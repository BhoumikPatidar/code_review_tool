// server/src/models/index.js
const sequelize = require('../config/database');
const User = require('./User');
const Code = require('./Code');
const Comment = require('./Comment');
const PullRequest = require('./PullRequest');
const PRComment = require('./PRComment');
const Repository = require('./Repository');
const RepositoryPermission = require('./RepositoryPermission');
const RepositoryInvitation = require('./RepositoryInvitation');

// Sync all models with the database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synchronized");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

module.exports = { 
  sequelize, 
  User, 
  Code, 
  Comment, 
  PullRequest, 
  PRComment, 
  Repository,
  RepositoryPermission,
  RepositoryInvitation,
  syncDatabase 
};