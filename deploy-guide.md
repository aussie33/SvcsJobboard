# PostgreSQL Deployment Guide for DigitalOcean

## Prerequisites
- DigitalOcean droplet with Node.js installed
- PostgreSQL installed and configured
- Your project files uploaded to the server

## Step 1: Set Up Environment Variables

Create a `.env` file in your project root:

```bash
cd /path/to/your/project
nano .env
```

Add these variables (replace with your actual values):

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/career_portal
SESSION_SECRET=your_secure_random_string_here_make_it_long_and_random
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Run Database Migration

This will create all tables and seed them with your sample data:

```bash
npm run db:migrate
# OR
node migrate.js
```

You should see output like:
```
Creating database tables...
Database tables created successfully!
Seeding database with initial data...
Database seeded successfully!
Migration completed successfully!
```

## Step 4: Build the Application

```bash
npm run build
```

## Step 5: Start the Application

Install PM2 process manager:
```bash
sudo npm install -g pm2
```

Start your application:
```bash
pm2 start dist/index.js --name "career-portal"
pm2 startup
pm2 save
```

## Step 6: Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/career-portal
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/career-portal /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 7: Set Up SSL

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Your Seeded Data

After migration, you'll have:

### Users:
- **Admin**: username: `admin`, password: `admin123`
- **Employee**: username: `employee`, password: `employee123`
- **Applicant**: username: `applicant`, password: `applicant123`

### 30 Job Categories:
Engineering, Marketing, Sales, Human Resources, Finance, Customer Service, Operations, Design, Data Science, Project Management, Legal, Executive, Administrative, Healthcare, Education, Research & Development, Quality Assurance, Security, Consulting, Supply Chain, Real Estate, Manufacturing, Retail, Hospitality, Media & Communications, Non-Profit, Government, Transportation, Energy, Agriculture

### 3 Sample Jobs:
1. **Senior Frontend Developer** (Engineering, NYC, Hybrid, $120K-$150K)
2. **Marketing Coordinator** (Marketing, LA, Onsite, $50K-$65K)
3. **Sales Representative** (Sales, Chicago, Remote, $60K-$80K + Commission)

## Monitoring Commands

Check application status:
```bash
pm2 status
pm2 logs career-portal
```

Check database connection:
```bash
psql -d career_portal -c "SELECT COUNT(*) FROM users;"
```

Restart application:
```bash
pm2 restart career-portal
```

## Troubleshooting

1. **Database connection issues**: Verify DATABASE_URL format and PostgreSQL is running
2. **Permission errors**: Check file permissions with `chmod -R 755 /path/to/project`
3. **Port conflicts**: Ensure port 5000 is not in use by other services
4. **Build errors**: Check Node.js version compatibility (requires Node.js 14+)

Your career portal will be accessible at your domain with all the same functionality as your Replit version, but with persistent PostgreSQL storage.