import { dict } from '@/services/i18nRuntime';
import {
  CaretRightOutlined,
  LockOutlined,
  PoweroffOutlined,
  RedoOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PreviewChromeActionsProps {
  /** 当前环境的应用预览地址 */
  previewUrl?: string;
  /** 地址栏回车后跳转预览 iframe */
  onNavigatePreview?: (url: string) => void;
  /** 刷新应用预览 iframe */
  onRefreshPreview?: () => void;
  /** 启动当前环境预览服务 */
  onStartPreviewRuntime?: () => void;
  /** 重启当前环境预览服务 */
  onRestartPreviewRuntime?: () => void;
  /** 停止当前环境预览服务 */
  onStopPreviewRuntime?: () => void;
  /** 启动 / 重启进行中 */
  previewRuntimeBusy?: boolean;
  /** 服务是否已启动 */
  previewRuntimeRunning?: boolean;
  /** 停止进行中 */
  previewRuntimeStopping?: boolean;
  /** 预览容器是否已就绪 */
  previewRuntimeReady?: boolean;
  /** 开发环境进行中任务锁定启动 / 重启 */
  previewDevActionLocked?: boolean;
}

/**
 * 应用预览工具条：启动 / 重启 / 停止 + 地址栏。
 * 从文件树预览标签栏抽出，供独立预览视图复用，行为不变。
 *
 * @param props 预览运行时与地址栏参数
 * @returns 预览工具条
 */
const PreviewChromeActions: React.FC<PreviewChromeActionsProps> = ({
  previewUrl,
  onNavigatePreview,
  onRefreshPreview,
  onStartPreviewRuntime,
  onRestartPreviewRuntime,
  onStopPreviewRuntime,
  previewRuntimeBusy = false,
  previewRuntimeRunning = false,
  previewRuntimeStopping = false,
  previewRuntimeReady = true,
  previewDevActionLocked = false,
}) => {
  const [addressDraft, setAddressDraft] = useState(previewUrl || '');
  const [addressFocused, setAddressFocused] = useState(false);

  useEffect(() => {
    if (!addressFocused) {
      setAddressDraft(previewUrl || '');
    }
  }, [previewUrl, addressFocused]);

  const handleAddressKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      onNavigatePreview?.(addressDraft);
      event.currentTarget.blur();
    },
    [addressDraft, onNavigatePreview],
  );

  return (
    <>
      {onStartPreviewRuntime && (
        <div className={cx(styles['preview-runtime-actions'])}>
          <Tooltip
            title={
              previewDevActionLocked
                ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                : dict('PC.Pages.AppDevPro.startService')
            }
          >
            <span className={cx(styles['preview-runtime-btn-wrap'])}>
              <button
                type="button"
                className={cx(styles['preview-runtime-btn'])}
                aria-label={
                  previewDevActionLocked
                    ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                    : dict('PC.Pages.AppDevPro.startService')
                }
                disabled={
                  !previewRuntimeReady ||
                  previewDevActionLocked ||
                  previewRuntimeBusy ||
                  previewRuntimeRunning
                }
                onClick={onStartPreviewRuntime}
              >
                <CaretRightOutlined />
              </button>
            </span>
          </Tooltip>
          <Tooltip
            title={
              previewDevActionLocked
                ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                : dict('PC.Pages.AppDevPro.restartService')
            }
          >
            <span className={cx(styles['preview-runtime-btn-wrap'])}>
              <button
                type="button"
                className={cx(styles['preview-runtime-btn'])}
                aria-label={
                  previewDevActionLocked
                    ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                    : dict('PC.Pages.AppDevPro.restartService')
                }
                disabled={
                  !previewRuntimeReady ||
                  previewDevActionLocked ||
                  previewRuntimeBusy ||
                  previewRuntimeStopping
                }
                onClick={onRestartPreviewRuntime}
              >
                <RedoOutlined />
              </button>
            </span>
          </Tooltip>
          <Tooltip title={dict('PC.Pages.AppDevPro.stopService')}>
            <button
              type="button"
              className={cx(
                styles['preview-runtime-btn'],
                styles['preview-runtime-btn-stop'],
              )}
              aria-label={dict('PC.Pages.AppDevPro.stopService')}
              disabled={previewRuntimeStopping}
              onClick={onStopPreviewRuntime}
            >
              <PoweroffOutlined />
            </button>
          </Tooltip>
        </div>
      )}

      {previewUrl !== undefined && (
        <Tooltip
          title={
            addressDraft
              ? dict('PC.Pages.AppDevPro.previewJumpHint', addressDraft)
              : ''
          }
          open={addressFocused && !!addressDraft}
          placement="bottomLeft"
          arrow={false}
          classNames={{ root: 'preview-address-jump-tooltip' }}
          getPopupContainer={() => document.body}
        >
          <div className={cx(styles['preview-address-bar'])}>
            <LockOutlined className={cx(styles['preview-address-lock'])} />
            <span className={cx(styles['preview-address-input-wrap'])}>
              <input
                className={cx(styles['preview-address-input'], {
                  [styles['preview-address-input-empty']]: !addressDraft,
                })}
                value={addressDraft}
                placeholder={dict('PC.Pages.AppDevPro.appPreviewEmpty')}
                disabled={!previewUrl}
                spellCheck={false}
                autoComplete="off"
                aria-label={dict('PC.Pages.AppDevPro.appPreview')}
                onFocus={() => setAddressFocused(true)}
                onBlur={() => setAddressFocused(false)}
                onChange={(event) => setAddressDraft(event.target.value)}
                onKeyDown={handleAddressKeyDown}
              />
            </span>
            <Tooltip
              title={dict('PC.Pages.AppDevEditorHeaderRight.refreshPreview')}
            >
              <span className={cx(styles['preview-address-refresh-wrap'])}>
                <button
                  type="button"
                  className={cx(styles['preview-address-refresh'])}
                  aria-label={dict(
                    'PC.Pages.AppDevEditorHeaderRight.refreshPreview',
                  )}
                  disabled={!previewUrl}
                  onClick={onRefreshPreview}
                >
                  <ReloadOutlined />
                </button>
              </span>
            </Tooltip>
          </div>
        </Tooltip>
      )}
    </>
  );
};

export default PreviewChromeActions;
