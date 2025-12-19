import { useWorkflowVersion } from '@/contexts/WorkflowVersionContext';
import { useModel } from 'umi';

export const useWorkflowModel = () => {
  const { version } = useWorkflowVersion();
  const workflowModel = useModel('workflow');
  const workflowV3Model = useModel('workflowV3');

  // 根据上下文版本返回对应的模型
  return version === 'v3' ? workflowV3Model : workflowModel;
};
