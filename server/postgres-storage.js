const { Pool } = require('pg');

class PostgreSQLStorage {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async close() {
    await this.pool.end();
  }

  async getUser(id) {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  async getUserByUsername(username) {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  async getUserByEmail(email) {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  async getUsers(filters = {}) {
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapUserFromDb);
  }

  async createUser(user) {
    const query = `
      INSERT INTO users (username, email, password, full_name, role, is_active, phone_number, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      user.username,
      user.email,
      user.password,
      user.fullName,
      user.role,
      user.isActive ?? true,
      user.phoneNumber,
      user.address
    ];
    
    const result = await this.pool.query(query, values);
    return this.mapUserFromDb(result.rows[0]);
  }

  async updateUser(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    const fieldMap = {
      username: 'username',
      email: 'email', 
      password: 'password',
      fullName: 'full_name',
      role: 'role',
      isActive: 'is_active',
      phoneNumber: 'phone_number',
      address: 'address'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key] && value !== undefined) {
        paramCount++;
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : undefined;
  }

  mapUserFromDb(row) {
    if (!row) return undefined;
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      phoneNumber: row.phone_number,
      address: row.address,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Category operations
  async getCategory(id) {
    const result = await this.pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] ? this.mapCategoryFromDb(result.rows[0]) : undefined;
  }

  async getCategories(includeInactive = false) {
    let query = 'SELECT * FROM categories';
    if (!includeInactive) {
      query += " WHERE status = 'active'";
    }
    query += ' ORDER BY name';
    
    const result = await this.pool.query(query);
    return result.rows.map(this.mapCategoryFromDb);
  }

  async createCategory(category) {
    const query = `
      INSERT INTO categories (name, description, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [category.name, category.description, category.status || 'active'];
    
    const result = await this.pool.query(query, values);
    return this.mapCategoryFromDb(result.rows[0]);
  }

  async updateCategory(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    if (updates.name !== undefined) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(updates.description);
    }

    if (updates.status !== undefined) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(updates.status);
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(id);

    const query = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapCategoryFromDb(result.rows[0]) : undefined;
  }

  mapCategoryFromDb(row) {
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // Job operations
  async getJob(id) {
    const result = await this.pool.query('SELECT * FROM jobs WHERE id = $1', [id]);
    return result.rows[0] ? this.mapJobFromDb(result.rows[0]) : undefined;
  }

  async getJobs(filters = {}) {
    let query = 'SELECT * FROM jobs WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.employeeId) {
      paramCount++;
      query += ` AND employee_id = $${paramCount}`;
      params.push(filters.employeeId);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.categoryId) {
      paramCount++;
      query += ` AND category_id = $${paramCount}`;
      params.push(filters.categoryId);
    }

    if (filters.search) {
      paramCount++;
      query += ` AND (title ILIKE $${paramCount} OR short_description ILIKE $${paramCount} OR full_description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
    }

    if (filters.department) {
      paramCount++;
      query += ` AND department = $${paramCount}`;
      params.push(filters.department);
    }

    if (filters.location) {
      paramCount++;
      query += ` AND location = $${paramCount}`;
      params.push(filters.location);
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapJobFromDb);
  }

  async createJob(job) {
    const query = `
      INSERT INTO jobs (title, department, short_description, full_description, location, job_type, salary, benefits, requirements, category_id, employee_id, status, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    const values = [
      job.title,
      job.department,
      job.shortDescription,
      job.fullDescription,
      job.location,
      job.jobType,
      job.salary,
      job.benefits,
      job.requirements,
      job.categoryId,
      job.employeeId,
      job.status || 'draft',
      job.expiryDate
    ];
    
    const result = await this.pool.query(query, values);
    return this.mapJobFromDb(result.rows[0]);
  }

  async updateJob(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    const fieldMap = {
      title: 'title',
      department: 'department',
      shortDescription: 'short_description',
      fullDescription: 'full_description',
      location: 'location',
      jobType: 'job_type',
      salary: 'salary',
      benefits: 'benefits',
      requirements: 'requirements',
      categoryId: 'category_id',
      status: 'status',
      expiryDate: 'expiry_date'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key] && value !== undefined) {
        paramCount++;
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(id);

    const query = `UPDATE jobs SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapJobFromDb(result.rows[0]) : undefined;
  }

  mapJobFromDb(row) {
    if (!row) return undefined;
    return {
      id: row.id,
      title: row.title,
      department: row.department,
      shortDescription: row.short_description,
      fullDescription: row.full_description,
      location: row.location,
      jobType: row.job_type,
      salary: row.salary,
      benefits: row.benefits,
      requirements: row.requirements,
      categoryId: row.category_id,
      employeeId: row.employee_id,
      status: row.status,
      expiryDate: row.expiry_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  // JobTag operations
  async getJobTags(jobId) {
    const result = await this.pool.query('SELECT * FROM job_tags WHERE job_id = $1 ORDER BY created_at', [jobId]);
    return result.rows.map(this.mapJobTagFromDb);
  }

  async addJobTag(jobTag) {
    const query = 'INSERT INTO job_tags (job_id, tag) VALUES ($1, $2) RETURNING *';
    const result = await this.pool.query(query, [jobTag.jobId, jobTag.tag]);
    return this.mapJobTagFromDb(result.rows[0]);
  }

  async removeJobTag(jobId, tag) {
    const result = await this.pool.query('DELETE FROM job_tags WHERE job_id = $1 AND tag = $2', [jobId, tag]);
    return result.rowCount > 0;
  }

  mapJobTagFromDb(row) {
    if (!row) return undefined;
    return {
      id: row.id,
      jobId: row.job_id,
      tag: row.tag,
      createdAt: row.created_at
    };
  }

  // Application operations
  async getApplication(id) {
    const result = await this.pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    return result.rows[0] ? this.mapApplicationFromDb(result.rows[0]) : undefined;
  }

  async getApplications(filters = {}) {
    let query = 'SELECT * FROM applications WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.jobId) {
      paramCount++;
      query += ` AND job_id = $${paramCount}`;
      params.push(filters.jobId);
    }

    if (filters.applicantId) {
      paramCount++;
      query += ` AND applicant_id = $${paramCount}`;
      params.push(filters.applicantId);
    }

    if (filters.status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';
    
    const result = await this.pool.query(query, params);
    return result.rows.map(this.mapApplicationFromDb);
  }

  async createApplication(application) {
    const query = `
      INSERT INTO applications (job_id, applicant_id, applicant_name, applicant_email, applicant_phone, cover_letter, resume_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      application.jobId,
      application.applicantId,
      application.applicantName,
      application.applicantEmail,
      application.applicantPhone,
      application.coverLetter,
      application.resumeUrl,
      application.status || 'new'
    ];
    
    const result = await this.pool.query(query, values);
    return this.mapApplicationFromDb(result.rows[0]);
  }

  async updateApplication(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    const fieldMap = {
      status: 'status',
      applicantName: 'applicant_name',
      applicantEmail: 'applicant_email',
      applicantPhone: 'applicant_phone',
      coverLetter: 'cover_letter',
      resumeUrl: 'resume_url'
    };

    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key] && value !== undefined) {
        paramCount++;
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return undefined;

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    paramCount++;
    values.push(id);

    const query = `UPDATE applications SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapApplicationFromDb(result.rows[0]) : undefined;
  }

  async getApplicationCount(jobId) {
    const result = await this.pool.query('SELECT COUNT(*) as count FROM applications WHERE job_id = $1', [jobId]);
    return parseInt(result.rows[0].count);
  }

  mapApplicationFromDb(row) {
    if (!row) return undefined;
    return {
      id: row.id,
      jobId: row.job_id,
      applicantId: row.applicant_id,
      applicantName: row.applicant_name,
      applicantEmail: row.applicant_email,
      applicantPhone: row.applicant_phone,
      coverLetter: row.cover_letter,
      resumeUrl: row.resume_url,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = { PostgreSQLStorage };