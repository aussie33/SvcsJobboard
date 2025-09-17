# How Career Portal Features Work

## Overview
This document explains how each feature in the Career Portal works, including user workflows, technical implementation, and expected behavior.

---

## 🔐 Authentication System

### How Login Works
1. **User Access**: Users can log in with either username or email address
2. **Password Verification**: System uses bcrypt to securely compare provided password with stored hash
3. **Legacy Password Migration**: If an old plain text password is detected, it's automatically rehashed with bcrypt
4. **Session Creation**: Upon successful login, a secure session is created and stored
5. **Role-Based Redirect**: Users are redirected based on their role (Admin → Admin Portal, Employee → Employee Portal, etc.)

**Technical Flow**:
```
User Input → Credential Validation → bcrypt.compare() → Session Creation → Role-Based Routing
```

### How User Registration Works
1. **Public Registration**: Only applicant accounts can be created through public registration
2. **Data Validation**: All input is validated using Zod schemas
3. **Password Hashing**: Passwords are immediately hashed with bcrypt (cost factor 10)
4. **Account Creation**: User record created in database with hashed password
5. **Automatic Login**: User is automatically logged in after successful registration

---

## 👥 User Management (Admin Features)

### How Admin User Management Works
1. **User Overview**: Admin dashboard displays all users with filtering options
2. **User Creation**: Admins can create users with any role (Admin, Employee, Applicant)
3. **Password Management**: Admins can reset user passwords (automatically bcrypt hashed)
4. **Role Assignment**: Change user roles with appropriate permission checks
5. **Account Status**: Activate/deactivate accounts without deleting user data
6. **Super Admin Protection**: Only super admins can modify other super admin accounts

**Admin Password Update Process**:
```
Admin Request → Permission Check → bcrypt.hash(new_password, 10) → Database Update → Success Response
```

### How User Filtering Works
- **By Role**: Filter users by Admin, Employee, or Applicant roles
- **By Status**: Show only active or inactive users
- **Search**: Search by username, email, or full name
- **Real-time Updates**: Results update instantly as filters are applied

---

## 💼 Job Management System

### How Job Creation Works (Employee Portal)
1. **Authentication Check**: Verify user has Employee or Admin role
2. **Form Validation**: Job data validated against Zod schemas
3. **Category Assignment**: Jobs assigned to predefined categories
4. **Employee Association**: Job automatically linked to creating employee
5. **Status Setting**: Jobs start as "Draft" by default
6. **Tag System**: Optional tags added for better searchability
7. **Database Storage**: Job record created with all relationships

**Job Creation Flow**:
```
Employee Login → Job Form → Validation → Category Assignment → Database Insert → Success
```

### How Job Status Management Works
Jobs follow a specific lifecycle:
- **Draft**: Not visible to public, can be edited freely
- **Active**: Visible on public job board, accepting applications
- **Paused**: Temporarily hidden, existing applications preserved  
- **Closed**: No longer accepting applications, archived

**Status Change Process**:
```
Employee/Admin → Status Selection → Permission Check → Database Update → Public Display Update
```

### How Job Applications Work
1. **Public Job Browsing**: Anyone can view active jobs without account
2. **Application Form**: Applicants fill out application with resume upload
3. **File Validation**: Resume files validated (PDF/DOC only, 10MB limit)
4. **File Storage**: Resumes stored securely with unique identifiers
5. **Application Record**: Application linked to job and applicant (if logged in)
6. **Status Tracking**: Applications start as "New" status

**Application Submission Flow**:
```
Job Selection → Application Form → Resume Upload → Validation → Database Insert → Confirmation
```

---

## 🔍 Search and Filtering System

### How Job Search Works
1. **Text Search**: Searches job titles, descriptions, and requirements
2. **Category Filtering**: Filter by predefined job categories
3. **Department Filtering**: Filter by department assignments
4. **Location Filtering**: Filter by job location (Remote, Onsite, Hybrid)
5. **Status Filtering**: Admins/Employees can filter by job status
6. **Combined Filters**: Multiple filters can be applied simultaneously

