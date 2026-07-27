import { OPENUI_SIDECAR_SANDBOX } from '@/constants/common.constants';
import { dict } from '@/services/i18nRuntime';
import type {
  OpenUiAction,
  OpenUiActionArtifact,
  OpenUiArtifact,
  OpenUiFile,
} from '@/types/interfaces/openUi';
import {
  isOpenUiArtifactRef,
  legacyArtifactToOpenUiFile,
  openUiFileSchema,
} from '@/utils/openUiArtifact';
import { ExportOutlined } from '@ant-design/icons';
import { compactOpenUiTheme } from '@nuwax-ai/openui-mcp/compact-theme';
import type { RenderOpenUiInput } from '@nuwax-ai/openui-mcp/contracts';
import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { ThemeProvider } from '@openuidev/react-ui';
import { openuiLibrary } from '@openuidev/react-ui/genui-lib';
import { Alert, Button, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOpenUiActionSender } from './actionRegistry';
import styles from './index.less';
// OpenUI ↔ ds-markdown 样式隔离（层序 + revert + 宿主复位）；须先于 layered CSS
import '@openuidev/react-ui/layered/styles/index.css';
import './openui-host-reset.css';

const RUNTIME_PROTOCOL = 'nuwax.openui-runtime/v1';
/** OpenUI 固化运行时入口（与 public/static/openui-runtime 对齐） */
const RUNTIME_URL = `${(process.env.BASE_URL || '').replace(
  /\/+$/,
  '',
)}/static/openui-runtime/index.html`;

interface OpenUiRuntimeFrameProps {
  artifact?: OpenUiFile;
  artifactUrl?: string;
  /** OpenUI Runtime「自主拉取」模式：/api/computer/static 之后的相对路径，传给 iframe 内 inline script */
  filePath?: string;
  expectedArtifactId?: string;
  expectedDigest?: string;
  variant?: 'inline' | 'full';
  fallbackMarkdown?: string;
  conversationId?: number | string;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return `sha256:${Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')}`;
}

