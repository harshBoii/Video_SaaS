'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiX, FiEdit, FiSave, FiAward, FiSearch } from 'react-icons/fi';
import { FaInternetExplorer } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Link from 'next/link';
const CompanyEmployeesModal = ({ isOpen, onClose, company, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for editing
  const [editingId, setEditingId] = useState(null);
  const [editedPosition, setEditedPosition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for the new search bar
  const [searchTerm, setSearchTerm] = useState('');

  // This function now includes the search term
  const fetchEmployees = async (name = '') => {
    if (isOpen && company) {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`/api/companies/${company.id}/employees?name=${name}`);
        if (!response.ok) throw new Error('Failed to fetch employees.');
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  // Initial fetch when the modal opens
  useEffect(() => {
    // Reset search term when modal opens
    setSearchTerm('');
    fetchEmployees();
  }, [isOpen, company]);

  // Debounced search effect
  useEffect(() => {
      const handler = setTimeout(() => {
          if (isOpen) {
            fetchEmployees(searchTerm);
          }
      }, 500); // 500ms delay

      return () => {
          clearTimeout(handler);
      };
  }, [searchTerm, isOpen]);


  const handleEditClick = (employee) => {
    setEditingId(employee.id);
    setEditedPosition(employee.position || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedPosition('');
  };

  const handleSave = async (employeeId, makeAdmin = false) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}/update-role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: editedPosition, makeAdmin }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update employee.');
      }
      
      Swal.fire('Success!', 'Employee has been updated.', 'success');
      handleCancelEdit();
      fetchEmployees(); // Refetch the list inside the modal
      if (onSuccess) onSuccess(); // Safely call onSuccess if it was provided
    } catch (err) {
      Swal.fire('Error!', err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 font-sans p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Employees at "{company?.companyName}"</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        {/* New Search Bar */}
        <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder="Search by employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500">Loading employees...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error: {error}</p>
          ) : (
            <ul className="space-y-3">
              {employees.length > 0 ? employees.map(emp => (
                <li key={emp.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Image 
                      src={`https://ui-avatars.com/api/?name=${emp.fullName.replace(' ', '+')}&background=random&color=fff`} 
                      alt={emp.fullName} 
                      width={40} 
                      height={40} 
                      className="rounded-full"
                      unoptimized={true}
                    />
                    <div className="ml-4 flex-grow">
                      <p className="font-semibold text-gray-800">{emp.fullName}</p>
                      <p className="text-sm text-gray-500">{emp.email}</p>
                    </div>
                    {editingId !== emp.id && (
                      <>
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                          {emp.position}
                        </span>
                        <button onClick={() => handleEditClick(emp)} className="ml-4 text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors" disabled={isSubmitting}>
                          <FiEdit />
                        </button>
                        <button>
                          <Link href={`/admin/verify-experience/${emp.id}`}>
                              <FaInternetExplorer/>
                          </Link>   
                        </button>
                      </>
                    )}
                  </div>
                  {editingId === emp.id && (
                    <div className="mt-4 flex items-center gap-4">
                      <input 
                        type="text"
                        value={editedPosition}
                        onChange={(e) => setEditedPosition(e.target.value)}
                        className="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new position"
                      />
                      <button onClick={() => handleSave(emp.id, true)} className="text-sm flex items-center gap-2 px-3 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded-md hover:bg-yellow-500 transition-colors" disabled={isSubmitting}>
                        <FiAward /> Make Admin
                      </button>
                      <button onClick={() => handleSave(emp.id)} className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors" disabled={isSubmitting}>
                        <FiSave />
                      </button>
                      <button onClick={handleCancelEdit} className="p-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors" disabled={isSubmitting}>
                        <FiX />
                      </button>
                    </div>
                  )}
                </li>
              )) : (
                <p className="text-center text-gray-500">No employees found.</p>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyEmployeesModal;
