import WorkspaceLayout from '@/components/WorkspaceLayout';
import LogProTable from './LogProTable';

const OperationLog: React.FC = () => {
  return (
    <WorkspaceLayout title="操作日志" hideScroll={true}>
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default OperationLog;
