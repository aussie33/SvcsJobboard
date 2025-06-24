-- Initialize Career Portal Database
-- This script creates the database schema and seeds initial data

-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    middle_name VARCHAR(255),
    preferred_name VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'applicant',
    department VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_super_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    employee_id INTEGER REFERENCES users(id),
    short_description TEXT,
    full_description TEXT,
    requirements TEXT,
    type VARCHAR(50) DEFAULT 'full-time',
    location VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    salary_range VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    posted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_tags (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    tag VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(50),
    cover_letter TEXT,
    resume_filename VARCHAR(255),
    status VARCHAR(50) DEFAULT 'submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id)
);

-- Insert default users
INSERT INTO users (username, password, email, first_name, last_name, full_name, role, department, is_active, is_super_admin) VALUES
('admin', 'admin123', 'admin@theresourceconsultants.com', 'Admin', 'User', 'Admin User', 'admin', 'Administration', true, true),
('employee', 'employee123', 'employee@theresourceconsultants.com', 'Employee', 'User', 'Employee User', 'employee', 'Human Resources', true, false),
('applicant', 'applicant123', 'applicant@theresourceconsultants.com', 'Applicant', 'User', 'Applicant User', 'applicant', NULL, true, false)
ON CONFLICT (username) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, description, status) VALUES
('Administrative', 'Administrative and office support roles', 'active'),
('Engineering', 'Software development and engineering positions', 'active'),
('Marketing', 'Marketing and communications roles', 'active'),
('Sales', 'Sales and business development positions', 'active'),
('Customer Service', 'Customer support and service roles', 'active'),
('Finance', 'Finance and accounting positions', 'active'),
('Human Resources', 'HR and talent management roles', 'active'),
('Operations', 'Operations and logistics positions', 'active'),
('Healthcare', 'Medical and healthcare positions', 'active'),
('Education', 'Teaching and training roles', 'active'),
('Legal', 'Legal and compliance positions', 'active'),
('IT Support', 'Information technology support roles', 'active'),
('Management', 'Leadership and management positions', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, salary_range, status) VALUES
('Software Engineer', 'Engineering', 2, 2, 'Join our dynamic engineering team to build innovative software solutions.', 'We are looking for a talented Software Engineer to join our growing team. You will be responsible for designing, developing, and maintaining high-quality software applications that serve our clients'' needs.', 'Bachelor''s degree in Computer Science or related field. 3+ years of experience in software development. Proficiency in JavaScript, Python, or Java.', 'full-time', 'remote', '$80,000 - $120,000', 'active'),
('Marketing Specialist', 'Marketing', 3, 2, 'Drive our marketing initiatives and help grow our brand presence.', 'We are seeking a creative Marketing Specialist to develop and execute marketing campaigns that increase brand awareness and drive customer engagement.', 'Bachelor''s degree in Marketing or related field. 2+ years of marketing experience. Strong communication and analytical skills.', 'full-time', 'hybrid', '$50,000 - $70,000', 'active'),
('Sales Representative', 'Sales', 4, 2, 'Build relationships with clients and drive revenue growth.', 'Join our sales team to identify new business opportunities, build client relationships, and achieve sales targets in a fast-paced environment.', 'High school diploma or equivalent. 1+ years of sales experience preferred. Excellent communication and negotiation skills.', 'full-time', 'on-site', '$40,000 - $60,000 + commission', 'active')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);