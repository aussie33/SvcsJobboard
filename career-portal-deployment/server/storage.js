const { PostgreSQLStorage } = require('./postgres-storage.js');

class MemStorage {
  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.jobs = new Map();
    this.jobTags = new Map();
    this.applications = new Map();

    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.jobIdCounter = 1;
    this.jobTagIdCounter = 1;
    this.applicationIdCounter = 1;

    this.initializeData();
  }

  initializeData() {
    // Initialize with test users
    const adminUser = {
      id: this.userIdCounter++,
      username: "admin",
      email: "admin@theresourcepool.com",
      password: "admin123",
      fullName: "System Administrator",
      role: "admin",
      isActive: true,
      phoneNumber: "555-0001",
      address: "123 Admin St",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const employeeUser = {
      id: this.userIdCounter++,
      username: "employee",
      email: "employee@theresourcepool.com", 
      password: "employee123",
      fullName: "HR Manager",
      role: "employee",
      isActive: true,
      phoneNumber: "555-0002",
      address: "456 Employee Ave",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const applicantUser = {
      id: this.userIdCounter++,
      username: "applicant",
      email: "applicant@example.com",
      password: "applicant123", 
      fullName: "John Applicant",
      role: "applicant",
      isActive: true,
      phoneNumber: "555-0003",
      address: "789 Applicant Blvd",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(employeeUser.id, employeeUser);
    this.users.set(applicantUser.id, applicantUser);

    // Initialize categories
    const categories = [
      "Engineering", "Marketing", "Sales", "Human Resources", "Finance", 
      "Operations", "Customer Service", "Product Management", "Design", 
      "Legal", "IT Support", "Quality Assurance", "Research & Development",
      "Business Development", "Consulting", "Project Management",
      "Data Science", "Security", "Compliance", "Training",
      "Administration", "Facilities", "Procurement", "Supply Chain",
      "Risk Management", "Internal Audit", "Communications", "Public Relations",
      "Strategy", "Innovation"
    ];

    categories.forEach((name, index) => {
      const category = {
        id: this.categoryIdCounter++,
        name: name,
        description: `${name} department positions and opportunities`,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.categories.set(category.id, category);
    });

    // Initialize sample jobs
    const sampleJobs = [
      {
        title: "Senior Frontend Developer",
        department: "Engineering",
        shortDescription: "Join our engineering team to build amazing user interfaces",
        fullDescription: "We are looking for an experienced frontend developer to join our growing team...",
        location: "remote",
        jobType: "full-time", 
        salary: "80000-120000",
        benefits: "Health insurance, 401k, flexible hours",
        requirements: "5+ years React experience, TypeScript knowledge",
        categoryId: 1,
        status: "active"
      },
      {
        title: "Marketing Manager", 
        department: "Marketing",
        shortDescription: "Lead our marketing initiatives and campaigns",
        fullDescription: "We need a creative marketing manager to drive our brand forward...",
        location: "onsite",
        jobType: "full-time",
        salary: "70000-90000", 
        benefits: "Health insurance, dental, vision",
        requirements: "3+ years marketing experience, MBA preferred",
        categoryId: 2,
        status: "active"
      },
      {
        title: "Sales Representative",
        department: "Sales", 
        shortDescription: "Drive revenue growth through client relationships",
        fullDescription: "Join our sales team to help expand our customer base...",
        location: "hybrid",
        jobType: "full-time",
        salary: "50000-80000",
        benefits: "Commission structure, health benefits",
        requirements: "2+ years sales experience, excellent communication",
        categoryId: 3,
        status: "active"
      }
    ];

    sampleJobs.forEach(jobData => {
      const job = {
        id: this.jobIdCounter++,
        ...jobData,
        employeeId: employeeUser.id,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.jobs.set(job.id, job);

      // Add sample tags
      const tags = job.title.includes('Developer') ? ['React', 'TypeScript', 'Frontend'] :
                   job.title.includes('Marketing') ? ['Digital Marketing', 'Strategy', 'Analytics'] :
                   ['Sales', 'Communication', 'Customer Relations'];
      
      tags.forEach(tag => {
        const jobTag = {
          id: this.jobTagIdCounter++,
          jobId: job.id,
          tag: tag,
          createdAt: new Date()
        };
        this.jobTags.set(jobTag.id, jobTag);
      });
    });

    console.log(`Initialized users: ${this.users.size}`);
    console.log(`Initialized categories: ${this.categories.size}`);
    console.log(`Initialized jobs: ${this.jobs.size}`);
    console.log(`Initialized job tags: ${this.jobTags.size}`);
  }

  // User operations
  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUsers(filters = {}) {
    let users = Array.from(this.users.values());
    
    if (filters.role) {
      users = users.filter(user => user.role === filters.role);
    }
    
    if (filters.isActive !== undefined) {
      users = users.filter(user => user.isActive === filters.isActive);
    }
    
    return users;
  }

  async createUser(user) {
    const id = this.userIdCounter++;
    const newUser = { 
      ...user, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id, updates, currentUserId) {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Category operations
  async getCategory(id) {
    return this.categories.get(id);
  }

  async getCategories(includeInactive = false) {
    let categories = Array.from(this.categories.values());
    if (!includeInactive) {
      categories = categories.filter(cat => cat.status === 'active');
    }
    return categories;
  }

  async createCategory(category) {
    const id = this.categoryIdCounter++;
    const newCategory = { 
      ...category, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  async updateCategory(id, updates) {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { 
      ...category, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  // Job operations  
  async getJob(id) {
    return this.jobs.get(id);
  }

  async getJobs(filters = {}) {
    let jobs = Array.from(this.jobs.values());
    
    if (filters.employeeId) {
      jobs = jobs.filter(job => job.employeeId === filters.employeeId);
    }
    
    if (filters.status) {
      jobs = jobs.filter(job => job.status === filters.status);
    }
    
    if (filters.categoryId) {
      jobs = jobs.filter(job => job.categoryId === filters.categoryId);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.shortDescription.toLowerCase().includes(searchLower) ||
        job.fullDescription.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.department) {
      jobs = jobs.filter(job => job.department === filters.department);
    }
    
    if (filters.location) {
      jobs = jobs.filter(job => job.location === filters.location);
    }
    
    return jobs;
  }

  async createJob(job) {
    const id = this.jobIdCounter++;
    const newJob = { 
      ...job, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.jobs.set(id, newJob);
    return newJob;
  }

  async updateJob(id, updates) {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { 
      ...job, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }

  // JobTag operations
  async getJobTags(jobId) {
    return Array.from(this.jobTags.values()).filter(tag => tag.jobId === jobId);
  }

  async addJobTag(jobTag) {
    const id = this.jobTagIdCounter++;
    const newJobTag = { ...jobTag, id };
    this.jobTags.set(id, newJobTag);
    return newJobTag;
  }

  async removeJobTag(jobId, tag) {
    const tagToRemove = Array.from(this.jobTags.values()).find(
      t => t.jobId === jobId && t.tag === tag
    );
    
    if (tagToRemove) {
      this.jobTags.delete(tagToRemove.id);
      return true;
    }
    return false;
  }

  // Application operations
  async getApplication(id) {
    return this.applications.get(id);
  }

  async getApplications(filters = {}) {
    let applications = Array.from(this.applications.values());
    
    if (filters.jobId) {
      applications = applications.filter(app => app.jobId === filters.jobId);
    }
    
    if (filters.applicantId) {
      applications = applications.filter(app => app.applicantId === filters.applicantId);
    }
    
    if (filters.status) {
      applications = applications.filter(app => app.status === filters.status);
    }
    
    return applications;
  }

  async createApplication(application) {
    const id = this.applicationIdCounter++;
    const newApplication = { 
      ...application, 
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async updateApplication(id, updates) {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { 
      ...application, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }

  async getApplicationCount(jobId) {
    return Array.from(this.applications.values()).filter(app => app.jobId === jobId).length;
  }
}

const storage = process.env.DATABASE_URL 
  ? new PostgreSQLStorage(process.env.DATABASE_URL)
  : new MemStorage();

module.exports = { storage, MemStorage };