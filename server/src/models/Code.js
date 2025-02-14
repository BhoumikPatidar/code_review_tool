const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Code = sequelize.define('Code', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

// Associate Code with User (author)
Code.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Code, { as: 'codes', foreignKey: 'authorId' });

module.exports = Code;
