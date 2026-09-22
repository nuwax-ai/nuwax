import SvgIcon from '@/components/base/SvgIcon';
import PageContainerHeader from '@/components/PageContainerHeader';
import { QuestionCircleOutlined } from '@ant-design/icons';
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
      <PageContainerHeader
        className={cx(styles['header-area'])}
        titlePrefix={
          titleLeftSlot ||
          (back && (
            <SvgIcon
              name="icons-nav-backward"
              className={cx(styles['icon-back'], 'cursor-pointer')}
              onClick={handleBack}
            />
          ))
        }
        title={
          <>
            {title || ''}
            {tips && (
              <Tooltip title={tips}>
                <QuestionCircleOutlined className={cx(styles['tips-icon'])} />
              </Tooltip>
            )}
          </>
        }
        titleExtra={leftSlot}
        middle={centerSlot}
        actions={rightSlot}
        style={{
          // 顶部退让由最外层 page-container 统一处理（沉浸态 marginTop），
          // 页面级不叠加，避免双重下移。右侧不再特判让位：头部已在壳顶行
          // （28px 窗控带）之下的内容区，贴右对齐（禅道 2429）。
          padding: headerPadding,
        }}
      />
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
