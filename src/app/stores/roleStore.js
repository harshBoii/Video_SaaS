import { create } from 'zustand';

const useRoleStore = create((set, get) => ({
  // State
  selectedCompany: null,
  roles: [],
  selectedRole: null,
  drawerOpen: false,
  modalOpen: false,
  searchQuery: '',
  filters: {
    showActiveOnly: false,
    showEmptyRoles: false,
    showInheritance: true,
  },
  expandedNodes: new Set(),
  viewMode: 'tree', // 'tree' or 'table'

  // Actions
  setSelectedCompany: (company) => set({ selectedCompany: company }),
  
  setRoles: (roles) => set({ roles }),
  
  setSelectedRole: (role) => set({ 
    selectedRole: role,
    drawerOpen: role !== null 
  }),
  
  closeDrawer: () => set({ drawerOpen: false, selectedRole: null }),
  
  openModal: () => set({ modalOpen: true }),
  closeModal: () => set({ modalOpen: false }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  updateFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  toggleNodeExpand: (nodeId) => set((state) => {
    const expanded = new Set(state.expandedNodes);
    if (expanded.has(nodeId)) {
      expanded.delete(nodeId);
    } else {
      expanded.add(nodeId);
    }
    return { expandedNodes: expanded };
  }),
  
  expandAll: () => set((state) => ({
    expandedNodes: new Set(state.roles.map(r => r.id))
  })),
  
  collapseAll: () => set({ expandedNodes: new Set() }),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  addRole: async (roleData) => {
    // API call to create role
    const newRole = { id: Date.now().toString(), ...roleData };
    set((state) => ({ roles: [...state.roles, newRole] }));
    return newRole;
  },
  
  updateRole: async (roleId, updates) => {
    set((state) => ({
      roles: state.roles.map(r => r.id === roleId ? { ...r, ...updates } : r)
    }));
  },
  
  deleteRole: async (roleId) => {
    set((state) => ({
      roles: state.roles.filter(r => r.id !== roleId)
    }));
  },
  
  moveRole: async (roleId, newParentId) => {
    set((state) => ({
      roles: state.roles.map(r => 
        r.id === roleId ? { ...r, parentId: newParentId } : r
      )
    }));
  },
}));

export default useRoleStore;
