// server/src/models/RepositoryPermission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Repository = require('./Repository');

const RepositoryPermission = sequelize.define('RepositoryPermission', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  permissionLevel: {
    type: DataTypes.ENUM('READER', 'CONTRIBUTOR', 'REVIEWER', 'APPROVER', 'OWNER'),
    allowNull: false,
    defaultValue: 'READER'
  },
  grantedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'repository_permissions',
  indexes: [
    // Create a unique index on repositoryId and userId to prevent duplicate permissions
    {
      unique: true,
      fields: ['repositoryId', 'userId']
    }
  ]
});

// Associate RepositoryPermission with Repository
RepositoryPermission.belongsTo(Repository, { foreignKey: 'repositoryId' });
Repository.hasMany(RepositoryPermission, { foreignKey: 'repositoryId' });

// Associate RepositoryPermission with User (the user who has the permission)
RepositoryPermission.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(RepositoryPermission, { foreignKey: 'userId' });

// Associate RepositoryPermission with User (the user who granted the permission)
RepositoryPermission.belongsTo(User, { as: 'grantedBy', foreignKey: 'grantedById' });

module.exports = RepositoryPermission;