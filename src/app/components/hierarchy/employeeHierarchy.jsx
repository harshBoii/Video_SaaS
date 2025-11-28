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
  Mail,
  Phone,
  GripVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Map as MapIcon,
  Minimize2,
  Shield,
  Crown,
  Target,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react';
import { employeeApi } from '@/app/lib/employeeApi';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

// ==================== CONSTANTS ====================
const EMPLOYEE_WIDTH = 120;  // Compact size
const EMPLOYEE_HEIGHT = 120; // Compact size
const ADMIN_CARD_WIDTH = 140;
const ADMIN_CARD_HEIGHT = 140;
const INITIAL_OFFSET = { x: 400, y: 250 };
const GRID_SIZE = 20;

// ==================== UTILITY FUNCTIONS ====================
const snapToGrid = (value, gridSize) => Math.round(value / gridSize) * gridSize;

const getInitialPositions = (employees) => {
  const positions = {};
  const admins = employees.filter(e => e.isAdmin);
  const nonAdmins = employees.filter(e => !e.isAdmin);

  // Position admins in a row at the top - more spacing for compact cards
  admins.forEach((admin, index) => {
    positions[admin.id] = {
      x: INITIAL_OFFSET.x + index * (ADMIN_CARD_WIDTH + 80),
      y: 80
    };
  });

  // Position non-admins below - grid with more spacing
  nonAdmins.forEach((emp, index) => {
    positions[emp.id] = {
      x: INITIAL_OFFSET.x + (index % 6) * (EMPLOYEE_WIDTH + 60), // 6 per row instead of 4
      y: INITIAL_OFFSET.y + Math.floor(index / 6) * (EMPLOYEE_HEIGHT + 60)
    };
  });

  return positions;
};

