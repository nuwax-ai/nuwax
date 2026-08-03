import TaskResultRow from '@/components/MarkdownRenderer/TaskResult/TaskResultRow';
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
import { compactOpenUiTheme } from '@nuwax-ai/openui-mcp/compact-theme';
import type { RenderOpenUiInput } from '@nuwax-ai/openui-mcp/contracts';
import {
  createMobileAwareLibrary,
  MobileLayoutProvider,
} from '@nuwax-ai/openui-mcp/mobile-layout';
import { Renderer, type ActionEvent } from '@openuidev/react-lang';
import { ThemeProvider } from '@openuidev/react-ui';
import { openuiLibrary } from '@openuidev/react-ui/genui-lib';
import { Alert, Button, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useModel } from 'umi';
import { getOpenUiActionSender } from './actionRegistry';
import styles from './index.less';
// OpenUI ↔ ds-markdown 样式隔离（层序 + revert + 宿主复位）；须先于 layered CSS
import '@openuidev/react-ui/layered/styles/index.css';
import './openui-host-reset.css';

const RUNTIME_PROTOCOL = 'nuwax.openui-runtime/v1';
/** OpenUI 统一预览入口；页面识别 openui=1 后按需加载 Runtime 重资源。 */
const RUNTIME_URL = `${(process.env.BASE_URL || '').replace(
  /\/+$/,
  '',
)}/static/file-preview.html`;

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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { isMobile } = useModel('layout');
  const sentActionIds = useRef(new Set<string>());
  /**
   * initialArtifact 仅作 OPENUI_FP_ERROR / 无 URL 时的回退内容。
   * 用 ref 持有最新值，供 fetch effect 在 identity 变化时取最新，避免闭包读到旧值。
   */
  const initialArtifactRef = useRef(initialArtifact);
  initialArtifactRef.current = initialArtifact;
  // 按 artifactId+digest 识别「内容身份」：仅用于判断是否需要更新 artifact，
  // 不再触发 iframe 重载（切换 artifact 走 OPENUI_LOAD 增量更新，避免每次重载 3.4MB runtime）。
  const inlineArtifactIdentity = initialArtifact
    ? `${initialArtifact.artifactId}:${initialArtifact.document.digest}`
    : '';
  /**
   * 重载世代：仅在需要真正重载 iframe 时递增——
   * 挂载（初值）、手动 retry、失败后切换到新 artifact（自动恢复）。
   * artifact 内容 / artifactUrl / expectedDigest 变化不再触发重载，只经 OPENUI_LOAD 更新。
   */
  const [reloadTick, setReloadTick] = useState(0);
  const reloadKey = `${reloadTick}\0${filePath ?? ''}`;
  const [prevReloadKey, setPrevReloadKey] = useState(reloadKey);
  // file_path 模式下初始为 null，等 iframe inline script relay 回来的 artifact
  const [artifact, setArtifact] = useState<OpenUiFile | null>(
    filePath ? null : initialArtifact ?? null,
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const statusRef = useRef(status);
  statusRef.current = status;
  const [error, setError] = useState('');
  const [height, setHeight] = useState(320);
  /**
   * 加载世代：reloadKey 变化时递增。超时回调比对世代号，忽略过期 timer。
   */
  const loadGenerationRef = useRef(0);

  // 真正重载（reloadTick / filePath 变化）：paint 前清掉旧 failed/ready，回到 loading
  if (reloadKey !== prevReloadKey) {
    setPrevReloadKey(reloadKey);
    loadGenerationRef.current += 1;
    setStatus('loading');
    setError('');
    setArtifact(filePath ? null : initialArtifact ?? null);
  }

  // nonce 随重载世代稳定（不随 artifact 内容变化）——避免每次切换都重载 runtime
  const nonce = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 有意只在重载时换 nonce
    [reloadTick, filePath],
  );

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
    // 仅更新 artifact 状态；不回打 loading/error——切换内容走 OPENUI_LOAD 增量更新，不重载 iframe。
    // 初始 loading 由 useState 初值提供，retry/恢复由 reloadKey 渲染期 reset 提供。
    setArtifact(filePath ? null : initialArtifactRef.current ?? null);
    if (filePath) {
      // 由 iframe 自主拉取（inline script），Host 不主动 fetch
      return;
    }
    if (!artifactUrl) {
      if (!initialArtifactRef.current) {
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
    // inlineArtifactIdentity：按 artifactId+digest 变化重新拉取/更新 artifact（仅 setArtifact，不重载 iframe）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialArtifact 经 ref + identity 稳定化
  }, [
    filePath,
    artifactUrl,
    expectedArtifactId,
    expectedDigest,
    inlineArtifactIdentity,
    reloadTick,
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
        viewport: isMobile ? 'mobile' : 'desktop',
      },
      '*',
    );
  }, [artifact, isMobile, nonce]);

  useEffect(() => {
    if (status === 'ready' && artifact) sendLoad();
  }, [artifact, sendLoad, status]);

  // 失败后切换到新 artifact：自动触发一次重载恢复，避免停留在旧失败态。
  // ready 态切换不重载（经 OPENUI_LOAD 增量更新）；loading 态切换由在途 load 兜底。
  const prevIdentityRef = useRef(inlineArtifactIdentity);
  useEffect(() => {
    const prev = prevIdentityRef.current;
    prevIdentityRef.current = inlineArtifactIdentity;
    if (
      prev &&
      inlineArtifactIdentity &&
      prev !== inlineArtifactIdentity &&
      statusRef.current === 'failed'
    ) {
      setReloadTick((tick) => tick + 1);
    }
  }, [inlineArtifactIdentity]);

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
        const fallback = initialArtifactRef.current;
        if (fallback) {
          setArtifact(fallback);
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
  }, [artifact, conversationId, nonce, sendLoad, variant, validateArtifact]);

  useEffect(() => {
    if (status !== 'loading') return;
    // OpenUI Runtime 的 OPENUI_READY 仅在 runtime 挂载时发送一次；
    // 当 iframe 被切到后台/被节流、或 3.4MB runtime.js 冷启动解析时，
    // 该信号会延迟到达。这里给一个较宽的安全阈值，避免把“还在加载”误判为失败。
    // 真正的加载/渲染错误由 iframe onError 与 runtime 的 OPENUI_ERROR 兜底。
    //
    // 依赖 reloadKey：仅在真正重载（reloadTick/filePath）后重置 60s timer；
    // ready 态切换 artifact 不重载、不重排 timer，故不会误判超时。
    const generation = loadGenerationRef.current;
    const timer = window.setTimeout(() => {
      if (generation !== loadGenerationRef.current) return;
      // 60s 仍未 ready：统一判失败（retry 可达）。
      // 不在此处回退 inlineFile：timer 触发时 status 必为 'loading'（ready/failed 会重置 timer），
      // 此时即便 setArtifact(inlineFile) 也无法 sendLoad（需 status==='ready'），只会卡住永久 loading，
      // 且会覆盖 relay 已成功拉取的 fresh artifact。回退改由 message handler 的 OPENUI_FP_ERROR 处理。
      setStatus('failed');
      setError('OpenUI Runtime timed out.');
    }, 60_000);
    return () => window.clearTimeout(timer);
  }, [status, reloadTick, reloadKey]);

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
            onClick={() => setReloadTick((value) => value + 1)}
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
        key={reloadTick}
        ref={iframeRef}
        className={styles.inlineFrame}
        src={`${RUNTIME_URL}?openui=1&nonce=${encodeURIComponent(nonce)}${
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
  const { isMobile } = useModel('layout');
  // 直连 Renderer 路径复用 web runtime 的移动端感知库（Stack/Card mobile 时横排→竖排）。
  const library = useMemo(() => createMobileAwareLibrary(openuiLibrary), []);
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
    // sidecar 摘要直接复用 TaskResult 的文件摘要行（TaskResultRow），
    // 点击走 onOpenSidecar（路由到文件树选中 data/{artifactId}.openui.json 预览）。
    // .task-result 自身只有上下外边距、宽度 100%；sidecar 宿主无内边距会左右贴边，
    // 故套一层 host 补水平外边距（与 .inlineFrameHost 的水平 inset 一致）。
    return (
      <div className={styles.sidecarRowHost}>
        <TaskResultRow
          label={artifact.title || dict('PC.Components.OpenUi.openPreview')}
          onClick={() => onOpenSidecar?.(artifact)}
        />
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
          <MobileLayoutProvider isMobile={isMobile}>
            <Renderer
              library={library}
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
          </MobileLayoutProvider>
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
