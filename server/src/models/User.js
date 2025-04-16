// server/src/models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  publicKey: {   // Field for SSH public key
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: "users",
  // Remove the password hash hook as we'll handle it in the controller
  // This avoids double-hashing when updating the User model
});

module.exports = User;