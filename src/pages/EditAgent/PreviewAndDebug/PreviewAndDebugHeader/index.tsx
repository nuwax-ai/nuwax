import { SvgIcon } from '@/components/base';
import ConditionRender from '@/components/ConditionRender';
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
  /** 是否显示智能体电脑 */
  isShowDesktop?: boolean;
  onPressDebug: () => void;
  /** 是否显示文件面板相关图标（仅通用型智能体时显示） */
  showFilePanel?: boolean;
  /** 当前是否已显示文件面板（文件树） */
  isFileTreeVisible?: boolean;
  /** 当前文件视图模式：预览 或 智能体电脑 */
  viewMode?: 'preview' | 'desktop';
  /** 打开 / 切换到 文件预览 视图 */
  onOpenPreviewPanel?: () => void;
  /** 打开 / 切换到 智能体电脑 视图 */
  onOpenDesktopPanel?: () => void;
}

/**
 * 预览与调试头部组件
 */
const PreviewAndDebugHeader: React.FC<PreviewAndDebugHeaderProps> = ({
  onPressDebug,
  onShowPreview,
  isShowPreview,
  isShowDesktop,
  showFilePanel,
  isFileTreeVisible,
  viewMode,
  onOpenPreviewPanel,
  onOpenDesktopPanel,
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

        {/* 文件预览 / 智能体电脑切换按钮 */}
        {showFilePanel && (
          <>
            {/* 文件预览视图 */}
            <TooltipIcon
              title={
                isFileTreeVisible && viewMode === 'preview'
                  ? '关闭文件预览'
                  : '打开文件预览'
              }
              className={cx(styles['icon-box'], {
                [styles['active']]: isFileTreeVisible && viewMode === 'preview',
              })}
              icon={<SvgIcon name="icons-common-file_preview" />}
              onClick={onOpenPreviewPanel}
            />

            {/* 智能体电脑视图 */}
            <ConditionRender condition={isShowDesktop}>
              <TooltipIcon
                title={
                  isFileTreeVisible && viewMode === 'desktop'
                    ? '关闭智能体电脑'
                    : '打开智能体电脑'
                }
                className={cx(styles['icon-box'], {
                  [styles['active']]:
                    isFileTreeVisible && viewMode === 'desktop',
                })}
                icon={<SvgIcon name="icons-nav-computer-star" />}
                onClick={onOpenDesktopPanel}
              />
            </ConditionRender>
          </>
        )}
      </div>
    </header>
  );
};

export default PreviewAndDebugHeader;
