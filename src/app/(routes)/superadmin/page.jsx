import SuperSide from '@/app/components/superadmin/SuperSide';
import SuperHead from '@/app/components/superadmin/SuperHead';
import SuperDashboard from '@/app/components/superadmin/SuperDashboard';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <SuperSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <SuperHead user={{ name: 'Super Admin' }} />
        <SuperDashboard />
      </div>
    </div>
  );
}