// server/src/models/Repository.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Repository = sequelize.define('Repository', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private',
    allowNull: false
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'repositories',
  timestamps: true, // createAt and updatedAt
});

// Associate Repository with User (owner)
Repository.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Repository, { as: 'ownedRepositories', foreignKey: 'ownerId' });

module.exports = Repository;