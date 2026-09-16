/**
 * 客户端版本徽标（logo 旁，仅桌面宿主）
 * @description 常显宿主客户端版本号；有新版本 → 主题色下载图标：hover 弹
 * 「目标版本 + 发布日期 + 更新日志」卡片，点击直接进入下载流程；
 * 下载中 → 进度圆环（卡片内同步进度）；下载完成 → 点击重启安装；失败（已有目标版本）→ 点击重试。
 * 浏览器 / 旧宿主（无 updater 桥）整体不渲染。
 */
import { dict } from '@/services/i18nRuntime';
import {
  download as triggerDownload,
  install as triggerInstall,
  isAvailable,
  start,
  subscribe,
} from './clientUpdateService';
import ReleaseNotesContent from './ReleaseNotesContent';
import { DownloadOutlined, InfoCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Popover, Progress } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

/** macOS/Linux 无真实 download-progress 时的本地模拟：0→90% 匀速爬升（与壳顶栏同口径） */
const SIM_CAP_PERCENT = 90;
const SIM_DURATION_MS = 45_000;
const SIM_TICK_MS = 500;

function useSimulatedPercent(active: boolean): number {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    if (!active) {
      setPercent(0);
      return;
    }
    setPercent(0);
    const startedAt = Date.now();
    const id = setInterval(() => {
      const ratio = Math.min(1, (Date.now() - startedAt) / SIM_DURATION_MS);
      setPercent(Math.round(ratio * SIM_CAP_PERCENT));
    }, SIM_TICK_MS);
    return () => clearInterval(id);
  }, [active]);
  return percent;
}

const ClientVersionBadge: React.FC = () => {
  const [state, setState] = useState<ClientUpdateState | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    start();
    const unsubscribe = subscribe((next) => {
      if (mounted.current) setState(next);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  const realPercent =
    typeof state?.progress?.percent === 'number' && Number.isFinite(state.progress.percent)
      ? state.progress.percent
      : undefined;
  const simPercent = useSimulatedPercent(
    state?.status === 'downloading' && realPercent === undefined,
  );

  if (!isAvailable() || !state?.hostVersion) return null;

  const status = state.status;
  const versionText = `v${state.hostVersion}`;
  const targetVersion = state.version ? `v${state.version}` : '';

  const handleDownload = async () => {
    setBusy(true);
    await triggerDownload();
    if (mounted.current) setBusy(false);
  };

  const handleInstall = async () => {
    setBusy(true);
    await triggerInstall();
    if (mounted.current) setBusy(false);
  };

  // 常态：仅版本号小字（无更新任务时不占额外交互位、无悬浮卡）
  if (status === 'idle' || status === 'checking' || status === 'not-available') {
    return (
      <span
        aria-label={dict('PC.Components.ClientUpdate.versionLabel')}
        style={{ fontSize: 11, lineHeight: 1, color: 'var(--xagi-color-text-tertiary)', userSelect: 'none', marginLeft: 10 }}
      >
        {versionText}
      </span>
    );
  }

  const isError = status === 'error';
  const isDownloading = status === 'downloading';
  const percent = isDownloading ? realPercent ?? simPercent : undefined;

  const cardTitle = isError
    ? dict('PC.Components.ClientUpdate.errorTitle')
    : [targetVersion, dict('PC.Components.ClientUpdate.releaseNotesTitle')].filter(Boolean).join(' ');

  const hoverCard = (
    <div style={{ width: 340 }}>
      {state.releaseDate && (
        <div style={{ fontSize: 12, color: 'var(--xagi-color-text-tertiary)', marginBottom: 8 }}>
          {dict('PC.Components.ClientUpdate.releaseDate')}: {state.releaseDate.slice(0, 10)}
        </div>
      )}
      {state.releaseNotes && (
        <div
          style={{
            maxHeight: 280,
            overflow: 'auto',
            overflowWrap: 'anywhere',
            background: 'var(--xagi-color-bg-layout)',
            padding: '10px 12px',
            borderRadius: 8,
          }}
        >
          <ReleaseNotesContent notes={state.releaseNotes} />
        </div>
      )}
      {state.error && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--xagi-color-error)' }}>
          {state.error}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        {status === 'downloaded' ? (
          <Button type="primary" loading={busy} onClick={handleInstall}>
            {dict('PC.Components.ClientUpdate.install')}
          </Button>
        ) : isDownloading ? (
          <Button disabled>
            {dict('PC.Components.ClientUpdate.downloading')}
            {percent !== undefined ? ` ${Math.round(percent)}%` : ''}
          </Button>
        ) : (
          <Button type="primary" loading={busy} onClick={handleDownload}>
            {isError
              ? dict('PC.Components.ClientUpdate.retry')
              : dict('PC.Components.ClientUpdate.download')}
          </Button>
        )}
      </div>
    </div>
  );

  // 点击徽标 = 直接触发对应动作（下载/重试/重启安装）；下载中不重复触发，进度看悬浮卡
  const handleBadgeClick = () => {
    if (status === 'downloaded') {
      handleInstall();
    } else if (!isDownloading) {
      handleDownload();
    }
  };

  const ariaLabel = isDownloading
    ? dict('PC.Components.ClientUpdate.downloading')
    : status === 'downloaded'
      ? dict('PC.Components.ClientUpdate.install')
      : isError
        ? dict('PC.Components.ClientUpdate.errorTitle')
        : dict('PC.Components.ClientUpdate.download');

  return (
    <Popover
      placement="bottomLeft"
      open={popoverOpen}
      onOpenChange={setPopoverOpen}
      trigger="hover"
      mouseEnterDelay={0.3}
      arrow={false}
      destroyOnHidden
      title={cardTitle}
      content={hoverCard}
    >
      <span
        role="button"
        aria-label={ariaLabel}
        onClick={handleBadgeClick}
        style={
          isDownloading
            ? { display: 'inline-flex', alignItems: 'center', marginLeft: 10, cursor: 'pointer' }
            : {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 24,
                padding: '0 8px',
                borderRadius: 12,
                marginLeft: 10,
                background: isError ? 'var(--xagi-color-error-bg)' : 'var(--xagi-color-primary-bg)',
                color: isError ? 'var(--xagi-color-error)' : 'var(--xagi-color-primary)',
                fontSize: 15,
                cursor: 'pointer',
              }
        }
      >
        {isDownloading ? (
          <Progress type="circle" percent={percent} size={22} strokeWidth={10} showInfo={false} />
        ) : status === 'downloaded' ? (
          <RocketOutlined />
        ) : isError ? (
          <InfoCircleOutlined />
        ) : (
          <DownloadOutlined />
        )}
      </span>
    </Popover>
  );
};

export default ClientVersionBadge;
