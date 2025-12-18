import WorkspaceLayout from '@/components/WorkspaceLayout';
import LogProTable from '@/pages/SpaceLibraryLog/LogProTable';

const SpaceLibraryLog = () => {
  return (
    <WorkspaceLayout title="日志查询" hideScroll={true}>
      <LogProTable />
    </WorkspaceLayout>
  );
};

export default SpaceLibraryLog;
