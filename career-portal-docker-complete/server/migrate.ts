import { Pool } from 'pg';

const createTables = async (pool: Pool) => {
  console.log('Creating database tables...');

  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      middle_name VARCHAR(255),
      preferred_name VARCHAR(255),
      full_name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'applicant' CHECK (role IN ('admin', 'employee', 'applicant')),
      department VARCHAR(255),
      is_active BOOLEAN NOT NULL DEFAULT true,
      is_super_admin BOOLEAN NOT NULL DEFAULT false,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create categories table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Create jobs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      department VARCHAR(255) NOT NULL,
      category_id INTEGER REFERENCES categories(id),
      employee_id INTEGER REFERENCES users(id) NOT NULL,
      short_description TEXT NOT NULL,
      full_description TEXT NOT NULL,
      requirements TEXT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'internship')),
      location VARCHAR(50) NOT NULL CHECK (location IN ('remote', 'onsite', 'hybrid')),
      city VARCHAR(255),
      state VARCHAR(255),
      salary_range VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed')),
      posted_date TIMESTAMP DEFAULT NOW(),
      expiry_date TIMESTAMP
    );
  `);

  // Create job_tags table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS job_tags (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) NOT NULL,
      tag VARCHAR(255) NOT NULL
    );
  `);

  // Create applications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id) NOT NULL,
      applicant_id INTEGER REFERENCES users(id) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(255),
      resume_url VARCHAR(500),
      cover_letter TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'interviewed', 'rejected', 'hired')),
      applied_date TIMESTAMP DEFAULT NOW(),
      last_updated TIMESTAMP DEFAULT NOW(),
      notes TEXT
    );
  `);

  console.log('Database tables created successfully!');
};

const seedData = async (pool: Pool) => {
  console.log('Seeding database with initial data...');

  // Check if data already exists
  const userCount = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCount.rows[0].count) > 0) {
    console.log('Data already exists, skipping seed...');
    return;
  }

  // Insert users
  await pool.query(`
    INSERT INTO users (username, password, email, first_name, last_name, full_name, role, department, is_active, is_super_admin) VALUES
    ('admin', 'admin123', 'admin@theresourceconsultants.com', 'Admin', 'User', 'Admin User', 'admin', 'Administration', true, true),
    ('employee', 'employee123', 'employee@theresourceconsultants.com', 'Employee', 'User', 'Employee User', 'employee', 'Human Resources', true, false),
    ('applicant', 'applicant123', 'applicant@example.com', 'John', 'Doe', 'John Doe', 'applicant', null, true, false)
  `);

  // Insert categories
  const categories = [
    ['Engineering', 'Software development, technical roles, and engineering positions'],
    ['Marketing', 'Marketing, advertising, and promotional roles'],
    ['Sales', 'Sales representatives, account managers, and business development'],
    ['Human Resources', 'HR specialists, recruiters, and people operations'],
    ['Finance', 'Financial analysts, accountants, and finance management'],
    ['Customer Service', 'Customer support, service representatives, and client relations'],
    ['Operations', 'Operations management, logistics, and process improvement'],
    ['Design', 'Graphic design, UX/UI design, and creative roles'],
    ['Data Science', 'Data analysts, data scientists, and business intelligence'],
    ['Project Management', 'Project managers, program managers, and coordination roles'],
    ['Legal', 'Legal counsel, compliance, and regulatory affairs'],
    ['Executive', 'C-level executives, directors, and senior leadership'],
    ['Administrative', 'Administrative assistants, office management, and support'],
    ['Healthcare', 'Medical professionals, healthcare administration, and clinical roles'],
    ['Education', 'Teachers, trainers, and educational specialists'],
    ['Research & Development', 'R&D specialists, innovation, and product development'],
    ['Quality Assurance', 'QA engineers, testers, and quality control'],
    ['Security', 'Information security, physical security, and risk management'],
    ['Consulting', 'Management consulting, technical consulting, and advisory roles'],
    ['Supply Chain', 'Procurement, logistics, and supply chain management'],
    ['Real Estate', 'Real estate agents, property management, and development'],
    ['Manufacturing', 'Production, assembly, and manufacturing operations'],
    ['Retail', 'Retail sales, merchandising, and store management'],
    ['Hospitality', 'Hotel management, restaurant service, and tourism'],
    ['Media & Communications', 'Journalism, public relations, and content creation'],
    ['Non-Profit', 'Social services, community outreach, and charitable organizations'],
    ['Government', 'Public sector, civil service, and government relations'],
    ['Transportation', 'Logistics, delivery, and transportation services'],
    ['Energy', 'Renewable energy, utilities, and energy management'],
    ['Agriculture', 'Farming, agricultural technology, and food production']
  ];

  for (const [name, description] of categories) {
    await pool.query(
      'INSERT INTO categories (name, description, status) VALUES ($1, $2, $3)',
      [name, description, 'active']
    );
  }

  // Get user IDs for job creation
  const employeeResult = await pool.query("SELECT id FROM users WHERE username = 'employee'");
  const employeeId = employeeResult.rows[0].id;

  // Get category IDs
  const engineeringResult = await pool.query("SELECT id FROM categories WHERE name = 'Engineering'");
  const marketingResult = await pool.query("SELECT id FROM categories WHERE name = 'Marketing'");
  const salesResult = await pool.query("SELECT id FROM categories WHERE name = 'Sales'");

  const engineeringId = engineeringResult.rows[0].id;
  const marketingId = marketingResult.rows[0].id;
  const salesId = salesResult.rows[0].id;

  // Insert jobs
  const jobs = [
    {
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      categoryId: engineeringId,
      shortDescription: 'Lead frontend development using modern React technologies',
      fullDescription: 'We are seeking a Senior Frontend Developer to join our dynamic engineering team. You will be responsible for developing user-facing features using React, TypeScript, and modern frontend technologies. This role involves collaborating with designers and backend developers to create seamless user experiences.',
      requirements: 'Requirements: 5+ years of React experience, TypeScript proficiency, knowledge of modern frontend tools and frameworks, experience with responsive design, strong problem-solving skills',
      type: 'full-time',
      location: 'hybrid',
      city: 'New York',
      state: 'NY',
      salaryRange: '$120,000 - $150,000'
    },
    {
      title: 'Marketing Coordinator',
      department: 'Marketing',
      categoryId: marketingId,
      shortDescription: 'Coordinate marketing campaigns and support brand initiatives',
      fullDescription: 'Join our marketing team as a Marketing Coordinator where you will support the planning and execution of marketing campaigns across multiple channels. You will work closely with the marketing manager to develop content, manage social media presence, and analyze campaign performance.',
      requirements: 'Requirements: Bachelor\'s degree in Marketing or related field, 2+ years of marketing experience, proficiency in marketing tools and analytics, excellent communication skills, creative thinking',
      type: 'full-time',
      location: 'onsite',
      city: 'Los Angeles',
      state: 'CA',
      salaryRange: '$50,000 - $65,000'
    },
    {
      title: 'Sales Representative',
      department: 'Sales',
      categoryId: salesId,
      shortDescription: 'Drive revenue growth through client acquisition and relationship management',
      fullDescription: 'We are looking for an energetic Sales Representative to join our growing sales team. You will be responsible for identifying new business opportunities, building relationships with potential clients, and achieving monthly sales targets. This role offers excellent growth potential and commission opportunities.',
      requirements: 'Requirements: 3+ years of B2B sales experience, proven track record of meeting sales targets, excellent communication and negotiation skills, CRM experience, self-motivated and results-driven',
      type: 'full-time',
      location: 'remote',
      city: 'Chicago',
      state: 'IL',
      salaryRange: '$60,000 - $80,000 + Commission'
    }
  ];

  for (const job of jobs) {
    await pool.query(`
      INSERT INTO jobs (title, department, category_id, employee_id, short_description, full_description, requirements, type, location, city, state, salary_range, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      job.title, job.department, job.categoryId, employeeId,
      job.shortDescription, job.fullDescription, job.requirements,
      job.type, job.location, job.city, job.state, job.salaryRange, 'active'
    ]);
  }

  // Get job IDs for tags
  const jobResults = await pool.query('SELECT id, title FROM jobs ORDER BY id');
  const jobIds = jobResults.rows;

  // Insert job tags
  const jobTags = [
    { jobTitle: 'Senior Frontend Developer', tags: ['React', 'TypeScript', 'Frontend'] },
    { jobTitle: 'Marketing Coordinator', tags: ['Marketing', 'Social Media', 'Analytics'] },
    { jobTitle: 'Sales Representative', tags: ['Sales', 'B2B', 'CRM'] }
  ];

  for (const { jobTitle, tags } of jobTags) {
    const job = jobIds.find(j => j.title === jobTitle);
    if (job) {
      for (const tag of tags) {
        await pool.query(
          'INSERT INTO job_tags (job_id, tag) VALUES ($1, $2)',
          [job.id, tag]
        );
      }
    }
  }

  console.log('Database seeded successfully!');
};

export const runMigration = async (connectionString: string) => {
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

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
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