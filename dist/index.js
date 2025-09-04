var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/postgres-storage.js
var { Pool } = __require("pg");
var PostgreSQLStorage = class {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });
  }
  async close() {
    await this.pool.end();
  }
  async getUser(id) {
    const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  }
  async getUserByUsername(username) {
    const result = await this.pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return result.rows[0];
  }
  async getUserByEmail(email) {
    const result = await this.pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return result.rows[0];
  }
  async getUsers(filters = {}) {
    let query = "SELECT * FROM users WHERE 1=1";
    const params = [];
    let paramCount = 0;
    if (filters.role) {
      paramCount++;
      query += ` AND role = $${paramCount}`;
      params.push(filters.role);
    }
    if (filters.isActive !== void 0) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(filters.isActive);
    }
    query += " ORDER BY created_at DESC";
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
      username: "username",
      email: "email",
      password: "password",
      fullName: "full_name",
      role: "role",
      isActive: "is_active",
      phoneNumber: "phone_number",
      address: "address"
    };
    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key] && value !== void 0) {
        paramCount++;
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return void 0;
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(/* @__PURE__ */ new Date());
    paramCount++;
    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapUserFromDb(result.rows[0]) : void 0;
  }
  mapUserFromDb(row) {
    if (!row) return void 0;
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
    const result = await this.pool.query("SELECT * FROM categories WHERE id = $1", [id]);
    return result.rows[0] ? this.mapCategoryFromDb(result.rows[0]) : void 0;
  }
  async getCategories(includeInactive = false) {
    let query = "SELECT * FROM categories";
    if (!includeInactive) {
      query += " WHERE status = 'active'";
    }
    query += " ORDER BY name";
    const result = await this.pool.query(query);
    return result.rows.map(this.mapCategoryFromDb);
  }
  async createCategory(category) {
    const query = `
      INSERT INTO categories (name, description, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const values = [category.name, category.description, category.status || "active"];
    const result = await this.pool.query(query, values);
    return this.mapCategoryFromDb(result.rows[0]);
  }
  async updateCategory(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;
    if (updates.name !== void 0) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(updates.name);
    }
    if (updates.description !== void 0) {
      paramCount++;
      fields.push(`description = $${paramCount}`);
      values.push(updates.description);
    }
    if (updates.status !== void 0) {
      paramCount++;
      fields.push(`status = $${paramCount}`);
      values.push(updates.status);
    }
    if (fields.length === 0) return void 0;
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(/* @__PURE__ */ new Date());
    paramCount++;
    values.push(id);
    const query = `UPDATE categories SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapCategoryFromDb(result.rows[0]) : void 0;
  }
  mapCategoryFromDb(row) {
    if (!row) return void 0;
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
    const result = await this.pool.query("SELECT * FROM jobs WHERE id = $1", [id]);
    return result.rows[0] ? this.mapJobFromDb(result.rows[0]) : void 0;
  }
  async getJobs(filters = {}) {
    let query = "SELECT * FROM jobs WHERE 1=1";
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
    query += " ORDER BY created_at DESC";
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
      job.status || "draft",
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
      title: "title",
      department: "department",
      shortDescription: "short_description",
      fullDescription: "full_description",
      location: "location",
      jobType: "job_type",
      salary: "salary",
      benefits: "benefits",
      requirements: "requirements",
      categoryId: "category_id",
      status: "status",
      expiryDate: "expiry_date"
    };
    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key] && value !== void 0) {
        paramCount++;
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return void 0;
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(/* @__PURE__ */ new Date());
    paramCount++;
    values.push(id);
    const query = `UPDATE jobs SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapJobFromDb(result.rows[0]) : void 0;
  }
  mapJobFromDb(row) {
    if (!row) return void 0;
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
    const result = await this.pool.query("SELECT * FROM job_tags WHERE job_id = $1 ORDER BY created_at", [jobId]);
    return result.rows.map(this.mapJobTagFromDb);
  }
  async addJobTag(jobTag) {
    const query = "INSERT INTO job_tags (job_id, tag) VALUES ($1, $2) RETURNING *";
    const result = await this.pool.query(query, [jobTag.jobId, jobTag.tag]);
    return this.mapJobTagFromDb(result.rows[0]);
  }
  async removeJobTag(jobId, tag) {
    const result = await this.pool.query("DELETE FROM job_tags WHERE job_id = $1 AND tag = $2", [jobId, tag]);
    return result.rowCount > 0;
  }
  mapJobTagFromDb(row) {
    if (!row) return void 0;
    return {
      id: row.id,
      jobId: row.job_id,
      tag: row.tag,
      createdAt: row.created_at
    };
  }
  // Application operations
  async getApplication(id) {
    const result = await this.pool.query("SELECT * FROM applications WHERE id = $1", [id]);
    return result.rows[0] ? this.mapApplicationFromDb(result.rows[0]) : void 0;
  }
  async getApplications(filters = {}) {
    let query = "SELECT * FROM applications WHERE 1=1";
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
    query += " ORDER BY created_at DESC";
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
      application.status || "new"
    ];
    const result = await this.pool.query(query, values);
    return this.mapApplicationFromDb(result.rows[0]);
  }
  async updateApplication(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 0;
    const fieldMap = {
      status: "status",
      applicantName: "applicant_name",
      applicantEmail: "applicant_email",
      applicantPhone: "applicant_phone",
      coverLetter: "cover_letter",
      resumeUrl: "resume_url"
    };
    for (const [key, value] of Object.entries(updates)) {
      if (fieldMap[key] && value !== void 0) {
        paramCount++;
        fields.push(`${fieldMap[key]} = $${paramCount}`);
        values.push(value);
      }
    }
    if (fields.length === 0) return void 0;
    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(/* @__PURE__ */ new Date());
    paramCount++;
    values.push(id);
    const query = `UPDATE applications SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const result = await this.pool.query(query, values);
    return result.rows[0] ? this.mapApplicationFromDb(result.rows[0]) : void 0;
  }
  async getApplicationCount(jobId) {
    const result = await this.pool.query("SELECT COUNT(*) as count FROM applications WHERE job_id = $1", [jobId]);
    return parseInt(result.rows[0].count);
  }
  mapApplicationFromDb(row) {
    if (!row) return void 0;
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
};
module.exports = { PostgreSQLStorage };

