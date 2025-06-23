const { createServer } = require("http");
const { storage } = require("./storage.js");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { ZodError } = require("zod");
const { 
  insertUserSchema, 
  insertCategorySchema, 
  insertJobSchema, 
  insertApplicationSchema,
  loginSchema,
  jobWithTagsSchema,
  applicationWithResumeSchema
} = require("../shared/schema.js");

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

const handleZodError = (err, res) => {
  if (err instanceof ZodError) {
    const errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));
    return res.status(400).json({ 
      message: "Validation error", 
      errors 
    });
  }
  throw err;
};

const requireAuth = async (req, res, next) => {
  console.log('requireAuth - Session ID:', req.sessionID);
  console.log('requireAuth - Session exists:', !!req.session);
  console.log('requireAuth - Session userId:', req.session?.userId);
  
  if (!req.session || !req.session.userId) {
    console.log('requireAuth - No session or userId, returning 401');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      console.log('requireAuth - User not found, returning 401');
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = user;
    console.log('requireAuth - Success for user:', user.username);
    next();
  } catch (error) {
    console.error('requireAuth - Error:', error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};

async function registerRoutes(app) {
  const server = createServer(app);

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Check if user exists with this username
      let user = await storage.getUserByUsername(username);
      
      // If not found by username, try email
      if (!user) {
        user = await storage.getUserByEmail(username);
      }
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user ID in session
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
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });

  // User routes
  app.get("/api/users", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      console.log('GET /api/users - Request query params:', req.query);
      
      const { role, isActive } = req.query;
      const filters = {};
      
      if (role && role !== 'all') {
        filters.role = role;
      }
      
      if (isActive !== undefined) {
        filters.isActive = isActive === 'true';
      }
      
      console.log('Processed filters for getUsers:', filters);
      
      const users = await storage.getUsers(filters);
      console.log('getUsers returning', users.length, 'users after applying filters');
      console.log('Total users in system:', users.length);
      
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      console.log('getUsers returning', usersWithoutPasswords.length, 'users after applying filters');
      console.log('Filtered users count:', usersWithoutPasswords.length);
      console.log('Sending users response with', usersWithoutPasswords.length, 'users');
      
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error in GET /api/users:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/users/:id", requireAuth, requireRole(['admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Remove password from updates if empty
      if (updates.password === '') {
        delete updates.password;
      }
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const { includeInactive } = req.query;
      const categories = await storage.getCategories(includeInactive === 'true');
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", requireAuth, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/categories/:id", requireAuth, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const category = await storage.updateCategory(id, updates);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Job routes
  app.get("/api/jobs", async (req, res) => {
    try {
      const { employeeId, status, categoryId, search, department, location, showAllStatuses } = req.query;
      
      const filters = {};
      
      if (employeeId) {
        filters.employeeId = parseInt(employeeId);
      }
      
      if (status) {
        filters.status = status;
        console.log(`Status filter applied: ${status}`);
      } else if (showAllStatuses !== 'true') {
        // Default to active jobs only if no status specified and showAllStatuses is not true
        filters.status = 'active';
        console.log('No status specified and showAllStatuses=false, defaulting to active only');
      } else {
        console.log('showAllStatuses=true, showing all job statuses (no status filter applied)');
      }
      
      if (categoryId) {
        filters.categoryId = parseInt(categoryId);
      }
      
      if (search) {
        filters.search = search;
      }
      
      if (department) {
        filters.department = department;
      }
      
      if (location) {
        filters.location = location;
      }
      
      const jobs = await storage.getJobs(filters);
      
      // Get job tags and application counts for each job
      const jobsWithDetails = await Promise.all(
        jobs.map(async (job) => {
          const tags = await storage.getJobTags(job.id);
          const applicationCount = await storage.getApplicationCount(job.id);
          return {
            ...job,
            tags: tags.map(tag => tag.tag),
            applicationCount
          };
        })
      );
      
      res.json(jobsWithDetails);
    } catch (error) {
      console.error('Error in GET /api/jobs:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getJob(id);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Get job tags and application count
      const tags = await storage.getJobTags(job.id);
      const applicationCount = await storage.getApplicationCount(job.id);
      
      const jobWithDetails = {
        ...job,
        tags: tags.map(tag => tag.tag),
        applicationCount
      };
      
      res.json(jobWithDetails);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/jobs", requireAuth, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const { tags, ...jobData } = req.body;
      
      // Set employeeId to current user's ID
      jobData.employeeId = req.user.id;
      
      const parsedJobData = insertJobSchema.parse(jobData);
      const job = await storage.createJob(parsedJobData);
      
      // Add tags if provided
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          if (tag.trim()) {
            await storage.addJobTag({ jobId: job.id, tag: tag.trim() });
          }
        }
      }
      
      // Get the job with tags
      const jobTags = await storage.getJobTags(job.id);
      const jobWithTags = {
        ...job,
        tags: jobTags.map(tag => tag.tag)
      };
      
      res.status(201).json(jobWithTags);
    } catch (error) {
      console.error('Error creating job:', error);
      handleZodError(error, res);
    }
  });

  app.patch("/api/jobs/:id", requireAuth, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { tags, ...updates } = req.body;
      
      // Check if user owns this job (unless admin)
      if (req.user.role !== 'admin') {
        const existingJob = await storage.getJob(id);
        if (!existingJob || existingJob.employeeId !== req.user.id) {
          return res.status(403).json({ message: "You can only edit your own jobs" });
        }
      }
      
      // Validate the updates
      const validFields = ['title', 'shortDescription', 'fullDescription', 'department', 'location', 'jobType', 'salary', 'benefits', 'requirements', 'categoryId', 'status', 'expiryDate'];
      const filteredUpdates = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (validFields.includes(key)) {
          filteredUpdates[key] = value;
        }
      }
      
      const job = await storage.updateJob(id, filteredUpdates);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      // Update tags if provided
      if (tags && Array.isArray(tags)) {
        // Remove existing tags
        const existingTags = await storage.getJobTags(id);
        for (const tag of existingTags) {
          await storage.removeJobTag(id, tag.tag);
        }
        
        // Add new tags
        for (const tag of tags) {
          if (tag.trim()) {
            await storage.addJobTag({ jobId: id, tag: tag.trim() });
          }
        }
      }
      
      // Get the updated job with tags
      const jobTags = await storage.getJobTags(id);
      const jobWithTags = {
        ...job,
        tags: jobTags.map(tag => tag.tag)
      };
      
      res.json(jobWithTags);
    } catch (error) {
      console.error('Error updating job:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Application routes
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const { jobId, applicantId, status } = req.query;
      
      const filters = {};
      
      if (jobId) {
        filters.jobId = parseInt(jobId);
      }
      
      if (applicantId) {
        filters.applicantId = parseInt(applicantId);
      }
      
      if (status) {
        filters.status = status;
      }
      
      // If user is not admin, only show their own applications (as applicant) or applications for their jobs (as employee)
      if (req.user.role === 'applicant') {
        filters.applicantId = req.user.id;
      } else if (req.user.role === 'employee') {
        // Get jobs posted by this employee
        const employeeJobs = await storage.getJobs({ employeeId: req.user.id });
        const jobIds = employeeJobs.map(job => job.id);
        
        if (jobIds.length === 0) {
          return res.json([]);
        }
        
        // Filter applications to only include those for employee's jobs
        const allApplications = await storage.getApplications(filters);
        const filteredApplications = allApplications.filter(app => jobIds.includes(app.jobId));
        return res.json(filteredApplications);
      }
      
      const applications = await storage.getApplications(filters);
      res.json(applications);
    } catch (error) {
      console.error('Error in GET /api/applications:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/applications", upload.single('resume'), async (req, res) => {
    try {
      const applicationData = JSON.parse(req.body.applicationData);
      
      // Add resume filename if file was uploaded
      if (req.file) {
        applicationData.resumeUrl = `/uploads/${req.file.filename}`;
      }
      
      // Set status to 'new' by default
      applicationData.status = 'new';
      
      const parsedData = insertApplicationSchema.parse(applicationData);
      const application = await storage.createApplication(parsedData);
      
      res.status(201).json(application);
    } catch (error) {
      console.error('Error creating application:', error);
      handleZodError(error, res);
    }
  });

  app.patch("/api/applications/:id", requireAuth, requireRole(['admin', 'employee']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Check if user can update this application (employee can only update applications for their jobs)
      if (req.user.role === 'employee') {
        const application = await storage.getApplication(id);
        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }
        
        const job = await storage.getJob(application.jobId);
        if (!job || job.employeeId !== req.user.id) {
          return res.status(403).json({ message: "You can only update applications for your own jobs" });
        }
      }
      
      const application = await storage.updateApplication(id, updates);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // File download route
  app.get("/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "../uploads", filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    res.download(filePath);
  });

  return server;
}

module.exports = { registerRoutes };