# Quick Deploy for Mac (No Docker Required)

Since you don't have Docker installed locally, use this alternative deployment method:

## Run This Command

```bash
./deploy-without-docker.sh
```

## What This Does

- Uploads your current Replit code to DigitalOcean
- Installs Docker on the server (if needed)
- Builds the Docker image directly on the server
- Starts all services (app, database, nginx)
- Runs health checks

## Expected Output

The script will show progress as it:
1. Uploads files to server
2. Installs Docker on server
3. Builds the application
4. Starts containers
5. Confirms everything is running

## Access After Deployment

- URL: http://64.225.6.33
- Admin: admin / admin123
- Employee: employee / employee123
- Applicant: applicant / applicant123

This method builds everything on the server, so you don't need Docker on your Mac.