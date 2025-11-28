import AdminSide from '@/app/components/admin/AdminSide';
// import RoleHierarchyManager from '@/app/components/admin/RoleHierarchyManager';
import CloudHierarchy from '@/app/components/hierarchy/cloudHierarchy';
import EmployeeHierarchyManager from '@/app/components/hierarchy/employeeHierarchy';
export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        {/* <CloudHierarchy />  */}
        <EmployeeHierarchyManager/>
      </div>
    </div>
  );
}