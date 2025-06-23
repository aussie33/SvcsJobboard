# Career Portal - Job Board Application

## Overview
The Career Portal is a comprehensive job board application built with modern web technologies. It serves as a platform connecting job seekers with employers, featuring role-based access control for admin, employee, and applicant users. The application provides job posting management, application tracking, and user management capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with custom theme configuration
- **Build Tool**: Vite for development and production builds
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript/JavaScript (ES modules)
- **Framework**: Express.js for HTTP server and API routes
- **Session Management**: Express-session with MemoryStore
- **File Handling**: Multer for resume uploads
- **Database**: PostgreSQL with Drizzle ORM
- **Migration System**: Custom migration scripts for database setup

### Database Architecture
- **Primary Database**: PostgreSQL
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migration**: Custom migration system with seeding capabilities
- **Backup Strategy**: Includes fallback in-memory storage for development

## Key Components

### User Management
- **Authentication**: Session-based authentication with role-based access control
- **User Roles**: Admin, Employee, and Applicant with different permission levels
- **Session Storage**: MemoryStore with configurable TTL and cleanup

### Job Management
- **Job Creation**: Full job posting workflow with categories and tags
- **Job Filtering**: Search and filter by department, location, type, and category
- **Job Status Management**: Draft, active, paused, and closed states

### Application System
- **Resume Upload**: File upload with PDF/DOC support and size limits
- **Application Tracking**: Status management from submission to hiring decision
- **Application Review**: Employee and admin interfaces for managing applications

### File Storage
- **Upload Directory**: Local filesystem storage for resumes
- **File Validation**: MIME type and size validation
- **Served Assets**: Express static middleware for file serving

## Data Flow

### Authentication Flow
1. User submits login credentials
2. Server validates against database
3. Session created and stored in MemoryStore
4. Client receives session cookie
5. Subsequent requests include session for authorization

### Job Application Flow
1. Applicant browses public job listings
2. Applicant submits application with resume upload
3. File processed and stored on server
4. Application record created in database
5. Employees/admins notified of new application
6. Review and status updates tracked through application lifecycle

### Job Management Flow
1. Employees create job postings through dashboard
2. Jobs can be saved as drafts or published immediately
3. Published jobs appear in public listings
4. Job status can be managed through employee interface
5. Applications associated with jobs tracked and managed

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connection (fallback for cloud deployments)
- **pg**: PostgreSQL client for database operations
- **drizzle-orm**: TypeScript ORM for database schema and queries
- **express-session**: Session management middleware
- **multer**: File upload handling
- **bcrypt**: Password hashing (implied for production use)

### Frontend Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **react-hook-form**: Form state management and validation
- **zod**: Schema validation for forms and API
- **tailwindcss**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Dev Server**: Vite development server with HMR
- **Database**: Local PostgreSQL or in-memory fallback
- **Session Storage**: MemoryStore suitable for single-instance development

### Production Environment
- **Application Server**: Node.js with PM2 process management
- **Reverse Proxy**: Nginx for static file serving and load balancing
- **Database**: PostgreSQL with connection pooling
- **File Storage**: Local filesystem with backup strategies
- **SSL**: Certbot/Let's Encrypt for HTTPS termination
- **Process Management**: PM2 with ecosystem configuration

### Deployment Features
- **Multi-environment Support**: Development, staging, and production configurations
- **Database Migration**: Automated schema creation and seeding
- **Health Checks**: Application health monitoring endpoints
- **Backup System**: Database and file backup strategies
- **Security Hardening**: Firewall configuration and fail2ban protection

## Changelog
- June 23, 2025. Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.