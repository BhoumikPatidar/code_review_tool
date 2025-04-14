// server/src/services/repositoryService.js
const { Repository, RepositoryPermission, User } = require('../models');
const path = require('path');
const NodeGit = require('nodegit');
const fs = require('fs-extra');

// Base directory where Git repositories are stored
const REPO_BASE_PATH = "/var/lib/git";

/**
 * Service for handling repository operations with permissions
 */
class RepositoryService {
  /**
   * Get a user's permission level for a repository
   * @param {number} userId - User ID
   * @param {number} repositoryId - Repository ID
   * @returns {Promise<string|null>} - Permission level or null if no permission
   */
  static async getUserPermissionLevel(userId, repositoryId) {
    const permission = await RepositoryPermission.findOne({
      where: { userId, repositoryId }
    });
    
    return permission ? permission.permissionLevel : null;
  }

  /**
   * Check if a user can view a repository
   * @param {number} userId - User ID
   * @param {number|object} repository - Repository ID or Repository object
   * @returns {Promise<boolean>} - Whether user can view the repository
   */
  static async canUserViewRepository(userId, repository) {
    // Handle both repository ID and repository object
    const repositoryId = typeof repository === 'object' ? repository.id : repository;
    
    // First check if user has explicit permission
    const permission = await RepositoryPermission.findOne({
      where: { userId, repositoryId }
    });
    
    if (permission) {
      return true; // Any permission level allows viewing
    }
    
    // If no explicit permission, check if repository is public
    if (typeof repository === 'object' && repository.visibility === 'public') {
      return true;
    } else if (typeof repository !== 'object') {
      const repoObj = await Repository.findByPk(repositoryId);
      return repoObj && repoObj.visibility === 'public';
    }
    
    return false;
  }

  /**
   * Check if a user can contribute to a repository
   * @param {number} userId - User ID
   * @param {number} repositoryId - Repository ID
   * @returns {Promise<boolean>} - Whether user can contribute
   */
  static async canUserContributeToRepository(userId, repositoryId) {
    const permission = await RepositoryPermission.findOne({
      where: { userId, repositoryId }
    });
    
    if (!permission) return false;
    
    const contributingRoles = ['CONTRIBUTOR', 'REVIEWER', 'APPROVER', 'OWNER'];
    return contributingRoles.includes(permission.permissionLevel);
  }

  /**
   * Check if a user can review PRs in a repository
   * @param {number} userId - User ID
   * @param {number} repositoryId - Repository ID
   * @returns {Promise<boolean>} - Whether user can review PRs
   */
  static async canUserReviewRepository(userId, repositoryId) {
    const permission = await RepositoryPermission.findOne({
      where: { userId, repositoryId }
    });
    
    if (!permission) return false;
    
    const reviewingRoles = ['REVIEWER', 'APPROVER', 'OWNER'];
    return reviewingRoles.includes(permission.permissionLevel);
  }

  /**
   * Check if a user can approve PRs in a repository
   * @param {number} userId - User ID
   * @param {number} repositoryId - Repository ID
   * @returns {Promise<boolean>} - Whether user can approve PRs
   */
  static async canUserApproveRepository(userId, repositoryId) {
    const permission = await RepositoryPermission.findOne({
      where: { userId, repositoryId }
    });
    
    if (!permission) return false;
    
    const approvingRoles = ['APPROVER', 'OWNER'];
    return approvingRoles.includes(permission.permissionLevel);
  }

  /**
   * Check if a user is an owner of a repository
   * @param {number} userId - User ID
   * @param {number} repositoryId - Repository ID
   * @returns {Promise<boolean>} - Whether user is an owner
   */
  static async isUserRepositoryOwner(userId, repositoryId) {
    const permission = await RepositoryPermission.findOne({
      where: { 
        userId, 
        repositoryId,
        permissionLevel: 'OWNER' 
      }
    });
    
    return !!permission;
  }

