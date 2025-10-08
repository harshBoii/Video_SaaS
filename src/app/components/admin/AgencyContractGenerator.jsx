'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import { FiSend, FiUser, FiBriefcase, FiCalendar, FiDollarSign, FiList } from 'react-icons/fi';

export default function AgencyContractGenerator() {
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);

  // Form fields
  const [agencyName, setAgencyName] = useState('');
  const [clientName, setClientName] = useState('');
  const [tenure, setTenure] = useState('');
  const [fee, setFee] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [requirements, setRequirements] = useState('');

  // Fetch company details from JWT
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        setCompany(data?.company || null);
        setClientName('');
      } catch (err) {
        console.error('Error fetching company:', err);
      }
    };
    fetchCompany();
  }, []);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agencyName || !tenure || !fee || !joiningDate || !requirements) {
      return Swal.fire('Missing Fields', 'Please fill in all required fields.', 'warning');
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/generate-agency-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency_name: agencyName,
          client_name: clientName,
          company_name: company?.name,
          company_email:company?.email||" ",
          company_mobile:company?.mobile|| " ",
          tenure,
          fee,
          requirement_list: requirements.split(',').map((r) => r.trim()),
          joining_date: joiningDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate agency contract.');
      const data = await response.json();

      Swal.fire({
        title: 'Success!',
        text: 'Agency contract generated successfully.',
        icon: 'success',
        confirmButtonColor: '#4f46e5',
      });

      console.log('API Response:', data);
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to generate contract.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans flex justify-center items-center ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className=" w-[80vw] min-h-[85vh] mx-auto bg-white border border-gray-100 rounded-3xl shadow-xl p-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Agency Contract Generator
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create and generate custom agency contracts instantly.
            </p>
          </div>
        </div>

        {/* Company Info */}
        {company ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-8">
            <h3 className="text-md font-semibold text-indigo-700">
              Company: {company.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Domain: {company.domain || 'Not provided'}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 mb-6">Fetching company details...</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiBriefcase className="inline mr-2 text-indigo-500" />
                Agency Name *
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Skyline Media"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiUser className="inline mr-2 text-indigo-500" />
                Client Name *
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Acme Corp"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-2 text-indigo-500" />
                Tenure *
              </label>
              <input
                type="text"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., 12 months"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiDollarSign className="inline mr-2 text-indigo-500" />
                Monthly Fee *
              </label>
              <input
                type="text"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., $1500/month"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FiCalendar className="inline mr-2 text-indigo-500" />
                Joining Date *
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiList className="inline mr-2 text-indigo-500" />
              Requirements (comma separated) *
            </label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="e.g., Monthly reports, SEO optimization, Ad creative design"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={loading}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg disabled:opacity-60"
            >
              <FiSend />
              {loading ? 'Generating...' : 'Generate Contract'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
