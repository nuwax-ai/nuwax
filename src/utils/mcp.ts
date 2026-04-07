import { dict } from '@/services/i18nRuntime';
import { DeployStatusEnum } from '@/types/enums/mcp';

// 获取mcp部署状态
export const getMcpDeployStatus = (status?: DeployStatusEnum) => {
  switch (status) {
    case DeployStatusEnum.Initialization:
      return dict('PC.Utils.Mcp.pendingDeploy');
    case DeployStatusEnum.Deploying:
      return dict('PC.Utils.Mcp.deploying');
    case DeployStatusEnum.Deployed:
      return dict('PC.Utils.Mcp.deployed');
    case DeployStatusEnum.DeployFailed:
      return dict('PC.Utils.Mcp.deployFailed');
    case DeployStatusEnum.Stopped:
      return dict('PC.Utils.Mcp.stopped');
    default:
      return '';
  }
};
