const { Pool } = require('pg');

const createTables = async (pool) => {
  console.log('Creating database tables...');
  
  // Create enums
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'employee', 'applicant');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE job_status AS ENUM ('draft', 'active', 'paused', 'closed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE application_status AS ENUM ('new', 'reviewing', 'interviewed', 'rejected', 'hired');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE job_type AS ENUM ('full-time', 'part-time', 'contract', 'internship');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE job_location AS ENUM ('remote', 'onsite', 'hybrid');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE category_status AS ENUM ('active', 'inactive');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      role user_role NOT NULL DEFAULT 'applicant',
      is_active BOOLEAN NOT NULL DEFAULT true,
      phone_number VARCHAR(20),
      address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status category_status NOT NULL DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      location job_location NOT NULL,
      job_type job_type NOT NULL,
      salary VARCHAR(255),
      benefits TEXT,
      requirements TEXT,
      category_id INTEGER REFERENCES categories(id),
      employee_id INTEGER NOT NULL REFERENCES users(id),
      status job_status NOT NULL DEFAULT 'draft',
      expiry_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_tags (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      tag VARCHAR(100) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, tag)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      applicant_id INTEGER REFERENCES users(id),
      applicant_name VARCHAR(255) NOT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      applicant_phone VARCHAR(20),
      cover_letter TEXT,
      resume_url VARCHAR(500),
      status application_status NOT NULL DEFAULT 'new',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database tables created successfully!');
};

const seedData = async (pool) => {
  console.log('Seeding database with initial data...');

  // Insert test users
  await pool.query(`
    INSERT INTO users (username, email, password, full_name, role, is_active, phone_number, address) VALUES
    ('admin', 'admin@theresourcepool.com', 'admin123', 'System Administrator', 'admin', true, '555-0001', '123 Admin St'),
    ('employee', 'employee@theresourcepool.com', 'employee123', 'HR Manager', 'employee', true, '555-0002', '456 Employee Ave'), 
    ('applicant', 'applicant@example.com', 'applicant123', 'John Applicant', 'applicant', true, '555-0003', '789 Applicant Blvd')
    ON CONFLICT (username) DO NOTHING;
  `);

  // Insert categories
  const categories = [
    'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance',
    'Operations', 'Customer Service', 'Product Management', 'Design',
    'Legal', 'IT Support', 'Quality Assurance', 'Research & Development',
    'Business Development', 'Consulting', 'Project Management',
    'Data Science', 'Security', 'Compliance', 'Training',
    'Administration', 'Facilities', 'Procurement', 'Supply Chain',
    'Risk Management', 'Internal Audit', 'Communications', 'Public Relations',
    'Strategy', 'Innovation'
  ];

  for (const category of categories) {
    await pool.query(`
      INSERT INTO categories (name, description, status) VALUES ($1, $2, 'active')
      ON CONFLICT DO NOTHING;
    `, [category, `${category} department positions and opportunities`]);
  }

  // Insert sample jobs
  await pool.query(`
    INSERT INTO jobs (title, department, short_description, full_description, location, job_type, salary, benefits, requirements, category_id, employee_id, status, expiry_date) VALUES
    ('Senior Frontend Developer', 'Engineering', 'Join our engineering team to build amazing user interfaces', 'We are looking for an experienced frontend developer to join our growing team. You will work on cutting-edge web applications using React, TypeScript, and modern development tools.', 'remote', 'full-time', '80000-120000', 'Health insurance, 401k, flexible hours', '5+ years React experience, TypeScript knowledge', 1, 2, 'active', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    ('Marketing Manager', 'Marketing', 'Lead our marketing initiatives and campaigns', 'We need a creative marketing manager to drive our brand forward. You will develop marketing strategies, manage campaigns, and work with cross-functional teams.', 'onsite', 'full-time', '70000-90000', 'Health insurance, dental, vision', '3+ years marketing experience, MBA preferred', 2, 2, 'active', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    ('Sales Representative', 'Sales', 'Drive revenue growth through client relationships', 'Join our sales team to help expand our customer base. You will identify prospects, build relationships, and close deals to meet revenue targets.', 'hybrid', 'full-time', '50000-80000', 'Commission structure, health benefits', '2+ years sales experience, excellent communication', 3, 2, 'active', CURRENT_TIMESTAMP + INTERVAL '30 days')
    ON CONFLICT DO NOTHING;
  `);

  // Insert job tags
  await pool.query(`
    INSERT INTO job_tags (job_id, tag) VALUES
    (1, 'React'), (1, 'TypeScript'), (1, 'Frontend'),
    (2, 'Digital Marketing'), (2, 'Strategy'), (2, 'Analytics'),
    (3, 'Sales'), (3, 'Communication'), (3, 'Customer Relations')
    ON CONFLICT (job_id, tag) DO NOTHING;
  `);

  console.log('Database seeded successfully!');
};

const runMigration = async (connectionString) => {
  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await createTables(pool);
    await seedData(pool);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run migration if called directly
if (require.main === module) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }
  
  runMigration(connectionString)
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };