#!/usr/bin/env node

/**
 * check-git-permission.js
 * 
 * This script checks if a user has permission to access a Git repository.
 * It's called by git-auth-wrapper.sh when a user tries to access a repository via SSH.
 * 
 * Usage: node check-git-permission.js <username> <repository>
 */

// Load environment variables
require('dotenv').config({ path: '/path/to/your/server/.env' });

// Import database models
const { sequelize, User, Repository, RepositoryPermission } = require('../src/models');

async function checkPermission(username, repoName) {
  try {
    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.error("User not found:", username);
      process.exit(2);
    }

    // Find repository by name
    const repository = await Repository.findOne({ 
      where: { name: repoName.endsWith('.git') ? repoName : `${repoName}.git` }
    });
    
    if (!repository) {
      console.error("Repository not found:", repoName);
      process.exit(3);
    }

    // Check if repository is public
    if (repository.visibility === 'public') {
      // Public repositories are readable by anyone
      return "read";
    }

    // Check user's permission for this repository
    const permission = await RepositoryPermission.findOne({
      where: { 
        userId: user.id,
        repositoryId: repository.id
      }
    });

    if (!permission) {
      console.error("No permission record found");
      process.exit(4);
    }

    // Determine allowed operations based on permission level
    switch(permission.permissionLevel) {
      case 'READER':
        return "read";
      case 'CONTRIBUTOR':
      case 'REVIEWER':
      case 'APPROVER':
      case 'OWNER':
        return "read write";
      default:
        console.error("Unknown permission level:", permission.permissionLevel);
        process.exit(5);
    }
  } catch (error) {
    console.error("Error checking permission:", error);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Get command line arguments
const username = process.argv[2];
const repoName = process.argv[3];

if (!username || !repoName) {
  console.error("Usage: node check-git-permission.js <username> <repository>");
  process.exit(1);
}

// Check permission and output the result
checkPermission(username, repoName)
  .then(result => {
    console.log(result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });