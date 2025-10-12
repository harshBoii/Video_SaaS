'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiSearch, FiPlus as FiPlusAlt } from 'react-icons/fi';
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
  const [permissionCombos, setPermissionCombos] = useState([]); // NEW
  const [newRole, setNewRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRole, setEditingRole] = useState(null);
  const [editedRoleName, setEditedRoleName] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // modal state for creating combo
  const [isComboModalOpen, setIsComboModalOpen] = useState(false);
  const [comboName, setComboName] = useState('');
  const [comboDescription, setComboDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [creatingCombo, setCreatingCombo] = useState(false);

  // loading states
  const [loading, setLoading] = useState(true); // initial fetch
  const [isCreating, setIsCreating] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState(null);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [assigningRoleId, setAssigningRoleId] = useState(null);

  // Fetch all roles, permissions, combos
  useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user");

      const user = await res.json();
      setCurrentUser(user);
    } catch (err) {
      console.error("Error fetching /api/auth/me:", err);
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  fetchCurrentUser();
}, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes, combosRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/permissions'),
        fetch('/api/permissions/combo'),
      ]);
      const [rolesData, permsData, combosData] = await Promise.all([
        rolesRes.json(),
        permsRes.json(),
        combosRes.json(),
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
      setPermissionCombos(combosData);
    } catch (err) {
      console.error('Failed to fetch roles/permissions/combos', err);
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
        Swal.fire('Error', err?.error || 'Could not create role', 'error');
      }
    } catch (err) {
      console.error('Error creating role:', err);
      Swal.fire('Error', 'Could not create role', 'error');
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
      Swal.fire('Error', 'Could not delete role', 'error');
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
      Swal.fire('Error', 'Could not update role', 'error');
    } finally {
      setSavingRoleId(null);
    }
  };

  // Create combo (POST /api/permissions/combo)
  const handleCreateCombo = async () => {
    if (!comboName.trim() || selectedPermissionIds.length === 0) {
      Swal.fire('Validation', 'Provide a name and select at least one permission', 'info');
      return;
    }
    setCreatingCombo(true);
    try {
      if (!currentUser?.companyId) {
            Swal.fire("Error", "User company not found. Please re-login.", "error");
            return;
          }

          const res = await fetch('/api/permissions/combo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: comboName,
              description: comboDescription,
              permissionIds: selectedPermissionIds,
              companyId: currentUser.companyId, // 👈 send from /api/auth/me
            }),
          });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e?.error || 'Failed to create combo');
      }
      const created = await res.json();
      // Update local combos list
      setPermissionCombos((prev) => [created, ...(prev || [])]);
      // reset modal
      setComboName('');
      setComboDescription('');
      setSelectedPermissionIds([]);
      setIsComboModalOpen(false);
      Swal.fire('Saved', 'Permission combo created', 'success');
    } catch (err) {
      console.error('Error creating combo', err);
      Swal.fire('Error', err.message || 'Could not create combo', 'error');
    } finally {
      setCreatingCombo(false);
    }
  };

  // Toggle permission selection in modal
  const togglePermissionSelect = (id) => {
    setSelectedPermissionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Drag & Drop handler (supports combos and single-permissions)
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const roleId = destination.droppableId;

    // detect combo draggable (prefix 'combo:')
    if (draggableId.startsWith('combo:')) {
      const comboId = draggableId.replace('combo:', '');
      const combo = permissionCombos.find((c) => c.id === comboId);
      if (!combo) return;

      // optimistic update: append combo permissions
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId
            ? { ...r, permissions: [...(r.permissions || []), ...combo.permissions] }
            : r
        )
      );

      setAssigningRoleId(roleId);
      try {
        const res = await fetch(`/api/roles/${roleId}/combos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comboId }),
        });
        if (!res.ok) throw new Error('Failed to assign combo to role');
      } catch (err) {
        console.error('Error assigning combo:', err);
        // rollback: remove the permissions we just added
        setRoles((prev) =>
          prev.map((r) =>
            r.id === roleId
              ? {
                  ...r,
                  permissions: (r.permissions || []).filter(
                    (p) => !combo.permissions.some((cp) => cp.id === p.id)
                  ),
                }
              : r
          )
        );
      } finally {
        setAssigningRoleId(null);
      }
      return;
    }

    // else handle single permission
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
      // optionally re-sync: await fetchAll();
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
    <>
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
          <div className="flex gap-6 overflow-x-auto pb-8 max-w-[90vw]">
            {/* Permissions Panel */}
            <Droppable droppableId="permissions">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-w-[360px] bg-white rounded-2xl p-0 border border-gray-200 shadow-md sticky left-2"
                >
                  {/* Header with Create Combo button */}
                  <div className="sticky top-0 z-50 bg-white border-b border-gray-100 p-4 rounded-t-2xl flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold z-50 text-indigo-600 mb-0">Permission Combos</h3>
                      <p className="text-xs text-gray-400">Drag a combo into a role to assign all its permissions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsComboModalOpen(true)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 hover:bg-indigo-100"
                      >
                        <FiPlusAlt /> New Combo
                      </button>
                    </div>
                  </div>

                  {/* combos list */}
                  <div className="p-5 border-b border-gray-100 max-h-[28vh] overflow-y-auto">
                    {permissionCombos.length > 0 ? (
                      permissionCombos.map((combo, idx) => (
                        <Draggable key={combo.id} draggableId={`combo:${combo.id}`} index={idx}>
                          {(prov) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className="p-3 mb-3 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 shadow-sm hover:shadow cursor-grab"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-800">{combo.name}</div>
                                  <p className="text-xs text-gray-500">{combo.description || 'No description'}</p>
                                </div>
                                <div className="text-xs text-gray-400">{combo.permissions?.length || 0}</div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {(combo.permissions || []).slice(0, 4).map((p) => (
                                  <span key={p.id} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded">
                                    {formatPermissionName(p.name)}
                                  </span>
                                ))}
                                {(combo.permissions || []).length > 4 && (
                                  <span className="text-xs text-gray-400 mt-1">+{(combo.permissions || []).length - 4} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No permission combos found.</div>
                    )}
                    {/** placeholder not required here because we don't drop into combos column */}
                  </div>

                  {/* All Permissions header */}
                  <div className=" bg-white border-b border-gray-100 p-4 rounded-t-2xl">
                    <h3 className="text-lg font-semibold text-indigo-600 mb-0">All Permissions</h3>
                  </div>

                  {/* scrollable permission list area */}
                  <div className="p-5 max-h-[42vh] overflow-y-auto">
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
                                className="p-3 mb-3 rounded-lg bg-white border border-gray-100 shadow-sm hover:shadow transition cursor-grab"
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
                    className="min-w-[320px] bg-white rounded-2xl p-0 border border-gray-200 shadow-md"
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

      {/* Combo creation modal (simple centered modal) */}
      {isComboModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsComboModalOpen(false)} />
          <div className="relative z-70 w-[min(900px,95%)] bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Create Permission Combo</h3>
                <p className="text-sm text-gray-500">Give this combo a name and pick permissions to include.</p>
              </div>
              <button onClick={() => setIsComboModalOpen(false)} className="text-gray-400 hover:text-gray-700"><FiX /></button>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600">Combo Name</label>
                <input value={comboName} onChange={(e) => setComboName(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="e.g. HR Essentials" />

                <label className="block text-sm text-gray-600 mt-3">Description (optional)</label>
                <input value={comboDescription} onChange={(e) => setComboDescription(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="Short description" />

                <div className="mt-4">
                  <label className="block text-sm text-gray-600">Selected Permissions ({selectedPermissionIds.length})</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedPermissionIds.map((id) => {
                      const p = permissions.find((x) => x.id === id);
                      return (
                        <span key={id} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded inline-flex items-center gap-2">
                          {p ? formatPermissionName(p.name) : id}
                          <button onClick={() => togglePermissionSelect(id)} className="text-indigo-500 ml-2 text-xs">x</button>
                        </span>
                      );
                    })}
                    {selectedPermissionIds.length === 0 && <div className="text-sm text-gray-400">No permissions selected yet.</div>}
                  </div>
                </div>
              </div>

              <div className="md:col-span-1 border-l pl-4">
                <label className="block text-sm text-gray-600 mb-2">Choose Permissions</label>
                <div className="max-h-[44vh] overflow-y-auto pr-2">
                  {permissions.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input type="checkbox" checked={selectedPermissionIds.includes(perm.id)} onChange={() => togglePermissionSelect(perm.id)} />
                      <div className="text-sm">
                        <div className="font-medium">{formatPermissionName(perm.name)}</div>
                        <div className="text-xs text-gray-400">{perm.description || 'No description'}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button className="px-4 py-2 rounded-md border" onClick={() => setIsComboModalOpen(false)}>Cancel</button>
              <button
                onClick={handleCreateCombo}
                disabled={creatingCombo}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white"
              >
                {creatingCombo ? <Spinner size={16} /> : 'Save Combo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
