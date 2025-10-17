import React from 'react';
import { 
  Calendar, 
  Users, 
  GitBranch, 
  Clock, 
  Target,
  TrendingUp 
} from 'lucide-react';

export default function CampaignOverview({ campaign, onRefresh }) {
  return (
    <div className="space-y-6">
      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Campaign Details */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Campaign Details
          </h3>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Company</span>
              <span className="text-sm font-medium text-gray-900">
                {campaign.company.name}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Campaign Admin</span>
              <span className="text-sm font-medium text-gray-900">
                {campaign.admin.fullName}
              </span>
            </div>
            {campaign.team && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Assigned Team</span>
                <span className="text-sm font-medium text-gray-900">
                  {campaign.team.name}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="text-sm font-medium text-gray-900">
                {new Date(campaign.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {campaign.stats.totalAssignments}
                </p>
                <p className="text-sm text-gray-600">Team Members</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {campaign.stats.totalFlows}
                </p>
                <p className="text-sm text-gray-600">Active Workflows</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {campaign.stats.totalSchedules}
                </p>
                <p className="text-sm text-gray-600">Schedule Entries</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  New team member added
                </p>
                <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
