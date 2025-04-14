import api from '../utils/api';

/**
 * Service for interacting with repository-related API endpoints
 */
const RepositoryService = {
  /**
   * Get all repositories accessible to the current user
   * @returns {Promise<Array>} List of repositories
   */
  getRepositories: async () => {
    try {
      const { data } = await api.get('/repos');
      return data.repositories || [];
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  },

  /**
   * Get a specific repository by ID
   * @param {number} id Repository ID
   * @returns {Promise<Object>} Repository details
   */
  getRepository: async (id) => {
    try {
      const { data } = await api.get(`/repos/${id}`);
      return data;
    } catch (error) {
      console.error(`Error fetching repository ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new repository
   * @param {Object} repositoryData Repository data
   * @returns {Promise<Object>} Created repository
   */
  createRepository: async (repositoryData) => {
    try {
      const { data } = await api.post('/repos/create', repositoryData);
      return data;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  },

  /**
   * Get collaborators for a repository
   * @param {number} id Repository ID
   * @returns {Promise<Array>} List of collaborators
   */
  getCollaborators: async (id) => {
    try {
      const { data } = await api.get(`/repos/${id}/collaborators`);
      return data.collaborators || [];
    } catch (error) {
      console.error(`Error fetching collaborators for repository ${id}:`, error);
      throw error;
    }
  },

  /**
   * Add or update a collaborator's permission
   * @param {number} repoId Repository ID
   * @param {number} userId User ID
   * @param {string} permissionLevel Permission level
   * @returns {Promise<Object>} Result
   */
  addCollaborator: async (repoId, userId, permissionLevel) => {
    try {
      const { data } = await api.post(`/repos/${repoId}/permissions`, {
        userId,
        permissionLevel,
        action: 'add'
      });
      return data;
    } catch (error) {
      console.error(`Error adding collaborator to repository ${repoId}:`, error);
      throw error;
    }
  },

  /**
   * Update a collaborator's permission
   * @param {number} repoId Repository ID
   * @param {number} userId User ID
   * @param {string} permissionLevel New permission level
   * @returns {Promise<Object>} Result
   */
  updateCollaborator: async (repoId, userId, permissionLevel) => {
    try {
      const { data } = await api.post(`/repos/${repoId}/permissions`, {
        userId,
        permissionLevel,
        action: 'update'
      });
      return data;
    } catch (error) {
      console.error(`Error updating collaborator in repository ${repoId}:`, error);
      throw error;
    }
  },

  /**
   * Remove a collaborator from a repository
   * @param {number} repoId Repository ID
   * @param {number} userId User ID to remove
   * @returns {Promise<Object>} Result
   */
  removeCollaborator: async (repoId, userId) => {
    try {
      const { data } = await api.post(`/repos/${repoId}/permissions`, {
        userId,
        action: 'remove'
      });
      return data;
    } catch (error) {
      console.error(`Error removing collaborator from repository ${repoId}:`, error);
      throw error;
    }
  },

  /**
   * Search for users to add as collaborators
   * @param {string} query Search query
   * @returns {Promise<Array>} List of matching users
   */
  searchUsers: async (query) => {
    try {
      const { data } = await api.get(`/user/search?query=${encodeURIComponent(query)}`);
      return data.users || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
};

export default RepositoryService;