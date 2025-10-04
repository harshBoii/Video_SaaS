'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiSearch } from 'react-icons/fi';
import Swal from 'sweetalert2';

// Helper — Convert snake_case → Capitalized Words
const formatPermissionName = (name) =>
  name
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

// Small inline spinner component
const Spinner = ({ size = 18 }) => (
  <svg
    className="animate-spin"
    style={{ width: size, height: size }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="12" cy="12" r="10" stroke="rgba(99,102,241,0.15)" strokeWidth="4" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function RolePermissionBoard() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editedRoleName, setEditedRoleName] = useState('');

  // loading states
  const [loading, setLoading] = useState(true); // initial fetch
  const [isCreating, setIsCreating] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [assigningRoleId, setAssigningRoleId] = useState(null);

  // Fetch all roles and permissions
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([fetch('/api/roles'), fetch('/api/permissions')]);
      const [rolesData, permsData] = await Promise.all([rolesRes.json(), permsRes.json()]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (err) {
      console.error('Failed to fetch roles/permissions', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Create role
  const handleCreateRole = async () => {
    if (!newRole.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRole }),
      });
      if (res.ok) {
        setNewRole('');
        await fetchAll();
      } else {
        const err = await res.json();
        console.error('Create role error', err);
      }
    } catch (err) {
      console.error('Error creating role:', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete role
  const handleDeleteRole = async (roleId) => {
    const confirm = await Swal.fire({
      title: 'Delete Role?',
      text: 'This will remove the role and all its assigned permissions.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#e11d48',
    });
    if (!confirm.isConfirmed) return;

    setDeletingRoleId(roleId);
    try {
      await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      await fetchAll();
    } catch (err) {
      console.error('Error deleting role', err);
    } finally {
      setDeletingRoleId(null);
    }
  };

  // Edit / Save role name
  const handleEditRole = async (roleId) => {
    if (!editedRoleName.trim()) return;
    setSavingRoleId(roleId);
    try {
      await fetch(`/api/roles/${roleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedRoleName }),
      });
      setEditingRole(null);
      await fetchAll();
    } catch (err) {
      console.error('Error saving role name', err);
    } finally {
      setSavingRoleId(null);
    }
  };

  // Drag & Drop handler (optimistic update + server persist)
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const roleId = destination.droppableId;
    const draggedPermission = permissions.find((perm) => perm.id === draggableId);
    if (!draggedPermission) return;

    // Optimistic update: append permission to role
    setRoles((prev) =>
      prev.map((r) =>
        r.id === roleId
          ? {
              ...r,
              permissions: [...(r.permissions || []), draggedPermission],
            }
          : r
      )
    );

    // show assigning spinner on role header
    setAssigningRoleId(roleId);

    try {
      const res = await fetch(`/api/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionId: draggableId }),
      });
      if (!res.ok) throw new Error('Failed to save permission');
      // optionally re-sync: uncomment if you want guaranteed final sync
      // await fetchAll();
    } catch (err) {
      console.error('Error assigning permission:', err);
      // rollback
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? {
                ...r,
                permissions: (r.permissions || []).filter((p) => p.id !== draggableId),
              }
            : r
        )
      );
    } finally {
      setAssigningRoleId(null);
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    const group = perm.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  // Filter based on search term
  const filteredPermissions = Object.entries(groupedPermissions).map(([group, perms]) => [
    group,
    perms.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50 p-8 font-sans"
    >
      {/* Top page header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Role & Permission Management</h1>
          <p className="text-sm text-gray-500">Manage company roles and assign permissions effortlessly.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              placeholder="New Role Name"
              className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
            />
            {isCreating && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Spinner size={18} />
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateRole}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            <FiPlus />
            <span>Add Role</span>
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm max-w-lg">
        <FiSearch className="text-gray-500" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search permissions..."
          className="bg-transparent outline-none flex-1 text-gray-700"
        />
        {loading && <Spinner size={18} />}
      </div>

      {/* Main Kanban Section */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-8 max-w-[80vw]">
          {/* Permissions Panel */}
          <Droppable droppableId="permissions">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-w-[320px] bg-white rounded-2xl p-0 border border-gray-200 shadow-md sticky left-2"
              >
                {/* Sticky header inside column */}
                <div className="sticky top-0 z-50  bg-white border-b border-gray-100 p-4 rounded-t-2xl">
                  <h3 className="text-lg font-semibold z-50 text-indigo-600 mb-0">All Permissions</h3>
                </div>

                {/* scrollable permission list area */}
                <div className="p-5 max-h-[72vh] overflow-y-auto">
                  {filteredPermissions.map(([group, perms]) => (
                    <div key={group} className="mb-4">
                      <h4 className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">{group}</h4>
                      {perms.map((perm, index) => (
                        <Draggable key={perm.id} draggableId={perm.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-3 mb-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm hover:shadow transition cursor-grab"
                            >
                              <div className="font-medium text-gray-800">{formatPermissionName(perm.name)}</div>
                              <p className="text-sm text-gray-500">{perm.description || 'No description'}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                  ))}
                  {provided.placeholder}
                  {filteredPermissions.length === 0 && !loading && (
                    <div className="text-sm text-gray-500">No permissions found.</div>
                  )}
                </div>
              </div>
            )}
          </Droppable>

          {/* Role Columns */}
          {roles.map((role) => (
            <Droppable key={role.id} droppableId={role.id}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[300px] bg-white rounded-2xl p-0 border border-gray-200 shadow-md"
                >
                  {/* Sticky header: role name + actions */}
                  <div className="top-0 z-2 bg-white border-b border-gray-100 p-4 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-800">{role.name}</h3>
                      {assigningRoleId === role.id && <Spinner size={16} />}
                    </div>

                    <div className="flex items-center gap-3 text-gray-500">
                      {editingRole === role.id ? (
                        <>
                          <input
                            value={editedRoleName}
                            onChange={(e) => setEditedRoleName(e.target.value)}
                            className="border-b border-gray-300 focus:outline-none text-gray-800"
                          />
                          <button onClick={() => handleEditRole(role.id)} disabled={savingRoleId === role.id}>
                            {savingRoleId === role.id ? <Spinner size={16} /> : <FiCheck className="text-green-500" />}
                          </button>
                          <button onClick={() => setEditingRole(null)}><FiX className="text-red-500" /></button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingRole(role.id);
                              setEditedRoleName(role.name);
                            }}
                            title="Edit role"
                          >
                            <FiEdit2 className="hover:text-indigo-600" />
                          </button>
                          <button onClick={() => handleDeleteRole(role.id)} title="Delete role" disabled={deletingRoleId === role.id}>
                            {deletingRoleId === role.id ? <Spinner size={16} /> : <FiTrash2 className="hover:text-red-500" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Role permissions list area (scrollable) */}
                  <div className="p-5 max-h-[72vh] overflow-y-auto">
                    {(role.permissions || []).length === 0 && (
                      <div className="text-sm text-gray-500 mb-3">No permissions assigned.</div>
                    )}

                    {(role.permissions || []).map((perm, index) => (
                      <div
                        key={perm.id}
                        className="p-3 mb-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm"
                      >
                        <div className="font-medium text-gray-800">{formatPermissionName(perm.name)}</div>
                      </div>
                    ))}

                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </motion.div>
  );
}

