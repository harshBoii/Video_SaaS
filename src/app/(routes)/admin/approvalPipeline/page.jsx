import AdminSide from '@/app/components/admin/AdminSide';
import FlowchainBuilder from '@/app/components/admin/ApprovalFlow';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <AdminSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* <SuperHead user={{ name: 'Super Admin' }} /> */}
        <FlowchainBuilder />
      </div>
    </div>
  );
}