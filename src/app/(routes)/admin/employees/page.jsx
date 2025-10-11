import AdminSide from '@/app/components/admin/AdminSide';
import EmployeesPage from '@/app/components/admin/EmployeeTable';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <EmployeesPage />
      </div>
    </div>
  );
}