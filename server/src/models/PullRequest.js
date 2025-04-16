// // server/src/models/PullRequest.js
// const { DataTypes } = require('sequelize');
// const sequelize = require('../config/database');
// const User = require('./User');

// const PullRequest = sequelize.define('PullRequest', {
//   approvedBy: {
//     type: DataTypes.INTEGER,
//     allowNull: true,
//     references: {
//       model: User,
//       key: 'id'
//     }
//   },
//   approvedAt: {
//     type: DataTypes.DATE,
//     allowNull: true
//   },
//   mergedBy: {
//     type: DataTypes.INTEGER,
//     allowNull: true,
//     references: {
//       model: User,
//       key: 'id'
//     }
//   },
//   mergedAt: {
//     type: DataTypes.DATE,
//     allowNull: true
//   },
//   id: {
//     type: DataTypes.INTEGER,
//     allowNull: false,
//     primaryKey: true,
//     autoIncrement: true,
//   },
//   repository: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   sourceBranch: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   targetBranch: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   title: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   description: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },
//   status: {
//     type: DataTypes.ENUM('open', 'approved', 'merged', 'rejected'),
//     defaultValue: 'open',
//   },
// }, {
//   tableName: 'pull_requests',
// });

// PullRequest.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
// PullRequest.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
// PullRequest.belongsTo(User, { as: 'merger', foreignKey: 'mergedBy' });PullRequest.belongsTo(User, { as: 'creator1', foreignKey: 'creatorId' });
// User.hasMany(PullRequest, { as: 'pullRequests', foreignKey: 'creatorId' });

// module.exports = PullRequest;




// server/src/models/PullRequest.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const PullRequest = sequelize.define('PullRequest', {
  id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true,
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  repository: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sourceBranch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetBranch: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('open', 'approved', 'merged', 'rejected'),
    defaultValue: 'open',
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  mergedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  mergedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'pull_requests',
});

// Define the associations
PullRequest.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
PullRequest.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
PullRequest.belongsTo(User, { as: 'merger', foreignKey: 'mergedBy' });
User.hasMany(PullRequest, { as: 'createdPullRequests', foreignKey: 'creatorId' });

module.exports = PullRequest;
