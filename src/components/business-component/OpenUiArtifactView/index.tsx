import { dict } from '@/services/i18nRuntime';
import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import { ExportOutlined } from '@ant-design/icons';
import { Renderer } from '@openuidev/react-lang';
import { openuiLibrary } from '@openuidev/react-ui/genui-lib';
import '@openuidev/react-ui/layered/styles/index.css';
import { Alert, Button, Spin } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
import { configureOpenUiValidation } from './openUiValidation';

export type OpenUiInlineRenderMode = 'renderer' | 'iframe';

configureOpenUiValidation();

const defaultInlineRenderMode: OpenUiInlineRenderMode =
  process.env.OPENUI_INLINE_RENDER_MODE === 'iframe' ? 'iframe' : 'renderer';

interface OpenUiArtifactViewProps {
  artifact: OpenUiArtifact;
  runtimeUrl?: string;
  inlineRenderMode?: OpenUiInlineRenderMode;
  blockedReason?: 'expired' | 'untrusted';
  onOpenSidecar?: (artifact: OpenUiArtifact) => void;
}

const OpenUiArtifactView: React.FC<OpenUiArtifactViewProps> = ({
  artifact,
  runtimeUrl,
  inlineRenderMode = defaultInlineRenderMode,
  blockedReason,
  onOpenSidecar,
}) => {
  const [frameStatus, setFrameStatus] = useState<
    'loading' | 'ready' | 'failed'
  >('loading');
  const [frameKey, setFrameKey] = useState(0);
  const [frameHeight, setFrameHeight] = useState(320);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoOpenedArtifactId = useRef<string | undefined>(undefined);
  const isSidecar = artifact.presentation.mode === 'sidecar';
  const useInlineFrame = !isSidecar && inlineRenderMode === 'iframe';
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    setFrameStatus('loading');
    setFrameHeight(320);
    setRenderError(null);
  }, [artifact.artifactId, runtimeUrl, frameKey]);

  useEffect(() => {
    if (!useInlineFrame || !runtimeUrl || frameStatus !== 'loading') return;
    const timeout = window.setTimeout(() => setFrameStatus('failed'), 10_000);
    return () => window.clearTimeout(timeout);
  }, [frameStatus, runtimeUrl, useInlineFrame]);

  useEffect(() => {
    if (!useInlineFrame) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (
        runtimeUrl &&
        event.origin !== new URL(runtimeUrl, window.location.href).origin
      ) {
        return;
      }
      const data = event.data as Record<string, unknown> | null;
      if (
        !data ||
        data.protocolVersion !== 'nuwax.openui-page/v1' ||
        data.artifactId !== artifact.artifactId
      ) {
        return;
      }
      if (data.type === 'OPENUI_READY') setFrameStatus('ready');
      if (data.type === 'OPENUI_RESIZE' && typeof data.height === 'number') {
        setFrameHeight(Math.min(720, Math.max(180, data.height + 2)));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [artifact.artifactId, runtimeUrl, useInlineFrame]);

  const retry = useCallback(() => {
    setFrameStatus('loading');
    setFrameKey((current) => current + 1);
  }, []);

  useEffect(() => {
    if (
      isSidecar &&
      artifact.presentation.autoOpen &&
      artifact.page &&
      !blockedReason &&
      onOpenSidecar &&
      autoOpenedArtifactId.current !== artifact.artifactId
    ) {
      autoOpenedArtifactId.current = artifact.artifactId;
      onOpenSidecar(artifact);
    }
  }, [artifact, blockedReason, isSidecar, onOpenSidecar]);

  if (blockedReason) {
    return (
      <Alert
        className={styles.renderState}
        type="warning"
        showIcon
        message={dict(
          blockedReason === 'expired'
            ? 'PC.Components.OpenUi.expired'
            : 'PC.Components.OpenUi.untrustedPage',
        )}
        description={artifact.fallback.markdown}
      />
    );
  }

  if (isSidecar) {
    return (
      <div className={styles.sidecarSummary}>
        <div className={styles.sidecarText}>
          <div className={styles.sidecarTitle}>{artifact.title}</div>
          {artifact.fallback.markdown && (
            <div className={styles.sidecarFallback}>
              {artifact.fallback.markdown}
            </div>
          )}
        </div>
        <Button
          type="primary"
          size="small"
          icon={<ExportOutlined />}
          disabled={!runtimeUrl || !onOpenSidecar}
          onClick={() => onOpenSidecar?.(artifact)}
        >
          {dict('PC.Components.OpenUi.openPreview')}
        </Button>
      </div>
    );
  }

  if (!useInlineFrame && renderError) {
    return (
      <Alert
        className={styles.renderState}
        type="warning"
        showIcon
        message={dict('PC.Components.OpenUi.renderFailed')}
        description={artifact.fallback.markdown || renderError}
      />
    );
  }

  if (!useInlineFrame) {
    return (
      <div
        className={styles.inlineRenderer}
        data-openui-artifact={artifact.artifactId}
        data-openui-render-mode="renderer"
      >
        <Renderer
          library={openuiLibrary}
          response={artifact.document.source}
          isStreaming={false}
          onError={(errors) => {
            if (errors.length > 0) {
              setRenderError(
                errors[0]?.message || dict('PC.Components.OpenUi.renderFailed'),
              );
            }
          }}
        />
      </div>
    );
  }

  if (!runtimeUrl || frameStatus === 'failed') {
    return (
      <Alert
        className={styles.renderState}
        type="warning"
        showIcon
        message={dict('PC.Components.OpenUi.renderFailed')}
        description={artifact.fallback.markdown}
        action={
          runtimeUrl ? (
            <Button size="small" onClick={retry}>
              {dict('PC.Components.OpenUi.retry')}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div
      className={styles.inlineFrameHost}
      data-openui-artifact={artifact.artifactId}
      data-openui-render-mode="iframe"
    >
      {frameStatus === 'loading' && (
        <div className={styles.frameLoading}>
          <Spin size="small" />
          <span>{dict('PC.Components.OpenUi.loading')}</span>
        </div>
      )}
      <iframe
        key={frameKey}
        ref={iframeRef}
        className={styles.inlineFrame}
        src={runtimeUrl}
        title={artifact.title}
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        style={{ height: frameHeight }}
        onError={() => setFrameStatus('failed')}
      />
    </div>
  );
};

export default OpenUiArtifactView;
