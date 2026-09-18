import { dict } from '@/services/i18nRuntime';
import { Button } from 'antd';
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
}

/**
 * 应用预览：重启 / 停止按钮，常驻在更多操作右侧。
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
}) => {
  if (!onRestartPreviewRuntime && !onStopPreviewRuntime) {
    return null;
  }

  const podActionBlocked =
    previewPodEnsuring || previewContainerFailed || !previewEnvPodReady;

  const restartDisabled =
    podActionBlocked ||
    !previewRuntimeReady ||
    previewDevActionLocked ||
    previewRuntimeBusy ||
    previewRuntimeStopping;

  const stopDisabled = podActionBlocked || previewRuntimeStopping;

  return (
    <div className={cx(styles['preview-runtime-text-actions'])}>
      {onRestartPreviewRuntime ? (
        <Button
          size="small"
          disabled={restartDisabled}
          loading={previewRuntimeRestarting}
          onClick={onRestartPreviewRuntime}
        >
          {dict('PC.Pages.AppDevPro.restartService')}
        </Button>
      ) : null}
      {onStopPreviewRuntime ? (
        <Button
          size="small"
          danger
          disabled={stopDisabled}
          loading={previewRuntimeStopping}
          onClick={onStopPreviewRuntime}
        >
          {dict('PC.Pages.AppDevPro.stopService')}
        </Button>
      ) : null}
    </div>
  );
};

export default PreviewRuntimeButtons;
