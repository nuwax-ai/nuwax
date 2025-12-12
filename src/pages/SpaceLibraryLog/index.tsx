import WorkspaceLayout from '@/components/WorkspaceLayout';
import SpaceLog from '@/pages/SpaceLibraryLog/SpaceLog';

const SpaceLibraryLog = () => {
  return (
    <WorkspaceLayout title="日志查询" hideScroll={true}>
      <SpaceLog />
    </WorkspaceLayout>
  );
};

export default SpaceLibraryLog;
