import AdminSide from '@/app/components/admin/AdminSide';


export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        {/* <SuperDashboard /> */}
      </div>
    </div>
  );
}