**Search Implementation**:
```
User Input → Query Building → Database Search → Result Filtering → Display Update
```

### How Real-time Updates Work
- **TanStack Query**: Automatically refetches data when needed
- **Cache Management**: Intelligent caching reduces unnecessary API calls
- **Optimistic Updates**: UI updates immediately, then syncs with server
- **Error Recovery**: Automatic retry on failed requests

---

## 📂 File Upload System

### How Resume Upload Works
1. **File Selection**: User selects PDF or DOC file from device
2. **Client Validation**: File type and size checked before upload
3. **Secure Upload**: File transmitted to server via multipart form
4. **Server Validation**: Double-check file type and size on server
5. **Unique Naming**: File renamed with timestamp and random suffix
6. **Secure Storage**: File stored in uploads directory with restricted access
7. **Database Link**: File path stored in application record

**Upload Security Flow**:
```
File Selection → Client Validation → Upload → Server Validation → Secure Storage → Database Link
```

### How File Access Works
- **Authorized Access Only**: Only employees/admins can download resumes
- **Direct Links**: Files served through secure download endpoints
- **Permission Checks**: User permissions verified before file access
- **Audit Trail**: File access can be logged for compliance

---

## 🎨 User Interface System

### How Theme System Works
1. **Theme Configuration**: Purple branding defined in `theme.json`
2. **CSS Variables**: Colors dynamically applied via CSS custom properties
3. **Component Styling**: shadcn/ui components inherit theme colors
4. **Responsive Design**: Tailwind CSS classes adapt to screen sizes
5. **Accessibility**: ARIA labels and keyboard navigation built-in

**Theme Application Flow**:
```
theme.json → CSS Variables → Component Styling → User Interface
```

### How Navigation Works
- **Role-Based Menus**: Different navigation options for each user role
- **Active States**: Current page highlighted in navigation
- **Responsive Navigation**: Mobile menu on smaller screens
- **Breadcrumbs**: Clear navigation path for complex workflows

---

## 📊 Data Management System

### How Database Operations Work
1. **Type Safety**: All database operations use TypeScript types
2. **Schema Validation**: Zod schemas validate data before database operations
3. **ORM Abstraction**: Drizzle ORM handles SQL generation and execution
4. **Relationship Management**: Foreign keys maintain data integrity
5. **Transaction Support**: Complex operations wrapped in database transactions

**Database Operation Flow**:
```
User Action → Type Validation → Zod Validation → ORM Operation → Database → Response
```

### How Data Relationships Work
- **Users → Jobs**: Employees create and own job postings
- **Jobs → Categories**: Jobs belong to specific categories
- **Jobs → Applications**: Applications linked to specific jobs
- **Users → Applications**: Applicants linked to their applications
- **Jobs → Tags**: Many-to-many relationship for flexible tagging

---

## 🔒 Security Implementation

### How Password Security Works
1. **Hashing**: All passwords hashed with bcrypt (cost factor 10)
2. **Salt**: bcrypt automatically includes unique salt for each password
3. **Comparison**: Login uses bcrypt.compare() for secure verification
4. **No Plain Text**: Passwords never stored or transmitted in plain text
5. **Legacy Migration**: Old plain text passwords automatically upgraded

**Password Security Flow**:
```
User Password → bcrypt.hash(password, 10) → Database Storage → Login → bcrypt.compare() → Authentication
```

### How Session Security Works
- **Secure Sessions**: Session IDs cryptographically generated
- **HttpOnly Cookies**: Sessions stored in httpOnly cookies (XSS protection)
- **Session Expiry**: Sessions automatically expire after inactivity
- **Logout**: Sessions properly destroyed on logout
- **Role Verification**: User roles verified on each protected request

---

## 📱 Responsive Design System

