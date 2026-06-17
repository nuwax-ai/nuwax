import WorkspaceLayout from '@/components/WorkspaceLayout';
import { dict } from '@/services/i18nRuntime';
import { history } from 'umi';
import LogProTable from './LogProTable';

const ApiKeyLogs: React.FC = () => {
  const handleBack = () => {
    history.push('/more-page/api-key');
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.MorePage.ApiKeyLogs.pageTitle')}
      hideScroll={false}
      back={true}
      onBack={handleBack}
    >
      <LogProTable />
    </WorkspaceLayout>
  );
};
export default ApiKeyLogs;
