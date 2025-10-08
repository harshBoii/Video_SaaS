import AdminSide from '@/app/components/admin/AdminSide';
import AgencyContractGenerator from '@/app/components/admin/AgencyContractGenerator';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <AgencyContractGenerator />
      </div>
    </div>
  );
}