# Career Portal - Direct Server Access Instructions

## Issue Diagnosis
Your DigitalOcean server at 64.225.6.33:8080 is running but may have connection or configuration issues preventing browser access.

## Quick Fix Steps

### Option 1: Manual Server Restart (Recommended)
1. SSH into your server:
   ```bash
   ssh root@64.225.6.33
   ```

2. Stop any existing processes:
   ```bash
   cd /var/www/career-portal
   pkill -f node
   fuser -k 8080/tcp
   ```

3. Start the simple test server:
   ```bash
   cat > test-server.js << 'EOF'
   const http = require('http');
   const server = http.createServer((req, res) => {
     console.log('Request from:', req.connection.remoteAddress, req.url);
     res.writeHead(200, {'Content-Type': 'text/html'});
     res.end(`
   <!DOCTYPE html>
   <html>
   <head><title>Career Portal - Test</title></head>
   <body style="font-family: Arial; padding: 20px; text-align: center;">
     <h1>🎉 Career Portal is Working!</h1>
     <p>Server Time: ${new Date()}</p>
     <p>Your server at 64.225.6.33:8080 is accessible!</p>
     <div style="background: #f0f0f0; padding: 20px; margin: 20px; border-radius: 10px;">
       <h3>Next Steps:</h3>
       <p>1. This confirms your server is working</p>
       <p>2. You can now deploy the full Career Portal</p>
       <p>3. Check firewall and network settings if still having issues</p>
     </div>
   </body>
   </html>`);
   });
   server.listen(8080, '0.0.0.0', () => {
     console.log('Test server running on http://64.225.6.33:8080');
   });
   EOF
   
   node test-server.js
   ```

4. Test in browser: Visit http://64.225.6.33:8080

### Option 2: Deploy Full Career Portal
Once the test server works, replace it with the full application:

```bash
# Stop test server (Ctrl+C)
# Start full Career Portal
node container-server.cjs
```

## Troubleshooting

### If browser still doesn't work:
1. **Check DigitalOcean Firewall:**
   - Go to your DigitalOcean dashboard
   - Check if there are cloud firewalls blocking port 8080
   - Ensure HTTP (80) and Custom (8080) are allowed

2. **Network Test:**
   ```bash
   # From your local machine
   telnet 64.225.6.33 8080
   # Should connect if port is open
   ```

3. **Server Logs:**
   ```bash
   # Check server output for errors
   cd /var/www/career-portal
   tail -f career.log
   ```

## Alternative Port
If 8080 doesn't work, try port 80:

```bash
# Modify server to use port 80
sed 's/8080/80/g' container-server.cjs > port80-server.js
sudo node port80-server.js
```
Then visit: http://64.225.6.33

## Working Features (Confirmed via API)
- Health checks responding
- Authentication system functional
- Job creation working
- Session management operational

The server backend is working correctly - this is likely a network accessibility issue.