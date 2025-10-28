import { McpInstallTypeEnum } from '@/types/enums/mcp';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface McpInstallTypeProps {
  installType: McpInstallTypeEnum;
}

// MCP安装方式
const McpInstallTypeMap: Record<
  string,
  { title: string; styleClassName: string }
> = {
  [McpInstallTypeEnum.NPX]: {
    title: 'npx',
    styleClassName: styles.npx,
  },
  [McpInstallTypeEnum.UVX]: {
    title: 'uvx',
    styleClassName: styles.uvx,
  },
  [McpInstallTypeEnum.SSE]: {
    title: 'sse',
    styleClassName: styles.sse,
  },
  [McpInstallTypeEnum.COMPONENT]: {
    title: '组件库',
    styleClassName: styles.component,
  },
};

/**
 * MCP安装类型组件
 * @param installType - MCP安装类型
 * @returns
 */
const McpInstallType: React.FC<McpInstallTypeProps> = ({ installType }) => {
  const { title, styleClassName } = McpInstallTypeMap[installType];

  return (
    <span className={cx('flex items-center', styles.container, styleClassName)}>
      {title}
    </span>
  );
};

export default McpInstallType;