// server/storage.ts
var MemStorage = class {
  users;
  categories;
  jobs;
  jobTags;
  applications;
  userIdCounter;
  categoryIdCounter;
  jobIdCounter;
  jobTagIdCounter;
  applicationIdCounter;
  constructor() {
    this.users = /* @__PURE__ */ new Map();
    this.categories = /* @__PURE__ */ new Map();
    this.jobs = /* @__PURE__ */ new Map();
    this.jobTags = /* @__PURE__ */ new Map();
    this.applications = /* @__PURE__ */ new Map();
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.jobIdCounter = 1;
    this.jobTagIdCounter = 1;
    this.applicationIdCounter = 1;
    this.initializeData();
  }
  initializeData() {
    const adminUser = {
      id: this.userIdCounter++,
      username: "admin",
      password: "admin123",
      email: "admin@theresourceconsultants.com",
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User",
      role: "admin",
      isActive: true,
      isSuperAdmin: true,
      // Mark as super admin
      middleName: null,
      preferredName: null,
      department: "Management",
      createdAt: /* @__PURE__ */ new Date(),
      lastLogin: null
    };
    this.users.set(adminUser.id, adminUser);
    const employeeUser = {
      id: this.userIdCounter++,
      username: "employee",
      password: "employee123",
      email: "employee@theresourceconsultants.com",
      firstName: "Employee",
      lastName: "User",
      middleName: null,
      preferredName: "HR",
      fullName: "Employee User",
      department: "Engineering",
      role: "employee",
      isActive: true,
      isSuperAdmin: false,
      createdAt: /* @__PURE__ */ new Date(),
      lastLogin: null
    };
    this.users.set(employeeUser.id, employeeUser);
    const applicantUser = {
      id: this.userIdCounter++,
      username: "applicant",
      password: "applicant123",
      email: "applicant@example.com",
      firstName: "Job",
      middleName: "A.",
      lastName: "Applicant",
      fullName: "Job Applicant",
      preferredName: null,
      department: null,
      role: "applicant",
      isActive: true,
      isSuperAdmin: false,
      createdAt: /* @__PURE__ */ new Date(),
      lastLogin: null
    };
    this.users.set(applicantUser.id, applicantUser);
    console.log("Initialized users:", this.users.size);
    const categoryIndex = /* @__PURE__ */ new Map();
    const categories2 = [
      "Engineering",
      "Marketing",
      "Design",
      "Product",
      "Sales",
      "IT",
      "Software Development",
      "Healthcare & Medical",
      "Nursing",
      "Pharmacy",
      "Counseling",
      "Engineering & Construction",
      "Mechanical Engineering",
      "Business & Finance",
      "Education & Training",
      "Legal & Compliance",
      "Government & Public Service",
      "Customer Service & Support",
      "Logistics & Supply Chain",
      "Hospitality & Tourism",
      "Creative & Design",
      "Graphic Design",
      "Video Production",
      "Photography",
      "Science & Research",
      "Manufacturing & Trades",
      "Remote & Freelance",
      "Virtual Assistance",
      "Content Writing",
      "Remote IT Support"
    ];
    categories2.forEach((name) => {
      const id = this.categoryIdCounter++;
      const category = {
        id,
        name,
        description: `${name} department jobs`,
        status: "active",
        createdAt: /* @__PURE__ */ new Date()
      };
      this.categories.set(id, category);
      categoryIndex.set(name, category);
    });
    console.log("Initialized categories:", this.categories.size);
    const employeeId = 2;
    const sampleJobs = [
      {
        title: "Senior Frontend Developer",
        department: "Engineering",
        categoryId: categoryIndex.get("Engineering")?.id || 1,
        employeeId,
        shortDescription: "Join our team as a Senior Frontend Developer to build cutting-edge web applications.",
        fullDescription: "We're looking for an experienced frontend developer with expertise in React, TypeScript, and modern web development practices. You'll work on our core product and help shape the future of our platform.",
        requirements: "5+ years of experience with modern JavaScript frameworks, Strong TypeScript skills, Experience with CSS-in-JS solutions",
        type: "full-time",
        location: "remote",
        city: "San Francisco",
        state: "California",
        salaryRange: "$120,000 - $150,000",
        status: "active",
        postedDate: /* @__PURE__ */ new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
        // 30 days from now
      },
      {
        title: "Product Designer",
        department: "Design",
        categoryId: categoryIndex.get("Design")?.id || 3,
        employeeId,
        shortDescription: "Create beautiful, functional designs for our growing product suite.",
        fullDescription: "As a Product Designer, you'll work closely with our product and engineering teams to create intuitive and visually appealing user interfaces. You'll be involved in the entire product development lifecycle, from concept to implementation.",
        requirements: "3+ years of experience in product design, Proficiency in Figma, Experience in UX research and user testing",
        type: "full-time",
        location: "hybrid",
        city: "Austin",
        state: "Texas",
        salaryRange: "$90,000 - $120,000",
        status: "active",
        postedDate: /* @__PURE__ */ new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3)
      },
      {
        title: "Marketing Intern",
        department: "Marketing",
        categoryId: categoryIndex.get("Marketing")?.id || 2,
        employeeId,
        shortDescription: "Join our marketing team for a summer internship opportunity.",
        fullDescription: "We're looking for enthusiastic marketing interns to join our team for a 3-month period. You'll gain hands-on experience in digital marketing, content creation, and campaign management.",
        requirements: "Currently pursuing a degree in Marketing or a related field, Strong written and verbal communication skills, Familiarity with social media platforms",
        type: "internship",
        location: "onsite",
        city: "Chicago",
        state: "Illinois",
        salaryRange: "$20-25/hour",
        status: "active",
        postedDate: /* @__PURE__ */ new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1e3)
      }
    ];
    sampleJobs.forEach((jobData) => {
      const jobId = this.jobIdCounter++;
      const job = {
        id: jobId,
        title: jobData.title,
        department: jobData.department,
        categoryId: jobData.categoryId,
        employeeId: jobData.employeeId,
        shortDescription: jobData.shortDescription,
        fullDescription: jobData.fullDescription,
        requirements: jobData.requirements,
        type: jobData.type,
        location: jobData.location,
        city: jobData.city,
        state: jobData.state,
        salaryRange: jobData.salaryRange,
        status: jobData.status,
        postedDate: jobData.postedDate,
        expiryDate: jobData.expiryDate
      };
      this.jobs.set(jobId, job);
      if (job.title.includes("Developer")) {
        const tags = ["React", "TypeScript", "Frontend"];
        tags.forEach((tag) => {
          const tagId = this.jobTagIdCounter++;
          this.jobTags.set(tagId, { id: tagId, jobId, tag });
        });
      } else if (job.title.includes("Designer")) {
        const tags = ["UI/UX", "Figma", "Design"];
        tags.forEach((tag) => {
          const tagId = this.jobTagIdCounter++;
          this.jobTags.set(tagId, { id: tagId, jobId, tag });
        });
      } else if (job.title.includes("Marketing")) {
        const tags = ["Social Media", "Content", "Digital Marketing"];
        tags.forEach((tag) => {
          const tagId = this.jobTagIdCounter++;
          this.jobTags.set(tagId, { id: tagId, jobId, tag });
        });
      }
    });
    console.log("Initialized jobs:", this.jobs.size);
    console.log("Initialized job tags:", this.jobTags.size);
  }
  // User operations
  async getUser(id) {
    return this.users.get(id);
  }
  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  async getUsers(filters) {
    let users2 = Array.from(this.users.values());
    if (filters) {
      if (filters.role) {
        console.log(`Filtering users by role: ${filters.role}`);
        users2 = users2.filter((user) => user.role === filters.role);
      }
      if (filters.isActive !== void 0) {
        console.log(`Filtering users by active status: ${filters.isActive}`);
        users2 = users2.filter((user) => user.isActive === filters.isActive);
      }
    }
    console.log(`getUsers returning ${users2.length} users after applying filters`);
    return users2;
  }
  async createUser(user) {
    const id = this.userIdCounter++;
    const timestamp2 = /* @__PURE__ */ new Date();
    let fullName = user.fullName;
    if (!fullName && user.firstName && user.lastName) {
      fullName = `${user.firstName} ${user.middleName ? user.middleName + " " : ""}${user.lastName}`;
    }
    const newUser = {
      ...user,
      fullName: fullName || `${user.firstName} ${user.lastName}`,
      id,
      lastLogin: null,
      createdAt: timestamp2
    };
    this.users.set(id, newUser);
    return newUser;
  }
  async updateUser(id, updates, currentUserId) {
    const user = this.users.get(id);
    if (!user) return void 0;
    const currentUser = currentUserId ? this.users.get(currentUserId) : null;
    if (user.isSuperAdmin && (!currentUser || !currentUser.isSuperAdmin)) {
      if (updates.role !== void 0 || updates.isActive !== void 0 || updates.isSuperAdmin !== void 0) {
        throw new Error("Only super admins can modify super admin properties");
      }
    }
    if (currentUserId === id && user.role === "admin" && !user.isSuperAdmin && updates.role !== void 0 && updates.role !== "admin") {
      throw new Error("Regular admins cannot change their own admin status");
    }
    if ((updates.firstName || updates.lastName || updates.middleName) && !updates.fullName) {
      const firstName = updates.firstName || user.firstName;
      const lastName = updates.lastName || user.lastName;
      const middleName = updates.middleName !== void 0 ? updates.middleName : user.middleName;
      updates.fullName = `${firstName} ${middleName ? middleName + " " : ""}${lastName}`;
    }
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  // Category operations
  async getCategory(id) {
    return this.categories.get(id);
  }
  async getCategories(includeInactive = false) {
    let categories2 = Array.from(this.categories.values());
    if (!includeInactive) {
      categories2 = categories2.filter((category) => category.status === "active");
    }
    return categories2;
  }
  async createCategory(category) {
    const id = this.categoryIdCounter++;
    const timestamp2 = /* @__PURE__ */ new Date();
    const newCategory = {
      ...category,
      id,
      createdAt: timestamp2
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  async updateCategory(id, updates) {
    const category = this.categories.get(id);
    if (!category) return void 0;
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  // Job operations
  async getJob(id) {
    return this.jobs.get(id);
  }
  async getJobs(filters) {
    let jobs2 = Array.from(this.jobs.values());
    if (filters) {
      if (filters.employeeId) {
        jobs2 = jobs2.filter((job) => job.employeeId === filters.employeeId);
      }
      if (filters.status) {
        jobs2 = jobs2.filter((job) => job.status === filters.status);
      }
      if (filters.categoryId) {
        jobs2 = jobs2.filter((job) => job.categoryId === filters.categoryId);
      }
      if (filters.department) {
        jobs2 = jobs2.filter((job) => job.department === filters.department);
      }
      if (filters.location) {
        jobs2 = jobs2.filter((job) => job.location === filters.location);
      }
      if (filters.city) {
        jobs2 = jobs2.filter((job) => job.city && job.city.toLowerCase().includes(filters.city.toLowerCase()));
      }
      if (filters.state) {
        jobs2 = jobs2.filter((job) => job.state && job.state.toLowerCase().includes(filters.state.toLowerCase()));
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        jobs2 = jobs2.filter(
          (job) => job.title.toLowerCase().includes(searchLower) || job.shortDescription.toLowerCase().includes(searchLower) || job.fullDescription.toLowerCase().includes(searchLower) || job.city && job.city.toLowerCase().includes(searchLower) || job.state && job.state.toLowerCase().includes(searchLower)
        );
      }
    }
    return jobs2;
  }
  async createJob(job) {
    const id = this.jobIdCounter++;
    const timestamp2 = /* @__PURE__ */ new Date();
    const newJob = {
      ...job,
      id,
      postedDate: timestamp2,
      expiryDate: null
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  async updateJob(id, updates) {
    const job = this.jobs.get(id);
    if (!job) return void 0;
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  // JobTag operations
  async getJobTags(jobId) {
    return Array.from(this.jobTags.values()).filter(
      (tag) => tag.jobId === jobId
    );
  }
  async addJobTag(jobTag) {
    const id = this.jobTagIdCounter++;
    const newJobTag = { ...jobTag, id };
    this.jobTags.set(id, newJobTag);
    return newJobTag;
  }
  async removeJobTag(jobId, tag) {
    const tagsToRemove = Array.from(this.jobTags.entries()).filter(([_, jobTag]) => jobTag.jobId === jobId && jobTag.tag === tag);
    if (tagsToRemove.length === 0) return false;
    tagsToRemove.forEach(([id]) => this.jobTags.delete(id));
    return true;
  }
  // Application operations
  async getApplication(id) {
    return this.applications.get(id);
  }
  async getApplications(filters) {
    let applications2 = Array.from(this.applications.values());
    if (filters) {
      if (filters.jobId) {
        applications2 = applications2.filter((app2) => app2.jobId === filters.jobId);
      }
      if (filters.applicantId) {
        applications2 = applications2.filter((app2) => app2.applicantId === filters.applicantId);
      }
      if (filters.status) {
        applications2 = applications2.filter((app2) => app2.status === filters.status);
      }
    }
    return applications2;
  }
  async createApplication(application) {
    const id = this.applicationIdCounter++;
    const timestamp2 = /* @__PURE__ */ new Date();
    const newApplication = {
      ...application,
      id,
      appliedDate: timestamp2,
      lastUpdated: timestamp2,
      status: application.status || "new"
      // Ensure status is set to 'new' if not provided
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }
  async updateApplication(id, updates) {
    const application = this.applications.get(id);
    if (!application) return void 0;
    const updatedApplication = {
      ...application,
      ...updates,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
  async getApplicationCount(jobId) {
    const applications2 = await this.getApplications({ jobId });
    return applications2.length;
  }
};
var storage = process.env.DATABASE_URL ? new (void 0)(process.env.DATABASE_URL) : new MemStorage();

// server/routes.ts
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { ZodError } from "zod";

// shared/schema.ts
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var userRoleEnum = pgEnum("user_role", ["admin", "employee", "applicant"]);
var jobStatusEnum = pgEnum("job_status", ["draft", "active", "paused", "closed"]);
var applicationStatusEnum = pgEnum("application_status", ["new", "reviewing", "interviewed", "rejected", "hired"]);
var jobTypeEnum = pgEnum("job_type", ["full-time", "part-time", "contract", "internship"]);
var jobLocationEnum = pgEnum("job_location", ["remote", "onsite", "hybrid"]);
var categoryStatusEnum = pgEnum("category_status", ["active", "inactive"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  preferredName: text("preferred_name"),
  fullName: text("full_name").notNull(),
  // Kept for backward compatibility
  role: userRoleEnum("role").notNull().default("applicant"),
  department: text("department"),
  isActive: boolean("is_active").notNull().default(true),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: categoryStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow()
});
var jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  employeeId: integer("employee_id").references(() => users.id).notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  requirements: text("requirements").notNull(),
  type: jobTypeEnum("type").notNull(),
  location: jobLocationEnum("location").notNull(),
  city: text("city"),
  state: text("state"),
  salaryRange: text("salary_range"),
  status: jobStatusEnum("status").notNull().default("draft"),
  postedDate: timestamp("posted_date").defaultNow(),
  expiryDate: timestamp("expiry_date")
});
var jobTags = pgTable("job_tags", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  tag: text("tag").notNull()
});
var applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  applicantId: integer("applicant_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  status: applicationStatusEnum("status").notNull().default("new"),
  appliedDate: timestamp("applied_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
  notes: text("notes")
});
var insertUserSchema = createInsertSchema(users).omit({ id: true, lastLogin: true, createdAt: true });
var insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
var insertJobSchema = createInsertSchema(jobs).omit({ id: true, postedDate: true, expiryDate: true }).partial({ employeeId: true });
var insertJobTagSchema = createInsertSchema(jobTags).omit({ id: true });
var insertApplicationSchema = createInsertSchema(applications).omit({ id: true, appliedDate: true, lastUpdated: true });
var loginSchema = z.object({
  username: z.string().min(3).describe("Username or email address"),
  password: z.string().min(6)
});
var jobWithTagsSchema = z.object({
  job: insertJobSchema.omit({ employeeId: true }),
  tags: z.array(z.string())
});
var applicationWithResumeSchema = insertApplicationSchema.extend({
  resume: z.instanceof(File).optional()
});

// server/routes.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOC files are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  }
});
var handleZodError = (err, res) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      errors: err.errors
    });
  }
  console.error("Unexpected error:", err);
  return res.status(500).json({ message: "Internal server error" });
};
var requireAuth = async (req, res, next) => {
  console.log("requireAuth - Session ID:", req.sessionID);
  console.log("requireAuth - Session exists:", !!req.session);
  console.log("requireAuth - Session userId:", req.session?.userId);
  if (!req.session || !req.session.userId) {
    console.log("requireAuth - No session or userId, returning 401");
    return res.status(401).json({ message: "Unauthorized" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    console.log("requireAuth - User not found for userId:", req.session.userId);
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
    });
    return res.status(401).json({ message: "User not found" });
  }
  if (!user.isActive) {
    console.log("requireAuth - User account disabled:", user.username);
    req.session.destroy((err) => {
      if (err) console.error("Session destroy error:", err);
    });
    return res.status(403).json({ message: "Account is disabled" });
  }
  console.log("requireAuth - Success for user:", user.username);
  req.user = user;
  next();
};
var requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
async function registerRoutes(app2) {
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });
  app2.use((req, res, next) => {
    req.user = null;
    next();
  });
  app2.use((req, res, next) => {
    next();
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const isEmail = credentials.username.includes("@");
      let user = isEmail ? await storage.getUserByEmail(credentials.username) : await storage.getUserByUsername(credentials.username);
      if (!user && !isEmail) {
        user = await storage.getUserByEmail(credentials.username);
      }
      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      await storage.updateUser(user.id, { lastLogin: /* @__PURE__ */ new Date() });
      req.session.userId = user.id;
      console.log("Login successful - Setting session userId:", user.id);
      console.log("Session ID:", req.sessionID);
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Session save failed" });
        }
        console.log("Session saved successfully");
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
  app2.post("/api/users/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, middleName, preferredName, fullName, role } = req.body;
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Required fields are missing" });
      }
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (role !== "applicant") {
        return res.status(403).json({ message: "Only applicant accounts can be created through registration" });
      }
      const newUser = await storage.createUser({
        username,
        email,
        password,
        firstName,
        lastName,
        middleName: middleName || null,
        preferredName: preferredName || null,
        fullName: fullName || `${firstName} ${lastName}`,
        role: "applicant",
        isActive: true,
        department: null
      });
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await storage.getUserByEmail(email);
      res.json({ message: "If an account with that email exists, password reset instructions have been sent." });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.get("/api/auth/me", requireAuth, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  app2.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    const { role, active } = req.query;
    const filters = {};
    console.log("GET /api/users - Request query params:", req.query);
    if (role && role !== "all") {
      filters.role = role.toString();
    }
    if (active === "true") {
      filters.isActive = true;
    } else if (active === "false") {
      filters.isActive = false;
    }
    console.log("Processed filters for getUsers:", filters);
    try {
      const allUsers = await storage.getUsers({});
      console.log("Total users in system:", allUsers.length);
      const users2 = await storage.getUsers(filters);
      console.log("Filtered users count:", users2.length);
      const usersWithoutPasswords = users2.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      console.log("Sending users response with", usersWithoutPasswords.length, "users");
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const newUser = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.patch("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const currentUserId = req.user?.id;
      const {
        username,
        email,
        firstName,
        lastName,
        middleName,
        preferredName,
        fullName,
        role,
        department,
        isActive,
        isSuperAdmin
      } = req.body;
      const updates = {};
      if (username !== void 0) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
        updates.username = username;
      }
      if (email !== void 0) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
        updates.email = email;
      }
      if (firstName !== void 0) updates.firstName = firstName;
      if (lastName !== void 0) updates.lastName = lastName;
      if (middleName !== void 0) updates.middleName = middleName;
      if (preferredName !== void 0) updates.preferredName = preferredName;
      if (fullName !== void 0) updates.fullName = fullName;
      if (role !== void 0) updates.role = role;
      if (department !== void 0) updates.department = department;
      if (isActive !== void 0) updates.isActive = isActive;
      if (isSuperAdmin !== void 0) {
        const currentUser = await storage.getUser(currentUserId);
        if (currentUser && currentUser.isSuperAdmin) {
          updates.isSuperAdmin = isSuperAdmin;
        } else {
          return res.status(403).json({ message: "Only super admins can assign super admin status" });
        }
      }
      try {
        const updatedUser = await storage.updateUser(userId, updates, currentUserId);
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        if (error instanceof Error) {
          return res.status(403).json({ message: error.message });
        }
        throw error;
      }
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.get("/api/categories", async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const categories2 = await storage.getCategories(includeInactive);
    res.json(categories2);
  });
  app2.post("/api/categories", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.patch("/api/categories/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      const { name, description, status } = req.body;
      const updates = {};
      if (name !== void 0) updates.name = name;
      if (description !== void 0) updates.description = description;
      if (status !== void 0) updates.status = status;
      const updatedCategory = await storage.updateCategory(categoryId, updates);
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(updatedCategory);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.get("/api/jobs", async (req, res) => {
    const { employeeId, status, categoryId, search, department, location, city, state, includeAllStatuses } = req.query;
    const filters = {};
    if (employeeId) filters.employeeId = parseInt(employeeId.toString());
    const showAllStatuses = includeAllStatuses === "true";
    if (status) {
      filters.status = status.toString();
      console.log(`Using explicit status filter: ${filters.status}`);
    } else if (!showAllStatuses) {
      filters.status = "active";
      console.log(`No status specified and showAllStatuses=false, defaulting to active only`);
    } else {
      console.log(`showAllStatuses=true, showing all job statuses (no status filter applied)`);
    }
    if (categoryId && categoryId !== "" && categoryId !== "all") filters.categoryId = parseInt(categoryId.toString());
    if (search) filters.search = search.toString();
    if (department) filters.department = department.toString();
    if (location) filters.location = location.toString();
    if (city) filters.city = city.toString();
    if (state) filters.state = state.toString();
    const jobs2 = await storage.getJobs(filters);
    const jobsWithTagsAndCounts = await Promise.all(jobs2.map(async (job) => {
      const tags = await storage.getJobTags(job.id);
      const applicationCount = await storage.getApplicationCount(job.id);
      return {
        ...job,
        tags: tags.map((tag) => tag.tag),
        applicationCount
      };
    }));
    res.json(jobsWithTagsAndCounts);
  });
  app2.get("/api/jobs/:id", async (req, res) => {
    const jobId = parseInt(req.params.id);
    const job = await storage.getJob(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    const tags = await storage.getJobTags(job.id);
    res.json({
      ...job,
      tags: tags.map((tag) => tag.tag)
    });
  });
  app2.post("/api/jobs", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    try {
      console.log("Job creation request received");
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      console.log("User:", req.user?.username, "Role:", req.user?.role);
      const { job: jobData, tags } = jobWithTagsSchema.parse(req.body);
      const jobWithEmployee = { ...jobData, employeeId: req.user.id };
      console.log("Creating job with data:", jobWithEmployee);
      const newJob = await storage.createJob(jobWithEmployee);
      console.log("Job created successfully:", newJob);
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await storage.addJobTag({
            jobId: newJob.id,
            tag
          });
        }
      }
      const jobTags2 = await storage.getJobTags(newJob.id);
      const result = {
        ...newJob,
        tags: jobTags2.map((tag) => tag.tag)
      };
      console.log("Job creation completed, returning:", result);
      res.status(201).json(result);
    } catch (err) {
      console.error("Job creation error:", err);
      handleZodError(err, res);
    }
  });
  app2.patch("/api/jobs/:id", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      if (job.employeeId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const { job: jobUpdates, tags } = req.body;
      if (jobUpdates) {
        const allowedUpdates = [
          "title",
          "department",
          "categoryId",
          "shortDescription",
          "fullDescription",
          "requirements",
          "type",
          "location",
          "city",
          "state",
          "salaryRange",
          "status",
          "expiryDate"
        ];
        const filteredUpdates = {};
        for (const key of allowedUpdates) {
          if (jobUpdates[key] !== void 0) {
            filteredUpdates[key] = jobUpdates[key];
          }
        }
        await storage.updateJob(jobId, filteredUpdates);
      }
      if (tags) {
        const currentTags = await storage.getJobTags(jobId);
        const currentTagValues = currentTags.map((tag) => tag.tag);
        for (const currentTag of currentTagValues) {
          if (!tags.includes(currentTag)) {
            await storage.removeJobTag(jobId, currentTag);
          }
        }
        for (const newTag of tags) {
          if (!currentTagValues.includes(newTag)) {
            await storage.addJobTag({
              jobId,
              tag: newTag
            });
          }
        }
      }
      const updatedJob = await storage.getJob(jobId);
      const jobTags2 = await storage.getJobTags(jobId);
      res.json({
        ...updatedJob,
        tags: jobTags2.map((tag) => tag.tag)
      });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  app2.get("/api/applications", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    const { jobId, status } = req.query;
    const filters = {};
    if (jobId && jobId !== "all") filters.jobId = parseInt(jobId.toString());
    if (status && status !== "all") filters.status = status.toString();
    if (req.user.role === "employee") {
      const employeeJobs = await storage.getJobs({ employeeId: req.user.id });
      const employeeJobIds = employeeJobs.map((job) => job.id);
      if (employeeJobIds.length === 0) {
        return res.json([]);
      }
      if (!filters.jobId) {
        const allApplications = await Promise.all(
          employeeJobIds.map((jobId2) => storage.getApplications({ jobId: jobId2 }))
        );
        let applications3 = allApplications.flat();
        if (filters.status) {
          applications3 = applications3.filter((app3) => app3.status === filters.status);
        }
        return res.json(applications3);
      }
      if (!employeeJobIds.includes(filters.jobId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    const applications2 = await storage.getApplications(filters);
    res.json(applications2);
  });
  app2.get("/api/my-applications", requireAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const applications2 = await storage.getApplications({ applicantId: req.user.id });
      const processedApplications = applications2.map((app3) => ({
        ...app3,
        resumeUrl: app3.resumeUrl ? `/api/applications/${app3.id}/resume` : null
      }));
      res.json(processedApplications);
    } catch (err) {
      console.error("Error fetching applications:", err);
      return res.status(500).json({ message: "Failed to fetch applications" });
    }
  });
  app2.post("/api/applications", upload.single("resume"), async (req, res) => {
    try {
      const applicationData = { ...req.body };
      if (applicationData.jobId) {
        applicationData.jobId = parseInt(applicationData.jobId);
      }
      if (applicationData.applicantId) {
        applicationData.applicantId = parseInt(applicationData.applicantId);
      }
      const parsedData = insertApplicationSchema.parse(applicationData);
      if (req.file) {
        parsedData.resumeUrl = `/uploads/${req.file.filename}`;
      } else if (applicationData.resumeUrl) {
        parsedData.resumeUrl = applicationData.resumeUrl;
      }
      if (req.user) {
        console.log("Setting applicant ID to:", req.user.id);
        parsedData.applicantId = req.user.id;
      }
      if (parsedData.applicantId) {
        const existingApplications = await storage.getApplications({
          jobId: parsedData.jobId,
          applicantId: parsedData.applicantId
        });
        if (existingApplications.length > 0) {
          return res.status(400).json({
            message: "You have already applied for this position"
          });
        }
      }
      const newApplication = await storage.createApplication(parsedData);
      console.log("Created application:", newApplication);
      res.status(201).json(newApplication);
    } catch (err) {
      console.error("Application submission error:", err);
      handleZodError(err, res);
    }
  });
  app2.patch("/api/applications/:id", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      if (req.user.role === "employee") {
        const job = await storage.getJob(application.jobId);
        if (!job || job.employeeId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      const { status, notes } = req.body;
      const updates = {};
      if (status !== void 0) updates.status = status;
      if (notes !== void 0) updates.notes = notes;
      const updatedApplication = await storage.updateApplication(applicationId, updates);
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(updatedApplication);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path2, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname(__filename2);
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(__dirname2, "client", "src"),
      "@shared": path2.resolve(__dirname2, "shared")
    }
  },
  root: path2.resolve(__dirname2, "client"),
  build: {
    outDir: path2.resolve(__dirname2, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = dirname2(__filename3);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        __dirname3,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(__dirname3, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import path4 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
import session from "express-session";
import MemoryStore from "memorystore";
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path4.dirname(__filename4);
var app = express2();
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use("/uploads", express2.static(path4.join(__dirname4, "../uploads")));
var MemoryStoreSession = MemoryStore(session);
app.use(session({
  secret: process.env.SESSION_SECRET || "career-portal-secret-key-dev",
  resave: false,
  saveUninitialized: false,
  store: new MemoryStoreSession({
    checkPeriod: 864e5
    // prune expired entries every 24h
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1e3,
    // 24 hours
    secure: false,
    // Keep false for HTTP in production
    httpOnly: true,
    sameSite: "lax"
  },
  name: "connect.sid"
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
