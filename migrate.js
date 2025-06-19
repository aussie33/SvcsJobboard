import { runMigration } from './server/migrate.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  console.log('Example: DATABASE_URL=postgresql://username:password@localhost:5432/career_portal');
  process.exit(1);
}

console.log('Running database migration...');
runMigration(connectionString)
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });