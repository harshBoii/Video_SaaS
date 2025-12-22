'use client';
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiUserCheck, FiX, FiTrendingUp, FiDollarSign, FiActivity, FiAward } from 'react-icons/fi';
import DashboardCharts from './DashboardCharts';
import CampaignTable from './CampaignsTable';

const StatCard = ({ icon, value, label, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            <FiTrendingUp className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value ?? 0}</p>
      </div>
    </motion.div>
  );
};

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
      }finally {
      setLoading(false); 
    }
    };
    fetchUser();
  }, []);


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
  }, [user]);

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

  if (loading || !user ) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error)
    return <p className="p-10 text-center text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen  p-4 md:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-[1600px] mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome back, <span className="text-primary">{user?.firstName || 'Admin'}</span>
            </h1>
            <p className="text-muted-foreground">
              {user?.company?.name ? (
                <>Here's what's happening with <span className="font-semibold">{user.company.name}</span> today</>
              ) : (
                <>Track your team's performance and insights</>
              )}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard 
            icon={<FiUsers className="w-6 h-6 text-white" />} 
            value={stats.totalEmployees} 
            label="Total Employees" 
            trend={7.9}
            color="blue"
          />
          <StatCard 
            icon={<FiUserCheck className="w-6 h-6 text-white" />} 
            value={stats.activeEmployees} 
            label="Active Employees" 
            trend={12.5}
            color="green"
          />
          <StatCard 
            icon={<FiActivity className="w-6 h-6 text-white" />} 
            value={stats.inactiveEmployees} 
            label="Inactive Employees"
            color="orange"
          />
          <StatCard 
            icon={<FiAward className="w-6 h-6 text-white" />} 
            value={stats.suspendedEmployees} 
            label="Suspended"
            color="purple"
          />
        </div>

        {/* Charts Section */}
        {/* <div className="grid grid-cols-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Company Analytics</h3>
            <DashboardCharts />
          </motion.div>

        </div> */}

        {/* Campaigns Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='py-12'
        >
          <CampaignTable companyId={user.companyId} />
        </motion.div>
      </motion.div>
    </div>
  );
}
