import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { EditAgentShowType } from '@/types/enums/space';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PreviewAndDebugHeaderProps {
  isShowPreview?: boolean;
  onShowPreview?: () => void;
  onPressDebug: () => void;
  // 打开文件面板
  onOpenFilePanel?: () => void;
  // 是否显示文件面板
  showFilePanel?: boolean;
}

/**
 * 预览与调试头部组件
 */
const PreviewAndDebugHeader: React.FC<PreviewAndDebugHeaderProps> = ({
  onPressDebug,
  onShowPreview,
  isShowPreview,
  onOpenFilePanel,
  showFilePanel,
}) => {
  const { showType } = useModel('conversationInfo');

  return (
    <header
      className={cx(
        'flex',
        'content-between',
        'items-center',
        styles.container,
      )}
    >
      <h3>预览与调试</h3>
      <div className={cx('flex', 'items-center')}>
        {(showType === EditAgentShowType.Version_History ||
          showType === EditAgentShowType.Show_Stand ||
          showType === EditAgentShowType.Hide) && (
          <TooltipIcon
            title="调试"
            className={cx(styles['icon-box'])}
            icon={<SvgIcon name="icons-common-debug" />}
            onClick={onPressDebug}
          />
        )}

        {/*打开预览页面*/}
        {isShowPreview && (
          <TooltipIcon
            title="打开预览页面"
            className={cx(styles['icon-box'])}
            icon={<SvgIcon name="icons-nav-ecosystem" />}
            onClick={onShowPreview}
          />
        )}

        {/*文件预览切换按钮*/}
        {showFilePanel && (
          <TooltipIcon
            title="文件预览或打开智能体电脑"
            className={cx(styles['icon-box'])}
            icon={<SvgIcon name="icons-nav-components" />}
            onClick={onOpenFilePanel}
          />
        )}
      </div>
    </header>
  );
};

export default PreviewAndDebugHeader;
