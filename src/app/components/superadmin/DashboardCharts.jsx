'use client';
import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register the necessary components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Common styling options for all charts
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          family: "'DM Sans', sans-serif",
        },
      },
    },
    title: {
      display: true,
      font: {
        size: 16,
        weight: 'bold',
        family: "'DM Sans', sans-serif",
      },
      padding: {
        top: 10,
        bottom: 20,
      },
    },
  },
};

const DashboardCharts = () => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/superadmin/dashboardCharts');
        if (!response.ok) throw new Error('Failed to load chart data.');
        const data = await response.json();
        setChartData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[30vh]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse"></div>
        ))}
      </div>
    );
  }
  
  if (error) return <div className="h-[30vh] flex items-center justify-center"><p className="text-red-500">Error: {error}</p></div>;
  if (!chartData) return null;

  // 1. Employee status (active vs inactive vs suspended)
  const statusChartData = {
    labels: chartData.statusData.map(s => s.status),
    datasets: [{
      data: chartData.statusData.map(s => s.count),
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'], // green, yellow, red
      borderWidth: 1,
    }],
  };

  // 2. Employees per role
  const roleChartData = {
    labels: chartData.roleData.map(r => r.role),
    datasets: [{
      label: 'Employees',
      data: chartData.roleData.map(r => r.count),
      backgroundColor: '#60a5fa',
      borderColor: '#2563eb',
      borderWidth: 1,
    }],
  };

  // 3. Employees per department
  const deptChartData = {
    labels: chartData.deptData.map(d => d.department),
    datasets: [{
      label: 'Employees',
      data: chartData.deptData.map(d => d.count),
      backgroundColor: '#a78bfa',
      borderColor: '#7c3aed',
      borderWidth: 1,
    }],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[30vh]">
      {/* Employee status */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Doughnut
          options={{
            ...chartOptions,
            plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Employee Status' } },
          }}
          data={statusChartData}
        />
      </div>

      {/* Employees per role */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar
          options={{
            ...chartOptions,
            plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Employees per Role' } },
          }}
          data={roleChartData}
        />
      </div>

      {/* Employees per department */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar
          options={{
            ...chartOptions,
            plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Employees per Department' } },
          }}
          data={deptChartData}
        />
      </div>
    </div>
  );
};

export default DashboardCharts;
