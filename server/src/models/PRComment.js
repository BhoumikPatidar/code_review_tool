// server/src/models/PRComment.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const PullRequest = require('./PullRequest');

const PRComment = sequelize.define('PRComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
  }
}, {
  tableName: 'pr_comments',
});

// Associate PRComment with a PullRequest and User
PRComment.belongsTo(PullRequest, { as: 'pr', foreignKey: 'prId' });
PullRequest.hasMany(PRComment, { as: 'comments', foreignKey: 'prId' });

PRComment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(PRComment, { as: 'prComments', foreignKey: 'authorId' });

module.exports = PRComment;
