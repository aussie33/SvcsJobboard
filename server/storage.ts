import { 
  users, type User, type InsertUser,
  categories, type Category, type InsertCategory,
  jobs, type Job, type InsertJob,
  jobTags, type JobTag, type InsertJobTag,
  applications, type Application, type InsertApplication,
  jobStatusEnum, applicationStatusEnum, userRoleEnum, categoryStatusEnum
} from "@shared/schema";

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(filters?: { role?: string, isActive?: boolean }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategories(includeInactive?: boolean): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined>;
  
  // Job operations
  getJob(id: number): Promise<Job | undefined>;
  getJobs(filters?: { 
    employeeId?: number, 
    status?: string, 
    categoryId?: number,
    search?: string,
    department?: string,
    location?: string
  }): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, updates: Partial<Job>): Promise<Job | undefined>;
  
  // JobTag operations
  getJobTags(jobId: number): Promise<JobTag[]>;
  addJobTag(jobTag: InsertJobTag): Promise<JobTag>;
  removeJobTag(jobId: number, tag: string): Promise<boolean>;
  
  // Application operations
  getApplication(id: number): Promise<Application | undefined>;
  getApplications(filters?: { 
    jobId?: number, 
    applicantId?: number, 
    status?: string 
  }): Promise<Application[]>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined>;
}

// In-memory implementation of the storage interface
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private jobs: Map<number, Job>;
  private jobTags: Map<number, JobTag>;
  private applications: Map<number, Application>;
  
  private userIdCounter: number;
  private categoryIdCounter: number;
  private jobIdCounter: number;
  private jobTagIdCounter: number;
  private applicationIdCounter: number;
  
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
    
    // Initialize with some default data
    this.initializeData();
  }
  
  private initializeData() {
    // Add admin user
    const adminUser: InsertUser = {
      username: "admin",
      password: "admin123",
      email: "admin@careerconnect.com",
      fullName: "Admin User",
      role: "admin",
      isActive: true
    };
    this.createUser(adminUser);
    
    // Add employee user
    const employeeUser: InsertUser = {
      username: "employee",
      password: "employee123",
      email: "employee@careerconnect.com",
      fullName: "Employee User",
      department: "Engineering",
      role: "employee",
      isActive: true
    };
    this.createUser(employeeUser);
    
    // Add some default categories
    const categories = ["Engineering", "Marketing", "Design", "Product", "Sales"];
    categories.forEach(name => {
      this.createCategory({
        name,
        description: `${name} department jobs`,
        status: "active"
      });
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUsers(filters?: { role?: string, isActive?: boolean }): Promise<User[]> {
    let users = Array.from(this.users.values());
    
    if (filters) {
      if (filters.role) {
        users = users.filter(user => user.role === filters.role);
      }
      
      if (filters.isActive !== undefined) {
        users = users.filter(user => user.isActive === filters.isActive);
      }
    }
    
    return users;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const newUser: User = { 
      ...user, 
      id, 
      lastLogin: null,
      createdAt: timestamp
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    let categories = Array.from(this.categories.values());
    
    if (!includeInactive) {
      categories = categories.filter(category => category.status === "active");
    }
    
    return categories;
  }
  
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const timestamp = new Date();
    const newCategory: Category = { 
      ...category, 
      id, 
      createdAt: timestamp
    };
    this.categories.set(id, newCategory);
    return newCategory;
  }
  
  async updateCategory(id: number, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...updates };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  // Job operations
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async getJobs(filters?: { 
    employeeId?: number, 
    status?: string, 
    categoryId?: number,
    search?: string,
    department?: string,
    location?: string
  }): Promise<Job[]> {
    let jobs = Array.from(this.jobs.values());
    
    if (filters) {
      if (filters.employeeId) {
        jobs = jobs.filter(job => job.employeeId === filters.employeeId);
      }
      
      if (filters.status) {
        jobs = jobs.filter(job => job.status === filters.status);
      }
      
      if (filters.categoryId) {
        jobs = jobs.filter(job => job.categoryId === filters.categoryId);
      }
      
      if (filters.department) {
        jobs = jobs.filter(job => job.department === filters.department);
      }
      
      if (filters.location) {
        jobs = jobs.filter(job => job.location === filters.location);
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(searchLower) || 
          job.shortDescription.toLowerCase().includes(searchLower) ||
          job.fullDescription.toLowerCase().includes(searchLower)
        );
      }
    }
    
    return jobs;
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const timestamp = new Date();
    const newJob: Job = { 
      ...job, 
      id, 
      postedDate: timestamp,
      expiryDate: null
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  async updateJob(id: number, updates: Partial<Job>): Promise<Job | undefined> {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    
    const updatedJob = { ...job, ...updates };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  // JobTag operations
  async getJobTags(jobId: number): Promise<JobTag[]> {
    return Array.from(this.jobTags.values()).filter(
      tag => tag.jobId === jobId
    );
  }
  
  async addJobTag(jobTag: InsertJobTag): Promise<JobTag> {
    const id = this.jobTagIdCounter++;
    const newJobTag: JobTag = { ...jobTag, id };
    this.jobTags.set(id, newJobTag);
    return newJobTag;
  }
  
  async removeJobTag(jobId: number, tag: string): Promise<boolean> {
    const tagsToRemove = Array.from(this.jobTags.entries())
      .filter(([_, jobTag]) => jobTag.jobId === jobId && jobTag.tag === tag);
    
    if (tagsToRemove.length === 0) return false;
    
    tagsToRemove.forEach(([id]) => this.jobTags.delete(id));
    return true;
  }
  
  // Application operations
  async getApplication(id: number): Promise<Application | undefined> {
    return this.applications.get(id);
  }
  
  async getApplications(filters?: { 
    jobId?: number, 
    applicantId?: number, 
    status?: string 
  }): Promise<Application[]> {
    let applications = Array.from(this.applications.values());
    
    if (filters) {
      if (filters.jobId) {
        applications = applications.filter(app => app.jobId === filters.jobId);
      }
      
      if (filters.applicantId) {
        applications = applications.filter(app => app.applicantId === filters.applicantId);
      }
      
      if (filters.status) {
        applications = applications.filter(app => app.status === filters.status);
      }
    }
    
    return applications;
  }
  
  async createApplication(application: InsertApplication): Promise<Application> {
    const id = this.applicationIdCounter++;
    const timestamp = new Date();
    const newApplication: Application = { 
      ...application, 
      id, 
      appliedDate: timestamp,
      lastUpdated: timestamp
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }
  
  async updateApplication(id: number, updates: Partial<Application>): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { 
      ...application, 
      ...updates, 
      lastUpdated: new Date() 
    };
    this.applications.set(id, updatedApplication);
    return updatedApplication;
  }
}

export const storage = new MemStorage();
