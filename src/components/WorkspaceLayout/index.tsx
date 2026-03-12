import { QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface WorkspaceLayoutProps {
  children?: React.ReactNode | null;
  leftSlot?: React.ReactNode;
  centerSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  title?: string;
  // 是否隐藏滚动条
  hideScroll?: boolean;
  extraContent?: React.ReactNode;
  // Padding 配置
  headerPadding?: React.CSSProperties['padding'];
  contentPadding?: React.CSSProperties['padding'];
  extraPadding?: React.CSSProperties['padding'];
  // 提示信息
  tips?: string | React.ReactNode;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children = null,
  leftSlot,
  centerSlot,
  rightSlot,
  title,
  hideScroll = false,
  extraContent,
  headerPadding,
  contentPadding,
  extraPadding,
  tips,
}) => {
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div
        className={cx(styles['header-area'])}
        style={{ padding: headerPadding }}
      >
        <div
          className={cx(styles['header-left'], 'flex', 'items-center', 'gap-2')}
        >
          <h3 className={cx(styles.title)}>{title || ''}</h3>
          {tips && (
            <Tooltip title={tips}>
              <QuestionCircleOutlined className={cx(styles['tips-icon'])} />
            </Tooltip>
          )}
          {/* 左侧区域插槽 */}
          {leftSlot}
        </div>
        <div>
          {/* 中间区域插槽 */}
          {centerSlot}
        </div>
        <div className={cx(styles['header-right'])}>
          {/* 右侧区域插槽 */}
          {rightSlot}
        </div>
      </div>
      <div
        className={cx(
          styles.content,
          hideScroll ? 'scroll-container-hide' : '',
        )}
        style={{ padding: contentPadding }}
      >
        {children}
      </div>
      {extraContent && (
        <div
          className={cx(styles['extra-container'])}
          style={{ padding: extraPadding }}
        >
          {extraContent}
        </div>
      )}
    </div>
  );
};

export default WorkspaceLayout;
