import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ZodError } from "zod";
import { 
  insertUserSchema, 
  insertCategorySchema, 
  insertJobSchema, 
  insertApplicationSchema,
  loginSchema,
  jobWithTagsSchema,
  applicationWithResumeSchema
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
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
    // Accept only pdf, doc, docx
    const allowedMimes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF and DOC files are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Helper to handle zod validation errors
const handleZodError = (err: unknown, res: Response) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ 
      message: "Validation error", 
      errors: err.errors 
    });
  }
  console.error("Unexpected error:", err);
  return res.status(500).json({ message: "Internal server error" });
};

// Simple auth middleware
const requireAuth = async (req: Request, res: Response, next: Function) => {
  console.log('requireAuth - Session ID:', req.sessionID);
  console.log('requireAuth - Session exists:', !!req.session);
  console.log('requireAuth - Session userId:', req.session?.userId);
  
  if (!req.session || !req.session.userId) {
    console.log('requireAuth - No session or userId, returning 401');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    console.log('requireAuth - User not found for userId:', req.session.userId);
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(401).json({ message: "User not found" });
  }
  
  if (!user.isActive) {
    console.log('requireAuth - User account disabled:', user.username);
    req.session.destroy((err) => {
      if (err) console.error('Session destroy error:', err);
    });
    return res.status(403).json({ message: "Account is disabled" });
  }
  
  console.log('requireAuth - Success for user:', user.username);
  req.user = user;
  next();
};

