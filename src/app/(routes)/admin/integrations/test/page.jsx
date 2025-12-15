'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TestNotificationPage() {
  const searchParams = useSearchParams();
  const channelFromUrl = searchParams.get('channel') || 'all';
  
  const [companyId, setCompanyId] = useState(''); // Get from auth
  const [channel, setChannel] = useState(channelFromUrl);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

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

  const handleTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      const response = await fetch('/api/messages/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          channel,
        }),
      });

      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Test error:', error);
      setResults({
        success: false,
        error: error.message,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Test Notifications</h1>
        <p className="text-gray-600 mb-6">
          Send a test notification to verify your integrations are working
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Channel to Test
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Channels</option>
            <option value="email">Email Only</option>
            <option value="slack">Slack Only</option>
            <option value="teams">Teams Only</option>
          </select>
        </div>

        <button
          onClick={handleTest}
          disabled={testing}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {testing ? 'Sending Test...' : 'Send Test Notification'}
        </button>

        {/* Results */}
        {results && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Test Results:</h3>
            
            <div className={`p-4 rounded-lg border ${
              results.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className="font-medium mb-2">
                {results.success ? '✓ Test Successful' : '✗ Test Failed'}
              </p>
              <p className="text-sm text-gray-700">{results.message}</p>
            </div>

            {results.results && (
              <div className="mt-4 space-y-3">
                {Object.entries(results.results).map(([channelName, result]) => (
                  <div
                    key={channelName}
                    className={`p-4 rounded border ${
                      result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium capitalize">{channelName}</p>
                        <p className="text-sm text-gray-600">
                          {result.success ? result.message : result.error}
                        </p>
                        {result.channelName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Channel: {result.channelName}
                          </p>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        result.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {result.success ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sample Notification Info */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Test Notification Content:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Type: <code>campaign_completed</code></p>
            <p>Campaign Name: Test Campaign</p>
            <p>Videos Processed: 5</p>
            <p>Total Views: 250</p>
          </div>
        </div>
      </div>
    </div>
  );
}
