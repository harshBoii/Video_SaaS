// lib/employeeApi.js
import { showError } from './swal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const employeeApi = {
  // Fetch all employees for a company
  async fetchEmployees(companyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees?companyId=${companyId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch employees');
      }
      
      const data = await response.json();
      return data.employees || [];
    } catch (error) {
      console.error('Error fetching employees:', error);
      throw error;
    }
  },

  // Update employee's manager
  async updateEmployeeManager(employeeId, managerId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/manager`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ managerId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update manager');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating manager:', error);
      throw error;
    }
  },

  // Remove employee's manager
  async removeEmployeeManager(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/manager`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove manager');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error removing manager:', error);
      throw error;
    }
  },

  // Delete employee
  async deleteEmployee(employeeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error deleting employee:', error);
      throw error;
    }
  },

  // Create new employee
  async createEmployee(employeeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(employeeData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create employee');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating employee:', error);
      throw error;
    }
  },

  // Update employee details
  async updateEmployee(employeeId, employeeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(employeeData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update employee');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating employee:', error);
      throw error;
    }
  },
};
