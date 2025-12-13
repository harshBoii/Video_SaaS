import EmployeeSide from '@/app/components/employees/EmployeeSide';
import EmployeeCampaignsPage from '@/app/components/employees/EmployeesCampaign';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <EmployeeSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <EmployeeCampaignsPage/>
      </div>
    </div>
  );
}