import React from 'react';
import { motion } from 'framer-motion';
import { Handle, Position } from '@xyflow/react';
import { Users, Shield } from 'lucide-react';

const RoleNode = ({ data, selected }) => {
  const { role } = data;
  
  // Count employees and permissions from the role data
  const employeeCount = role.employees?.length || 0;
  const permissionCount = role.permissions?.length || 0;

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`bg-white rounded-2xl shadow-lg p-4 w-[280px] transition-all duration-200 cursor-pointer
          ${selected ? 'border-2 border-blue-500 shadow-xl' : 'border-2 border-gray-200 hover:border-blue-300'}`}
      >
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg text-gray-800 truncate">
            {role.name}
          </h3>
          {role.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {role.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">{employeeCount}</span>
            <span className="text-xs">employees</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Shield className="w-4 h-4" />
            <span className="font-medium">{permissionCount}</span>
            <span className="text-xs">perms</span>
          </div>
        </div>
      </motion.div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
    </>
  );
};

export default RoleNode;
