import { dict } from '@/services/i18nRuntime';
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
    title: dict('PC.Components.McpStatus.pendingDeploy'),
  },
  [DeployStatusEnum.Deploying]: {
    icon: <ICON_DEPLOYING />,
    title: dict('PC.Components.McpStatus.deploying'),
  },
  [DeployStatusEnum.Deployed]: {
    icon: <ICON_DEPLOYED />,
    title: dict('PC.Components.McpStatus.deployed'),
  },
  [DeployStatusEnum.DeployFailed]: {
    icon: <ICON_DEPLOY_FAILED />,
    title: dict('PC.Components.McpStatus.deployFailed'),
  },
  [DeployStatusEnum.Stopped]: {
    icon: <ICON_STOPPED />,
    title: dict('PC.Components.McpStatus.stopped'),
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
      <span className={cx(styles.title)}>{title}</span>
    </div>
  );
};

export default McpStatus;
