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
  getApplicationCount(jobId: number): Promise<number>;
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
    // Direct initialization without async (since this is a memory DB)
    
    // Add admin user (Super Admin)
    const adminUser: User = {
      id: this.userIdCounter++,
      username: "admin",
      password: "admin123",
      email: "admin@theresourceconsultants.com",
      firstName: "Admin",
      lastName: "User",
      fullName: "Admin User",
      role: "admin",
      isActive: true,
      isSuperAdmin: true, // Mark as super admin
      middleName: null,
      preferredName: null,
      department: "Management",
      createdAt: new Date(),
      lastLogin: null
    };
    this.users.set(adminUser.id, adminUser);
    
    // Add employee user
    const employeeUser: User = {
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
      createdAt: new Date(),
      lastLogin: null
    };
    this.users.set(employeeUser.id, employeeUser);
    
    // Add applicant user
    const applicantUser: User = {
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
      createdAt: new Date(),
      lastLogin: null
    };
    this.users.set(applicantUser.id, applicantUser);
    
    console.log('Initialized users:', this.users.size);
    
    // Add default categories directly without promises
    const categoryIndex = new Map<string, Category>();
    
    // Create categories directly
    const categories = [
      "Engineering", "Marketing", "Design", "Product", "Sales",
      "IT", "Software Development", "Healthcare & Medical", "Nursing", "Pharmacy", 
      "Counseling", "Engineering & Construction", "Mechanical Engineering", 
      "Business & Finance", "Education & Training", "Legal & Compliance", 
      "Government & Public Service", "Customer Service & Support", 
      "Logistics & Supply Chain", "Hospitality & Tourism", "Creative & Design", 
      "Graphic Design", "Video Production", "Photography", "Science & Research", 
      "Manufacturing & Trades", "Remote & Freelance", "Virtual Assistance", 
      "Content Writing", "Remote IT Support"
    ];
    
    categories.forEach(name => {
      const id = this.categoryIdCounter++;
      const category: Category = {
        id,
        name,
        description: `${name} department jobs`,
        status: "active",
        createdAt: new Date()
      };
      this.categories.set(id, category);
      categoryIndex.set(name, category);
    });
    
    console.log('Initialized categories:', this.categories.size);
    
    // Get the employee ID directly since we assigned it above
    const employeeId = 2; // From the initialization above
    
    // Create sample jobs directly
    const sampleJobs = [
      {
        title: "Senior Frontend Developer",
        department: "Engineering",
        categoryId: categoryIndex.get("Engineering")?.id || 1,
        employeeId: employeeId,
        shortDescription: "Join our team as a Senior Frontend Developer to build cutting-edge web applications.",
        fullDescription: "We're looking for an experienced frontend developer with expertise in React, TypeScript, and modern web development practices. You'll work on our core product and help shape the future of our platform.",
        requirements: "5+ years of experience with modern JavaScript frameworks, Strong TypeScript skills, Experience with CSS-in-JS solutions",
        type: "full-time",
        location: "remote",
        city: "San Francisco",
        state: "California",
        salaryRange: "$120,000 - $150,000",
        status: "active",
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      {
        title: "Product Designer",
        department: "Design",
        categoryId: categoryIndex.get("Design")?.id || 3,
        employeeId: employeeId,
        shortDescription: "Create beautiful, functional designs for our growing product suite.",
        fullDescription: "As a Product Designer, you'll work closely with our product and engineering teams to create intuitive and visually appealing user interfaces. You'll be involved in the entire product development lifecycle, from concept to implementation.",
        requirements: "3+ years of experience in product design, Proficiency in Figma, Experience in UX research and user testing",
        type: "full-time",
        location: "hybrid",
        city: "Austin",
        state: "Texas",
        salaryRange: "$90,000 - $120,000",
        status: "active",
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "Marketing Intern",
        department: "Marketing",
        categoryId: categoryIndex.get("Marketing")?.id || 2,
        employeeId: employeeId,
        shortDescription: "Join our marketing team for a summer internship opportunity.",
        fullDescription: "We're looking for enthusiastic marketing interns to join our team for a 3-month period. You'll gain hands-on experience in digital marketing, content creation, and campaign management.",
        requirements: "Currently pursuing a degree in Marketing or a related field, Strong written and verbal communication skills, Familiarity with social media platforms",
        type: "internship",
        location: "onsite",
        city: "Chicago",
        state: "Illinois",
        salaryRange: "$20-25/hour",
        status: "active",
        postedDate: new Date(),
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      }
    ];
    
    // Create jobs directly without promises
    sampleJobs.forEach(jobData => {
      const jobId = this.jobIdCounter++;
      const job: Job = {
        id: jobId,
        title: jobData.title,
        department: jobData.department,
        categoryId: jobData.categoryId,
        employeeId: jobData.employeeId,
        shortDescription: jobData.shortDescription,
        fullDescription: jobData.fullDescription,
        requirements: jobData.requirements,
        type: jobData.type as "full-time" | "part-time" | "contract" | "internship",
        location: jobData.location as "remote" | "onsite" | "hybrid",
        city: jobData.city,
        state: jobData.state,
        salaryRange: jobData.salaryRange,
        status: jobData.status as "active" | "draft" | "paused" | "closed",
        postedDate: jobData.postedDate,
        expiryDate: jobData.expiryDate
      };
      this.jobs.set(jobId, job);
      
      // Add tags based on job title directly
      if (job.title.includes("Developer")) {
        const tags = ["React", "TypeScript", "Frontend"];
        tags.forEach(tag => {
          const tagId = this.jobTagIdCounter++;
          this.jobTags.set(tagId, { id: tagId, jobId, tag });
        });
      } else if (job.title.includes("Designer")) {
        const tags = ["UI/UX", "Figma", "Design"];
        tags.forEach(tag => {
          const tagId = this.jobTagIdCounter++;
          this.jobTags.set(tagId, { id: tagId, jobId, tag });
        });
      } else if (job.title.includes("Marketing")) {
        const tags = ["Social Media", "Content", "Digital Marketing"];
        tags.forEach(tag => {
          const tagId = this.jobTagIdCounter++;
          this.jobTags.set(tagId, { id: tagId, jobId, tag });
        });
      }
    });
    
    console.log('Initialized jobs:', this.jobs.size);
    console.log('Initialized job tags:', this.jobTags.size);
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
    // Start with all users
    let users = Array.from(this.users.values());
    
    // Apply filters only if they're explicitly provided and have valid values
    if (filters) {
      // Filter by role
      if (filters.role) {
        console.log(`Filtering users by role: ${filters.role}`);
        users = users.filter(user => user.role === filters.role);
      }
      
      // Filter by active status
      if (filters.isActive !== undefined) {
        console.log(`Filtering users by active status: ${filters.isActive}`);
        users = users.filter(user => user.isActive === filters.isActive);
      }
    }
    
    console.log(`getUsers returning ${users.length} users after applying filters`);
    return users;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    
    // If fullName is not provided, generate it from first and last name
    let fullName = user.fullName;
    if (!fullName && user.firstName && user.lastName) {
      fullName = `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`;
    }
    
    const newUser: User = { 
      ...user, 
      fullName: fullName || `${user.firstName} ${user.lastName}`,
      id, 
      lastLogin: null,
      createdAt: timestamp
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, updates: Partial<User>, currentUserId?: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    // Get current user for permission checks
    const currentUser = currentUserId ? this.users.get(currentUserId) : null;
    
    // If the current user is not a super admin and target user is a super admin
    if (user.isSuperAdmin && (!currentUser || !currentUser.isSuperAdmin)) {
      if (updates.role !== undefined || updates.isActive !== undefined || updates.isSuperAdmin !== undefined) {
        // Non-super admin trying to change super admin properties
        throw new Error("Only super admins can modify super admin properties");
      }
    }
    
    // Self-protection - Regular admins cannot downgrade their own admin status
    if (currentUserId === id && user.role === 'admin' && !user.isSuperAdmin && 
        updates.role !== undefined && updates.role !== 'admin') {
      throw new Error("Regular admins cannot change their own admin status");
    }
    
    // Update fullName if name components are changed
    if ((updates.firstName || updates.lastName || updates.middleName) && !updates.fullName) {
      const firstName = updates.firstName || user.firstName;
      const lastName = updates.lastName || user.lastName;
      const middleName = updates.middleName !== undefined ? updates.middleName : user.middleName;
      
      updates.fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;
    }
    
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
    location?: string,
    city?: string,
    state?: string
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
      
      if (filters.city) {
        jobs = jobs.filter(job => job.city && job.city.toLowerCase().includes(filters.city!.toLowerCase()));
      }
      
      if (filters.state) {
        jobs = jobs.filter(job => job.state && job.state.toLowerCase().includes(filters.state!.toLowerCase()));
      }
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(searchLower) || 
          job.shortDescription.toLowerCase().includes(searchLower) ||
          job.fullDescription.toLowerCase().includes(searchLower) ||
          (job.city && job.city.toLowerCase().includes(searchLower)) ||
          (job.state && job.state.toLowerCase().includes(searchLower))
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
      lastUpdated: timestamp,
      status: application.status || 'new' // Ensure status is set to 'new' if not provided
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
  
  async getApplicationCount(jobId: number): Promise<number> {
    const applications = await this.getApplications({ jobId });
    return applications.length;
  }
}

import { PostgreSQLStorage } from './postgres-storage.js';

// Use PostgreSQL if DATABASE_URL is provided, otherwise fall back to in-memory
export const storage = process.env.DATABASE_URL 
  ? new PostgreSQLStorage(process.env.DATABASE_URL)
  : new MemStorage();
