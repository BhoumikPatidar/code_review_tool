const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { syncDatabase } = require('./models');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const codeRoutes = require('./routes/codeRoutes');
const commentRoutes = require('./routes/commentRoutes');

const app = express();

// Middleware
// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/codes', codeRoutes);
app.use('/api/comments', commentRoutes);

// Sync database and start the server
syncDatabase()
  .then(() => {
    app.listen(process.env.PORT, '0.0.0.0', () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch(err => console.error("Error syncing database:", err));

