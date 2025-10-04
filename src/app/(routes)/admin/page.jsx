import AdminSide from '@/app/components/admin/AdminSide';
import AdminDashboard from '@/app/components/admin/AdminDashboard';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <AdminDashboard />
      </div>
    </div>
  );
}