'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiUserCheck, FiX, FiSearch, FiClock } from 'react-icons/fi';
import DashboardCharts from './DashboardCharts';
import Image from 'next/image';
import EmployeesPage from './EmployeeTable';
import CampaignTable from './CampaignsTable';

const StatCard = ({ icon, value, label }) => (
  <motion.div
    whileHover={{ scale: 1.05, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
    transition={{ type: "spring", stiffness: 200 }}
    className="bg-white border border-purple-200 rounded-2xl p-6 flex items-center gap-4"
  >
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white w-12 h-12 rounded-xl flex items-center justify-center">
      {icon}
    </div>
    <div>
      <span className="text-3xl font-bold text-gray-800">{value ?? 0}</span>
      <span className="block text-sm text-gray-500">{label}</span>
    </div>
  </motion.div>
);

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [companyId,setCompanyId]=useState('');


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        console.log("data is :",data)
        setUser(data.employee);
        setCompanyId(data.employee.companyId);

      } catch (err) {
        console.error(err);
        setError('Failed to load user info');
      }
    };
    fetchUser();
  }, []);

  // ✅ 2. Fetch Stats and Employees
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, empRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats'),
          fetch('/api/admin/employees'),
        ]);

        if (!statsRes.ok || !empRes.ok) throw new Error('Failed to load dashboard data');

        const statsData = await statsRes.json();
        const empData = await empRes.json();

        setStats(statsData);
        setEmployees(empData);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ 3. Search Employees (Debounced)
  useEffect(() => {
    const handler = setTimeout(async () => {
      const res = await fetch(`/api/admin/employees?name=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error)
    return <p className="p-10 text-center text-red-500">Error: {error}</p>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="p-6 font-sans bg-gray-50 min-h-screen"
    >
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white p-10 rounded-3xl shadow-xl mb-10 flex justify-between items-center relative overflow-hidden"
      >
        {/* Glow shapes */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>

        {/* Greeting */}
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight">
            Welcome back,&nbsp;
            <span className="text-indigo-300">{user?.firstName || 'Admin'}</span>
          </h2>
          <p className="mt-3 text-lg opacity-90">
            {user?.company?.name ? (
              <>Managing <span className="font-semibold">{user.company.name}</span> employees</>
            ) : (
              <>Manage your team efficiently and track company insights.</>
            )}
          </p>
        </div>

        {/* Clock */}
        <div className="bg-white/10 p-3 rounded-2xl border border-white/20 text-center shadow-md">
          <FiClock className="mx-auto text-3xl mb-1" />
          <p className="text-sm opacity-90">Local Time</p>
          <p className="text-xl font-semibold">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard icon={<FiUsers size={24} />} value={stats.totalEmployees} label="Total Employees" />
        <StatCard icon={<FiUserCheck size={24} />} value={stats.activeEmployees} label="Active Employees" />
        <StatCard icon={<FiX size={24} />} value={stats.inactiveEmployees} label="Inactive Employees" />
        <StatCard icon={<FiX size={24} />} value={stats.suspendedEmployees} label="Suspended Employees" />
      </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow p-6 mb-10"
      >
        <h3 className="text-xl font-bold text-gray-700 mb-4">Company Analytics</h3>
        <DashboardCharts />
      </motion.div>

      {/* Employees Table */}
     <CampaignTable
     companyId={user.companyId}
     />
    </motion.div>
  );
}
