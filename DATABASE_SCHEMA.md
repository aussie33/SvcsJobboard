# Database Schema Documentation

## Overview
The Career Portal uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema supports role-based user management, job postings, applications, and categorization.

## Database Connection
```typescript
DATABASE_URL=postgresql://career_portal_user:password@localhost:5432/career_portal_db
```

## Core Tables

### 1. Users Table
Primary table for all system users (admins, employees, applicants).

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hashed (cost factor 10)
  email VARCHAR(255) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  middleName VARCHAR(100),
  preferredName VARCHAR(100),
  fullName VARCHAR(200) NOT NULL,
  role user_role NOT NULL,  -- 'admin', 'employee', 'applicant'
  isActive BOOLEAN DEFAULT true,
  isSuperAdmin BOOLEAN DEFAULT false,
  department VARCHAR(100),
  createdAt TIMESTAMP DEFAULT now(),
  lastLogin TIMESTAMP
);
```

**Key Features:**
- ✅ **Secure Authentication**: bcrypt password hashing
- ✅ **Role-Based Access**: admin, employee, applicant roles
- ✅ **Super Admin Support**: Enhanced permissions for system management
- ✅ **Flexible Naming**: Support for preferred names and middle names

### 2. Categories Table
Job categories for organization and filtering.

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  status category_status DEFAULT 'active',  -- 'active', 'inactive'
  createdAt TIMESTAMP DEFAULT now()
);
```

### 3. Jobs Table
Job postings created by employees and managed by admins.

```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  department VARCHAR(100) NOT NULL,
  status job_status NOT NULL,  -- 'active', 'draft', 'paused', 'closed'
  title VARCHAR(200) NOT NULL,
  categoryId INTEGER REFERENCES categories(id),
  employeeId INTEGER NOT NULL REFERENCES users(id),
  shortDescription TEXT NOT NULL,
  fullDescription TEXT NOT NULL,
  requirements TEXT NOT NULL,
  type job_type NOT NULL,  -- 'full-time', 'part-time', 'contract', 'internship'
  location VARCHAR(100),
  salaryRange VARCHAR(50),
  postedDate TIMESTAMP DEFAULT now(),
  expiryDate TIMESTAMP
);
```

### 4. JobTags Table
Flexible tagging system for jobs (many-to-many relationship).

```sql
CREATE TABLE jobTags (
  id SERIAL PRIMARY KEY,
  jobId INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL
);
```

### 5. Applications Table
Job applications submitted by applicants.

```sql
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  status application_status NOT NULL,  -- 'new', 'reviewing', 'interviewed', 'rejected', 'hired'
  jobId INTEGER NOT NULL REFERENCES jobs(id),
  applicantId INTEGER REFERENCES users(id),
  phone VARCHAR(20),
  resumeUrl TEXT,
  coverLetter TEXT,
  appliedDate TIMESTAMP DEFAULT now(),
  lastUpdated TIMESTAMP DEFAULT now(),
  notes TEXT
);
```

## Enums and Types

### User Roles
```sql
CREATE TYPE user_role AS ENUM ('admin', 'employee', 'applicant');
```

### Job Status
```sql
CREATE TYPE job_status AS ENUM ('active', 'draft', 'paused', 'closed');
```

### Job Types
```sql
CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
```

### Application Status
```sql
CREATE TYPE application_status AS ENUM ('new', 'reviewing', 'interviewed', 'rejected', 'hired');
```

### Category Status
```sql
CREATE TYPE category_status AS ENUM ('active', 'inactive');
```

## Sample Data

### Default Users (with bcrypt hashed passwords)
```sql
-- Super Admin User
INSERT INTO users (username, password, email, firstName, lastName, fullName, role, isActive, isSuperAdmin, department) 
VALUES ('admin', '$2b$10$...', 'admin@theresourceconsultants.com', 'Admin', 'User', 'Admin User', 'admin', true, true, 'Management');

-- Employee User  
INSERT INTO users (username, password, email, firstName, lastName, fullName, role, isActive, department)
VALUES ('employee', '$2b$10$...', 'employee@theresourceconsultants.com', 'Employee', 'User', 'Employee User', 'employee', true, 'Engineering');

-- Applicant User
INSERT INTO users (username, password, email, firstName, lastName, fullName, role, isActive)
VALUES ('applicant', '$2b$10$...', 'applicant@example.com', 'Job', 'Applicant', 'Job Applicant', 'applicant', true);
```

### Default Categories
```sql
INSERT INTO categories (name, description, status) VALUES
('Engineering', 'Software development and technical roles', 'active'),
('Marketing', 'Marketing and promotional activities', 'active'),
('Design', 'UI/UX and graphic design positions', 'active'),
('Product', 'Product management and strategy', 'active'),
('Sales', 'Sales and business development', 'active'),
('Administrative', 'Administrative and support roles', 'active'),
('Healthcare & Medical', 'Medical and healthcare positions', 'active'),
('Nursing', 'Nursing and patient care roles', 'active'),
('Engineering & Construction', 'Construction and civil engineering', 'active'),
('Education & Training', 'Teaching and training positions', 'active');
```

## Relationships

### One-to-Many Relationships
- **users** → **jobs** (employeeId): Employees create job postings
- **categories** → **jobs** (categoryId): Jobs belong to categories
- **jobs** → **applications** (jobId): Jobs receive applications
- **users** → **applications** (applicantId): Applicants submit applications

### Many-to-Many Relationships
- **jobs** ↔ **tags** (via jobTags table): Jobs can have multiple tags

## Indexes for Performance

```sql
-- User lookups
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Job filtering
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_department ON jobs(department);
CREATE INDEX idx_jobs_category ON jobs(categoryId);
CREATE INDEX idx_jobs_employee ON jobs(employeeId);
CREATE INDEX idx_jobs_posted_date ON jobs(postedDate);

-- Application management
CREATE INDEX idx_applications_job ON applications(jobId);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_applicant ON applications(applicantId);

-- Tag searching
CREATE INDEX idx_job_tags_job ON jobTags(jobId);
CREATE INDEX idx_job_tags_tag ON jobTags(tag);
```

## Security Features

### Password Security
- ✅ **bcrypt Hashing**: All passwords use bcrypt with cost factor 10
- ✅ **No Plain Text**: Passwords never stored in plain text
- ✅ **Salt Included**: bcrypt automatically handles salting

### Data Validation
- ✅ **Email Validation**: Unique email constraints
- ✅ **Username Validation**: Unique username constraints
- ✅ **Required Fields**: NOT NULL constraints on critical fields
- ✅ **Enum Validation**: Type safety with PostgreSQL enums

### Access Control
- ✅ **Role-Based Access**: Different permissions for admin/employee/applicant
- ✅ **Super Admin**: Enhanced permissions for system management
- ✅ **Active Status**: Ability to disable users without deletion

## Migration Commands

### Initial Setup
```bash
# Install Drizzle CLI
npm install -g drizzle-kit

# Push schema to database
npm run db:push --force

# Generate types (if needed)
npm run db:generate
```

### Backup and Restore
```bash
# Create backup
pg_dump -h localhost -U career_portal_user career_portal_db > backup.sql

# Restore from backup
psql -h localhost -U career_portal_user -d career_portal_db < backup.sql
```

---
**Schema Version**: 2.0.0  
**Last Updated**: September 17, 2025  
**ORM**: Drizzle ORM with TypeScript  
**Database**: PostgreSQL 16+