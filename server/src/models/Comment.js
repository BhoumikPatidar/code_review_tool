const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Code = require('./Code');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'comments',
});

// Associate Comment with User (author)
Comment.belongsTo(User, { as: 'author', foreignKey: 'authorId' });
User.hasMany(Comment, { as: 'comments', foreignKey: 'authorId' });

// Associate Comment with Code
Comment.belongsTo(Code, { as: 'code', foreignKey: 'codeId' });
Code.hasMany(Comment, { as: 'comments', foreignKey: 'codeId' });

module.exports = Comment;
