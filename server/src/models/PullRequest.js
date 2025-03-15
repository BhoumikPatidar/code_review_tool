// server/src/models/PullRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const PullRequest = sequelize.define('PullRequest', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  repository: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sourceBranch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetBranch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'approved', 'merged', 'rejected'),
    defaultValue: 'open',
  },
}, {
  tableName: 'pull_requests',
});

// Associate PR with its creator (User)
PullRequest.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
User.hasMany(PullRequest, { as: 'pullRequests', foreignKey: 'creatorId' });

module.exports = PullRequest;
