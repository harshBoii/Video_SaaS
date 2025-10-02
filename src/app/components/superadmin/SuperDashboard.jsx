// 'use client';
// import React, { useState, useEffect } from 'react';
// import Image from 'next/image';
// import { FiUsers, FiBriefcase, FiPlus, FiSearch } from 'react-icons/fi';
// import SuperAdminCharts from './SuperChart';
// import AddCompanyModal from './AddCompanyModal';
// import CompanyEmployeesModal from './CompanyEmployeesModal';

// const StatCard = ({ icon, value, label }) => (
//     <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4">
//         <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
//             {icon}
//         </div>
//         <div>
//             <span className="text-2xl font-bold text-gray-800">{value}</span>
//             <span className="block text-sm text-gray-500">{label}</span>
//         </div>
//     </div>
// );

// const SuperDashboard = () => {
//     const [companies, setCompanies] = useState([]);
//     const [stats, setStats] = useState({ totalCompanies: 0, totalEmployees: 0 });
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
    
//     const [searchTerm, setSearchTerm] = useState('');
//     const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//     const [viewingCompany, setViewingCompany] = useState(null);

//     const fetchCompanies = async (name = '') => {
//         try {
//             // No need to set loading here as the main fetch handles it
//             const response = await fetch(`/api/companies/search?name=${name}`);
//             if (!response.ok) throw new Error('Failed to fetch companies.');
//             const data = await response.json();
//             setCompanies(data);
//         } catch (err) {
//             setError(err.message);
//         }
//     };

//     // Initial fetch for stats and all companies
//     useEffect(() => {
//         const initialFetch = async () => {
//              try {
//                 setLoading(true);
//                 const [statsRes, companiesRes] = await Promise.all([
//                     fetch('/api/superadmin/stats'),
//                     fetch('/api/companies/search')
//                 ]);

//                 if (!statsRes.ok) throw new Error('Failed to fetch dashboard stats.');
//                 if (!companiesRes.ok) throw new Error('Failed to fetch company list.');

//                 const statsData = await statsRes.json();
//                 const companiesData = await companiesRes.json();

//                 setStats(statsData);
//                 setCompanies(companiesData);
//             } catch (err) {
//                 setError(err.message);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         initialFetch();
//     }, []);

//     // Debounced search effect
//     useEffect(() => {
//         const handler = setTimeout(() => {
//             fetchCompanies(searchTerm);
//         }, 500); // Wait 500ms after user stops typing

//         return () => {
//             clearTimeout(handler);
//         };
//     }, [searchTerm]);

//     return (
//         <>
//             <div className="p-6 font-sans">
//                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
//                     <div className="lg:col-span-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white p-8 rounded-xl">
//                         <h2 className="text-3xl font-bold">Welcome back, Super Admin!</h2>
//                         <p className="mt-2 opacity-90">You can now turn your Verification Process Faster than a Cheetah.</p>
//                     </div>
//                     <div className="flex flex-col gap-4 justify-center">
//                         <StatCard icon={<FiUsers size={20} />} value={stats.totalEmployees} label="Total Employees Verified" />
//                         <StatCard icon={<FiBriefcase size={20} />} value={stats.totalCompanies} label="Total Companies" />
//                     </div>
//                 </div>

//                 <div className="my-8">
//                     <SuperAdminCharts />
//                 </div>

//                 <div className="bg-white border border-gray-200 rounded-lg p-6">
//                     <div className="flex justify-between items-center mb-4">
//                         <h3 className="text-xl font-bold text-gray-800">Newly Joined Company</h3>
//                         <div className="flex items-center gap-4">
//                             <div className="relative">
//                                 <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
//                                 <input 
//                                     type="text"
//                                     placeholder="Search by company name..."
//                                     value={searchTerm}
//                                     onChange={(e) => setSearchTerm(e.target.value)}
//                                     className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
//                                 />
//                             </div>
//                             <button 
//                                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
//                                 onClick={() => setIsAddModalOpen(true)}
//                             >
//                                 <FiPlus /> Add Company
//                             </button>
//                         </div>
//                     </div>

