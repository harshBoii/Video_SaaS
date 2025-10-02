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
      }
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
        // This API call will return data for ALL companies because the user is a Super Admin
        const response = await fetch('/api/superadmin/charts-dashboard');
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

  // Prepare data for each chart from the API response
  const verificationChartData = {
    labels: ['Verified Employees', 'Pending Employees'],
    datasets: [{
      data: [chartData.verificationStats?.verified, chartData.verificationStats?.unverified],
      backgroundColor: ['#3b82f6', '#93c5fd'], 
      borderColor: ['black', 'white'],
      borderWidth: 1,
    }],
  };

  const campaignChartData = {
    labels: chartData.campaignMembers.map(c => c.name),
    datasets: [{
      label: 'Members',
      data: chartData.campaignMembers.map(c => c.members),
      backgroundColor: '#60a5fa',
      borderColor: '#2563eb',
      borderWidth: 1,
    }],
  };
  
  const companySizeChartData = {
    labels: chartData.companySizes.map(c => c.name),
    datasets: [{
      label: 'Employees',
      data: chartData.companySizes.map(c => c.employees),
      backgroundColor: '#3b82f6',
      borderColor: '#93c5fd',
      borderWidth: 1,
    }],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[30vh]">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Doughnut options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'Overall Verification Status'}}}} data={verificationChartData} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'Top Campaigns by Members'}}}} data={campaignChartData} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <Bar options={{...chartOptions, plugins: {...chartOptions.plugins, title: {...chartOptions.plugins.title, text: 'Top Companies by Employee Size'}}}} data={companySizeChartData} />
      </div>
    </div>
  );
};

export default DashboardCharts;
