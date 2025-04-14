// server/src/models/RepositoryInvitation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Repository = require('./Repository');
const crypto = require('crypto');

const RepositoryInvitation = sequelize.define('RepositoryInvitation', {
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
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined'),
    allowNull: false,
    defaultValue: 'pending'
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => crypto.randomBytes(20).toString('hex')
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => {
      const date = new Date();
      date.setDate(date.getDate() + 7); // Default expiration: 7 days
      return date;
    }
  }
}, {
  tableName: 'repository_invitations',
  indexes: [
    // Create an index on token for fast lookups when accepting invitations
    {
      unique: true,
      fields: ['token']
    },
    // Create a unique index to prevent duplicate pending invitations
    {
      unique: true,
      fields: ['repositoryId', 'userId', 'status'],
      where: {
        status: 'pending'
      }
    }
  ]
});

// Associate RepositoryInvitation with Repository
RepositoryInvitation.belongsTo(Repository, { foreignKey: 'repositoryId' });
Repository.hasMany(RepositoryInvitation, { foreignKey: 'repositoryId' });

// Associate RepositoryInvitation with User (invitee)
RepositoryInvitation.belongsTo(User, { as: 'user', foreignKey: 'userId' });
User.hasMany(RepositoryInvitation, { as: 'invitations', foreignKey: 'userId' });

// Associate RepositoryInvitation with User (inviter)
RepositoryInvitation.belongsTo(User, { as: 'inviter', foreignKey: 'inviterId' });
User.hasMany(RepositoryInvitation, { as: 'sentInvitations', foreignKey: 'inviterId' });

module.exports = RepositoryInvitation;