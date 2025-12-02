'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User2, Mail, Building2, Briefcase, Phone, Pencil, 
  Camera, Calendar, Award, TrendingUp, CheckCircle2,
  X, Save, Loader2, MapPin, Shield, Bell, Lock,
  CreditCard, Package, Heart, Clock, Settings, LogOut,
  ChevronRight, Video, MessageSquare, Folder
} from 'lucide-react';
import { showSuccess, showError } from '@/app/lib/swal';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    title: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/individual/profile', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setEditData({
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          phone: data.profile.phone || '',
          bio: data.profile.bio || '',
          title: data.profile.title || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editData.firstName.trim() || !editData.lastName.trim()) {
      await showError('Validation Error', 'First name and last name are required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/individual/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      const data = await res.json();
      
      if (data.success) {
        setProfile(data.profile);
        setIsEditing(false);
        await showSuccess('Profile Updated', 'Your profile has been updated successfully');
      } else {
        await showError('Update Failed', data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Save error:', err);
      await showError('Error', 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      bio: profile.bio || '',
      title: profile.title || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <User2 className="w-16 h-16 mx-auto mb-3 text-slate-300" />
          <p className="text-lg font-medium text-slate-600">Could not load profile</p>
        </div>
      </div>
    );
  }

  const assignCount = profile._count?.campaignAssignments ?? 0;
  const videoCount = profile._count?.uploadedVideos ?? 0;
  const commentCount = profile._count?.videoComments ?? 0;

  const menuItems = [
    { id: 'account', label: 'Account Settings', icon: User2 },
    { id: 'security', label: 'Security & Privacy', icon: Shield },
    { id: 'activity', label: 'Recent Activity', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Your Account</h1>
            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden sticky top-6">
              {/* Profile Summary in Sidebar */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.firstName}+${profile.lastName}&backgroundColor=3b82f6`}
                      alt={profile.firstName}
                      className="w-16 h-16 rounded-full border-2 border-white shadow-md object-cover"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {profile.firstName} {profile.lastName}
                    </h3>
                    <p className="text-xs text-slate-600 truncate">{profile.email}</p>
                    {profile.role && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        {profile.role.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <nav className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeSection === item.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm flex-1 text-left">{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </button>
                ))}
              </nav>

              {/* Stats Summary */}
              <div className="p-4 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-slate-900">{assignCount}</div>
                    <div className="text-xs text-slate-500">Projects</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">{videoCount}</div>
                    <div className="text-xs text-slate-500">Videos</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-slate-900">{commentCount}</div>
                    <div className="text-xs text-slate-500">Comments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9">
            <AnimatePresence mode="wait">
              {activeSection === 'account' && (
                <AccountSection 
                  profile={profile}
                  editData={editData}
                  setEditData={setEditData}
                  isEditing={isEditing}
                  setIsEditing={setIsEditing}
                  isSaving={isSaving}
                  handleSave={handleSave}
                  handleCancel={handleCancel}
                  assignCount={assignCount}
                  videoCount={videoCount}
                  commentCount={commentCount}
                />
              )}
              {activeSection === 'security' && <SecuritySection />}
              {activeSection === 'activity' && <ActivitySection />}
              {activeSection === 'notifications' && <NotificationsSection />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountSection({ profile, editData, setEditData, isEditing, setIsEditing, isSaving, handleSave, handleCancel, assignCount, videoCount, commentCount }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-blue-100 via-indigo-300 to-purple-300">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
        </div>
        
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 relative z-10">
            <div className="relative group">
              <img
                src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.firstName}+${profile.lastName}&backgroundColor=ffffff`}
                alt={profile.firstName}
                className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl object-cover bg-white"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="flex-1 sm:mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {profile.firstName} {profile.lastName}
                  </h2>
                  <p className="text-slate-600 mt-1">{profile.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {profile.role && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                        <Briefcase className="w-3.5 h-3.5" />
                        {profile.role.name}
                      </span>
                    )}
                    {profile.title && (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                        <Award className="w-3.5 h-3.5" />
                        {profile.title}
                      </span>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isEditing ? (
                    <motion.div
                      key="editing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex gap-2"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="not-editing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Profile
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCardAmazon icon={Folder} label="Total Projects" value={assignCount} color="blue" />
        <StatCardAmazon icon={Video} label="Videos Uploaded" value={videoCount} color="indigo" />
        <StatCardAmazon icon={MessageSquare} label="Comments Made" value={commentCount} color="purple" />
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User2 className="w-5 h-5 text-blue-600" />
          Personal Information
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              label="First Name"
              value={isEditing ? editData.firstName : profile.firstName}
              isEditing={isEditing}
              onChange={(val) => setEditData({ ...editData, firstName: val })}
            />
            <FormField 
              label="Last Name"
              value={isEditing ? editData.lastName : profile.lastName}
              isEditing={isEditing}
              onChange={(val) => setEditData({ ...editData, lastName: val })}
            />
          </div>

          <FormField 
            label="Email Address"
            value={profile.email}
            isEditing={false}
            icon={Mail}
            readOnly
          />

          <FormField 
            label="Phone Number"
            value={isEditing ? editData.phone : profile.phone || 'Not provided'}
            isEditing={isEditing}
            onChange={(val) => setEditData({ ...editData, phone: val })}
            icon={Phone}
          />

          <FormField 
            label="Job Title"
            value={isEditing ? editData.title : profile.title || 'Not provided'}
            isEditing={isEditing}
            onChange={(val) => setEditData({ ...editData, title: val })}
            icon={Briefcase}
          />
        </div>
      </div>

      {/* About / Bio */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">About</h3>
        
        {isEditing ? (
          <div>
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Tell us about yourself..."
            />
            <div className="text-right text-xs text-slate-400 mt-1">
              {editData.bio.length} / 500 characters
            </div>
          </div>
        ) : (
          <p className="text-slate-600 leading-relaxed">
            {profile.bio || (
              <span className="text-slate-400 italic">No biography added yet.</span>
            )}
          </p>
        )}
      </div>

      {/* Company Info */}
      {profile.company && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company
          </h3>
          
          <div className="flex items-center gap-4">
            {profile.company.logoUrl ? (
              <img 
                src={profile.company.logoUrl} 
                alt="Company" 
                className="w-16 h-16 rounded-lg object-cover border border-slate-200" 
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-2xl font-bold">
                {profile.company.name.charAt(0)}
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-900 text-lg">{profile.company.name}</p>
              <p className="text-sm text-slate-500">Organization</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SecuritySection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Security & Privacy
        </h3>

        <div className="space-y-4">
          <SecurityItem 
            icon={Lock}
            title="Password"
            description="Last changed 30 days ago"
            action="Change Password"
          />
          <SecurityItem 
            icon={Shield}
            title="Two-Factor Authentication"
            description="Not enabled"
            action="Enable"
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActivitySection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-600" />
        Recent Activity
      </h3>
      <div className="text-center py-12 text-slate-400">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Activity timeline coming soon...</p>
      </div>
    </motion.div>
  );
}

function NotificationsSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl border border-slate-200 p-6"
    >
      <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5 text-blue-600" />
        Notification Preferences
      </h3>
      <div className="text-center py-12 text-slate-400">
        <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Notification settings coming soon...</p>
      </div>
    </motion.div>
  );
}

function StatCardAmazon({ icon: Icon, label, value, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    indigo: 'from-indigo-500 to-indigo-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</div>
          <div className="text-sm text-slate-600">{label}</div>
        </div>
      </div>
    </motion.div>
  );
}

function FormField({ label, value, isEditing, onChange, icon: Icon, readOnly }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      {isEditing && !readOnly ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900">
          {Icon && <Icon className="w-4 h-4 text-slate-400" />}
          <span>{value}</span>
        </div>
      )}
    </div>
  );
}

function SecurityItem({ icon: Icon, title, description, action }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="font-medium text-slate-900">{title}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
        {action}
      </button>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-4">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 bg-slate-200 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-9 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="h-32 bg-slate-200 rounded mb-6" />
              <div className="space-y-3">
                <div className="h-6 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
