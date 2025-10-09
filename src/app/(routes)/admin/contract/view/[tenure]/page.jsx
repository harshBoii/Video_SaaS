import AdminSide from '@/app/components/admin/AdminSide';
import AgencyContractViewer from '@/app/components/admin/AgencyContractViewer';
export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <AgencyContractViewer />
      </div>
    </div>
  );
}