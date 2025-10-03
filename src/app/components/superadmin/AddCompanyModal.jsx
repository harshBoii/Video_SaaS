'use client';
import React, {useState} from 'react';
import { FiX, FiSave, FiBriefcase, FiUser } from 'react-icons/fi';
import Swal from 'sweetalert2';

const AddCompanyModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyType: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPosition: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/companies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to create company.');
      
      Swal.fire('✅ Success!', 'New company and admin have been created.', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      Swal.fire('❌ Error!', error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-2xl bg-opacity-70 flex justify-center items-center z-50 font-sans p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FiBriefcase className="text-blue-600" size={24} />
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Add New Company</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Details */}
          <div className="space-y-4">
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">Company Name*</span>
              <input 
                type="text" name="companyName" required 
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-gray-600 mb-2">Company Type*</span>
              <input 
                type="text" name="companyType" required 
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </div>
          
          <hr className="border-t border-gray-200" />
          
          {/* Admin Details */}
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FiUser /> Admin User Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" name="adminFirstName" placeholder="First Name*" required 
              onChange={handleInputChange}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input type="text" name="adminLastName" placeholder="Last Name*" required 
              onChange={handleInputChange}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input type="email" name="adminEmail" placeholder="Email*" required 
              onChange={handleInputChange}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input type="password" name="adminPassword" placeholder="Password*" required 
              onChange={handleInputChange}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input type="text" name="adminPosition" placeholder="Position (Optional)" 
              onChange={handleInputChange}
              className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 mt-6">
            <button 
              type="button" 
              className="px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave /> {isSubmitting ? 'Creating...' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompanyModal;
