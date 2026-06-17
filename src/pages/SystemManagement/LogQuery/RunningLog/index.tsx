import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import LogProTable from './LogProTable';

const RunningLog: React.FC = () => {
  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SystemLog.runningLog')}
      hideScroll={false}
    >
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default RunningLog;
