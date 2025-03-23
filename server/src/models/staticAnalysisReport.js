const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const PullRequest = require('./PullRequest');

const StaticAnalysisReport = sequelize.define('StaticAnalysisReport', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  prId: {
    type: DataTypes.INTEGER,
    references: {
      model: PullRequest,
      key: 'id',
    },
    allowNull: false,
  },
  tool: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

PullRequest.hasMany(StaticAnalysisReport, { as: 'reports', foreignKey: 'prId' });
StaticAnalysisReport.belongsTo(PullRequest, { foreignKey: 'prId' });

module.exports = StaticAnalysisReport;
