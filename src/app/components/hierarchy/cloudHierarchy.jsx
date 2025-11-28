// components/hierarchy/HierarchyManager.jsx
'use client';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Users, 
  Plus,
  Building2,
  X,
  Trash2,
  Edit,
  GitBranch,
  TrendingUp,
  Mail,
  Search,
  Settings,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Map as MapIcon,
  Minimize2,
  Link2Off
} from 'lucide-react';
import { roleApi } from '@/app/lib/roleApi';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

// ==================== CONSTANTS ====================
const ROLE_WIDTH = 400;
const ROLE_HEIGHT = 280;
const INITIAL_OFFSET = { x: 400, y: 100 };
const GRID_SIZE = 20;

// ==================== UTILITY FUNCTIONS ====================
const snapToGrid = (value, gridSize) => Math.round(value / gridSize) * gridSize;

// ==================== MINIMAP ====================
const Minimap = React.memo(({ positions, viewport, onNavigate, connections }) => {
  const scale = 0.08;
  const minimapWidth = 220;
  const minimapHeight = 160;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-6 left-6 z-30 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-700 flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-blue-600" />
          Navigation
        </p>
        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
          {positions.length} nodes
        </span>
      </div>
      
      <div 
        className="relative bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-xl cursor-pointer overflow-hidden"
        style={{ width: minimapWidth, height: minimapHeight }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / scale) - viewport.width / 2;
          const y = ((e.clientY - rect.top) / scale) - viewport.height / 2;
          onNavigate(x, y);
        }}
      >
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent 20px)',
          backgroundSize: `${20 * scale}px ${20 * scale}px`
        }} />
        
        {/* Connection lines */}
        {connections.map((conn, idx) => (
          <line
            key={idx}
            x1={conn.x1 * scale}
            y1={conn.y1 * scale}
            x2={conn.x2 * scale}
            y2={conn.y2 * scale}
            stroke="#9ca3af"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        ))}
        
        {/* Nodes */}
        {positions.map((pos) => (
          <motion.div
            key={pos.id}
            whileHover={{ scale: 1.1 }}
            className="absolute bg-gradient-to-br from-blue-500 to-purple-500 rounded-md shadow-sm cursor-pointer"
            style={{
              left: pos.x * scale,
              top: pos.y * scale,
              width: ROLE_WIDTH * scale,
              height: ROLE_HEIGHT * scale,
            }}
          />
        ))}
        
        {/* Viewport indicator */}
        <motion.div
          className="absolute border-3 border-red-500 bg-red-500/10 rounded pointer-events-none"
          style={{
            left: viewport.x * scale,
            top: viewport.y * scale,
            width: viewport.width * scale,
            height: viewport.height * scale,
          }}
        />
      </div>
    </motion.div>
  );
});

Minimap.displayName = 'Minimap';

// ==================== ZOOM CONTROLS ====================
const ZoomControls = ({ zoom, onZoomIn, onZoomOut, onReset, onFitView }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed bottom-6 right-6 z-30 flex flex-col gap-2 bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-3"
    >
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onZoomIn}
        className="p-3 hover:bg-blue-50 rounded-xl transition-colors group"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
      </motion.button>
      
      <div className="px-3 py-2 text-sm font-bold text-gray-700 text-center border-y-2 border-gray-200">
        {Math.round(zoom * 100)}%
      </div>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onZoomOut}
        className="p-3 hover:bg-blue-50 rounded-xl transition-colors group"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
      </motion.button>
      
      <div className="border-t-2 border-gray-200 my-1" />
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onFitView}
        className="p-3 hover:bg-blue-50 rounded-xl transition-colors group"
        title="Fit to View"
      >
        <Minimize2 className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onReset}
        className="p-3 hover:bg-blue-50 rounded-xl transition-colors group"
        title="Reset View"
      >
        <Maximize2 className="w-5 h-5 text-gray-700 group-hover:text-blue-600" />
      </motion.button>
    </motion.div>
  );
};

