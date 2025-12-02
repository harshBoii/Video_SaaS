import SoloSide from '@/app/components/solo/SoloSide';
import CommentNotifications from '@/app/components/notifications/CommentNotifications';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <SoloSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CommentNotifications />
      </div>
    </div>
  );
}