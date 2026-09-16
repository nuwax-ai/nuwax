/**
 * 客户端版本徽标（logo 旁，仅桌面宿主）
 * @description 常显宿主客户端版本号；有新版本 → 主题色下载图标（点击弹版本说明）；
 * 下载中 → 进度圆环；下载完成 → 重启安装图标；失败（已有目标版本）→ 红色信息图标。
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
import { Tooltip } from 'antd';
import { DownloadOutlined, InfoCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { Button, Modal, Progress } from 'antd';
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
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleDownload = async () => {
    setBusy(true);
    await triggerDownload();
    if (mounted.current) {
      setBusy(false);
      // 下载已发起：关弹窗，徽标位变进度圆环（需求行为）
      setModalOpen(false);
    }
  };

  const handleInstall = async () => {
    setBusy(true);
    await triggerInstall();
    if (mounted.current) setBusy(false);
  };

  /** 更新说明弹窗（available/error 态点击图标打开；downloaded 态亦可回看） */
  const renderModal = () => {
    const targetVersion = state.version ? `v${state.version}` : '';
    return (
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={480}
        title={dict('PC.Components.ClientUpdate.modalTitle') + (targetVersion ? ` ${targetVersion}` : '')}
        styles={{ body: { paddingTop: 12 } }}
        destroyOnHidden
      >
        {state.releaseDate && (
          <div style={{ fontSize: 12, color: 'var(--xagi-color-text-tertiary)', marginBottom: 8 }}>
            {dict('PC.Components.ClientUpdate.releaseDate')}: {state.releaseDate.slice(0, 10)}
          </div>
        )}
        {state.releaseNotes && (
          <div
            style={{
              maxHeight: 240,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              overflowWrap: 'anywhere',
              fontSize: 12,
              lineHeight: 1.7,
              color: 'var(--xagi-color-text-secondary)',
              background: 'var(--xagi-color-bg-layout)',
              padding: '10px 12px',
              borderRadius: 8,
            }}
          >
            {state.releaseNotes}
          </div>
        )}
        {state.error && (
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--xagi-color-error)' }}>
            {state.error}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          {status === 'downloaded' ? (
            <Button type="primary" loading={busy} onClick={handleInstall}>
              {dict('PC.Components.ClientUpdate.install')}
            </Button>
          ) : status === 'downloading' ? (
            <Button disabled>{dict('PC.Components.ClientUpdate.downloading')}</Button>
          ) : (
            <Button type="primary" loading={busy} onClick={handleDownload}>
              {status === 'error'
                ? dict('PC.Components.ClientUpdate.retry')
                : dict('PC.Components.ClientUpdate.download')}
            </Button>
          )}
          <Button onClick={() => setModalOpen(false)}>{dict('PC.Components.ClientUpdate.later')}</Button>
        </div>
      </Modal>
    );
  };

  // 常态：仅版本号小字（无更新任务时不占额外交互位）
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

  // 下载中：进度圆环（真实进度缺失时本地模拟推进）
  if (status === 'downloading') {
    const percent = realPercent ?? simPercent;
    return (
      <Tooltip title={dict('PC.Components.ClientUpdate.downloading')} mouseEnterDelay={0.7} placement="right">
        <span
          aria-label={dict('PC.Components.ClientUpdate.downloading')}
          style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 10, cursor: 'pointer' }}
          onClick={() => setModalOpen(true)}
        >
          <Progress
            type="circle"
            percent={percent}
            size={22}
            strokeWidth={10}
            showInfo={false}
          />
        </span>
      </Tooltip>
    );
  }

  // 下载完成：重启安装图标
  if (status === 'downloaded') {
    return (
      <>
        <Tooltip title={dict('PC.Components.ClientUpdate.install')} mouseEnterDelay={0.7} placement="right">
          <span
            role="button"
            aria-label={dict('PC.Components.ClientUpdate.install')}
            onClick={handleInstall}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 24,
              padding: '0 8px',
              borderRadius: 12,
              marginLeft: 10,
              background: 'var(--xagi-color-primary-bg)',
              color: 'var(--xagi-color-primary)',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            <RocketOutlined />
          </span>
        </Tooltip>
        {renderModal()}
      </>
    );
  }

  // available（可下载） / error（已有目标版本，点击回看与重试）
  const isError = status === 'error';
  return (
    <>
      <Tooltip
        title={
          isError
            ? dict('PC.Components.ClientUpdate.errorTitle')
            : dict('PC.Components.ClientUpdate.download')
        }
        mouseEnterDelay={0.7} placement="right"
      >
        <span
          role="button"
          aria-label={
            isError
              ? dict('PC.Components.ClientUpdate.errorTitle')
              : dict('PC.Components.ClientUpdate.download')
          }
          onClick={() => setModalOpen(true)}
          style={{
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
          }}
        >
          {isError ? <InfoCircleOutlined /> : <DownloadOutlined />}
        </span>
      </Tooltip>
      {renderModal()}
    </>
  );
};

export default ClientVersionBadge;
