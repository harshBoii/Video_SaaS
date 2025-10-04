'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getElementAtEvent } from 'react-chartjs-2';
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

// Register necessary Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: { family: "'DM Sans', sans-serif" },
      },
    },
    title: {
      display: true,
      font: { size: 16, weight: 'bold', family: "'DM Sans', sans-serif" },
      padding: { top: 10, bottom: 20 },
    },
  },
};

export default function DashboardCharts() {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const statusChartRef = useRef();
  const departmentChartRef = useRef();
  const roleChartRef = useRef();

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[30vh]">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[30vh] flex items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!chartData) return null;

  // --- Data for charts ---
  const employeeStatusData = {
    labels: ['Active', 'Inactive', 'Suspended'],
    datasets: [
      {
        label: 'Employees',
        data: [
          chartData.employeeStatus.active,
          chartData.employeeStatus.inactive,
          chartData.employeeStatus.suspended,
        ],
        backgroundColor: ['#22c55e', '#facc15', '#ef4444'],
        borderColor: ['#15803d', '#ca8a04', '#b91c1c'],
        borderWidth: 2,
      },
    ],
  };

  const departmentData = {
    labels: chartData.departmentEmployees.map((d) => d.name),
    datasets: [
      {
        label: 'Employees',
        data: chartData.departmentEmployees.map((d) => d.count),
        backgroundColor: '#6366f1',
        borderColor: '#4f46e5',
        borderWidth: 2,
      },
    ],
  };

  const topRolesData = {
    labels: chartData.topRoles.map((r) => r.name),
    datasets: [
      {
        label: 'Employees',
        data: chartData.topRoles.map((r) => r.employees),
        backgroundColor: '#a855f7',
        borderColor: '#9333ea',
        borderWidth: 2,
      },
    ],
  };

  // --- Optional click handlers (interactive dashboards) ---
  const handleDepartmentClick = (event) => {
    const elements = getElementAtEvent(departmentChartRef.current, event);
    if (elements.length) {
      const index = elements[0].index;
      const department = chartData.departmentEmployees[index];
      alert(`You clicked on department: ${department.name}`);
    }
  };

  const handleRoleClick = (event) => {
    const elements = getElementAtEvent(roleChartRef.current, event);
    if (elements.length) {
      const index = elements[0].index;
      const role = chartData.topRoles[index];
      alert(`You clicked on role: ${role.name}`);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[30vh]">
      {/* Employee Status */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Doughnut
          ref={statusChartRef}
          options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Employee Status Breakdown',
              },
            },
          }}
          data={employeeStatusData}
        />
      </div>

      {/* Department Distribution */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar
          ref={departmentChartRef}
          onClick={handleDepartmentClick}
          options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Employees per Department',
              },
            },
          }}
          data={departmentData}
        />
      </div>

      {/* Top Roles */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar
          ref={roleChartRef}
          onClick={handleRoleClick}
          options={{
            ...chartOptions,
            plugins: {
              ...chartOptions.plugins,
              title: {
                ...chartOptions.plugins.title,
                text: 'Top Roles by Employee Count',
              },
            },
          }}
          data={topRolesData}
        />
      </div>
    </div>
  );
}
