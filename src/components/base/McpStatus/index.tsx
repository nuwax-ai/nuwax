import { DeployStatusEnum } from '@/types/enums/mcp';
import classNames from 'classnames';
import {
  ICON_DEPLOY_FAILED,
  ICON_DEPLOYED,
  ICON_DEPLOYING,
  ICON_INITIALIZATION,
  ICON_STOPPED,
} from './images.constants';
import styles from './index.less';

const cx = classNames.bind(styles);

interface McpStatusProps {
  status: DeployStatusEnum;
}

// MCP部署状态映射
const McpStatusMap: Record<string, { icon: React.ReactNode; title: string }> = {
  [DeployStatusEnum.Initialization]: {
    icon: <ICON_INITIALIZATION />,
    title: '待部署',
  },
  [DeployStatusEnum.Deploying]: {
    icon: <ICON_DEPLOYING />,
    title: '部署中',
  },
  [DeployStatusEnum.Deployed]: {
    icon: <ICON_DEPLOYED />,
    title: '已部署',
  },
  [DeployStatusEnum.DeployFailed]: {
    icon: <ICON_DEPLOY_FAILED />,
    title: '部署失败',
  },
  [DeployStatusEnum.Stopped]: {
    icon: <ICON_STOPPED />,
    title: '已停止',
  },
};

/**
 * MCP部署状态组件
 * @param status - MCP部署状态
 * @returns
 */
const McpStatus: React.FC<McpStatusProps> = ({ status }) => {
  const { icon, title } = McpStatusMap[status];

  return (
    <div className={cx('flex items-center', styles.container)}>
      {icon}
      <span>{title}</span>
    </div>
  );
};

export default McpStatus;
