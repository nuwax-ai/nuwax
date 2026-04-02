import WorkspaceLayout from '@/components/WorkspaceLayout';
import { history } from 'umi';
import LogProTable from './LogProTable';

const ApiKeyLogs: React.FC = () => {
  const handleBack = () => {
    history.push('/more-page/api-key');
  };

  return (
    <WorkspaceLayout
      title="API 调用日志"
      hideScroll={false}
      back={true}
      onBack={handleBack}
    >
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default ApiKeyLogs;
