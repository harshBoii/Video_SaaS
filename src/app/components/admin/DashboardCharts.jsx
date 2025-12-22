'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Users, Briefcase, Activity } from 'lucide-react';

// Premium color palette
const COLORS = {
  primary: '#8b5cf6',
  secondary: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#a855f7',
  blue: '#3b82f6',
  gradient: ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-xl bg-white/95 dark:bg-black/95 border border-white/20 dark:border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs text-muted-foreground">
            <span className="font-medium" style={{ color: entry.color }}>
              {entry.name}:
            </span>{' '}
            {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardCharts() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/dashboard/charts');
        if (!response.ok) throw new Error('Failed to load chart data.');
        const data = await response.json();
        setChartData(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl animate-pulse" />
          <div className="h-48 backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-xl">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!chartData) return null;

  // Transform data for Recharts
  const statusData = [
    { name: 'Active', value: chartData.employeeStatus.active, color: COLORS.success },
    { name: 'Inactive', value: chartData.employeeStatus.inactive, color: COLORS.warning },
    { name: 'Suspended', value: chartData.employeeStatus.suspended, color: COLORS.danger },
  ];

  const departmentData = chartData.departmentEmployees.map((d) => ({
    name: d.name,
    employees: d.count,
  }));

  const roleData = chartData.topRoles.map((r) => ({
    name: r.name,
    count: r.employees,
  }));

  // Mock activity data for area chart (you can replace with real data)
  const activityData = [
    { month: 'Jan', active: 45, inactive: 12 },
    { month: 'Feb', active: 52, inactive: 10 },
    { month: 'Mar', active: 61, inactive: 8 },
    { month: 'Apr', active: 58, inactive: 15 },
    { month: 'May', active: 70, inactive: 7 },
    { month: 'Jun', active: 75, inactive: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Main Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">Employee Activity Trend</h3>
            <p className="text-sm text-muted-foreground">Monthly active vs inactive employees</p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">Last 6 Months</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={activityData}>
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInactive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(255,255,255,0.5)" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.5)" 
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="active"
              stroke={COLORS.primary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorActive)"
            />
            <Area
              type="monotone"
              dataKey="inactive"
              stroke={COLORS.warning}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorInactive)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom Row - Status Pie & Department Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Status Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Employee Status</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.name}: <span className="font-semibold text-foreground">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Department Distribution Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-black/10 dark:border-white/10 rounded-2xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Employees by Department</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.5)" 
                style={{ fontSize: '11px' }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                style={{ fontSize: '12px' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="employees" radius={[8, 8, 0, 0]}>
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.gradient[index % COLORS.gradient.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
