import WorkspaceLayout from '@/components/WorkspaceLayout';
import LogProTable from './LogProTable';

const RunningLog: React.FC = () => {
  return (
    <WorkspaceLayout title="运行日志" hideScroll={false}>
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default RunningLog;
