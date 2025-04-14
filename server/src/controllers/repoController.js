// server/src/controllers/repositoryController.js
const { Repository, RepositoryPermission, User, sequelize } = require('../models');
const RepositoryService = require('../services/repositoryService');
const NodeGit = require('nodegit');
const path = require('path');
const fs = require('fs-extra');

// Define the base directory where your repositories are located
const REPO_BASE_PATH = "/var/lib/git";

/**
 * List repositories accessible to the current user
 */
async function listRepos(req, res) {
  try {
    const repositories = await RepositoryService.getAccessibleRepositories(req.user.id);
    
    // Format the response
    const formattedRepos = repositories.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description,
      visibility: repo.visibility,
      owner: repo.owner ? {
        id: repo.owner.id,
        username: repo.owner.username
      } : null,
      // Include the user's permission level if available
      permissionLevel: repo.RepositoryPermissions && repo.RepositoryPermissions.length > 0 
        ? repo.RepositoryPermissions[0].permissionLevel 
        : 'READ' // Default for public repositories
    }));
    
    res.json({ repositories: formattedRepos });
  } catch (err) {
    console.error("Error in listRepos:", err);
    res.status(500).json({ 
      error: "Error listing repositories",
      details: err.message 
    });
  }
}

/**
 * Create a new repository
 */
async function createRepo(req, res) {
  try {
    const { name, description, visibility = 'private' } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Repository name is required" });
    }
    
    // Validate visibility
    if (visibility !== 'public' && visibility !== 'private') {
      return res.status(400).json({ error: "Visibility must be 'public' or 'private'" });
    }
    
    // Create the repository
    const repository = await RepositoryService.createRepository(
      name, 
      description, 
      visibility, 
      req.user.id
    );
    
    res.json({ 
      message: "Repository created successfully", 
      repository: {
        id: repository.id,
        name: repository.name,
        description: repository.description,
        visibility: repository.visibility
      }
    });
  } catch (error) {
    console.error("Error creating repository:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get details of a specific repository
 */
async function getRepository(req, res) {
  try {
    const { repoId } = req.params;
    const repository = await Repository.findByPk(repoId, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'username']
        }
      ]
    });
    
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if user has permission to view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repository);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Get the user's permission level for this repository
    const permissionLevel = await RepositoryService.getUserPermissionLevel(req.user.id, repository.id);
    
    const result = {
      id: repository.id,
      name: repository.name,
      description: repository.description,
      visibility: repository.visibility,
      owner: repository.owner ? {
        id: repository.owner.id,
        username: repository.owner.username
      } : null,
      permissionLevel
    };
    
    res.json(result);
  } catch (error) {
    console.error("Error getting repository:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get commit history for a repository
 */
async function getCommits(req, res) {
  const repoName = req.params.repoName;
  
  try {
    // Find the repository in the database
    const repository = await Repository.findOne({ 
      where: { name: repoName.endsWith('.git') ? repoName : `${repoName}.git` }
    });
    
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if user has permission to view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repository);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Continue with the existing logic to get commits
    const repoPath = repository.path;
    console.log("Attempting to open repository at path:", repoPath);

    const repo = await NodeGit.Repository.open(repoPath);
    let headCommit;

    // Try to get the HEAD commit.
    try {
      const branchName = (await repo.getCurrentBranch()).shorthand();
      headCommit = await repo.getBranchCommit(branchName);
    } catch (e) {
      console.warn("getHeadCommit failed:", e.message);
      headCommit = null;
    }

    // If no HEAD, try to get the commit from the 'main' branch.
    if (!headCommit) {
      try {
        headCommit = await repo.getBranchCommit('main');
      } catch (e) {
        console.warn("getBranchCommit('main') failed:", e.message);
        return res.json({ commits: [] });
      }
    }

    let commits = [];
    const history = headCommit.history();

    history.on("commit", commit => {
      commits.push({
        sha: commit.sha(),
        message: commit.message().trim(),
        author: commit.author().name(),
        date: commit.date()
      });
    });

    history.on("end", () => {
      res.json({ commits });
    });

    history.on("error", err => {
      console.error("Error reading commit history:", err);
      res.status(500).json({ error: "Error reading commit history" });
    });

    history.start();
  } catch (err) {
    console.error("Error opening repository:", err.message);
    res.status(500).json({ error: "Error opening repository" });
  }
}

/**
 * Get repository tree (files and directories)
 */
async function getRepoTree(req, res) {
  const repoName = req.params.repoName;
  const queryPath = req.query.path || '';
  const branch = req.query.branch || 'main';

  try {
    // Find the repository in the database
    const repository = await Repository.findOne({ 
      where: { name: repoName.endsWith('.git') ? repoName : `${repoName}.git` }
    });
    
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if user has permission to view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repository);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Continue with the existing logic
    const repoPath = repository.path;
    const repo = await NodeGit.Repository.open(repoPath);
    
    // Get specified branch commit
    const commit = await repo.getBranchCommit(branch);
    const tree = await commit.getTree();
    
    let targetTree = tree;
    if (queryPath) {
      try {
        const entry = await tree.getEntry(queryPath);
        if (entry.isTree()) {
          targetTree = await entry.getTree();
        } else {
          return res.status(400).json({ error: "The provided path points to a file, not a directory" });
        }
      } catch (err) {
        console.error("Error getting subtree:", err);
        return res.status(400).json({ error: "Invalid path" });
      }
    }

    const entries = [];
    targetTree.entries().forEach(entry => {
      entries.push({
        name: entry.name(),
        type: entry.isBlob() ? 'file' : 'directory',
        sha: entry.sha()
      });
    });

    res.json({ path: queryPath, entries });
  } catch(err) {
    console.error("Error getting repository tree:", err);
    res.status(500).json({ error: "Error getting repository tree" });
  }
}

