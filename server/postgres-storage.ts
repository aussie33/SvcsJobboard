import { Pool } from 'pg';
import { IStorage } from './storage.js';
import { 
  User, InsertUser, 
  Category, InsertCategory,
  Job, InsertJob,
  JobTag, InsertJobTag,
  Application, InsertApplication
} from '../shared/schema.js';

export class PostgreSQLStorage implements IStorage {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async close() {
    await this.pool.end();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : undefined;
  }

  async getUsers(filters?: { role?: string, isActive?: boolean }): Promise<User[]> {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (filters?.role && filters.role !== 'all') {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    if (filters?.isActive !== undefined && filters.isActive !== null) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
    }

    query += ' ORDER BY created_at DESC';
    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapUserFromDb(row));
  }

  async createUser(user: InsertUser): Promise<User> {
    const query = `
      INSERT INTO users (username, password, email, first_name, last_name, middle_name, preferred_name, full_name, role, department, is_active, is_super_admin)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;
    const values = [
      user.username,
      user.password,
      user.email,
      user.firstName,
      user.lastName,
      user.middleName || null,
      user.preferredName || null,
      user.fullName,
      user.role || 'applicant',
      user.department || null,
      user.isActive !== false,
      user.isSuperAdmin || false
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        paramCount++;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await this.pool.query(query, values);
    return this.mapUserFromDb(result.rows[0]);
  }

  private mapUserFromDb(row: any): User {
    return {
      id: row.id,
      username: row.username,
      password: row.password,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      middleName: row.middle_name,
      preferredName: row.preferred_name,
      fullName: row.full_name,
      role: row.role,
      department: row.department,
      isActive: row.is_active,
      isSuperAdmin: row.is_super_admin,
      createdAt: row.created_at,
      lastLogin: row.last_login
    };
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const result = await this.pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    let query = 'SELECT * FROM categories';
    if (!includeInactive) {
      query += " WHERE status = 'active'";
    }
    query += ' ORDER BY name';
    
    const result = await this.pool.query(query);
    return result.rows;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const query = `
      INSERT INTO categories (name, description, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [
      category.name,
      category.description || null,
      category.status || 'active'
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'createdAt') {
        paramCount++;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    const result = await this.pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getJobs(filters?: { 
    employeeId?: number, 
    status?: string, 
    categoryId?: number,
    search?: string,
    department?: string,
    location?: string
  }): Promise<Job[]> {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (filters?.employeeId) {
      paramCount++;
      query += ` AND employee_id = $${paramCount}`;
      params.push(filters.employeeId);
    }

    if (filters?.status && filters.status !== 'all') {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    } else if (!filters?.status) {
      // Default to active jobs only
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push('active');
    }

    if (filters?.categoryId) {
      paramCount++;
      query += ` AND category_id = $${paramCount}`;
      params.push(filters.categoryId);
    }

    if (filters?.search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR short_description ILIKE $${paramCount} OR full_description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    if (filters?.department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(filters.department);
    }

    if (filters?.location) {
      paramCount++;
      query += ` AND location = $${paramCount}`;
      params.push(filters.location);
    }

    query += ' ORDER BY posted_date DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const query = `
      INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, city, state, salary_range, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      job.title,
      job.department,
      job.categoryId || null,
      job.employeeId,
      job.shortDescription,
      job.fullDescription,
      job.requirements,
      job.type,
      job.location,
      job.city || null,
      job.state || null,
      job.salaryRange || null,
      job.status || 'active'
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateJob(id: number, updates: Partial<Job>): Promise<Job | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'postedDate') {
        paramCount++;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    const query = `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // JobTag operations
  async getJobTags(jobId: number): Promise<JobTag[]> {
    const result = await this.pool.query('SELECT * FROM job_tags WHERE job_id = $1', [jobId]);
    return result.rows;
  }

  async addJobTag(jobTag: InsertJobTag): Promise<JobTag> {
    const query = 'INSERT INTO job_tags (job_id, tag) VALUES ($1, $2) RETURNING *';
    const result = await this.pool.query(query, [jobTag.jobId, jobTag.tag]);
    return result.rows[0];
  }

  async removeJobTag(jobId: number, tag: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM job_tags WHERE job_id = $1 AND tag = $2', [jobId, tag]);
    return (result.rowCount || 0) > 0;
  }

  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    const result = await this.pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getApplications(filters?: { 
    jobId?: number, 
    applicantId?: number, 
    status?: string 
  }): Promise<Application[]> {
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (filters?.jobId) {
      paramCount++;
      query += ` AND job_id = $${paramCount}`;
      params.push(filters.jobId);
    }

    if (filters?.applicantId) {
      paramCount++;
      query += ` AND applicant_id = $${paramCount}`;
      params.push(filters.applicantId);
    }

    if (filters?.status && filters.status !== 'all') {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    query += ' ORDER BY applied_date DESC';
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const query = `
      INSERT INTO applications (job_id, applicant_id, name, email, phone, resume_url, cover_letter, status, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const values = [
      application.jobId,
      application.applicantId,
      application.name,
      application.email,
      application.phone || null,
      application.resumeUrl || null,
      application.coverLetter || null,
      application.status || 'new',
      application.notes || null
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined> {
    const fields = [];
    const values = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id' && key !== 'appliedDate') {
        paramCount++;
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (dbKey === 'last_updated') {
          fields.push(`${dbKey} = NOW()`);
        } else {
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(value);
        }
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    const query = `UPDATE applications SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    values.push(id);

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async getApplicationCount(jobId: number): Promise<number> {
    const result = await this.pool.query('SELECT COUNT(*) FROM applications WHERE job_id = $1', [jobId]);
    return parseInt(result.rows[0].count);
  }
}