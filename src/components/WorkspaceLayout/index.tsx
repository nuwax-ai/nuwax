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
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children = null,
  leftSlot,
  centerSlot,
  rightSlot,
  title,
  hideScroll = false,
}) => {
  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div
        className={cx('flex', 'content-between')}
        style={{ marginBottom: 5 }}
      >
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>
          <h3 className={cx(styles.title)}>{title || ''}</h3>
          {/* 左侧区域插槽 */}
          {leftSlot}
        </div>
        <div>
          {/* 中间区域插槽 */}
          {centerSlot}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
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
    </div>
  );
};

export default WorkspaceLayout;
