import { LeftOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface WorkspaceLayoutProps {
  children?: React.ReactNode | null;
  leftSlot?: React.ReactNode;
  titleLeftSlot?: React.ReactNode;
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
  // 是否显示返回按钮
  back?: boolean;
  // 返回按钮点击事件
  onBack?: () => void;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  children = null,
  leftSlot,
  titleLeftSlot,
  centerSlot,
  rightSlot,
  title,
  hideScroll = false,
  extraContent,
  headerPadding,
  contentPadding,
  extraPadding,
  tips,
  back = false,
  onBack,
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    history.back();
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div
        className={cx(styles['header-area'])}
        style={{ padding: headerPadding }}
      >
        <div
          className={cx(styles['header-left'], 'flex', 'items-center', 'gap-2')}
        >
          {/* 标题左侧插槽 (若存在则不显示内置返回按钮) */}
          {titleLeftSlot ||
            (back && (
              <LeftOutlined
                className={cx(styles['icon-back'], 'cursor-pointer')}
                onClick={handleBack}
              />
            ))}
          <h3 className={cx(styles.title)}>{title || ''}</h3>
          {tips && (
            <Tooltip title={tips}>
              <QuestionCircleOutlined className={cx(styles['tips-icon'])} />
            </Tooltip>
          )}
          {/* 标题右侧插槽 */}
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
