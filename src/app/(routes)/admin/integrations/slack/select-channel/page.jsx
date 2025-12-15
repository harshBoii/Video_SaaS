'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SelectChannelPage() {
  const router = useRouter();
  const [companyId, setCompanyId] = useState(''); // Get from auth
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include JWT cookie
      });

      if (!response.ok) {
        throw new Error('Not authenticated');
      }

      const data = await response.json();
      
      if (data.success && data.employee) {
        setCompanyId(data.employee.companyId);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Optionally redirect to login
      // window.location.href = '/login';
    }
  };

  fetchUser();
}, []);
  useEffect(()=>{
    if (companyId){
    setLoading(false)
    fetchChannels()
  }
  },[companyId])
  const fetchChannels = async () => {
    try {
      const response = await fetch(`/api/messages/integrations/slack/channels?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setChannels(data.channels);
        setSelectedChannel(data.currentChannelId || '');
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      alert('Failed to fetch channels. Please try reconnecting Slack.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedChannel) {
      alert('Please select a channel');
      return;
    }

    setSaving(true);

    try {
      const channel = channels.find(c => c.id === selectedChannel);
      
      const response = await fetch('/api/messages/integrations/slack/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          channelId: channel.id,
          channelName: channel.name,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/admin/integrations?success=slack_connected');
      } else {
        alert('Failed to save channel: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving channel:', error);
      alert('Failed to save channel');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center">Loading channels...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Select Slack Channel</h1>
        <p className="text-gray-600 mb-6">
          Choose where you want to receive notifications from our app
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Channel
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a channel --</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.displayName}
                {!channel.isMember && ' (Bot needs to be invited)'}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-gray-500">
            💡 Tip: If you don't see your channel, make sure it's not archived
          </p>
        </div>

        {selectedChannel && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If the bot is not a member of this channel, 
              you'll need to invite it by typing <code className="bg-blue-100 px-1 rounded">/invite @YourBot</code> in the channel.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!selectedChannel || saving}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Complete Setup'}
          </button>
          <button
            onClick={() => router.push('/admin/integrations')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
