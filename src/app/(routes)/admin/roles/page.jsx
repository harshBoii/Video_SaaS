import AdminSide from '@/app/components/admin/AdminSide';
import RolePermissionBoard from '@/app/components/admin/RolePermissionBoard';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <RolePermissionBoard />
      </div>
    </div>
  );
}