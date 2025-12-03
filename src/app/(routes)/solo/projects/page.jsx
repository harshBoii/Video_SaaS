import SoloSide from '@/app/components/solo/SoloSide';
import ProjectsPage from '@/app/components/solo/ProjectPage';

export default function Companies() {
  return (
    <div style={{ display: 'flex' }}>
      <SoloSide />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <ProjectsPage />
      </div>
    </div>
  );
}