/**
 * Get file content from repository
 */
async function getFileContent(req, res) {
  const repoName = req.params.repoName;
  const filePath = req.query.path;

  if (!filePath) {
    return res.status(400).json({ error: "File path is required" });
  }

  try {
    // Find the repository in the database
    const repository = await Repository.findOne({ 
      where: { name: repoName.endsWith('.git') ? repoName : `${repoName}.git` }
    });
    
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if user has permission to view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repository);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Continue with the existing logic
    const repoPath = repository.path;
    const repo = await NodeGit.Repository.open(repoPath);

    // Get the current branch's head commit
    let headCommit;
    try {
      const branchName = (await repo.getCurrentBranch()).shorthand();
      headCommit = await repo.getBranchCommit(branchName);
    } catch (e) {
      headCommit = await repo.getBranchCommit('main');
    }

    const tree = await headCommit.getTree();
    const entry = await tree.getEntry(filePath);

    if (!entry.isBlob()) {
      return res.status(400).json({ error: "The provided path is not a file" });
    }

    const blob = await entry.getBlob();
    res.json({ 
      path: filePath,
      content: blob.toString(),
      size: blob.rawsize()
    });
  } catch(err) {
    console.error("Error getting file content:", err);
    res.status(500).json({ 
      error: "Error getting file content",
      details: err.message 
    });
  }
}

/**
 * Get branches for a repository
 */
async function getBranches(req, res) {
  const repoName = req.params.repoName;
  
  try {
    // Find the repository in the database
    const repository = await Repository.findOne({ 
      where: { name: repoName.endsWith('.git') ? repoName : `${repoName}.git` }
    });
    
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if user has permission to view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repository);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Continue with the existing logic
    const repoPath = repository.path;
    const repo = await NodeGit.Repository.open(repoPath);
    
    // Use Reference.list() instead of getReferences
    const branchRefs = await NodeGit.Reference.list(repo);
    const branches = [];

    // Process each reference
    for (const refName of branchRefs) {
      const ref = await NodeGit.Reference.lookup(repo, refName);
      if (ref.isBranch()) {
        branches.push({
          name: ref.shorthand(),
          isHead: ref.isHead(),
          target: ref.target().tostrS()
        });
      }
    }

    console.log("Found branches:", branches);
    res.json({ branches });
  } catch(err) {
    console.error("Error getting branches:", err);
    res.status(500).json({ 
      error: "Error getting branches",
      details: err.message 
    });
  }
}

/**
 * Get diff between two commits
 */
