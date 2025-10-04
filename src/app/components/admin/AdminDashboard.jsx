'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiUserCheck, FiX, FiSearch, FiClock } from 'react-icons/fi';
import DashboardCharts from './DashboardCharts';
import Image from 'next/image';

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

  // ✅ 1. Fetch Logged-in Admin
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data);
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

  if (loading)
    return <p className="p-10 text-center text-gray-500">Loading dashboard...</p>;

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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-gray-200 rounded-2xl p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Employees</h3>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {employees.length === 0 ? (
            <p className="text-center p-8 text-gray-500">No employees found.</p>
          ) : (
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Employee Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <motion.tr
                    key={emp.id}
                    whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                    transition={{ type: "spring", stiffness: 150 }}
                    className="border-b"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                      <Image
                        src={`https://ui-avatars.com/api/?name=${emp.firstName}+${emp.lastName}&background=random`}
                        alt={emp.firstName}
                        width={32}
                        height={32}
                        className="rounded-full"
                        unoptimized
                      />
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-6 py-4">{emp.email}</td>
                    <td className="px-6 py-4">{emp.role?.name || '—'}</td>
                    <td className="px-6 py-4">{emp.department?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : emp.status === 'INACTIVE'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
