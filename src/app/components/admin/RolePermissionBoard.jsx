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

export default function RolePermissionBoard() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [newRole, setNewRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editedRoleName, setEditedRoleName] = useState('');

  // Fetch all roles and permissions
  const fetchAll = useCallback(async () => {
    const [rolesRes, permsRes] = await Promise.all([
      fetch('/api/roles'),
      fetch('/api/permissions'),
    ]);
    const [rolesData, permsData] = await Promise.all([
      rolesRes.json(),
      permsRes.json(),
    ]);
    setRoles(rolesData);
    setPermissions(permsData);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleCreateRole = async () => {
    if (!newRole.trim()) return;
    const res = await fetch('/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRole }),
    });
    if (res.ok) {
      setNewRole('');
      fetchAll();
    }
  };

  const handleDeleteRole = async (roleId) => {
    const confirm = await Swal.fire({
      title: 'Delete Role?',
      text: 'This will remove the role and all its assigned permissions.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#e11d48',
    });
    if (confirm.isConfirmed) {
      await fetch(`/api/roles/${roleId}`, { method: 'DELETE' });
      fetchAll();
    }
  };

  const handleEditRole = async (roleId) => {
    if (!editedRoleName.trim()) return;
    await fetch(`/api/roles/${roleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editedRoleName }),
    });
    setEditingRole(null);
    fetchAll();
  };

  const onDragEnd = async (result) => {
  const { source, destination, draggableId } = result;
  if (!destination) return;
  if (source.droppableId === destination.droppableId) return;

  const roleId = destination.droppableId;

  // ✅ Find the exact permission safely at this moment
  const draggedPermission = permissions.find((perm) => perm.id === draggableId);
  if (!draggedPermission) return;

  // ✅ Optimistic update — directly inject the dragged permission
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

  // ✅ Background persistence — non-blocking
  try {
    const res = await fetch(`/api/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionId: draggableId }),
    });

    // Optional: re-fetch if needed to stay 100% in sync
    if (!res.ok) throw new Error('Failed to save permission');
    // await fetchAll(); // You can uncomment if you want guaranteed sync
  } catch (err) {
    console.error('Error assigning permission:', err);
    // Rollback optimistic UI if needed
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Role & Permission Management
          </h1>
          <p className="text-sm text-gray-500">
            Manage company roles and assign permissions effortlessly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="New Role Name"
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCreateRole}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
          >
            <FiPlus /> Add Role
          </motion.button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-6 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
        <FiSearch className="text-gray-500" />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search permissions..."
          className="bg-transparent outline-none flex-1 text-gray-700"
        />
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
                className="min-w-[320px] bg-zinc-100 hover:bg-purple-50 rounded-2xl p-5 border border-purple-200 shadow-md sticky left-2"
              >
                <h3 className="text-lg font-semibold text-indigo-600 mb-4 sticky top-1">
                  All Permissions
                </h3>
                {filteredPermissions.map(([group, perms]) => (
                  <div key={group} className="mb-4">
                    <h4 className="text-sm text-gray-500 mb-2 font-medium uppercase tracking-wide">
                      {group}
                    </h4>
                    {perms.map((perm, index) => (
                      <Draggable key={perm.id} draggableId={perm.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="p-3 mb-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm hover:shadow transition cursor-grab"
                          >
                            <div className="font-medium text-gray-800">
                              {formatPermissionName(perm.name)}
                            </div>
                            <p className="text-sm text-gray-500">
                              {perm.description || 'No description'}
                            </p>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>
                ))}
                {provided.placeholder}
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
                  className="min-w-[300px] bg-white rounded-2xl p-5 border border-gray-200 shadow-md"
                >
                  {/* Role Header */}
                  <div className="flex justify-between items-center mb-4">
                    {editingRole === role.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editedRoleName}
                          onChange={(e) => setEditedRoleName(e.target.value)}
                          className="border-b border-gray-300 focus:outline-none text-gray-800"
                        />
                        <FiCheck
                          onClick={() => handleEditRole(role.id)}
                          className="cursor-pointer text-green-500"
                        />
                        <FiX
                          onClick={() => setEditingRole(null)}
                          className="cursor-pointer text-red-500"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {role.name}
                        </h3>
                        <div className="flex gap-3 text-gray-500">
                          <FiEdit2
                            className="cursor-pointer hover:text-indigo-600"
                            onClick={() => {
                              setEditingRole(role.id);
                              setEditedRoleName(role.name);
                            }}
                          />
                          <FiTrash2
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => handleDeleteRole(role.id)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Assigned Permissions */}
                  {(role.permissions || []).map((perm, index) => (
                    <div
                      key={perm.id}
                      className="p-3 mb-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm"
                    >
                      <div className="font-medium text-gray-800">
                        {formatPermissionName(perm.name)}
                      </div>
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </motion.div>
  );
}