async function getDiff(req, res) {
  const repoName = req.params.repoName;
  const { commit1, commit2, filePath } = req.query;

  if (!commit1 || !commit2 || !filePath) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Find the repository in the database
    const repository = await Repository.findOne({ 
      where: { name: repoName.endsWith('.git') ? repoName : `${repoName}.git` }
    });
    
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if user has permission to view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repository);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Continue with the existing logic
    const repoPath = repository.path;
    const repo = await NodeGit.Repository.open(repoPath);

    const c1 = await repo.getCommit(commit1);
    const c2 = await repo.getCommit(commit2);

    const tree1 = await c1.getTree();
    const tree2 = await c2.getTree();

    const diff = await NodeGit.Diff.treeToTree(repo, tree1, tree2, {
      pathspec: [filePath],
      flags: NodeGit.Diff.OPTION.SHOW_UNTRACKED_CONTENT
    });

    const patches = await diff.patches();
    let diffText = '';

    for (const patch of patches) {
      const hunks = await patch.hunks();
      for (const hunk of hunks) {
        const lines = await hunk.lines();
        for (const line of lines) {
          const prefix = String.fromCharCode(line.origin());
          diffText += prefix + line.content();
        }
      }
    }

    res.json({ diff: diffText });
  } catch (err) {
    console.error("Error getting diff:", err);
    res.status(500).json({ error: "Error getting diff", details: err.message });
  }
}

/**
 * Manage repository permissions (add/update/remove collaborators)
 */
async function managePermissions(req, res) {
  try {
    const { repoId } = req.params;
    const { userId, permissionLevel, action } = req.body;
    
    if (!repoId || !userId || !action) {
      return res.status(400).json({ error: "Repository ID, user ID, and action are required" });
    }
    
    // Validate the repository exists
    const repository = await Repository.findByPk(repoId);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if current user is an owner
    const isOwner = await RepositoryService.isUserRepositoryOwner(req.user.id, repoId);
    if (!isOwner) {
      return res.status(403).json({ error: "Only repository owners can manage permissions" });
    }
    
    // Handle the requested action
    switch (action) {
      case 'add':
      case 'update':
        if (!permissionLevel) {
          return res.status(400).json({ error: "Permission level is required" });
        }
        
        // Validate permission level
        const validLevels = ['READER', 'CONTRIBUTOR', 'REVIEWER', 'APPROVER', 'OWNER'];
        if (!validLevels.includes(permissionLevel)) {
          return res.status(400).json({ error: "Invalid permission level" });
        }
        
        const permission = await RepositoryService.grantPermission(
          repoId, 
          userId, 
          permissionLevel, 
          req.user.id
        );
        
        return res.json({ 
          message: "Permission granted successfully",
          permission
        });
        
      case 'remove':
        const removed = await RepositoryService.removePermission(
          repoId,
          userId,
          req.user.id
        );
        
        if (removed) {
          return res.json({ message: "Permission removed successfully" });
        } else {
          return res.status(404).json({ error: "Permission not found" });
        }
        
      default:
        return res.status(400).json({ error: "Invalid action. Must be 'add', 'update', or 'remove'" });
    }
  } catch (error) {
    console.error("Error managing permissions:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all collaborators for a repository with their permission levels
 */
async function getCollaborators(req, res) {
  try {
    const { repoId } = req.params;
    
    // Validate the repository exists
    const repository = await Repository.findByPk(repoId);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found" });
    }
    
    // Check if current user can view this repository
    const canView = await RepositoryService.canUserViewRepository(req.user.id, repoId);
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this repository" });
    }
    
    // Get all permissions for this repository
    const permissions = await RepositoryPermission.findAll({
      where: { repositoryId: repoId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username']
        }
      ]
    });
    
    // Format the response
    const collaborators = permissions.map(perm => ({
      userId: perm.userId,
      username: perm.user.username,
      permissionLevel: perm.permissionLevel,
      grantedAt: perm.grantedAt
    }));
    
    res.json({ collaborators });
  } catch (error) {
    console.error("Error getting collaborators:", error);
    res.status(500).json({ error: error.message });
  }
}

module.exports = { 
  listRepos, 
  createRepo, 
  getRepository,
  getCommits, 
  getDiff, 
  getRepoTree, 
  getFileContent, 
  getBranches,
  managePermissions,
  getCollaborators
};