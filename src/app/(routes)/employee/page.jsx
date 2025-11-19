import EmployeeSide from '@/app/components/employees/EmployeeSide';


export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <EmployeeSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      </div>
    </div>
  );
}