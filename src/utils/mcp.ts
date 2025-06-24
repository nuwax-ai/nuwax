import { DeployStatusEnum } from '@/types/enums/mcp';

// 获取mcp部署状态
export const getMcpDeployStatus = (status?: DeployStatusEnum) => {
  switch (status) {
    case DeployStatusEnum.Initialization:
      return '待部署';
    case DeployStatusEnum.Deploying:
      return '部署中';
    case DeployStatusEnum.Deployed:
      return '已部署';
    case DeployStatusEnum.DeployFailed:
      return '部署失败';
    case DeployStatusEnum.Stopped:
      return '已停止';
    default:
      return '';
  }
};
