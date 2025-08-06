# Career Portal - Job Board Application

## Overview
The Career Portal is a comprehensive job board application designed to connect job seekers with employers. It features role-based access control for admin, employee, and applicant users, offering job posting management, application tracking, and user management capabilities. The project aims to provide a robust platform for career development and recruitment.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: Radix UI primitives with custom shadcn/ui
- **Styling**: Tailwind CSS with custom theme
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation
- **UI/UX Decisions**: Incorporates a consistent purple branding with gradients, professional shadows, colored badges for job listings, and a clean, accessible design. Features include an RC logo, "The Resource Consultants" branding, "Find Your Dream Career" title, job cards with hover effects, and comprehensive modals for login and application.

### Backend
- **Runtime**: Node.js with TypeScript/JavaScript (ES modules)
- **Framework**: Express.js
- **Session Management**: Express-session with MemoryStore
- **File Handling**: Multer for resume uploads
- **Authentication**: Session-based with role-based access (Admin, Employee, Applicant)
- **Key Features**: User management (authentication, roles), Job management (creation, filtering, status), Application system (resume upload, tracking, review), File storage (local filesystem for resumes).

### Database
- **Type**: PostgreSQL
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Migration**: Custom migration system with seeding capabilities
- **Backup**: Includes fallback in-memory storage for development.

## External Dependencies

### Core
- **@neondatabase/serverless**: Database connection (for cloud deployments)
- **pg**: PostgreSQL client
- **drizzle-orm**: TypeScript ORM
- **express-session**: Session management
- **multer**: File upload handling
- **bcrypt**: Password hashing (for production use)

### Frontend
- **@tanstack/react-query**: Server state management
- **@radix-ui/**\*: Accessible UI component primitives
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **tailwindcss**: CSS framework