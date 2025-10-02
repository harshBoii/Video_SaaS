'use client';
import React, {useState} from 'react';
import { FiX, FiSave } from 'react-icons/fi';
import Swal from 'sweetalert2';

const AddCompanyModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyType:'',
    adminFullName: '',
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
      
      Swal.fire('Success!', 'New company and admin have been created.', 'success');
      onSuccess(); // Refetch the company list on the main page
      onClose();   // Close the modal
    } catch (error) {
      Swal.fire('Error!', error.message, 'error');
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
        <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Add New Company</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-600 mb-2">Company Name*</label>
            <input 
              type="text" 
              id="companyName" 
              name="companyName" 
              onChange={handleInputChange} 
              required 
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-600 mb-2">Company Work-type*</label>
            <input 
              type="text" 
              id="companyType" 
              name="companyType" 
              onChange={handleInputChange} 
              required 
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />

          </div>
          
          <hr className="border-t border-gray-200" />
          
          <h3 className="text-lg font-semibold text-gray-700">Admin User Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="adminFullName" className="block text-sm font-medium text-gray-600 mb-2">Admin Full Name*</label>
              <input type="text" id="adminFullName" name="adminFullName" onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-600 mb-2">Admin Email*</label>
              <input type="email" id="adminEmail" name="adminEmail" onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-600 mb-2">Password*</label>
              <input type="password" id="adminPassword" name="adminPassword" onChange={handleInputChange} required className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label htmlFor="adminPosition" className="block text-sm font-medium text-gray-600 mb-2">Admin Position</label>
              <input type="text" id="adminPosition" name="adminPosition" onChange={handleInputChange} className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
          
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
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
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
