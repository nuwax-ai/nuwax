import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import { LoadingOutlined, PoweroffOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PreviewRuntimeButtonsProps {
  /** 重启当前环境预览服务 */
  onRestartPreviewRuntime?: () => void;
  /** 停止当前环境预览服务 */
  onStopPreviewRuntime?: () => void;
  /** 启动 / 重启进行中（用于禁用按钮） */
  previewRuntimeBusy?: boolean;
  /** 重启进行中（仅重启按钮 loading） */
  previewRuntimeRestarting?: boolean;
  /** 停止进行中 */
  previewRuntimeStopping?: boolean;
  /** 预览容器是否已就绪 */
  previewRuntimeReady?: boolean;
  /** 当前 Header 环境 pod ensure 已成功（running） */
  previewEnvPodReady?: boolean;
  /** 当前环境 pod ensure 进行中 */
  previewPodEnsuring?: boolean;
  /** 当前环境容器 ensure 失败，重启 / 停止均不可点 */
  previewContainerFailed?: boolean;
  /** 开发环境进行中任务锁定启动 / 重启 */
  previewDevActionLocked?: boolean;
  /** 会话仍在生成项目，重启不可点 */
  previewConversationActive?: boolean;
  /** 仍有待回复的确认卡，重启不可点 */
  previewWaitingConfirmation?: boolean;
  /**
   * 查询出的文件树非空且根目录含 workspace.manifest.toml。
   * 为 false 时重启 / 停止均不可点。
   */
  previewWorkspaceManifestReady?: boolean;
  /** 展示形态：Header 图标 / 预览区文字按钮 */
  variant?: 'icon' | 'text';
  /** 图标按钮外层类名（Header panel-btn） */
  iconButtonClassName?: string;
}

/**
 * 应用预览：重启 / 停止控制。
 *
 * @param props 预览运行时参数
 * @returns 重启与停止按钮组
 */
const PreviewRuntimeButtons: React.FC<PreviewRuntimeButtonsProps> = ({
  onRestartPreviewRuntime,
  onStopPreviewRuntime,
  previewRuntimeBusy = false,
  previewRuntimeRestarting = false,
  previewRuntimeStopping = false,
  previewRuntimeReady = true,
  previewEnvPodReady = true,
  previewPodEnsuring = false,
  previewContainerFailed = false,
  previewDevActionLocked = false,
  previewConversationActive = false,
  previewWaitingConfirmation = false,
  previewWorkspaceManifestReady = true,
  variant = 'text',
  iconButtonClassName,
}) => {
  if (!onRestartPreviewRuntime && !onStopPreviewRuntime) {
    return null;
  }

  const podActionBlocked =
    previewPodEnsuring || previewContainerFailed || !previewEnvPodReady;
  /** 文件树为空，或根目录没有 workspace.manifest.toml */
  const workspaceManifestBlocked = !previewWorkspaceManifestReady;

  const restartDisabled =
    workspaceManifestBlocked ||
    podActionBlocked ||
    !previewRuntimeReady ||
    previewDevActionLocked ||
    previewRuntimeBusy ||
    previewRuntimeStopping;

  const stopDisabled =
    workspaceManifestBlocked ||
    podActionBlocked ||
    previewRuntimeStopping ||
    previewRuntimeRestarting;

  /**
   * 禁用时悬停说明当前为什么不能点。
   * 优先说正在进行的重启 / 停止 / 启动，再说明容器、会话和项目文件。
   *
   * @param action 要提示的按钮
   * @returns 禁用原因；可点击时返回空，沿用「重启应用 / 停止应用」
   */
  const pickBlockedHint = (action: 'restart' | 'stop'): string => {
    const disabled = action === 'restart' ? restartDisabled : stopDisabled;
    if (!disabled) {
      return '';
    }
    if (action === 'restart' && previewRuntimeRestarting) {
      return dict('PC.Pages.AppDevPro.previewRestarting');
    }
    if (previewRuntimeStopping) {
      return dict('PC.Pages.AppDevPro.previewStopping');
    }
    if (previewRuntimeRestarting) {
      return dict('PC.Pages.AppDevPro.previewRestarting');
    }
    if (action === 'restart' && previewRuntimeBusy) {
      return dict('PC.Pages.AppDevPro.startingService');
    }
    if (action === 'restart' && previewDevActionLocked) {
      return dict('PC.Pages.AppDevPro.devActionBusyHint');
    }
    if (previewContainerFailed) {
      return dict('PC.Pages.AppDevPro.containerStartFailed');
    }
    if (previewPodEnsuring) {
      return dict('PC.Pages.AppDevPro.containerStarting');
    }
    if (action === 'restart' && previewWaitingConfirmation) {
      return dict('PC.Pages.AppDevPro.confirmingDevelopment');
    }
    if (action === 'restart' && previewConversationActive) {
      return dict('PC.Pages.AppDevPro.previewGeneratingHint');
    }
    if (!previewEnvPodReady) {
      return dict('PC.Pages.AppDevPro.previewPreparing');
    }
    if (workspaceManifestBlocked) {
      return dict('PC.Pages.AppDevPro.previewNoProjectFiles');
    }
    return dict('PC.Pages.AppDevPro.previewPreparing');
  };

  const restartLabel = dict('PC.Pages.AppDevPro.restartService');
  const stopLabel = dict('PC.Pages.AppDevPro.stopService');
  const restartTitle = pickBlockedHint('restart') || restartLabel;
  const stopTitle = pickBlockedHint('stop') || stopLabel;

  if (variant === 'icon') {
    return (
      <div className={cx(styles['preview-runtime-icon-actions'])}>
        {onRestartPreviewRuntime ? (
          <TooltipIcon
            title={restartTitle}
            ariaLabel={restartTitle}
            className={classNames(iconButtonClassName, {
              [styles['preview-runtime-icon-disabled']]: restartDisabled,
            })}
            icon={
              previewRuntimeRestarting ? (
                <LoadingOutlined style={{ fontSize: 16 }} />
              ) : (
                <SvgIcon name="icons-common-restart" style={{ fontSize: 16 }} />
              )
            }
            onClick={restartDisabled ? undefined : onRestartPreviewRuntime}
          />
        ) : null}
        {onStopPreviewRuntime ? (
          <TooltipIcon
            title={stopTitle}
            ariaLabel={stopTitle}
            className={classNames(iconButtonClassName, {
              [styles['preview-runtime-icon-disabled']]: stopDisabled,
            })}
            icon={
              previewRuntimeStopping ? (
                <LoadingOutlined style={{ fontSize: 16 }} />
              ) : (
                <PoweroffOutlined style={{ fontSize: 16 }} />
              )
            }
            onClick={stopDisabled ? undefined : onStopPreviewRuntime}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={cx(styles['preview-runtime-text-actions'])}>
      {onRestartPreviewRuntime ? (
        <Tooltip title={restartTitle}>
          <span className={cx(styles['preview-runtime-text-trigger'])}>
            <Button
              size="small"
              disabled={restartDisabled}
              loading={previewRuntimeRestarting}
              onClick={onRestartPreviewRuntime}
            >
              {restartLabel}
            </Button>
          </span>
        </Tooltip>
      ) : null}
      {onStopPreviewRuntime ? (
        <Tooltip title={stopTitle}>
          <span className={cx(styles['preview-runtime-text-trigger'])}>
            <Button
              size="small"
              danger
              disabled={stopDisabled}
              loading={previewRuntimeStopping}
              onClick={onStopPreviewRuntime}
            >
              {stopLabel}
            </Button>
          </span>
        </Tooltip>
      ) : null}
    </div>
  );
};

export default PreviewRuntimeButtons;
