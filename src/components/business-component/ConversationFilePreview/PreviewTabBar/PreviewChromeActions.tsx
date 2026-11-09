import { dict } from '@/services/i18nRuntime';
import { LockOutlined, ReloadOutlined } from '@ant-design/icons';
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
}

/**
 * 应用预览工具条：地址栏 + 刷新。
 * 重启 / 停止见 Header 右侧图标组最前的 PreviewRuntimeButtons。
 *
 * @param props 预览地址栏参数
 * @returns 预览地址栏
 */
const PreviewChromeActions: React.FC<PreviewChromeActionsProps> = ({
  previewUrl,
  onNavigatePreview,
  onRefreshPreview,
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

  if (previewUrl === undefined) {
    return null;
  }

  return (
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
  );
};

export default PreviewChromeActions;
