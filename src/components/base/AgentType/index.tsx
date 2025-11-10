import { AgentComponentTypeEnum } from '@/types/enums/agent';
import classNames from 'classnames';
import {
  ICON_AGENT,
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PAGE_APP,
  ICON_PLUGIN,
  ICON_TABLE,
  ICON_WORKFLOW,
} from './images.constants';
import styles from './index.less';

const cx = classNames.bind(styles);

interface AgentTypeProps {
  type: AgentComponentTypeEnum;
  className?: string;
}

// 智能体类型组件映射
const AgentTypeMap: Record<
  string,
  { icon: React.ReactNode; title: string; styleClassName: string }
> = {
  [AgentComponentTypeEnum.Agent]: {
    icon: <ICON_AGENT />,
    title: '智能体',
    styleClassName: styles.agent,
  },
  [AgentComponentTypeEnum.Plugin]: {
    icon: <ICON_PLUGIN />,
    title: '插件',
    styleClassName: styles.plugin,
  },
  [AgentComponentTypeEnum.Workflow]: {
    icon: <ICON_WORKFLOW />,
    title: '工作流',
    styleClassName: styles.workflow,
  },
  [AgentComponentTypeEnum.Knowledge]: {
    icon: <ICON_KNOWLEDGE />,
    title: '知识库',
    styleClassName: styles.knowledge,
  },
  [AgentComponentTypeEnum.Table]: {
    icon: <ICON_TABLE />,
    title: '数据表',
    styleClassName: styles.table,
  },
  [AgentComponentTypeEnum.Model]: {
    icon: <ICON_MODEL />,
    title: '模型',
    styleClassName: styles.model,
  },
  [AgentComponentTypeEnum.Page]: {
    icon: <ICON_PAGE_APP />,
    title: '应用页面',
    styleClassName: styles.page,
  },
};

/**
 * 智能体类型组件
 * @param type - 智能体类型
 * @returns
 */
const AgentType: React.FC<AgentTypeProps> = ({ type, className }) => {
  const { icon, title, styleClassName } = AgentTypeMap[type];

  return (
    <div
      className={cx(
        'flex items-center',
        styles.container,
        styleClassName,
        className,
      )}
    >
      {icon}
      <span>{title}</span>
    </div>
  );
};

export default AgentType;