// Role-based authorization middleware
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Extend express request to include user
  app.use((req, res, next) => {
    req.user = null;
    next();
  });
  
  // Set up session middleware
  app.use((req, res, next) => {
    // Session is already initialized by express-session middleware
    // We just need to make sure userId is properly typed
    next();
  });
  
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      // Check if the provided username is an email address
      const isEmail = credentials.username.includes('@');
      
      // Try to find user by username or email
      let user = isEmail 
        ? await storage.getUserByEmail(credentials.username) 
        : await storage.getUserByUsername(credentials.username);
      
      // If we didn't find a user and the username doesn't look like an email,
      // let's try finding by email anyway (for backward compatibility)
      if (!user && !isEmail) {
        user = await storage.getUserByEmail(credentials.username);
      }
      
      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is disabled" });
      }
      
      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Set user session
      req.session.userId = user.id;
      console.log('Login successful - Setting session userId:', user.id);
      console.log('Session ID:', req.sessionID);
      
      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session save failed" });
        }
        
        console.log('Session saved successfully');
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: "Error logging out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
  
  // User registration route (public)
  app.post("/api/users/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName, middleName, preferredName, fullName, role } = req.body;
      
      // Validation checks
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "Required fields are missing" });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Only allow applicant role through public registration
      if (role !== 'applicant') {
        return res.status(403).json({ message: "Only applicant accounts can be created through registration" });
      }
      
      // Create the user
      const newUser = await storage.createUser({
        username,
        email,
        password,
        firstName,
        lastName,
        middleName: middleName || null,
        preferredName: preferredName || null,
        fullName: fullName || `${firstName} ${lastName}`,
        role: 'applicant',
        isActive: true,
        department: null,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  // Password reset request route
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // For security reasons, don't reveal if the email exists or not
      // Just return a success message even if the email doesn't exist
      
      // In a real system, this would send an email with a password reset link
      // For this demo, we'll just return a success message
      
      res.json({ message: "If an account with that email exists, password reset instructions have been sent." });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.get("/api/auth/me", requireAuth, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // User routes (Admin only)
  app.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    const { role, active } = req.query;
    const filters: { role?: string, isActive?: boolean } = {};
    
    console.log('GET /api/users - Request query params:', req.query);
    
    // Only apply filters if they're explicitly provided with valid values
    if (role && role !== 'all') {
      filters.role = role.toString();
    }
    
    // Only apply active filter if explicitly provided and not 'all'
    if (active === 'true') {
      filters.isActive = true;
    } else if (active === 'false') {
      filters.isActive = false;
    }
    // If active is not provided, is 'all', or is invalid, no filter is applied
    
    console.log('Processed filters for getUsers:', filters);
    
    try {
      // Get all users from storage
      const allUsers = await storage.getUsers({});
      console.log('Total users in system:', allUsers.length);
      
      // Get filtered users
      const users = await storage.getUsers(filters);
      console.log('Filtered users count:', users.length);
      
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      console.log('Sending users response with', usersWithoutPasswords.length, 'users');
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.patch("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get current user ID for permission checks
      const currentUserId = req.user?.id;
      
      // Only allow certain fields to be updated
      const { 
        username, email, firstName, lastName, middleName, 
        preferredName, fullName, role, department, isActive, isSuperAdmin 
      } = req.body;
      
      const updates: Partial<typeof user> = {};
      
      if (username !== undefined) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
        updates.username = username;
      }
      
      if (email !== undefined) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
        updates.email = email;
      }
      
      // Update name fields
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (middleName !== undefined) updates.middleName = middleName;
      if (preferredName !== undefined) updates.preferredName = preferredName;
      if (fullName !== undefined) updates.fullName = fullName;
      
      // Update role and status (protected by the storage.updateUser method)
      if (role !== undefined) updates.role = role;
      if (department !== undefined) updates.department = department;
      if (isActive !== undefined) updates.isActive = isActive;
      
      // Only super admins can set another user as super admin
      if (isSuperAdmin !== undefined) {
        const currentUser = await storage.getUser(currentUserId!);
        if (currentUser && currentUser.isSuperAdmin) {
          updates.isSuperAdmin = isSuperAdmin;
        } else {
          return res.status(403).json({ message: "Only super admins can assign super admin status" });
        }
      }
      
      try {
        // Pass the current user ID to check permissions
        const updatedUser = await storage.updateUser(userId, updates, currentUserId);
        
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
      } catch (error) {
        // Handle specific error messages from the storage layer
        if (error instanceof Error) {
          return res.status(403).json({ message: error.message });
        }
        throw error;
      }
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  // Category routes (Admin only)
  app.get("/api/categories", async (req, res) => {
    const includeInactive = req.query.includeInactive === "true";
    const categories = await storage.getCategories(includeInactive);
    res.json(categories);
  });
  
  app.post("/api/categories", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const newCategory = await storage.createCategory(categoryData);
      res.status(201).json(newCategory);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.patch("/api/categories/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const category = await storage.getCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      const { name, description, status } = req.body;
      const updates: Partial<typeof category> = {};
      
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (status !== undefined) updates.status = status;
      
      const updatedCategory = await storage.updateCategory(categoryId, updates);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      res.json(updatedCategory);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  // Job routes
  app.get("/api/jobs", async (req, res) => {
    const { employeeId, status, categoryId, search, department, location, city, state, includeAllStatuses } = req.query;
    const filters: {
      employeeId?: number;
      status?: string;
      categoryId?: number;
      search?: string;
      department?: string;
      location?: string;
      city?: string;
      state?: string;
    } = {};
    
    if (employeeId) filters.employeeId = parseInt(employeeId.toString());
    
    // Special flag to include all job statuses when viewing employee's own jobs
    const showAllStatuses = includeAllStatuses === 'true';
    
    // Logic for filtering by status:
    // 1. If status is explicitly provided in query params, use that (e.g., status=active)
    // 2. If no status is provided but includeAllStatuses=true, don't add status filter (return all)
    // 3. Otherwise for public access or normal employee views, only show active jobs
    if (status) {
      // Case 1: Explicit status filter provided
      filters.status = status.toString();
      console.log(`Using explicit status filter: ${filters.status}`);
    } else if (!showAllStatuses) {
      // Case 3: Default behavior - show only active jobs for most views
      filters.status = "active";
      console.log(`No status specified and showAllStatuses=false, defaulting to active only`);
    } else {
      // Case 2: showAllStatuses is true, we don't add a status filter to see all statuses
      console.log(`showAllStatuses=true, showing all job statuses (no status filter applied)`);
    }
    
    if (categoryId && categoryId !== '' && categoryId !== 'all') filters.categoryId = parseInt(categoryId.toString());
    if (search) filters.search = search.toString();
    if (department) filters.department = department.toString();
    if (location) filters.location = location.toString();
    if (city) filters.city = city.toString();
    if (state) filters.state = state.toString();
    
    const jobs = await storage.getJobs(filters);
    
    // Get tags and application counts for each job
    const jobsWithTagsAndCounts = await Promise.all(jobs.map(async (job) => {
      const tags = await storage.getJobTags(job.id);
      const applicationCount = await storage.getApplicationCount(job.id);
      return {
        ...job,
        tags: tags.map(tag => tag.tag),
        applicationCount
      };
    }));
    
    res.json(jobsWithTagsAndCounts);
  });
  
  app.get("/api/jobs/:id", async (req, res) => {
    const jobId = parseInt(req.params.id);
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    // Get tags for the job
    const tags = await storage.getJobTags(job.id);
    
    res.json({
      ...job,
      tags: tags.map(tag => tag.tag)
    });
  });
  
  app.post("/api/jobs", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    try {
      // Parse request body using schema that doesn't expect employeeId
      const { job: jobData, tags } = jobWithTagsSchema.parse(req.body);
      
      // Set the employee ID to the current user
      const jobWithEmployee = { ...jobData, employeeId: req.user!.id };
      
      const newJob = await storage.createJob(jobWithEmployee);
      
      // Add tags
      if (tags && tags.length > 0) {
        for (const tag of tags) {
          await storage.addJobTag({
            jobId: newJob.id,
            tag
          });
        }
      }
      
      // Get the tags we just created
      const jobTags = await storage.getJobTags(newJob.id);
      
      res.status(201).json({
        ...newJob,
        tags: jobTags.map(tag => tag.tag)
      });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  app.patch("/api/jobs/:id", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Ensure the user is the job owner or an admin
      if (job.employeeId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const { job: jobUpdates, tags } = req.body;
      
      if (jobUpdates) {
        // Only allow certain fields to be updated
        const allowedUpdates = [
          "title", "department", "categoryId", "shortDescription", 
          "fullDescription", "requirements", "type", "location",
          "city", "state", "salaryRange", "status", "expiryDate"
        ];
        
        const filteredUpdates: Partial<typeof job> = {};
        for (const key of allowedUpdates) {
          if (jobUpdates[key] !== undefined) {
            filteredUpdates[key] = jobUpdates[key];
          }
        }
        
        await storage.updateJob(jobId, filteredUpdates);
      }
      
      // Update tags if provided
      if (tags) {
        // Get current tags
        const currentTags = await storage.getJobTags(jobId);
        const currentTagValues = currentTags.map(tag => tag.tag);
        
        // Remove tags not in the new list
        for (const currentTag of currentTagValues) {
          if (!tags.includes(currentTag)) {
            await storage.removeJobTag(jobId, currentTag);
          }
        }
        
        // Add new tags
        for (const newTag of tags) {
          if (!currentTagValues.includes(newTag)) {
            await storage.addJobTag({
              jobId,
              tag: newTag
            });
          }
        }
      }
      
      // Get the updated job with tags
      const updatedJob = await storage.getJob(jobId);
      const jobTags = await storage.getJobTags(jobId);
      
      res.json({
        ...updatedJob,
        tags: jobTags.map(tag => tag.tag)
      });
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  // Application routes
  app.get("/api/applications", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    const { jobId, status } = req.query;
    const filters: {
      jobId?: number;
      status?: string;
    } = {};
    
    if (jobId && jobId !== 'all') filters.jobId = parseInt(jobId.toString());
    if (status && status !== 'all') filters.status = status.toString();
    
    // If employee, only show applications for their jobs
    if (req.user.role === "employee") {
      const employeeJobs = await storage.getJobs({ employeeId: req.user.id });
      const employeeJobIds = employeeJobs.map(job => job.id);
      
      // No jobs, return empty array
      if (employeeJobIds.length === 0) {
        return res.json([]);
      }
      
      // Get applications for all employee jobs if no specific jobId is given
      if (!filters.jobId) {
        const allApplications = await Promise.all(
          employeeJobIds.map(jobId => storage.getApplications({ jobId }))
        );
        
        let applications = allApplications.flat();
        
        // Filter by status if needed
        if (filters.status) {
          applications = applications.filter(app => app.status === filters.status);
        }
        
        return res.json(applications);
      }
      
      // Ensure the specified jobId belongs to the employee
      if (!employeeJobIds.includes(filters.jobId)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }
    
    const applications = await storage.getApplications(filters);
    res.json(applications);
  });
  
  app.get("/api/my-applications", requireAuth, async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get applications for the current user
      const applications = await storage.getApplications({ applicantId: req.user.id });
      
      // Add extra details like resume URLs if needed
      const processedApplications = applications.map(app => ({
        ...app,
        resumeUrl: app.resumeUrl ? `/api/applications/${app.id}/resume` : null
      }));
      
      res.json(processedApplications);
    } catch (err) {
      console.error('Error fetching applications:', err);
      return res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });
  
  app.post("/api/applications", upload.single("resume"), async (req, res) => {
    try {
      // Parse application data
      const applicationData = { ...req.body };
      
      // Convert string values to numbers for proper validation
      if (applicationData.jobId) {
        applicationData.jobId = parseInt(applicationData.jobId);
      }
      
      if (applicationData.applicantId) {
        applicationData.applicantId = parseInt(applicationData.applicantId);
      }
      
      // Validate the data
      const parsedData = insertApplicationSchema.parse(applicationData);
      
      // Add resume URL if available
      if (req.file) {
        parsedData.resumeUrl = `/uploads/${req.file.filename}`;
      } else if (applicationData.resumeUrl) {
        // Handle Google Docs link
        parsedData.resumeUrl = applicationData.resumeUrl;
      }
      
      // Set applicant id if logged in
      if (req.user) {
        console.log('Setting applicant ID to:', req.user.id);
        parsedData.applicantId = req.user.id;
      }
      
      // Check if user already applied for this job
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
      console.log('Created application:', newApplication);
      
      res.status(201).json(newApplication);
    } catch (err) {
      console.error('Application submission error:', err);
      handleZodError(err, res);
    }
  });
  
  app.patch("/api/applications/:id", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const application = await storage.getApplication(applicationId);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // If employee, ensure they own the job
      if (req.user.role === "employee") {
        const job = await storage.getJob(application.jobId);
        if (!job || job.employeeId !== req.user.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      // Only allow status and notes to be updated
      const { status, notes } = req.body;
      const updates: Partial<typeof application> = {};
      
      if (status !== undefined) updates.status = status;
      if (notes !== undefined) updates.notes = notes;
      
      const updatedApplication = await storage.updateApplication(applicationId, updates);
      
      if (!updatedApplication) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(updatedApplication);
    } catch (err) {
      handleZodError(err, res);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