  /**
   * Create a new repository and set the creator as owner
   * @param {string} name - Repository name
   * @param {string} description - Repository description
   * @param {string} visibility - Repository visibility (public/private)
   * @param {number} userId - User ID of creator
   * @returns {Promise<object>} - Created repository object
   */
  static async createRepository(name, description, visibility, userId) {
    // Ensure the repository name ends with .git
    const repoName = name.endsWith('.git') ? name : `${name}.git`;
    const repoPath = path.join(REPO_BASE_PATH, repoName);
    
    // Check if repository already exists on filesystem
    try {
      await fs.access(repoPath);
      throw new Error("Repository already exists at this path");
    } catch (err) {
      // If error is "no such file or directory", that's what we want
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }
    
    // Create the bare repository
    await NodeGit.Repository.init(repoPath, 1); // 1 = bare repository
    
    // Create repository record in database
    const repository = await Repository.create({
      name: repoName,
      description,
      path: repoPath,
      visibility,
      ownerId: userId
    });
    
    // Add owner permission
    await RepositoryPermission.create({
      repositoryId: repository.id,
      userId,
      permissionLevel: 'OWNER',
      grantedById: userId
    });
    
    return repository;
  }

  /**
   * Get all repositories a user has access to
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of repositories
   */
  static async getAccessibleRepositories(userId) {
    // Get repositories where the user has explicit permission
    const repositories = await Repository.findAll({
      include: [
        {
          model: RepositoryPermission,
          where: { userId },
          required: true
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ]
    });
    
    // Get public repositories the user doesn't have explicit permission for
    const publicRepositories = await Repository.findAll({
      where: { visibility: 'public' },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        },
        {
          model: RepositoryPermission,
          where: { userId },
          required: false
        }
      ],
      // Only include repositories where the user doesn't have explicit permission
      having: sequelize.literal(`COUNT(RepositoryPermissions.id) = 0`),
      group: ['Repository.id']
    });
    
    return [...repositories, ...publicRepositories];
  }

  /**
   * Grant permission to a user for a repository
   * @param {number} repositoryId - Repository ID
   * @param {number} userId - User to grant permission to
   * @param {string} permissionLevel - Permission level to grant
   * @param {number} grantedById - User granting the permission
   * @returns {Promise<object>} - Created or updated permission
   */
  static async grantPermission(repositoryId, userId, permissionLevel, grantedById) {
    // Check if granter is an owner
    const canGrant = await this.isUserRepositoryOwner(grantedById, repositoryId);
    if (!canGrant) {
      throw new Error("Only repository owners can grant permissions");
    }
    
    // Check if permission already exists
    const existingPermission = await RepositoryPermission.findOne({
      where: { repositoryId, userId }
    });
    
    if (existingPermission) {
      // Update existing permission
      existingPermission.permissionLevel = permissionLevel;
      existingPermission.grantedById = grantedById;
      existingPermission.grantedAt = new Date();
      await existingPermission.save();
      return existingPermission;
    } else {
      // Create new permission
      return await RepositoryPermission.create({
        repositoryId,
        userId,
        permissionLevel,
        grantedById
      });
    }
  }

  /**
   * Remove a user's permission from a repository
   * @param {number} repositoryId - Repository ID
   * @param {number} userId - User to remove permission from
   * @param {number} removedById - User removing the permission
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  static async removePermission(repositoryId, userId, removedById) {
    // Check if remover is an owner
    const canRemove = await this.isUserRepositoryOwner(removedById, repositoryId);
    if (!canRemove) {
      throw new Error("Only repository owners can remove permissions");
    }
    
    // Cannot remove owner if they're the last one
    const permission = await RepositoryPermission.findOne({
      where: { repositoryId, userId }
    });
    
    if (permission && permission.permissionLevel === 'OWNER') {
      // Count how many owners this repository has
      const ownerCount = await RepositoryPermission.count({
        where: { 
          repositoryId,
          permissionLevel: 'OWNER'
        }
      });
      
      if (ownerCount <= 1) {
        throw new Error("Cannot remove the last owner of a repository");
      }
    }
    
    // Remove the permission
    const deleted = await RepositoryPermission.destroy({
      where: { repositoryId, userId }
    });
    
    return deleted > 0;
  }
}

module.exports = RepositoryService;