import WorkspaceLayout from '@/components/WorkspaceLayout';
import LogProTable from './LogProTable';

const ApiKeyLogs: React.FC = () => {
  return (
    <WorkspaceLayout title="Api调用日志" hideScroll={false}>
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default ApiKeyLogs;
