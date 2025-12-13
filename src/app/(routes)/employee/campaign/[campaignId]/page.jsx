import EmployeeSide from '@/app/components/employees/EmployeeSide';
import CampaignPage from '@/app/components/campaign/CampaignPage';

export default async function Companies({params}) {
  const {campaignId : id} = await params

  return (
    <div style={{ display: 'flex' }}>
      <EmployeeSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <CampaignPage campaignId={id}/>
      </div>
    </div>
  );
}