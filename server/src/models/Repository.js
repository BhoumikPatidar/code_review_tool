// server/src/models/Repository.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Repository = sequelize.define('Repository', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  path: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  visibility: {
    type: DataTypes.ENUM('public', 'private'),
    defaultValue: 'private',
  },
}, {
  tableName: 'repositories',
});

// Associate Repository with User (owner)
Repository.belongsTo(User, { as: 'owner', foreignKey: 'ownerId' });
User.hasMany(Repository, { as: 'ownedRepositories', foreignKey: 'ownerId' });

module.exports = Repository;