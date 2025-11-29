//app/(routes)/employee/notification/page.jsx
import EmployeeSide from '@/app/components/employees/EmployeeSide';
import CommentNotifications from '@/app/components/notifications/CommentNotifications';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <EmployeeSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CommentNotifications/>
      </div>
    </div>
  );
}