// ==================== MINIMAP ====================
const Minimap = React.memo(({ positions, viewport, onNavigate, connections, employees }) => {
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
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <Crown className="w-3 h-3" />
            {employees.filter(e => e.isAdmin).length}
          </span>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
            {employees.length}
          </span>
        </div>
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
        
        {/* Nodes */}
        {Object.entries(positions).map(([id, pos]) => {
          const emp = employees.find(e => e.id === parseInt(id));
          return (
            <motion.div
              key={id}
              whileHover={{ scale: 1.1 }}
              className={`absolute rounded-sm shadow-sm cursor-pointer ${emp?.isAdmin ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-blue-500 to-purple-500'}`}
              style={{
                left: pos.x * scale,
                top: pos.y * scale,
                width: (emp?.isAdmin ? ADMIN_CARD_WIDTH : EMPLOYEE_WIDTH) * scale,
                height: (emp?.isAdmin ? ADMIN_CARD_HEIGHT : EMPLOYEE_HEIGHT) * scale,
              }}
            />
          );
        })}
        
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

// ==================== DOTTED CONNECTION LINES ====================
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
                'Remove Reporting Relationship?',
                `${conn.childName} will no longer report to ${conn.parentName}`,
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

// ==================== ADMIN CARD (COMPACT) ====================
const AdminCard = React.memo(({ employee, isDragging, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isDragging ? 1.05 : 1, opacity: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl shadow-xl border-2 border-amber-300 overflow-hidden ${isDragging ? 'ring-4 ring-amber-400' : ''} transition-all duration-300`}
      style={{ 
        width: isHovered ? ADMIN_CARD_WIDTH + 120 : ADMIN_CARD_WIDTH, 
        height: isHovered ? ADMIN_CARD_HEIGHT + 60 : ADMIN_CARD_HEIGHT 
      }}
      onClick={onViewDetails}
    >
      {/* Default View - Just Avatar and Name */}
      <div className="relative z-10 p-4 h-full flex flex-col items-center justify-center">
        {/* Avatar */}
        <div className="relative mb-2">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center text-amber-900 font-bold text-xl shadow-lg border-2 border-white">
            {employee.firstName?.[0]}{employee.lastName?.[0]}
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-amber-400 shadow-md">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
          </div>
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-white text-center">
          {employee.firstName} {employee.lastName}
        </h3>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 z-20 p-4 flex flex-col justify-center"
            >
              {/* Avatar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-amber-900 font-bold text-lg border-2 border-white shadow-lg">
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white truncate">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <div className="flex items-center gap-1 mt-0.5 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full w-fit">
                    <Crown className="w-3 h-3 text-white" />
                    <span className="text-[10px] text-white font-bold">ADMIN</span>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-2">
                <p className="text-[10px] text-white/70 font-semibold mb-0.5">Role</p>
                <p className="text-xs text-white font-bold truncate">
                  {employee.role?.name || 'Administrator'}
                </p>
              </div>

              {/* Email */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-2">
                <p className="text-[10px] text-white/70 font-semibold mb-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </p>
                <p className="text-xs text-white font-semibold truncate">
                  {employee.email}
                </p>
              </div>

              {/* Department */}
              {employee.department && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <p className="text-[10px] text-white/70 font-semibold mb-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Department
                  </p>
                  <p className="text-xs text-white font-semibold truncate">
                    {employee.department.name}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

AdminCard.displayName = 'AdminCard';

// ==================== EMPLOYEE CARD ====================
const EmployeeCard = React.memo(({ employee, isDragging, onViewDetails, subordinateCount }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: isDragging ? 1.05 : 1, opacity: 1 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden transition-all ${isDragging ? 'ring-4 ring-blue-400' : ''} hover:border-blue-300`}
      style={{ 
        width: isHovered ? EMPLOYEE_WIDTH + 160 : EMPLOYEE_WIDTH, 
        height: isHovered ? EMPLOYEE_HEIGHT + 120 : EMPLOYEE_HEIGHT 
      }}
      onClick={onViewDetails}
    >
      {/* Default View - Just Avatar and Name */}
      <div className="relative z-10 p-4 h-full flex flex-col items-center justify-center">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white mb-2">
          {employee.firstName?.[0]}{employee.lastName?.[0]}
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-gray-900 text-center truncate w-full px-2">
          {employee.firstName} {employee.lastName}
        </h3>

        {/* Subordinate Badge */}
        {subordinateCount > 0 && !isHovered && (
          <span className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-md">
            {subordinateCount}
          </span>
        )}

        {/* Hover Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 z-20 p-4 flex flex-col justify-center"
            >
              {/* Header with Avatar */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center text-blue-900 font-bold text-lg border-2 border-white shadow-lg">
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  {subordinateCount > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full w-fit">
                      <Users className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white font-bold">{subordinateCount} reports</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-2">
                <p className="text-[10px] text-white/70 font-semibold mb-0.5">Role</p>
                <p className="text-xs text-white font-bold truncate">
                  {employee.role?.name || 'Employee'}
                </p>
              </div>

              {/* Email */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-2">
                <p className="text-[10px] text-white/70 font-semibold mb-0.5 flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Email
                </p>
                <p className="text-[10px] text-white font-semibold truncate">
                  {employee.email}
                </p>
              </div>

              {/* Department */}
              {employee.department && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mb-2">
                  <p className="text-[10px] text-white/70 font-semibold mb-0.5 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Department
                  </p>
                  <p className="text-xs text-white font-semibold truncate">
                    {employee.department.name}
                  </p>
                </div>
              )}

              {/* Manager */}
              {employee.manager && (
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                  <p className="text-[10px] text-white/70 font-semibold mb-0.5">Reports To</p>
                  <p className="text-xs text-white font-semibold truncate">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

EmployeeCard.displayName = 'EmployeeCard';

// ==================== DRAGGABLE EMPLOYEE NODE ====================
const DraggableEmployeeNode = ({ employee, position, onPositionChange, children, isAdmin, subordinateCount, onViewDetails }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `employee-${employee.id}`,
    data: { type: 'employee', employee, position }
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${employee.id}`,
    data: { type: 'employee', employee }
  });

  const finalPosition = useMemo(() => {
    if (!transform) return position;
    return {
      x: position.x + transform.x,
      y: position.y + transform.y
    };
  }, [position, transform]);

  const width = isAdmin ? ADMIN_CARD_WIDTH : EMPLOYEE_WIDTH;
  const height = isAdmin ? ADMIN_CARD_HEIGHT : EMPLOYEE_HEIGHT;

  const style = {
    position: 'absolute',
    left: finalPosition.x,
    top: finalPosition.y,
    width,
    height,
    zIndex: isDragging ? 1000 : isOver ? 100 : 1,
    cursor: 'pointer'
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
          <GripVertical className="w-4 h-4 text-gray-700" />
        </div>

        {/* Position Indicator */}
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-xl whitespace-nowrap z-30"
          >
            📍 {Math.round(finalPosition.x)}, {Math.round(finalPosition.y)}
          </motion.div>
        )}

        {/* Drop Indicator */}
        {isOver && (
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="absolute inset-0 bg-green-400/30 rounded-2xl border-4 border-green-400 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-lg">
              Drop to set as manager
            </div>
          </motion.div>
        )}

        {children}
      </div>
    </div>
  );
};

// ==================== EMPLOYEE DETAILS MODAL ====================
const EmployeeDetailsModal = React.memo(({ employee, onClose, onEdit, onDelete, allEmployees }) => {
  const subordinates = useMemo(() => 
    allEmployees.filter(e => e.managerId === employee.id),
    [allEmployees, employee.id]
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
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 ${employee.isAdmin ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-gradient-to-r from-blue-600 to-purple-600'} text-white`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl border-4 border-white/30 shadow-lg">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">
                  {employee.firstName} {employee.lastName}
                </h2>
                <p className="text-sm opacity-90 font-semibold">
                  {employee.role?.name || 'Employee'}
                </p>
                {employee.isAdmin && (
                  <div className="flex items-center gap-1 mt-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit">
                    <Crown className="w-4 h-4" />
                    <span className="text-xs font-bold">Administrator</span>
                  </div>
                )}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm font-semibold text-gray-900">{employee.email}</p>
              </div>
              {employee.phone && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{employee.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Organization Info */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Organization
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {employee.department && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Department</p>
                  <p className="text-sm font-semibold text-gray-900">{employee.department.name}</p>
                </div>
              )}
              {employee.manager && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Reports To</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {employee.manager.firstName} {employee.manager.lastName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Subordinates */}
          {subordinates.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Direct Reports ({subordinates.length})
              </h3>
              <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                {subordinates.map(sub => (
                  <div key={sub.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                      {sub.firstName?.[0]}{sub.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {sub.firstName} {sub.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{sub.role?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onEdit(employee)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Employee
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onDelete(employee)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

EmployeeDetailsModal.displayName = 'EmployeeDetailsModal';

// ==================== MAIN EMPLOYEE HIERARCHY MANAGER ====================
const EmployeeHierarchyManager = () => {
  const [companyId, setCompanyId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
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
      loadEmployees();
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

  const loadEmployees = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const fetchedEmployees = await employeeApi.fetchEmployees(companyId);
      setEmployees(fetchedEmployees);
      
      // Initialize or preserve positions
      setNodePositions(prev => {
        const existingPositions = { ...prev };
        const newPositions = getInitialPositions(fetchedEmployees);
        
        // Only use new positions for employees that don't have positions yet
        fetchedEmployees.forEach(emp => {
          if (!existingPositions[emp.id]) {
            existingPositions[emp.id] = newPositions[emp.id];
          }
        });
        
        return existingPositions;
      });
      
      calculateStats(fetchedEmployees);
    } catch (error) {
      console.error('Failed to load employees:', error);
      showError('Error', 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const calculateStats = useCallback((employees) => {
    const admins = employees.filter(e => e.isAdmin).length;
    const withManagers = employees.filter(e => e.managerId).length;
    const departments = new globalThis.Set(employees.map(e => e.departmentId).filter(Boolean));
    
    setStats({
      totalEmployees: employees.length,
      admins,
      withManagers,
      totalDepartments: departments.size,
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
    if (employees.length === 0) return;
    
    const positions = Object.values(nodePositions);
    const minX = Math.min(...positions.map(p => p.x));
    const maxX = Math.max(...positions.map(p => p.x + EMPLOYEE_WIDTH));
    const minY = Math.min(...positions.map(p => p.y));
    const maxY = Math.max(...positions.map(p => p.y + EMPLOYEE_HEIGHT));
    
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
  }, [employees, nodePositions]);

  const handlePositionChange = useCallback((employeeId, newPosition) => {
    setNodePositions(prev => ({
      ...prev,
      [employeeId]: newPosition
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
    
    // Update position after drag
    if (activeData.type === 'employee') {
      const currentPos = activeData.position || { x: 0, y: 0 };
      const newPosition = {
        x: snapToGrid(currentPos.x + delta.x, GRID_SIZE),
        y: snapToGrid(currentPos.y + delta.y, GRID_SIZE)
      };
      
      setNodePositions(prev => ({
        ...prev,
        [activeData.employee.id]: newPosition
      }));
    }

    // Handle manager assignment
    if (over && activeData.type === 'employee' && over.data.current.type === 'employee') {
      const draggedEmployee = activeData.employee;
      const targetEmployee = over.data.current.employee;

      if (draggedEmployee.id === targetEmployee.id) return;

      // Prevent circular references
      if (targetEmployee.managerId === draggedEmployee.id) {
        showError('Invalid Operation', 'Cannot create circular reporting relationship');
        return;
      }

      showLoading('Updating manager...', 'Please wait');
      
      try {
        await employeeApi.updateEmployeeManager(draggedEmployee.id, targetEmployee.id);
        await loadEmployees();
        closeSwal();
        showSuccess('Success', `${draggedEmployee.firstName} now reports to ${targetEmployee.firstName}`);
      } catch (error) {
        closeSwal();
        showError('Error', error.message);
      }
    }
  }, [loadEmployees]);

  const handleRemoveManager = useCallback(async (employeeId) => {
    showLoading('Removing manager...', 'Please wait');
    
    try {
      await employeeApi.removeEmployeeManager(employeeId);
      await loadEmployees();
      closeSwal();
      showSuccess('Success', 'Manager removed');
    } catch (error) {
      closeSwal();
      showError('Error', error.message);
    }
  }, [loadEmployees]);

  const handleEditEmployee = useCallback((employee) => {
    // Open edit modal
    console.log('Edit employee:', employee);
    setSelectedEmployee(null);
  }, []);

  const handleDeleteEmployee = useCallback(async (employee) => {
    setSelectedEmployee(null);
    
    const result = await showConfirm(
      'Delete Employee?',
      `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`,
      'Delete',
      'Cancel'
    );

    if (!result.isConfirmed) return;

    showLoading('Deleting employee...', 'Please wait');
    
    try {
      await employeeApi.deleteEmployee(employee.id);
      await loadEmployees();
      closeSwal();
      showSuccess('Success', 'Employee deleted');
    } catch (error) {
      closeSwal();
      showError('Error', error.message);
    }
  }, [loadEmployees]);

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
    return employees.map(emp => ({
      id: emp.id,
      employee: emp,
      ...nodePositions[emp.id] || { x: 0, y: 0 }
    }));
  }, [employees, nodePositions]);

  // Calculate connections
  const connections = useMemo(() => {
    const lines = [];
    employees.forEach(emp => {
      if (emp.managerId && nodePositions[emp.id] && nodePositions[emp.managerId]) {
        const managerPos = nodePositions[emp.managerId];
        const empPos = nodePositions[emp.id];
        const manager = employees.find(e => e.id === emp.managerId);
        
        const managerWidth = manager?.isAdmin ? ADMIN_CARD_WIDTH : EMPLOYEE_WIDTH;
        const managerHeight = manager?.isAdmin ? ADMIN_CARD_HEIGHT : EMPLOYEE_HEIGHT;
        const empWidth = emp.isAdmin ? ADMIN_CARD_WIDTH : EMPLOYEE_WIDTH;
        
        lines.push({
          x1: managerPos.x + managerWidth / 2,
          y1: managerPos.y + managerHeight,
          x2: empPos.x + empWidth / 2,
          y2: empPos.y,
          childId: emp.id,
          parentId: emp.managerId,
          childName: `${emp.firstName} ${emp.lastName}`,
          parentName: `${manager?.firstName} ${manager?.lastName}`
        });
      }
    });
    return lines;
  }, [employees, nodePositions]);

  // Count subordinates
  const subordinateCounts = useMemo(() => {
    const counts = {};
    employees.forEach(emp => {
      counts[emp.id] = employees.filter(e => e.managerId === emp.id).length;
    });
    return counts;
  }, [employees]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-700">Loading Employees...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b-2 border-gray-200 shadow-lg z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Employee Hierarchy
                </h1>
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Drag employees to set manager • Click lines to remove • Scroll to zoom
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
                  Add Employee
                </motion.button>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'blue' },
                  { label: 'Administrators', value: stats.admins, icon: Crown, color: 'amber' },
                  { label: 'With Managers', value: stats.withManagers, icon: Target, color: 'green' },
                  { label: 'Departments', value: stats.totalDepartments, icon: Building2, color: 'purple' }
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
            {/* Connection Lines */}
            <DottedConnectionLines
              connections={connections}
              onRemove={handleRemoveManager}
              zoom={zoom}
            />

            {/* Employee Nodes */}
            {layoutData.map((node) => (
              <DraggableEmployeeNode
                key={node.id}
                employee={node.employee}
                position={{ x: node.x, y: node.y }}
                onPositionChange={handlePositionChange}
                isAdmin={node.employee.isAdmin}
                subordinateCount={subordinateCounts[node.id] || 0}
                onViewDetails={() => setSelectedEmployee(node.employee)}
              >
                {node.employee.isAdmin ? (
                  <AdminCard
                    employee={node.employee}
                    isDragging={activeId === `employee-${node.id}`}
                    onViewDetails={() => setSelectedEmployee(node.employee)}
                  />
                ) : (
                  <EmployeeCard
                    employee={node.employee}
                    isDragging={activeId === `employee-${node.id}`}
                    onViewDetails={() => setSelectedEmployee(node.employee)}
                    subordinateCount={subordinateCounts[node.id] || 0}
                  />
                )}
              </DraggableEmployeeNode>
            ))}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && (
          <Minimap
            positions={nodePositions}
            viewport={viewport}
            onNavigate={handleNavigate}
            connections={connections}
            employees={employees}
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

        {/* Employee Details Modal */}
        <AnimatePresence>
          {selectedEmployee && (
            <EmployeeDetailsModal
              employee={selectedEmployee}
              onClose={() => setSelectedEmployee(null)}
              onEdit={handleEditEmployee}
              onDelete={handleDeleteEmployee}
              allEmployees={employees}
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

export default EmployeeHierarchyManager;