export const OpenUiRuntimeFrame: React.FC<OpenUiRuntimeFrameProps> = ({
  artifact: initialArtifact,
  artifactUrl,
  filePath,
  expectedArtifactId,
  expectedDigest,
  variant = 'inline',
  fallbackMarkdown = '',
  conversationId,
}) => {
  const nonce = useMemo(
    () => crypto.randomUUID(),
    [filePath, artifactUrl, expectedDigest],
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const sentActionIds = useRef(new Set<string>());
  // file_path 模式下初始为 null，等 iframe inline script relay 回来的 artifact
  const [artifact, setArtifact] = useState<OpenUiFile | null>(
    filePath ? null : initialArtifact ?? null,
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [error, setError] = useState('');
  const [height, setHeight] = useState(320);
  const [frameKey, setFrameKey] = useState(0);

  // 校验拉取/relay 到的 artifact：artifactId 与 digest 与期望一致（fetch 与 OPENUI_FP_ARTIFACT 复用）
  const validateArtifact = useCallback(
    async (parsed: OpenUiFile): Promise<void> => {
      if (expectedArtifactId && parsed.artifactId !== expectedArtifactId) {
        throw new Error('Artifact ID does not match the requested file.');
      }
      const actualDigest = await sha256(parsed.document.source);
      if (
        actualDigest !== parsed.document.digest ||
        (expectedDigest && actualDigest !== expectedDigest)
      ) {
        throw new Error('Artifact digest verification failed.');
      }
    },
    [expectedArtifactId, expectedDigest],
  );

  useEffect(() => {
    // file_path 模式：初始 artifact 置空，由 iframe 内 inline script 同源拉取并 relay 回来
    setArtifact(filePath ? null : initialArtifact ?? null);
    setStatus('loading');
    setError('');
    if (filePath) {
      // 由 iframe 自主拉取（inline script），Host 不主动 fetch
      return;
    }
    if (!artifactUrl) {
      if (!initialArtifact) {
        setStatus('failed');
        setError('OpenUI artifact data is unavailable.');
      }
      return;
    }
    const controller = new AbortController();
    void fetch(artifactUrl, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error(`Artifact request failed (${response.status}).`);
        const parsed = openUiFileSchema.parse(await response.json());
        await validateArtifact(parsed);
        // validateArtifact 含 sha256（async）；期间 artifactUrl 可能已切换，复查避免提交 stale artifact
        if (controller.signal.aborted) return;
        setArtifact(parsed);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setStatus('failed');
          setError(reason instanceof Error ? reason.message : String(reason));
        }
      });
    return () => controller.abort();
  }, [
    filePath,
    artifactUrl,
    expectedArtifactId,
    expectedDigest,
    initialArtifact,
    frameKey,
    validateArtifact,
  ]);

  const sendLoad = useCallback(() => {
    if (!artifact || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: 'OPENUI_LOAD',
        protocolVersion: RUNTIME_PROTOCOL,
        nonce,
        artifact,
        locale: document.documentElement.lang || navigator.language,
        theme: 'light',
        viewport: window.matchMedia('(max-width: 767px)').matches
          ? 'mobile'
          : 'desktop',
      },
      '*',
    );
  }, [artifact, nonce]);

  useEffect(() => {
    if (status === 'ready' && artifact) sendLoad();
  }, [artifact, sendLoad, status]);

  useEffect(() => {
    const handleMessage = (message: MessageEvent<Record<string, unknown>>) => {
      if (message.source !== iframeRef.current?.contentWindow) return;
      const data = message.data;
      if (
        !data ||
        data.protocolVersion !== RUNTIME_PROTOCOL ||
        data.nonce !== nonce
      )
        return;
      if (data.type === 'OPENUI_FP_ARTIFACT') {
        // file_path 模式：iframe inline script 同源拉取成功，relay 回来的 artifact
        try {
          const parsed = openUiFileSchema.parse(data.artifact);
          void validateArtifact(parsed)
            .then(() => setArtifact(parsed))
            .catch((reason: unknown) => {
              setStatus('failed');
              setError(
                reason instanceof Error ? reason.message : String(reason),
              );
            });
        } catch (reason) {
          setStatus('failed');
          setError(reason instanceof Error ? reason.message : String(reason));
        }
        return;
      }
      if (data.type === 'OPENUI_FP_ERROR') {
        // iframe 拉取失败/过期：有内存 inlineFile 则回退下发，否则展示失败
        const msg =
          typeof data.message === 'string'
            ? data.message
            : 'OpenUI file fetch failed.';
        if (initialArtifact) {
          setArtifact(initialArtifact);
        } else {
          setStatus('failed');
          setError(msg);
        }
        return;
      }
      if (data.type === 'OPENUI_READY') {
        setStatus('ready');
        sendLoad();
      } else if (
        data.type === 'OPENUI_RESIZE' &&
        variant === 'inline' &&
        typeof data.height === 'number'
      ) {
        setHeight(Math.min(1200, Math.max(180, Math.ceil(data.height) + 2)));
      } else if (data.type === 'OPENUI_ERROR') {
        setStatus('failed');
        setError(
          typeof data.message === 'string'
            ? data.message
            : 'OpenUI render failed.',
        );
      } else if (data.type === 'OPENUI_ACTION' && artifact) {
        const action = data.event as OpenUiAction | undefined;
        if (
          !action ||
          action.type !== 'nuwax.openui-action' ||
          action.schemaVersion !== 'nuwax.openui-action/v1' ||
          action.artifactId !== artifact.artifactId ||
          action.artifactPath !== `data/${artifact.artifactId}.openui.json` ||
          sentActionIds.current.has(action.actionId)
        )
          return;
        sentActionIds.current.add(action.actionId);
        const effectiveSender = getOpenUiActionSender(conversationId);
        Promise.resolve(effectiveSender?.(artifact, action))
          .then(() =>
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'OPENUI_ACTION_RESULT',
                protocolVersion: RUNTIME_PROTOCOL,
                nonce,
                actionId: action.actionId,
                success: Boolean(effectiveSender),
                message: effectiveSender
                  ? undefined
                  : dict('PC.Components.OpenUi.actionUnavailable'),
              },
              '*',
            ),
          )
          .catch((reason: unknown) => {
            sentActionIds.current.delete(action.actionId);
            iframeRef.current?.contentWindow?.postMessage(
              {
                type: 'OPENUI_ACTION_RESULT',
                protocolVersion: RUNTIME_PROTOCOL,
                nonce,
                actionId: action.actionId,
                success: false,
                message:
                  reason instanceof Error ? reason.message : String(reason),
              },
              '*',
            );
          });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    artifact,
    conversationId,
    nonce,
    sendLoad,
    variant,
    validateArtifact,
    initialArtifact,
  ]);

  useEffect(() => {
    if (status !== 'loading') return;
    // OpenUI Runtime 的 OPENUI_READY 仅在 runtime 挂载时发送一次；
    // 当 iframe 被切到后台/被节流、或 3.4MB runtime.js 冷启动解析时，
    // 该信号会延迟到达。这里给一个较宽的安全阈值，避免把“还在加载”误判为失败。
    // 真正的加载/渲染错误由 iframe onError 与 runtime 的 OPENUI_ERROR 兜底。
    const timer = window.setTimeout(() => {
      // 60s 仍未 ready：统一判失败（retry 可达）。
      // 不在此处回退 inlineFile：timer 触发时 status 必为 'loading'（ready/failed 会重置 timer），
      // 此时即便 setArtifact(inlineFile) 也无法 sendLoad（需 status==='ready'），只会卡住永久 loading，
      // 且会覆盖 relay 已成功拉取的 fresh artifact。回退改由 message handler 的 OPENUI_FP_ERROR 处理。
      setStatus('failed');
      setError('OpenUI Runtime timed out.');
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [status, frameKey]);

  if (status === 'failed') {
    return (
      <Alert
        className={styles.renderState}
        type="warning"
        showIcon
        message={dict('PC.Components.OpenUi.renderFailed')}
        description={fallbackMarkdown || error}
        action={
          <Button
            size="small"
            onClick={() => setFrameKey((value) => value + 1)}
          >
            {dict('PC.Components.OpenUi.retry')}
          </Button>
        }
      />
    );
  }

  return (
    <div
      className={
        variant === 'inline' ? styles.inlineFrameHost : styles.fullFrameHost
      }
    >
      {status === 'loading' && (
        <div className={styles.frameLoading}>
          <Spin size="small" />
          <span>{dict('PC.Components.OpenUi.loading')}</span>
        </div>
      )}
      <iframe
        key={frameKey}
        ref={iframeRef}
        className={styles.inlineFrame}
        src={`${RUNTIME_URL}?nonce=${encodeURIComponent(nonce)}${
          filePath ? `&file_path=${encodeURIComponent(filePath)}` : ''
        }`}
        title={artifact?.title || 'OpenUI'}
        // ES module 在 null origin 下会触发 CORS；与 sidecar 一致启用 allow-same-origin
        sandbox={OPENUI_SIDECAR_SANDBOX}
        referrerPolicy="no-referrer"
        style={{ height: variant === 'inline' ? height : '100%' }}
        onLoad={sendLoad}
        onError={() => setStatus('failed')}
      />
    </div>
  );
};

interface OpenUiArtifactViewProps {
  artifact?: OpenUiArtifact;
  inlineInput?: RenderOpenUiInput;
  inlineArtifactId?: string;
  artifactUrl?: string;
  onOpenSidecar?: (artifact: OpenUiArtifact) => void;
  conversationId?: number | string;
}

const OpenUiArtifactView: React.FC<OpenUiArtifactViewProps> = ({
  artifact,
  inlineInput,
  inlineArtifactId,
  artifactUrl,
  onOpenSidecar,
  conversationId,
}) => {
  const autoOpenedArtifactId = useRef<string>();
  const formStateRef = useRef<Record<string, unknown>>({});
  const pendingActionIdRef = useRef<string>();
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const presentation = artifact?.presentation ?? inlineInput?.presentation;
  const artifactId = artifact?.artifactId ?? inlineArtifactId ?? 'inline';
  const isSidecar = presentation?.mode === 'sidecar';
  const file = artifact
    ? isOpenUiArtifactRef(artifact)
      ? undefined
      : legacyArtifactToOpenUiFile(artifact)
    : undefined;
  const inlineSource = inlineInput?.document.source ?? file?.document.source;
  const inlineFallback =
    inlineInput?.fallback.markdown ?? file?.fallback.markdown ?? '';
  const actionArtifact = useMemo<OpenUiActionArtifact | null>(
    () =>
      presentation
        ? {
            artifactId,
            title: artifact?.title ?? inlineInput?.title ?? 'OpenUI',
            presentation,
          }
        : null,
    [artifact?.title, artifactId, inlineInput?.title, presentation],
  );

  const handleInlineAction = useCallback(
    (event: ActionEvent) => {
      if (pendingActionIdRef.current) return;
      const sender = getOpenUiActionSender(conversationId);
      if (!sender || !actionArtifact) {
        setRenderError(dict('PC.Components.OpenUi.actionUnavailable'));
        return;
      }
      const actionId = crypto.randomUUID();
      const action: OpenUiAction = {
        type: 'nuwax.openui-action',
        schemaVersion: 'nuwax.openui-action/v1',
        actionId,
        artifactId: actionArtifact.artifactId,
        artifactPath: `data/${actionArtifact.artifactId}.openui.json`,
        actionName: String(event.type),
        values: event.formState ?? formStateRef.current,
        formName: event.formName,
        humanFriendlyMessage: event.humanFriendlyMessage,
        params: event.params,
        submittedAt: new Date().toISOString(),
      };
      pendingActionIdRef.current = actionId;
      setIsSubmitting(true);
      void Promise.resolve(sender(actionArtifact, action))
        .catch((reason: unknown) => {
          setRenderError(
            reason instanceof Error ? reason.message : String(reason),
          );
        })
        .finally(() => {
          if (pendingActionIdRef.current === actionId) {
            pendingActionIdRef.current = undefined;
            setIsSubmitting(false);
          }
        });
    },
    [actionArtifact, conversationId],
  );

  useEffect(() => {
    setRenderError(null);
    formStateRef.current = {};
    pendingActionIdRef.current = undefined;
    setIsSubmitting(false);
  }, [artifactId, inlineSource]);

  useEffect(() => {
    if (
      isSidecar &&
      artifact?.presentation.autoOpen &&
      onOpenSidecar &&
      autoOpenedArtifactId.current !== artifact.artifactId
    ) {
      autoOpenedArtifactId.current = artifact.artifactId;
      onOpenSidecar(artifact);
    }
  }, [artifact, isSidecar, onOpenSidecar]);

  if (isSidecar && artifact) {
    return (
      <div className={styles.sidecarSummary}>
        <div className={styles.sidecarText}>
          <div className={styles.sidecarTitle}>{artifact.title}</div>
          {!isOpenUiArtifactRef(artifact) && artifact.fallback.markdown ? (
            <div className={styles.sidecarFallback}>
              {artifact.fallback.markdown}
            </div>
          ) : null}
        </div>
        <Button
          type="primary"
          size="small"
          icon={<ExportOutlined />}
          disabled={!onOpenSidecar}
          onClick={() => onOpenSidecar?.(artifact)}
        >
          {dict('PC.Components.OpenUi.openPreview')}
        </Button>
      </div>
    );
  }

  if (inlineSource) {
    if (renderError) {
      return (
        <Alert
          className={styles.renderState}
          type="warning"
          showIcon
          message={dict('PC.Components.OpenUi.renderFailed')}
          description={inlineFallback || renderError}
        />
      );
    }
    return (
      <div
        className={styles.inlineRenderer}
        data-openui-artifact={artifactId}
        data-openui-render-mode="renderer"
        data-openui-theme="light"
      >
        <ThemeProvider mode="light" lightTheme={compactOpenUiTheme}>
          <Renderer
            library={openuiLibrary}
            response={inlineSource}
            isStreaming={isSubmitting}
            onStateUpdate={(state) => {
              formStateRef.current = state;
            }}
            onAction={handleInlineAction}
            onError={(errors) => {
              if (errors.length > 0) {
                setRenderError(
                  errors[0]?.message ||
                    dict('PC.Components.OpenUi.renderFailed'),
                );
              }
            }}
          />
        </ThemeProvider>
      </div>
    );
  }

  return (
    <OpenUiRuntimeFrame
      artifact={file}
      artifactUrl={artifactUrl}
      expectedArtifactId={artifact?.artifactId}
      expectedDigest={
        artifact && isOpenUiArtifactRef(artifact)
          ? artifact.digest
          : artifact?.document.digest
      }
      conversationId={conversationId}
      fallbackMarkdown={
        !artifact || isOpenUiArtifactRef(artifact)
          ? ''
          : artifact.fallback.markdown
      }
    />
  );
};

export default OpenUiArtifactView;
