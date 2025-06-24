const express = require('express');
const session = require('express-session');
const path = require('path');
const { fileURLToPath } = require('url');
const { registerRoutes } = require('./routes.js');
const { setupVite, serveStatic } = require('./vite.js');

const app = express();

// CORS configuration for session cookies
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' ? false : false, // Set to true when using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'connect.sid'
}));

const server = await registerRoutes(app);

// Error handling middleware
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error(`Error ${status}: ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  res.status(status).json({ message });
});

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
} else {
  await setupVite(app, server);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});