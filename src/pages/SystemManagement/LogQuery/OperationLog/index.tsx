import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import LogProTable from './LogProTable';

const OperationLog: React.FC = () => {
  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SystemLog.operationLog')}
      hideScroll={true}
    >
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default OperationLog;