### How Mobile Adaptation Works
1. **Breakpoint Detection**: CSS media queries detect screen size
2. **Layout Adjustment**: Components automatically adjust for mobile
3. **Touch Optimization**: Buttons and inputs optimized for touch
4. **Mobile Navigation**: Collapsible menu system for small screens
5. **Font Scaling**: Text sizes adjust appropriately for device

**Responsive Flow**:
```
Screen Size Detection → Layout Adjustment → Component Adaptation → Touch Optimization
```

### How Performance Optimization Works
- **Code Splitting**: Vite automatically splits code into chunks
- **Lazy Loading**: Components loaded only when needed
- **Query Caching**: API responses cached to reduce server requests
- **Image Optimization**: Images optimized for web delivery
- **Bundle Analysis**: Build process optimizes final bundle size

---

## 🚀 Deployment System

### How Production Deployment Works
1. **Build Process**: Vite creates optimized production build
2. **Asset Optimization**: CSS/JS files minified and compressed
3. **Process Management**: PM2 manages Node.js process lifecycle
4. **Reverse Proxy**: Nginx serves static files and proxies API requests
5. **Database Connection**: PostgreSQL connection pooling for efficiency
6. **Environment Configuration**: Production environment variables loaded

**Deployment Flow**:
```
Code Changes → Build Process → Asset Optimization → PM2 Deployment → Nginx Configuration → Live Site
```

### How Updates Work
1. **Code Push**: New code pushed to server
2. **Dependency Installation**: npm install updates packages
3. **Database Migration**: Schema changes applied if needed
4. **Build Refresh**: New production build created
5. **Process Restart**: PM2 restarts application with zero downtime
6. **Health Check**: System verifies deployment success

---

## 📊 Application Workflow Examples

### Complete Job Posting Workflow
1. **Employee Login** → Authentication verified
2. **Navigate to Employee Portal** → Role-based access granted
3. **Click "Create Job"** → Job creation form displayed
4. **Fill Job Details** → Form validation in real-time
5. **Select Category** → Dropdown populated from database
6. **Add Tags** → Tag system allows custom tags
7. **Set Status** → Choose Draft or Active
8. **Submit Job** → Data validated and saved
9. **Job Created** → Redirect to job management page
10. **Publish Job** → Status change makes job public

### Complete Application Workflow
1. **Browse Jobs** → Public job board displayed
2. **Search/Filter** → Find relevant positions
3. **View Job Details** → Complete job information shown
4. **Click Apply** → Application form displayed
5. **Fill Application** → Personal information collected
6. **Upload Resume** → File validation and secure storage
7. **Submit Application** → Application record created
8. **Confirmation** → Success message and application tracking info
9. **Status Updates** → Employer updates application status
10. **Notifications** → Applicant can check status updates

### Complete Admin User Management Workflow
1. **Admin Login** → Super admin authentication
2. **Navigate to Admin Portal** → Full admin interface
3. **View Users** → All users displayed with filters
4. **Click "Add User"** → User creation form
5. **Fill User Details** → Complete profile information
6. **Assign Role** → Admin, Employee, or Applicant
7. **Set Password** → Automatic bcrypt hashing
8. **Create User** → User record saved to database
9. **User Management** → Edit, activate, or modify users
10. **Password Resets** → Secure password management

---

## 🎯 Key Feature Integration

### How Everything Works Together
- **Authentication** enables role-based access to features
- **User Management** controls who can access which parts
- **Job Management** creates the core content for the platform
- **Application System** connects job seekers with opportunities
- **Search/Filter** helps users find relevant content
- **File Upload** enables resume sharing for applications
- **Security** protects all data and user interactions
- **Responsive Design** ensures accessibility across all devices

The Career Portal is designed as an integrated system where each feature enhances and supports the others, creating a complete job board solution.

---

**Last Updated**: September 17, 2025  
**Version**: 2.0.0  
**Status**: Production Ready ✅