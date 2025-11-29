'use client';
import { useState, useEffect } from 'react';
import { 
  BarChart3, Eye, Clock, CheckCircle, TrendingUp, 
  Smartphone, MapPin, Calendar, Activity, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to format time
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// Helper to format duration
const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subtitle, color = "blue" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <p className={`text-3xl font-bold text-${color}-600 mb-1`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
      <div className={`p-3 bg-${color}-100 rounded-lg`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </motion.div>
);

// Heatmap Bar Component
const HeatmapBar = ({ segments, duration, onSeek }) => {
  const maxViews = Math.max(...segments.map(s => s.views), 1);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Engagement Heatmap
      </h4>
      <div className="flex items-end gap-1 h-32">
        {segments.map((seg, idx) => {
          const height = (seg.views / maxViews) * 100;
          const intensity = Math.min(seg.views / (maxViews * 0.7), 1);
          
          return (
            <motion.button
              key={idx}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onSeek && onSeek(seg.start)}
              className="flex-1 rounded-t transition-all hover:opacity-80 relative group"
              style={{
                background: `linear-gradient(to top, 
                  rgb(${255 - intensity * 100}, ${100 + intensity * 155}, 255),
                  rgb(${200 - intensity * 100}, ${150 + intensity * 105}, 255)
                )`
              }}
              title={`${formatTime(seg.start)} - ${formatTime(seg.end)}: ${seg.views} views`}
            >
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                {formatTime(seg.start)} - {seg.views}x
              </div>
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>0:00</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

// Device Chart Component
const DeviceChart = ({ devices }) => {
  const total = devices.reduce((sum, d) => sum + d._count.id, 0);
  
  const deviceIcons = {
    mobile: '📱',
    desktop: '💻',
    tablet: '📟'
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Smartphone className="w-4 h-4" />
        Device Breakdown
      </h4>
      {devices.map((device, idx) => {
        const percentage = total > 0 ? (device._count.id / total * 100).toFixed(1) : 0;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span>{deviceIcons[device.deviceType] || '📱'}</span>
                <span className="font-medium capitalize">{device.deviceType || 'Unknown'}</span>
              </span>
              <span className="text-gray-600 font-semibold">{percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ delay: idx * 0.1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Location List Component
const LocationList = ({ locations }) => (
  <div className="space-y-3">
    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
      <MapPin className="w-4 h-4" />
      Top Locations
    </h4>
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {locations.map((loc, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
        >
          <span className="text-sm text-gray-700">{loc.location}</span>
          <span className="text-sm font-semibold text-blue-600">{loc._count.id}</span>
        </motion.div>
      ))}
    </div>
  </div>
);

// Main Component
export default function VideoAnalytics({ videoId, onSeek }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [videoId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/analytics`, {
        credentials: 'include'
      });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const { stats, segments, devices, locations } = data;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-blue-600" />
            Video Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">{data.video.title}</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <TrendingUp className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Total Views"
          value={stats.totalViews.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={CheckCircle}
          label="Completion Rate"
          value={`${stats.completionRate}%`}
          subtitle={`${stats.completedViews} completed`}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Avg Watch Time"
          value={formatDuration(stats.avgWatchTime)}
          subtitle={`${stats.avgCompletion.toFixed(1)}% avg completion`}
          color="purple"
        />
        <StatCard
          icon={Activity}
          label="Total Watch Time"
          value={formatDuration(stats.totalWatchTime)}
          color="orange"
        />
      </div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
      >
        <HeatmapBar 
          segments={segments} 
          duration={data.video.duration} 
          onSeek={onSeek}
        />
      </motion.div>

      {/* Device & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <DeviceChart devices={devices} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
        >
          <LocationList locations={locations} />
        </motion.div>
      </div>
    </div>
  );
}
