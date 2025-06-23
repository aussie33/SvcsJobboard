const { z } = require("zod");

// Define the schemas for validation
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required"),
  role: z.enum(["admin", "employee", "applicant"]),
  isActive: z.boolean().optional().default(true),
  phoneNumber: z.string().optional(),
  address: z.string().optional()
});

const insertCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional().default("active")
});

const insertJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  department: z.string().min(1, "Department is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  fullDescription: z.string().min(1, "Full description is required"),
  location: z.enum(["remote", "onsite", "hybrid"]),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
  salary: z.string().optional(),
  benefits: z.string().optional(),
  requirements: z.string().optional(),
  categoryId: z.number().optional(),
  employeeId: z.number(),
  status: z.enum(["draft", "active", "paused", "closed"]).optional().default("draft"),
  expiryDate: z.date().optional()
});

const insertJobTagSchema = z.object({
  jobId: z.number(),
  tag: z.string().min(1, "Tag cannot be empty")
});

const insertApplicationSchema = z.object({
  jobId: z.number(),
  applicantId: z.number().optional(),
  applicantName: z.string().min(1, "Applicant name is required"),
  applicantEmail: z.string().email("Invalid email address"),
  applicantPhone: z.string().optional(),
  coverLetter: z.string().optional(),
  resumeUrl: z.string().optional(),
  status: z.enum(["new", "reviewing", "interviewed", "rejected", "hired"]).optional().default("new")
});

const jobWithTagsSchema = z.object({
  id: z.number(),
  title: z.string(),
  department: z.string(),
  shortDescription: z.string(),
  fullDescription: z.string(), 
  location: z.enum(["remote", "onsite", "hybrid"]),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
  salary: z.string().optional(),
  benefits: z.string().optional(),
  requirements: z.string().optional(),
  categoryId: z.number().optional(),
  employeeId: z.number(),
  status: z.enum(["draft", "active", "paused", "closed"]),
  expiryDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()),
  applicationCount: z.number().optional()
});

const applicationWithResumeSchema = insertApplicationSchema.extend({
  resume: z.any().optional()
});

module.exports = {
  loginSchema,
  insertUserSchema,
  insertCategorySchema,
  insertJobSchema,
  insertJobTagSchema,
  insertApplicationSchema,
  jobWithTagsSchema,
  applicationWithResumeSchema
};