//                     <div className="overflow-x-auto">
//                         {loading ? (
//                             <p className="text-center p-8">Loading companies...</p>
//                         ) : error ? (
//                             <p className="text-center p-8 text-red-500">Error: {error}</p>
//                         ) : (
//                             <table className="w-full text-sm text-left text-gray-500">
//                                 <thead className="text-xs text-gray-700 uppercase bg-gray-50">
//                                     <tr>
//                                         <th scope="col" className="px-6 py-3">Company Name</th>
//                                         <th scope="col" className="px-6 py-3">Admin Email</th>
//                                         <th scope="col" className="px-6 py-3">Package</th>
//                                         <th scope="col" className="px-6 py-3">Remaining</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody>
//                                     {companies.map(company => (
//                                         <tr key={company.id} onClick={() => setViewingCompany(company)} className="bg-white border-b hover:bg-gray-50 cursor-pointer">
//                                             <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap flex items-center gap-3">
//                                                 <Image 
//                                                     src={`https://ui-avatars.com/api/?name=${company.adminName.replace(' ', '+')}&background=random`} 
//                                                     alt={company.adminName} 
//                                                     width={32} 
//                                                     height={32} 
//                                                     className="rounded-full"
//                                                     unoptimized={true}
//                                                 />
//                                                 {company.companyName}
//                                             </th>
//                                             <td className="px-6 py-4">{company.adminEmail}</td>
//                                             <td className="px-6 py-4">{company.package}</td>
//                                             <td className={`px-6 py-4 ${company.remaining.includes('Expired') || company.remaining.includes('4 days') ? 'text-red-500 font-semibold' : ''}`}>
//                                                 {company.remaining}
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         )}
//                     </div>
//                 </div>
//             </div>
            
//             <AddCompanyModal 
//                 isOpen={isAddModalOpen}
//                 onClose={() => setIsAddModalOpen(false)}
//                 onSuccess={() => fetchCompanies()}
//             />
//             <CompanyEmployeesModal
//                 isOpen={!!viewingCompany}
//                 onClose={() => setViewingCompany(null)}
//                 company={viewingCompany}
//                 onSuccess={() => fetchCompanies()}
//             />
//         </>
//     );
// };

// export default SuperDashboard;
'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUsers, FiBriefcase, FiPlus, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import SuperAdminCharts from './SuperChart';
import AddCompanyModal from './AddCompanyModal';
import CompanyEmployeesModal from './CompanyEmployeesModal';

const StatCard = ({ icon, value, label, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all"
  >
    <div className="bg-gradient-to-br from-purple-600 to-purple-400 text-white w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow">
      {icon}
    </div>
    <div>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
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
          fetch('/api/companies/search'),
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
    <div className="flex h-screen font-sans">
      {/* Sidebar */}
      {/* <div className="hidden lg:flex lg:flex-col w-64 bg-gradient-to-b from-purple-700 to-purple-600 text-white p-6">
        <h1 className="text-2xl font-extrabold mb-10 tracking-wide">Super Admin</h1>
        <nav className="flex flex-col gap-4 text-sm font-medium">
          <a href="#" className="hover:text-purple-200">Dashboard</a>
          <a href="#" className="hover:text-purple-200">Companies</a>
          <a href="#" className="hover:text-purple-200">Employees</a>
          <a href="#" className="hover:text-purple-200">Settings</a>
        </nav>
      </div> */}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {/* Top Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold text-gray-800">Welcome back, Super Admin 👋</h2>
            <p className="text-gray-600">Manage your verification process faster and smarter.</p>
          </motion.div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-md"
              onClick={() => setIsAddModalOpen(true)}
            >
              <FiPlus /> Add Company
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<FiUsers size={22} />} value={stats.totalEmployees} label="Employees Verified" delay={0.1} />
          <StatCard icon={<FiBriefcase size={22} />} value={stats.totalCompanies} label="Total Companies" delay={0.2} />
          <StatCard icon={<FiUsers size={22} />} value="42" label="Active Admins" delay={0.3} />
        </div>

        {/* Charts */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics Overview</h3>
          <SuperAdminCharts />
        </motion.div>

        {/* Company Table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white border border-gray-200 rounded-xl shadow-sm"
        >
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800">Newly Joined Companies</h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-center p-8">Loading companies...</p>
            ) : error ? (
              <p className="text-center p-8 text-red-500">Error: {error}</p>
            ) : (
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3">Company Name</th>
                    <th className="px-6 py-3">Admin Email</th>
                    <th className="px-6 py-3">Package</th>
                    <th className="px-6 py-3">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr
                      key={company.id}
                      onClick={() => setViewingCompany(company)}
                      className="bg-white border-b hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                        <Image
                          src={`https://ui-avatars.com/api/?name=${company.adminName.replace(' ', '+')}&background=random`}
                          alt={company.adminName}
                          width={32}
                          height={32}
                          className="rounded-full"
                          unoptimized={true}
                        />
                        {company.companyName}
                      </td>
                      <td className="px-6 py-4">{company.adminEmail}</td>
                      <td className="px-6 py-4">{company.package}</td>
                      <td
                        className={`px-6 py-4 ${
                          company.remaining.includes('Expired') || company.remaining.includes('4 days')
                            ? 'text-red-500 font-semibold'
                            : ''
                        }`}
                      >
                        {company.remaining}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchCompanies()}
      />
      <CompanyEmployeesModal
        isOpen={!!viewingCompany}
        onClose={() => setViewingCompany(null)}
        company={viewingCompany}
        onSuccess={() => fetchCompanies()}
      />
    </div>
  );
};

export default SuperDashboard;
