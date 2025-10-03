'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { FiUsers, FiBriefcase, FiPlus, FiSearch } from 'react-icons/fi';
import AddCompanyModal from './AddCompanyModal';
import CompanyEmployeesModal from './CompanyEmployeesModal';
import DashboardCharts from'./DashboardCharts'

const StatCard = ({ icon, value, label }) => (
  <motion.div
    whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
    transition={{ type: "spring", stiffness: 200 }}
    className="bg-white border border-purple-200 rounded-2xl p-6 flex items-center gap-4"
  >
    <div className="bg-gradient-to-br from-purple-600 to-indigo-500 text-white w-12 h-12 rounded-xl flex items-center justify-center">
      {icon}
    </div>
    <div>
      <span className="text-3xl font-bold text-gray-800">{value}</span>
      <span className="block text-sm text-gray-500">{label}</span>
    </div>
  </motion.div>
);

const SuperDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [stats, setStats] = useState({ totalCompanies: 0, totalEmployees: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingCompany, setViewingCompany] = useState(null);

  const fetchCompanies = async (name = '') => {
    try {
      const response = await fetch(`/api/companies/search?name=${name}`);
      if (!response.ok) throw new Error('Failed to fetch companies.');
      const data = await response.json();
      setCompanies(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        const [statsRes, companiesRes] = await Promise.all([
          fetch('/api/superadmin/stats'),
          fetch('/api/companies/search')
        ]);

        if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats.');
        if (!companiesRes.ok) throw new Error('Failed to fetch company list.');

        const statsData = await statsRes.json();
        const companiesData = await companiesRes.json();

        setStats(statsData);
        setCompanies(companiesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialFetch();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCompanies(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 font-sans bg-gray-50 min-h-screen"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white p-8 rounded-2xl shadow-lg mb-8 flex justify-between items-center"
      >
        <div>
          <h2 className="text-3xl font-bold">Welcome back, Super Admin!</h2>
          <p className="mt-2 opacity-90">Manage your companies and employees with speed and style .</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-white text-purple-600 font-semibold rounded-xl shadow hover:bg-gray-100 transition"
        >
          <FiPlus /> Add Company
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={<FiUsers size={24} />} value={stats.totalEmployees} label="Employees Verified" />
        <StatCard icon={<FiBriefcase size={24} />} value={stats.totalCompanies} label="Total Companies" />
        <StatCard icon={<FiPlus size={24} />} value={companies.length} label="Currently Active" />
      </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow p-6 mb-10"
      >
        <h3 className="text-xl font-bold text-gray-700 mb-4">Analytics Overview</h3>
        <DashboardCharts />
      </motion.div>

      {/* Companies Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200 rounded-2xl p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Newly Joined Companies</h3>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by company name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center p-8">Loading companies...</p>
          ) : error ? (
            <p className="text-center p-8 text-red-500">Error: {error}</p>
          ) : (
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th scope="col" className="px-6 py-3">Company Name</th>
                  <th scope="col" className="px-6 py-3">Admin Email</th>
                  <th scope="col" className="px-6 py-3">Package</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <motion.tbody
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.1 }
                  }
                }}
              >
                {companies.map(company => (
                  <motion.tr
                    key={company.id}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                    transition={{ type: "spring", stiffness: 150 }}
                    onClick={() => setViewingCompany(company)}
                    className="cursor-pointer border-b"
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3">
                      <Image
                        src={`https://ui-avatars.com/api/?name=${company.adminName.replace(' ', '+')}&background=random`}
                        alt={company.adminName}
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized={true}
                      />
                      {company.companyName}
                    </th>
                    <td className="px-6 py-4">{company.adminEmail}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {company.package}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold 
                        ${company.remaining.includes('Expired') || company.remaining.includes('4 days')
                          ? 'bg-red-100 text-red-600'
                          : 'bg-green-100 text-green-600'}`}>
                        {company.remaining}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddCompanyModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => fetchCompanies()}
          />
        )}
        {viewingCompany && (
          <CompanyEmployeesModal
            isOpen={!!viewingCompany}
            onClose={() => setViewingCompany(null)}
            company={viewingCompany}
            onSuccess={() => fetchCompanies()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SuperDashboard;
