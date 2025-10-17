import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User
} from 'lucide-react';
import { showSuccess, showError, showConfirm, showLoading, closeSwal } from '@/app/lib/swal';

export default function CampaignCalendar({ campaignId }) {
  const [schedules, setSchedules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, list
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [campaignId]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/schedules`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to load schedules');

      const result = await response.json();
      setSchedules(result.data);
    } catch (error) {
      console.error('Error loading schedules:', error);
      await showError('Load Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {['month', 'week', 'list'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Schedule
            </button>
          </div>
        </div>

        {/* Role Legend */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Roles:</span>
          {schedules?.groupedByRole.map((group) => (
            <div key={group.role.id} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: group.schedules[0]?.color || '#3b82f6' }}
              />
              <span className="text-sm text-gray-600">{group.role.name}</span>
              <span className="text-xs text-gray-400">({group.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule View */}
      {viewMode === 'list' ? (
        <ScheduleListView schedules={schedules} />
      ) : (
        <ScheduleCalendarView 
          schedules={schedules} 
          currentDate={currentDate}
          viewMode={viewMode}
        />
      )}

      {/* Add Schedule Modal */}
      {showAddModal && (
        <AddScheduleModal
          campaignId={campaignId}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadSchedules}
        />
      )}
    </div>
  );
}

// List View Component
function ScheduleListView({ schedules }) {
  return (
    <div className="space-y-3">
      {schedules?.schedules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No schedules created yet</p>
        </div>
      ) : (
        schedules?.schedules.map((schedule) => (
          <motion.div
            key={schedule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border-l-4 p-4 border-gray-200 hover:shadow-md transition-shadow"
            style={{ borderLeftColor: schedule.color || '#3b82f6' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {schedule.title || 'Untitled Schedule'}
                  </h4>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {schedule.role.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {schedule.creator && (
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>By {schedule.creator.fullName}</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="text-gray-400 hover:text-red-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

// Calendar Grid View Component
function ScheduleCalendarView({ schedules, currentDate, viewMode }) {
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
        {dayNames.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Empty days */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square border border-gray-100 bg-gray-50" />
        ))}

        {/* Days with schedules */}
        {days.map((day) => {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const daySchedules = schedules?.schedules.filter(schedule => {
            const start = new Date(schedule.startDate);
            const end = new Date(schedule.endDate);
            return date >= start && date <= end;
          }) || [];

          return (
            <div
              key={day}
              className="aspect-square border border-gray-100 p-2 hover:bg-gray-50 transition-colors overflow-hidden"
            >
              <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
              <div className="space-y-1">
                {daySchedules.slice(0, 2).map((schedule) => (
                  <div
                    key={schedule.id}
                    className="text-xs px-1.5 py-0.5 rounded truncate text-white font-medium"
                    style={{ backgroundColor: schedule.color || '#3b82f6' }}
                    title={`${schedule.role.name}: ${schedule.title || 'Untitled'}`}
                  >
                    {schedule.role.name}
                  </div>
                ))}
                {daySchedules.length > 2 && (
                  <div className="text-xs text-gray-500 px-1.5">
                    +{daySchedules.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Add Schedule Modal
function AddScheduleModal({ campaignId, onClose, onSuccess }) {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    roleId: '',
    title: '',
    startDate: '',
    endDate: '',
    color: '#3b82f6',
  });
  const [loading, setLoading] = useState(false);

  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', 
    '#10b981', '#06b6d4', '#6366f1', '#ef4444'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    showLoading('Creating schedule...', 'Please wait');

    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/schedules`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      closeSwal();
      await showSuccess('Schedule Created!', 'Calendar entry added successfully');
      onSuccess();
      onClose();
    } catch (error) {
      closeSwal();
      await showError('Creation Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Add Schedule Entry</h2>
          <p className="text-sm text-gray-600 mt-1">Create a new calendar entry for a role</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role...</option>
              {/* Map roles here */}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Q4 Campaign Sprint"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-blue-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