// ==================== DOTTED CONNECTION LINES (CLICKABLE) ====================
const DottedConnectionLines = React.memo(({ connections, onRemove, zoom }) => {
  const [hoveredLine, setHoveredLine] = useState(null);

  return (
    <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: '100%', height: '100%', zIndex: 0 }}>
      {connections.map((conn, idx) => {
        const isHovered = hoveredLine === idx;
        const midX = (conn.x1 + conn.x2) / 2;
        const midY = (conn.y1 + conn.y2) / 2;

        return (
          <g 
            key={idx}
            className="pointer-events-auto cursor-pointer"
            onMouseEnter={() => setHoveredLine(idx)}
            onMouseLeave={() => setHoveredLine(null)}
            onClick={async () => {
              const result = await showConfirm(
                'Remove Connection?',
                'This will disconnect the role from its parent.',
                'Remove',
                'Cancel'
              );
              if (result.isConfirmed) {
                onRemove(conn.childId);
              }
            }}
          >
            {/* Invisible wider line for easier clicking */}
            <line
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="transparent"
              strokeWidth={20 / zoom}
            />
            
            {/* Visible dotted line */}
            <motion.line
              animate={{
                stroke: isHovered ? '#ef4444' : '#9ca3af',
                strokeWidth: isHovered ? 3 / zoom : 2 / zoom
              }}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              strokeDasharray={isHovered ? `${8 / zoom},${4 / zoom}` : `${6 / zoom},${4 / zoom}`}
              strokeLinecap="round"
              className="pointer-events-none"
            />

            {/* Animated dot */}
            <motion.circle
              animate={{ 
                cx: [conn.x1, conn.x2, conn.x1],
                cy: [conn.y1, conn.y2, conn.y1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              r={isHovered ? 5 / zoom : 3 / zoom}
              fill={isHovered ? '#ef4444' : '#3b82f6'}
              className="pointer-events-none"
            />

            {/* Delete icon when hovered */}
            {isHovered && (
              <g transform={`translate(${midX}, ${midY})`}>
                <motion.circle 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  cx="0" 
                  cy="0" 
                  r={16 / zoom} 
                  fill="#ef4444"
                  className="animate-pulse"
                />
                <motion.g
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transform={`scale(${1 / zoom})`}
                >
                  <line x1="-6" y1="-6" x2="6" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <line x1="6" y1="-6" x2="-6" y2="6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </motion.g>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
});

DottedConnectionLines.displayName = 'DottedConnectionLines';

// ==================== ROLE CARD ====================
const RoleCard = React.memo(({ 
  role, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onAddChild, 
  isDragging = false
}) => {
  const employeeCount = role.employees?.length || 0;
  const childCount = role.children?.length || 0;
  const permissionCount = role.permissions?.length || 0;

  const departments = useMemo(() => 
    role.employees?.reduce((acc, emp) => {
      const dept = emp.department?.name || 'No Department';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {}) || {}, [role.employees]
  );

  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isDragging ? 1.05 : 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`relative w-[400px] min-h-[280px] bg-gradient-to-br from-blue-400/30 to-purple-600/30 backdrop-blur-2xl rounded-[40px] border-2 border-blue-400/50 shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-3xl group ${isDragging ? 'ring-4 ring-blue-500' : ''}`}
      onClick={onToggle}
      style={{ width: ROLE_WIDTH, height: ROLE_HEIGHT }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-xl" />
      <div className="absolute top-4 right-4 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
      <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />

      <div className="relative z-10 p-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-gray-800 truncate mb-1">
              {role.name}
            </h3>
            {role.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {role.description}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-white/50 hover:bg-white/70 backdrop-blur-sm rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-gray-700" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onAddChild();
              }}
              className="p-2 bg-white/50 hover:bg-white/70 backdrop-blur-sm rounded-lg transition-colors"
              title="Add Child"
            >
              <Plus className="w-4 h-4 text-gray-700" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/40">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600 font-medium">Employees</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{employeeCount}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/40">
            <div className="flex items-center gap-2 mb-1">
              <GitBranch className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600 font-medium">Sub-Roles</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{childCount}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/40">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600 font-medium">Permissions</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{permissionCount}</p>
          </div>
        </div>

        {/* Departments */}
        {Object.keys(departments).length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/40 flex-1">
            <p className="text-xs text-gray-600 font-medium mb-2 flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              Departments
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(departments).slice(0, 3).map(([dept, count]) => (
                <span 
                  key={dept}
                  className="text-xs bg-white/80 px-2 py-1 rounded-full text-gray-700 font-medium"
                >
                  {dept} ({count})
                </span>
              ))}
              {Object.keys(departments).length > 3 && (
                <span className="text-xs text-gray-600 font-medium">
                  +{Object.keys(departments).length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Employee Avatars */}
        {!isExpanded && employeeCount > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {role.employees?.slice(0, 5).map((emp, idx) => (
                <motion.div
                  key={emp.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-md"
                  title={`${emp.firstName} ${emp.lastName}`}
                >
                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                </motion.div>
              ))}
            </div>
            {employeeCount > 5 && (
              <span className="text-sm text-gray-600 font-medium">
                +{employeeCount - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

RoleCard.displayName = 'RoleCard';

// ==================== DRAGGABLE ROLE NODE ====================
const DraggableRoleNode = ({ role, position, onPositionChange, children, expandedRole, onToggle, onEdit, onDelete, onAddChild }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `role-${role.id}`,
    data: { type: 'role', role, position }  // Pass current position
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${role.id}`,
    data: { type: 'role', role }
  });

  const finalPosition = useMemo(() => {
    if (!transform) return position;
    return {
      x: position.x + transform.x,
      y: position.y + transform.y
    };
  }, [position, transform]);

  const style = {
    position: 'absolute',
    left: finalPosition.x,
    top: finalPosition.y,
    width: ROLE_WIDTH,
    height: ROLE_HEIGHT,
    zIndex: isDragging ? 1000 : isOver ? 100 : 1,
  };

  return (
    <div ref={setDropRef} style={style}>
      <div ref={setNodeRef} className="relative w-full h-full">
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="absolute -top-2 left-1/2 -translate-x-1/2 p-2 bg-white/90 hover:bg-white rounded-xl cursor-grab active:cursor-grabbing transition-all z-20 shadow-lg border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-5 h-5 text-gray-700" />
        </div>

        {/* Position Indicator */}
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-16 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-xl whitespace-nowrap z-30"
          >
            📍 X: {Math.round(finalPosition.x)} Y: {Math.round(finalPosition.y)}
          </motion.div>
        )}

        {/* Drop Indicator */}
        {isOver && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-green-400/30 rounded-[40px] border-4 border-green-400 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-lg">
              Drop to make sub-role
            </div>
          </motion.div>
        )}

        {children}
      </div>
    </div>
  );
};


// ==================== EXPANDED ROLE VIEW ====================
const ExpandedRoleView = React.memo(({ role, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('all');

  const filteredEmployees = useMemo(() => 
    role.employees?.filter(emp => {
      const matchesSearch = 
        emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDept = filterDept === 'all' || emp.departmentId === filterDept;
      
      return matchesSearch && matchesDept;
    }) || [], [role.employees, searchQuery, filterDept]
  );

  const departments = useMemo(() => 
    [...new globalThis.Set(role.employees?.map(e => e.department).filter(Boolean))],
    [role.employees]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">{role.name}</h2>
              <p className="text-blue-100 text-sm">{role.description}</p>
              <div className="flex items-center gap-6 mt-3 text-sm">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">{role.employees?.length || 0}</span> employees
                </span>
                <span className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5" />
                  <span className="font-bold">{role.children?.length || 0}</span> sub-roles
                </span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
              />
            </div>

            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredEmployees.map(emp => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {emp.firstName?.[0]}{emp.lastName?.[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.department && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Building2 className="w-3 h-3" />
                        {emp.department.name}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold text-lg">No employees found</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
});

ExpandedRoleView.displayName = 'ExpandedRoleView';

// ==================== MAIN HIERARCHY MANAGER ====================
const HierarchyManager = () => {
  const [companyId, setCompanyId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [expandedRole, setExpandedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState({});
  const [showMinimap, setShowMinimap] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchUserCompany();
  }, []);

  useEffect(() => {
    if (companyId) {
      loadHierarchy();
    }
  }, [companyId]);

  const fetchUserCompany = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await response.json();
      setCompanyId(data.employee?.companyId);
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  const buildHierarchyMap = useCallback((flatRoles) => {
    const roleMap = new globalThis.Map();
    const parentChildMap = new globalThis.Map();
    
    flatRoles.forEach(role => {
      roleMap.set(role.id, role);
      if (role.parentId) {
        if (!parentChildMap.has(role.parentId)) {
          parentChildMap.set(role.parentId, []);
        }
        parentChildMap.get(role.parentId).push(role.id);
      }
    });
    
    return { roleMap, parentChildMap };
  }, []);

  const loadHierarchy = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const fetchedRoles = await roleApi.fetchRoles(companyId);
      setRoles(fetchedRoles);
      
      // Initialize positions for new roles
      const positions = {};
      fetchedRoles.forEach((role, index) => {
        positions[role.id] = nodePositions[role.id] || {
          x: INITIAL_OFFSET.x + (index % 3) * 500,
          y: INITIAL_OFFSET.y + Math.floor(index / 3) * 400
        };
      });
      setNodePositions(positions);
      
      calculateStats(fetchedRoles);
    } catch (error) {
      console.error('Failed to load hierarchy:', error);
      showError('Error', 'Failed to load hierarchy');
    } finally {
      setLoading(false);
    }
  }, [companyId, nodePositions]);

  const calculateStats = useCallback((roles) => {
    const totalEmployees = roles.reduce((sum, r) => sum + (r.employees?.length || 0), 0);
    const totalRoles = roles.length;
    const departments = new globalThis.Set(roles.flatMap(r => r.employees?.map(e => e.departmentId).filter(Boolean) || []));
    
    setStats({
      totalEmployees,
      totalRoles,
      totalDepartments: departments.size,
      avgEmployeesPerRole: totalRoles > 0 ? Math.round(totalEmployees / totalRoles) : 0
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.4));
  }, []);

  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleFitView = useCallback(() => {
    if (roles.length === 0) return;
    
    const positions = Object.values(nodePositions);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + ROLE_WIDTH));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y + ROLE_HEIGHT));
    
    const width = maxX - minX;
    const height = maxY - minY;
    
    const container = containerRef.current;
    if (!container) return;
    
    const scaleX = container.clientWidth / (width + 200);
    const scaleY = container.clientHeight / (height + 200);
    const newZoom = Math.min(scaleX, scaleY, 1);
    
    setZoom(newZoom);
    setPan({
      x: -minX + 100,
      y: -minY + 100
    });
  }, [roles, nodePositions]);

  const handlePositionChange = useCallback((roleId, newPosition) => {
    setNodePositions(prev => ({
      ...prev,
      [roleId]: newPosition
    }));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.closest('.canvas-background')) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(prev => Math.max(0.4, Math.min(2, prev + delta)));
  }, []);

  const handleNavigate = useCallback((x, y) => {
    setPan({ x: -x, y: -y });
  }, []);

  const handleDragStart = useCallback((event) => {
    setActiveId(event.active.id);
  }, []);

const handleDragEnd = useCallback(async (event) => {
  const { active, over, delta } = event;
  setActiveId(null);

  const activeData = active.data.current;
  
  // Update position for role nodes when dragged (even without dropping on another role)
  if (activeData.type === 'role' && activeData.position) {
    const newPosition = {
      x: snapToGrid(activeData.position.x + delta.x, GRID_SIZE),
      y: snapToGrid(activeData.position.y + delta.y, GRID_SIZE)
    };
    
    // Update position immediately
    handlePositionChange(activeData.role.id, newPosition);
  }

  if (!over) return;

  const overData = over.data.current;

  // Role dragged onto another role - create parent-child relationship
  if (activeData.type === 'role' && overData.type === 'role') {
    const draggedRole = activeData.role;
    const targetRole = overData.role;

    if (draggedRole.id === targetRole.id) return;

    showLoading('Updating hierarchy...', 'Please wait');
    
    try {
      await roleApi.updateRoleParent(draggedRole.id, targetRole.id);
      await loadHierarchy();
      closeSwal();
      showSuccess('Success', `"${draggedRole.name}" is now under "${targetRole.name}"`);
    } catch (error) {
      closeSwal();
      showError('Error', error.message);
    }
  }
}, [handlePositionChange, loadHierarchy]);

  const handleRemoveConnection = useCallback(async (roleId) => {
    showLoading('Removing connection...', 'Please wait');
    
    try {
      await roleApi.removeRoleParent(roleId);
      await loadHierarchy();
      closeSwal();
      showSuccess('Success', 'Connection removed');
    } catch (error) {
      closeSwal();
      showError('Error', error.message);
    }
  }, [loadHierarchy]);

  const viewport = useMemo(() => {
    if (!containerRef.current) return { x: 0, y: 0, width: 0, height: 0 };
    return {
      x: -pan.x / zoom,
      y: -pan.y / zoom,
      width: containerRef.current.clientWidth / zoom,
      height: containerRef.current.clientHeight / zoom
    };
  }, [pan, zoom]);

  const layoutData = useMemo(() => {
    return roles.map(role => ({
      id: role.id,
      role,
      ...nodePositions[role.id] || { x: 0, y: 0 }
    }));
  }, [roles, nodePositions]);

  // Calculate connections between parent and child roles
  const connections = useMemo(() => {
    const lines = [];
    roles.forEach(role => {
      if (role.parentId && nodePositions[role.id] && nodePositions[role.parentId]) {
        const parentPos = nodePositions[role.parentId];
        const childPos = nodePositions[role.id];
        lines.push({
          x1: parentPos.x + ROLE_WIDTH / 2,
          y1: parentPos.y + ROLE_HEIGHT,
          x2: childPos.x + ROLE_WIDTH / 2,
          y2: childPos.y,
          childId: role.id,
          parentId: role.parentId
        });
      }
    });
    return lines;
  }, [roles, nodePositions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-700">Loading Organization...</p>
        </div>
      </div>
    );
  }

  const expandedRoleData = expandedRole ? roles.find(r => r.id === expandedRole) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b-2 border-gray-200 shadow-lg z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Organization Hierarchy
                </h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Drag roles anywhere • Scroll to zoom • Drag canvas to pan • Click dotted lines to disconnect
                </p>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMinimap(!showMinimap)}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm"
                >
                  <MapIcon className="w-4 h-4" />
                  {showMinimap ? 'Hide' : 'Show'} Map
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm"
                >
                  <Plus className="w-5 h-5" />
                  Add Role
                </motion.button>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Employees', value: stats.totalEmployees, icon: Users, color: 'blue' },
                  { label: 'Roles', value: stats.totalRoles, icon: GitBranch, color: 'purple' },
                  { label: 'Departments', value: stats.totalDepartments, icon: Building2, color: 'pink' },
                  { label: 'Avg/Role', value: stats.avgEmployeesPerRole, icon: TrendingUp, color: 'green' }
                ].map(({ label, value, icon: Icon, color }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`bg-gradient-to-br from-${color}-50 to-${color}-100 rounded-xl p-4 border-2 border-${color}-200 shadow-sm`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-5 h-5 text-${color}-700`} />
                      <span className={`text-xs text-${color}-700 font-bold`}>{label}</span>
                    </div>
                    <p className={`text-3xl font-bold text-${color}-900`}>{value}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Grid Background */}
          <div 
            className="absolute inset-0 canvas-background"
            style={{
              backgroundImage: `
                repeating-linear-gradient(0deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent ${GRID_SIZE}px),
                repeating-linear-gradient(90deg, #e5e7eb 0px, #e5e7eb 1px, transparent 1px, transparent ${GRID_SIZE}px)
              `,
              backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
          />

          {/* Nodes Canvas */}
          <div
            ref={canvasRef}
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Dotted Connection Lines */}
            <DottedConnectionLines
              connections={connections}
              onRemove={handleRemoveConnection}
              zoom={zoom}
            />

            {/* Role Nodes */}
            {layoutData.map((node) => (
              <DraggableRoleNode
                key={node.id}
                role={node.role}
                position={{ x: node.x, y: node.y }}
                onPositionChange={handlePositionChange}
                expandedRole={expandedRole}
                onToggle={() => setExpandedRole(expandedRole === node.id ? null : node.id)}
                onEdit={() => {}}
                onDelete={() => {}}
                onAddChild={() => {}}
              >
                <RoleCard
                  role={node.role}
                  isExpanded={expandedRole === node.id}
                  onToggle={() => setExpandedRole(expandedRole === node.id ? null : node.id)}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onAddChild={() => {}}
                  isDragging={activeId === `role-${node.id}`}
                />
              </DraggableRoleNode>
            ))}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && (
          <Minimap
            positions={layoutData}
            viewport={viewport}
            onNavigate={handleNavigate}
            connections={connections}
          />
        )}

        {/* Zoom Controls */}
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          onFitView={handleFitView}
        />

        {/* Expanded Role View */}
        <AnimatePresence>
          {expandedRoleData && (
            <ExpandedRoleView
              role={expandedRoleData}
              onClose={() => setExpandedRole(null)}
            />
          )}
        </AnimatePresence>

        <DragOverlay>
          {activeId && (
            <div className="bg-white rounded-2xl p-4 shadow-2xl border-2 border-blue-500">
              <GripVertical className="w-6 h-6 text-blue-600" />
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default HierarchyManager;
