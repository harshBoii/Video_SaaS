export const roleApi = {
  async fetchRoles(companyId) {
    try {
      const response = await fetch(`/api/companies/${companyId}/roles`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch roles');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getRoleDetails(roleId) {
    try {
      const response = await fetch(`/api/roles/${roleId}/details`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch role details');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching role details:', error);
      throw error;
    }
  },

  async updateRoleParent(roleId, newParentId) {
    try {
      const response = await fetch(`/api/roles/${roleId}/parent`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId: newParentId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role parent');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error updating role parent:', error);
      throw error;
    }
  },

  // NEW: Remove parent relationship
  async removeRoleParent(roleId) {
    try {
      const response = await fetch(`/api/roles/${roleId}/parent`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove parent relationship');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error removing parent relationship:', error);
      throw error;
    }
  },

  async searchEmployees(roleId, query, options = {}) {
    try {
      const params = new URLSearchParams({
        search: query,
        ...options,
      });
      
      const response = await fetch(
        `/api/roles/${roleId}/employees?${params.toString()}`,
        {
          credentials: 'include',
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search employees');
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error searching employees:', error);
      throw error;
    }
  },
};
