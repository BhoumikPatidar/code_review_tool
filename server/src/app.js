const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { syncDatabase } = require('./models');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const repoRoutes = require('./routes/repoRoutes'); // New Git integration routes
const prRoutes = require('./routes/prRoutes');  // New PR routes

const app = express();

// Allow all origins in development
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/codes', codeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/repos', repoRoutes); // Mount the repository routes
app.use('/api/prs', prRoutes);  // Mount the PR endpoints

// Use PORT from environment or fallback to 5000
const PORT = process.env.PORT ||5000;
app.get("/", (req, res) => {
    res.send("Server is running!");
});

syncDatabase()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () =>
      console.log(`Server running on port ${PORT}`)
    );
  })
  .catch(err => console.error("Error syncing database:", err));
