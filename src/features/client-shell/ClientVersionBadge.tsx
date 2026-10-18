/**
 * 客户端版本徽标（logo 旁，仅桌面宿主）
 * @description 有新版本时显示「新版本就绪」；点击/悬停打开更新日志，由日志内按钮发起操作。
 * Windows 一键宿主从下载入口继续安装，renderer 只消费进度，不追加安装调用；
 * 旧宿主保留先下载、再安装的能力边界。下载中展示局部进度，安装持续 1 秒后展示全屏遮罩：
 * 宿主侧退出前清理链可达 10s+ 才 quitAndInstall，
 * 遮罩保留到进程退出；宿主拒绝/异常（dev 包/MSI）浮出错误。
 * 浏览器 / 旧宿主（无 updater 桥）整体不渲染。
 */
import { dict } from '@/services/i18nRuntime';
import { InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Modal, Popover, Progress, Spin } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  isAvailable,
  start,
  subscribe,
  download as triggerDownload,
  install as triggerInstall,
} from './clientUpdateService';
import ReleaseNotesContent from './ReleaseNotesContent';

/** macOS/Linux 无真实 download-progress 时的本地模拟：0→90% 匀速爬升（与壳顶栏同口径） */
const SIM_CAP_PERCENT = 90;
const SIM_DURATION_MS = 45_000;
const SIM_TICK_MS = 500;
const INSTALL_DIALOG_DELAY_MS = 1_000;

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
  /** 重启安装遮罩：running=已触发宿主安装（清理+退出空窗，可达数十秒）；failed=宿主拒绝/异常 */
  const [installPhase, setInstallPhase] = useState<
    'idle' | 'running' | 'failed'
  >('idle');
  const [installError, setInstallError] = useState<string | undefined>(
    undefined,
  );
  const mounted = useRef(true);
  const actionInFlight = useRef(false);
  const [showInstallProgress, setShowInstallProgress] = useState(false);
  const installationActive =
    installPhase === 'running' || state?.status === 'installing';

  useEffect(() => {
    if (!installationActive) {
      setShowInstallProgress(false);
      return;
    }
    // 下载仍可继续使用页面；安装先用局部状态反馈，避免快速退出前闪现遮罩。
    const timer = setTimeout(
      () => setShowInstallProgress(true),
      INSTALL_DIALOG_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [installationActive]);

  useEffect(() => {
    mounted.current = true;
    start();
    const unsubscribe = subscribe((next) => {
      if (mounted.current) setState(next);
    });
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, []);

  // IPC 已接受任务后，宿主仍可能报告安装启动失败；释放本入口供用户重试。
  useEffect(() => {
    if (state?.status === 'error' && installPhase === 'running') {
      actionInFlight.current = false;
      setBusy(false);
      setInstallError(state.error);
      setInstallPhase('failed');
    }
  }, [state?.status, state?.error, installPhase]);

  const realPercent =
    typeof state?.progress?.percent === 'number' &&
    Number.isFinite(state.progress.percent)
      ? state.progress.percent
      : undefined;
  const simPercent = useSimulatedPercent(
    state?.status === 'downloading' && realPercent === undefined,
  );

  if (!isAvailable() || !state?.hostVersion) return null;

  const status = state.status;
  const versionText = `v${state.hostVersion}`;
  const targetVersion = state.version ? `v${state.version}` : '';
  const oneClickUpdate =
    state.installAfterDownload === true && state.canAutoUpdate !== false;

  const handleDownload = async () => {
    if (
      actionInFlight.current ||
      status === 'downloading' ||
      status === 'installing'
    )
      return;
    actionInFlight.current = true;
    setBusy(true);
    setInstallError(undefined);
    setPopoverOpen(false);
    let handedOff = false;
    try {
      const ok = await triggerDownload();
      if (!mounted.current) return;
      if (oneClickUpdate) {
        handedOff = ok;
        setInstallPhase(ok ? 'running' : 'failed');
      }
    } catch {
      if (mounted.current) {
        setInstallPhase('failed');
        setInstallError(dict('PC.Components.ClientUpdate.errorTitle'));
      }
    } finally {
      if (!handedOff) {
        actionInFlight.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  };

  const handleInstall = async () => {
    if (actionInFlight.current || status === 'installing') return;
    actionInFlight.current = true;
    setBusy(true);
    setInstallError(undefined);
    setPopoverOpen(false);
    // 徽标立即反馈安装状态；清理耗时较长时再显示遮罩。
    setInstallPhase('running');
    let handedOff = false;
    try {
      const res = await triggerInstall();
      if (!mounted.current) return;
      if (!res?.success) {
        // dev 包/MSI/宿主拒绝：收回遮罩并浮出错误
        setInstallPhase('failed');
        setInstallError(res?.error);
        return;
      }
      handedOff = true;
      // 成功：进程即将退出，遮罩保留到窗口关闭（回退正常 UI 会造成「点了没反应」假象）
    } catch {
      if (mounted.current) {
        setInstallPhase('failed');
        setInstallError(dict('PC.Components.ClientUpdate.installFailed'));
      }
    } finally {
      if (!handedOff) {
        actionInFlight.current = false;
        if (mounted.current) setBusy(false);
      }
    }
  };

  // 常态：仅版本号小字（无更新任务时不占额外交互位、无悬浮卡）
  if (
    status === 'idle' ||
    status === 'checking' ||
    status === 'not-available'
  ) {
    return (
      <span
        aria-label={dict('PC.Components.ClientUpdate.versionLabel')}
        style={{
          fontSize: 11,
          lineHeight: 1,
          color: 'var(--xagi-color-text-tertiary)',
          userSelect: 'none',
          marginLeft: 10,
        }}
      >
        {versionText}
      </span>
    );
  }

  const isError = status === 'error';
  const isDownloading = status === 'downloading';
  const isInstalling = installationActive;
  const downloadLabel = dict(
    oneClickUpdate
      ? 'PC.Components.ClientUpdate.install'
      : 'PC.Components.ClientUpdate.download',
  );
  const percent = isDownloading ? realPercent ?? simPercent : undefined;

  const cardTitle = isError
    ? dict('PC.Components.ClientUpdate.errorTitle')
    : [targetVersion, dict('PC.Components.ClientUpdate.releaseNotesTitle')]
        .filter(Boolean)
        .join(' ');

  const hoverCard = (
    <div style={{ width: 340 }}>
      {state.releaseDate && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--xagi-color-text-tertiary)',
            marginBottom: 8,
          }}
        >
          {dict('PC.Components.ClientUpdate.releaseDate')}:{' '}
          {state.releaseDate.slice(0, 10)}
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
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: 'var(--xagi-color-error)',
          }}
        >
          {state.error}
        </div>
      )}
      <div
        style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}
      >
        {isInstalling ? (
          <Button loading disabled>
            {dict('PC.Components.ClientUpdate.installing')}
          </Button>
        ) : status === 'downloaded' ? (
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
            {isError ? dict('PC.Components.ClientUpdate.retry') : downloadLabel}
          </Button>
        )}
      </div>
    </div>
  );

  const ariaLabel = isDownloading
    ? dict('PC.Components.ClientUpdate.downloading')
    : isInstalling
    ? dict('PC.Components.ClientUpdate.installing')
    : isError
    ? dict('PC.Components.ClientUpdate.errorTitle')
    : dict('PC.Components.ClientUpdate.ready');

  return (
    <>
      <Popover
        placement="bottomLeft"
        open={popoverOpen}
        onOpenChange={setPopoverOpen}
        trigger={['hover', 'click']}
        mouseEnterDelay={0.8}
        arrow={false}
        destroyOnHidden
        title={cardTitle}
        content={hoverCard}
      >
        <span
          role="button"
          tabIndex={0}
          aria-label={ariaLabel}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setPopoverOpen((open) => !open);
            }
          }}
          style={
            isDownloading
              ? {
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginLeft: 10,
                  cursor: 'pointer',
                }
              : {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 24,
                  padding: '0 8px',
                  borderRadius: 12,
                  marginLeft: 10,
                  background: isError
                    ? 'var(--xagi-color-error-bg)'
                    : 'var(--xagi-color-primary-bg)',
                  color: isError
                    ? 'var(--xagi-color-error)'
                    : 'var(--xagi-color-primary)',
                  // 就绪提示与版本号小字同级；error 仍为图标。
                  fontSize: isError ? 15 : 12,
                  fontWeight: isError ? undefined : 500,
                  cursor: 'pointer',
                }
          }
        >
          {isDownloading ? (
            <Progress
              type="circle"
              percent={percent}
              size={16}
              strokeWidth={18}
              showInfo={false}
            />
          ) : isInstalling ? (
            <>
              {(busy || isInstalling) && (
                <LoadingOutlined spin style={{ marginRight: 4 }} />
              )}
              {dict('PC.Components.ClientUpdate.installing')}
            </>
          ) : isError ? (
            <InfoCircleOutlined />
          ) : (
            dict('PC.Components.ClientUpdate.ready')
          )}
        </span>
      </Popover>
      {/* 重启更新遮罩：清理+退出空窗期的全局反馈；成功后保留到进程退出 */}
      <Modal
        open={
          installPhase === 'failed' ||
          (installationActive && showInstallProgress)
        }
        centered
        width={420}
        footer={null}
        closable={false}
        maskClosable={false}
        keyboard={false}
        zIndex={3000}
        destroyOnHidden
      >
        {installPhase === 'failed' ? (
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--xagi-color-error)',
              }}
            >
              {dict('PC.Components.ClientUpdate.installFailed')}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--xagi-color-text-secondary)',
                overflowWrap: 'anywhere',
              }}
            >
              {installError ?? state.error}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 16,
              }}
            >
              <Button onClick={() => setInstallPhase('idle')}>
                {dict('PC.Components.ClientUpdate.close')}
              </Button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            {isDownloading ? (
              <Progress percent={Math.round(percent ?? 0)} status="active" />
            ) : (
              <Spin size="large" />
            )}
            <div style={{ marginTop: 16, fontSize: 15, fontWeight: 500 }}>
              {dict(
                isDownloading
                  ? 'PC.Components.ClientUpdate.downloading'
                  : 'PC.Components.ClientUpdate.installing',
              )}
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--xagi-color-text-tertiary)',
              }}
            >
              {!isDownloading &&
                dict('PC.Components.ClientUpdate.installingHint')}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default ClientVersionBadge;
