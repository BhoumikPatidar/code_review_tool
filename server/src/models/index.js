const sequelize = require('../config/database');
const User = require('./User');
const Code = require('./Code');
const Comment = require('./Comment');
const PullRequest = require('./PullRequest');
// Sync all models with the database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true }); // alter adjusts tables to match models
    console.log("Database synchronized");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

module.exports = { sequelize, User, Code, Comment, PullRequest, syncDatabase };
