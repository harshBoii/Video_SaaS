import AdminSide from '@/app/components/admin/AdminSide';
import RoleHierarchyManager from '@/app/components/admin/RoleHierarchyManager';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <RoleHierarchyManager />
      </div>
    </div>
  );
}