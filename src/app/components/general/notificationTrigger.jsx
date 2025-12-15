// components/NotificationTrigger.jsx
'use client';

export function NotificationTrigger({ companyId, notificationType, data, label = 'Send Notification' }) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          notificationType,
          data,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Notification sent to ${result.channels.length} channel(s)`);
      } else {
        alert('Failed to send notification');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error sending notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={sending}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
    >
      {sending ? 'Sending...' : label}
    </button>
  );
}

// Usage example:
// <NotificationTrigger
//   companyId={companyId}
//   notificationType="campaign_completed"
//   data={{ campaignName: 'Summer Sale', status: 'Completed' }}
//   label="Notify Campaign Complete"
// />
