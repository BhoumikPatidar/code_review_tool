// server/src/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { syncDatabase } = require('./models');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const repoRoutes = require('./routes/repoRoutes');
const prRoutes = require('./routes/prRoutes');
const prCommentRoutes = require('./routes/prCommentRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Test route to confirm the server is running
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/codes', codeRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/repos', repoRoutes);
app.use('/api/prs', prRoutes);
app.use('/api/prcomments', prCommentRoutes);
app.use('/api/user', userRoutes);

// Sync database and start the server
syncDatabase()
  .then(() => {
    app.listen(process.env.PORT, '0.0.0.0', () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.error("Error syncing database:", err));