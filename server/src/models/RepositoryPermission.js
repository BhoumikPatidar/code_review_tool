// server/src/models/RepositoryPermission.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Repository = require('./Repository');

const RepositoryPermission = sequelize.define('RepositoryPermission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  permissionLevel: {
    type: DataTypes.ENUM('READER', 'CONTRIBUTOR', 'REVIEWER', 'APPROVER', 'OWNER'),
    defaultValue: 'READER',
    allowNull: false
  },
  grantedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
}, {
  tableName: 'repository_permissions',
  timestamps: true,
});

// Associations
RepositoryPermission.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(RepositoryPermission, { foreignKey: 'userId' });

RepositoryPermission.belongsTo(Repository, { foreignKey: 'repositoryId' });
Repository.hasMany(RepositoryPermission, { foreignKey: 'repositoryId' });

RepositoryPermission.belongsTo(User, { as: 'grantedBy', foreignKey: 'grantedById' });

module.exports = RepositoryPermission;