import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'employee', 'applicant']);
export const jobStatusEnum = pgEnum('job_status', ['draft', 'active', 'paused', 'closed']);
export const applicationStatusEnum = pgEnum('application_status', ['new', 'reviewing', 'interviewed', 'rejected', 'hired']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'internship']);
export const jobLocationEnum = pgEnum('job_location', ['remote', 'onsite', 'hybrid']);
export const categoryStatusEnum = pgEnum('category_status', ['active', 'inactive']);

// Tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  middleName: text('middle_name'),
  preferredName: text('preferred_name'),
  fullName: text('full_name').notNull(), // Kept for backward compatibility
  role: userRoleEnum('role').notNull().default('applicant'),
  department: text('department'),
  isActive: boolean('is_active').notNull().default(true),
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: categoryStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const jobs = pgTable('jobs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  department: text('department').notNull(),
  categoryId: integer('category_id').references(() => categories.id),
  employeeId: integer('employee_id').references(() => users.id).notNull(),
  shortDescription: text('short_description').notNull(),
  fullDescription: text('full_description').notNull(),
  requirements: text('requirements').notNull(),
  type: jobTypeEnum('type').notNull(),
  location: jobLocationEnum('location').notNull(),
  city: text('city'),
  state: text('state'),
  salaryRange: text('salary_range'),
  status: jobStatusEnum('status').notNull().default('draft'),
  postedDate: timestamp('posted_date').defaultNow(),
  expiryDate: timestamp('expiry_date'),
});

export const jobTags = pgTable('job_tags', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  tag: text('tag').notNull(),
});

export const applications = pgTable('applications', {
  id: serial('id').primaryKey(),
  jobId: integer('job_id').references(() => jobs.id).notNull(),
  applicantId: integer('applicant_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  resumeUrl: text('resume_url'),
  coverLetter: text('cover_letter'),
  status: applicationStatusEnum('status').notNull().default('new'),
  appliedDate: timestamp('applied_date').defaultNow(),
  lastUpdated: timestamp('last_updated').defaultNow(),
  notes: text('notes'),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, lastLogin: true, createdAt: true });

export const insertCategorySchema = createInsertSchema(categories)
  .omit({ id: true, createdAt: true });

export const insertJobSchema = createInsertSchema(jobs)
  .omit({ id: true, postedDate: true, expiryDate: true });

export const insertJobTagSchema = createInsertSchema(jobTags)
  .omit({ id: true });

export const insertApplicationSchema = createInsertSchema(applications)
  .omit({ id: true, appliedDate: true, lastUpdated: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type JobTag = typeof jobTags.$inferSelect;
export type InsertJobTag = z.infer<typeof insertJobTagSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

// Extended schemas for the client
export const loginSchema = z.object({
  username: z.string().min(3).describe("Username or email address"),
  password: z.string().min(6),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

export const jobWithTagsSchema = z.object({
  job: z.object(createInsertSchema(jobs).shape),
  tags: z.array(z.string()),
  applicationCount: z.number().optional(),
});

export type JobWithTags = z.infer<typeof jobWithTagsSchema>;

export const applicationWithResumeSchema = insertApplicationSchema.extend({
  resume: z.instanceof(File).optional(),
});

export type ApplicationWithResume = z.infer<typeof applicationWithResumeSchema>;
