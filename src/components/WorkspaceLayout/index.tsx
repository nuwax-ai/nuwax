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
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children = null,
  leftSlot,
  centerSlot,
  rightSlot,
  title,
  hideScroll = false,
  extraContent,
}) => {
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div className={cx(styles['header-area'])}>
        <div className={cx(styles['header-left'])}>
          <h3 className={cx(styles.title)}>{title || ''}</h3>
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
      >
        {children}
      </div>
      {extraContent}
    </div>
  );
};

export default WorkspaceLayout;
