const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Code = sequelize.define('Code', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  code: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'codes',
});

// Associate Code with User (author)
Code.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Code, { as: 'codes', foreignKey: 'authorId' });

module.exports = Code;
