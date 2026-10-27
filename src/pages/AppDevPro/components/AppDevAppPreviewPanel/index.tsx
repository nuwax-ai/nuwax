import { dict } from '@/services/i18nRuntime';
import {
  CloseCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Empty, Tooltip } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { UserAppEnvPodStatus } from '../../hooks/useUserAppEnvPod';
import {
  getUserAppReadinessUiKind,
  UserAppContainerStatusEnum,
  UserAppReadinessStatusEnum,
} from '../../services/appDevPro';
import type {
  UserAppPublishPhase,
  UserAppTaskServiceProgress,
} from '../../type';
import AppDevProIframe from '../AppDevProIframe';
import AppDevServiceStartStatus from '../AppDevStatusHero';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevAppPreviewPanelProps {
  /** 当前环境对应的应用预览地址 */
  previewUrl?: string;
  /** 刷新计数，变化时强制重新加载 iframe */
  refreshKey?: number;
  /** 当前环境服务是否已在运行 */
  running?: boolean;
  /** 启动 / 重启任务进行中 */
  busy?: boolean;
  /** 启动任务阶段 */
  phase?: UserAppPublishPhase;
  /** 启动任务各服务进度（含 SSE 日志） */
  services?: UserAppTaskServiceProgress[];
  /** 启动失败时的接口错误文案，展示在日志区 */
  errorMessage?: string;
  /**
   * 启动接口已成功，但预览域名不可访问。
   * 只展示页面加载失败，不进入启动进度日志。
   */
  previewLoadError?: string;
  /** 启动已成功，正在轮询应用是否可以访问 */
  checking?: boolean;
  /** 取消任务 loading */
  cancelLoading?: boolean;
  /** 容器是否已就绪 */
  podReady?: boolean;
  /** 当前环境容器启动状态；传入后优先展示容器启动过程 */
  containerStatus?: UserAppEnvPodStatus;
  /** 会话是否仍在生成项目文件 */
  isGeneratingFiles?: boolean;
  /** 会话结束后是否仍在等待用户确认 */
  isWaitingForUserConfirmation?: boolean;
  /** 取消当前启动任务 */
  onCancelTask?: () => void;
  /** 启动失败后重新启动（dev/restart 或 prod/restart） */
  onRetryStart?: () => void;
  /**
   * 服务未运行时的「启动预览」。
   * 用户主动停止成功后由外层改为 restart；其余情况仍是 start。
   */
  onStart?: () => void;
  /** 页面加载失败后只刷新当前预览 iframe，不重启服务 */
  onRefreshPreview?: () => void;
  /** 容器启动失败后重新启动 */
  onRetryContainer?: () => void;
  /** 开发环境进行中任务锁定启动 / 重启 */
  devActionLocked?: boolean;
  /**
   * 是否允许展示「服务已停止」。
   * 进页未决定 start/attach 前为 false，避免刷新先闪停止再自动 start。
   * 用户点停止后为 true。
   */
  allowStoppedHero?: boolean;
  /**
   * 线上环境预览：容器就绪后直接展示 iframe，不走开发环境的「预览准备中」。
   */
  directPreview?: boolean;
  /**
   * 首次进入后 file-list 已返回，但列表为空或根目录缺少 workspace.manifest.toml。
   * 首次 file-list 还没返回时为 false。
   */
  missingProjectFiles?: boolean;
  /**
   * 根目录是否已有可预览的有效项目（非空且含 workspace.manifest.toml）。
   * null：file-list 还没返回，不据此覆盖就绪态。
   */
  hasValidProjectFiles?: boolean | null;
  /** 正在调用停止接口，避免 iframe 被关掉后露出空白 */
  stopping?: boolean;
  /** 线上环境重启进行中：展示重启提示，隐藏 iframe */
  restarting?: boolean;
  /**
   * 智能体电脑重启后、容器尚未确认启动成功。
   * 为 true 时不挂预览 iframe，避免打到还没起来的域名。
   */
  holdPreview?: boolean;
  /**
   * 当前环境最近一次就绪探测的顶层业务状态。
   * 还没有结果时不传，预览区保持原来的准备中界面。
   */
  readinessStatus?: UserAppReadinessStatusEnum | null;
  /**
   * 当前环境就绪探测的 ready 字段。
   * status 为 ready 时，这个字段也必须为 true 才按正常访问展示。
   */
  readinessReady?: boolean | null;
  /**
   * readiness 回包里的容器状态。
   * 应用为 provisioning 时，只有容器已是 running 才展示资源准备中。
   */
  readinessContainerStatus?: string | null;
  /**
   * readiness 回包里容器当前意图操作的类型，如 restart / stop。
   * 线上 start / restart 都会先重启容器：容器还在过渡中时用它区分
   * 「重启容器」与普通应用启动，让非操作页签与操作页签展示一致。
   */
  readinessContainerOperationAction?: string | null;
  /**
   * 当前环境的预览是否已经正常渲染过。
   * 为 true 时不再用就绪状态提示替换正在看的页面。
   */
  previewAlreadyPresented?: boolean;
  /**
   * 本页签主动停止过当前环境（父页面本地停止标记）。
   * 生命周期展示跟随 readiness；本标记只在 stop 成功但 readiness 还停在
   * ready 的滞后窗口里拦下 iframe 并显示停止中过渡（stopPendingReadiness），
   * 另在未部署空项目提示里避免把停止态误报成「暂无可预览的项目」。
   * readiness 经过 starting（或从 stopping/stopped 跳到就绪）后父页面会
   * 清掉本标记，ready 即可正常打开。
   */
  suppressReadinessStatus?: boolean;
  /** iframe 已正常打开，通知页面记住这个环境已经渲染过 */
  onPreviewPresented?: () => void;
  /**
   * 线上环境应用尚未部署。
   * 为 true 时只展示提示和部署按钮，不拉起预览。
   */
  prodUndeployed?: boolean;
  /** 打开部署弹窗 */
  onDeploy?: () => void;
}

/**
 * 把各 service 的日志摊平成可展示行。
 *
 * @param services 任务服务进度
 * @returns 日志行
 */
const flattenTaskLogs = (services?: UserAppTaskServiceProgress[]): string[] => {
  if (!services?.length) {
    return [];
  }
  return services.flatMap((item) => item.logs).filter((line) => line.trim());
};

/**
 * 启动日志详情：自动滚到最新一行。
 *
 * @param props.logs 日志行
 * @param props.waitingText 尚无日志时的占位
 * @returns 日志块
 */
const PreviewStartLogBoard: React.FC<{
  logs: string[];
  waitingText: string;
}> = ({ logs, waitingText }) => {
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <pre ref={logRef} className={cx(styles.logBody)}>
      {logs.length ? (
        logs.map((line, index) => (
          <span key={index} className={cx(styles.logLine)}>
            {line}
          </span>
        ))
      ) : (
        <span className={cx(styles.logEmpty)}>{waitingText}</span>
      )}
    </pre>
  );
};

/**
 * iframe 加载中的粉色角色插画（浮动 + 速度线）。
 *
 * @returns 加载插画
 */
const PreviewLoadingMascot: React.FC = () => (
  <svg
    className={cx(styles.mascot)}
    viewBox="0 0 140 128"
    width="112"
    height="102"
    aria-hidden
  >
    <defs>
      <linearGradient
        id="previewMascotGrad"
        x1="50%"
        y1="0%"
        x2="50%"
        y2="100%"
      >
        <stop offset="0%" stopColor="#FF8FA3" />
        <stop offset="100%" stopColor="#FFC2CE" />
      </linearGradient>
    </defs>
    <g
      className={cx(styles.mascotMotion)}
      stroke="#D4D4D4"
      strokeLinecap="round"
    >
      <line x1="96" y1="36" x2="124" y2="36" strokeWidth="3" />
      <line x1="102" y1="50" x2="132" y2="50" strokeWidth="2.5" />
      <line x1="98" y1="64" x2="122" y2="64" strokeWidth="2.5" />
    </g>
    <g className={cx(styles.mascotBody)}>
      <path
        fill="url(#previewMascotGrad)"
        d="M24.5 54c0-22 14.5-36 33.5-36s33.5 14 33.5 36c0 20.5-13 34-33.5 36.5C38 88 24.5 74.5 24.5 54Z"
      />
      <rect x="44" y="40" width="8" height="20" rx="2.5" fill="#1F1F1F" />
      <rect x="62" y="42" width="7.5" height="17" rx="2.5" fill="#1F1F1F" />
    </g>
    <ellipse
      className={cx(styles.mascotShadow)}
      cx="58"
      cy="116"
      rx="26"
      ry="6"
      fill="#E8E8E8"
    />
  </svg>
);

/**
 * iframe 加载遮罩：插画 + 标题 + 说明。
 *
 * @returns 加载遮罩内容
 */
const PreviewIframeLoading: React.FC = () => (
  <div className={cx(styles.iframeLoading)}>
    <PreviewLoadingMascot />
    <p className={cx(styles.iframeLoadingTitle)}>
      {dict('PC.Pages.AppDevPro.previewAppLoading')}
    </p>
    <p className={cx(styles.iframeLoadingHint)}>
      {dict('PC.Pages.AppDevPro.previewAppLoadingHint')}
    </p>
  </div>
);

/**
 * 预览 iframe 展示框：挂载即未加载，先盖应用加载动画，iframe 真实 load 后
 * 才收起动画展示页面；加载失败时收起动画，露 AppDevProIframe 自己的失败提示。
 * 加载状态只活在本组件内：被状态提示替换（卸载）后重新挂载，动画必然重新
 * 出现，不再有跨挂载残留的「已加载」标记把动画跳过、只剩白屏。
 * 地址或刷新计数变化时由父级换 key 重挂，同样重新走动画。
 *
 * @param props.src 预览地址
 * @param props.iframeKey iframe 重挂标记（地址 + 刷新计数）
 * @param props.title 无障碍标题
 * @param props.onPreviewPresented iframe 首次真实加载完成时通知父级
 * @returns 带加载动画的 iframe 展示框
 */
const PreviewIframeFrame: React.FC<{
  src: string;
  iframeKey: string;
  title: string;
  onPreviewPresented?: () => void;
}> = ({ src, iframeKey, title, onPreviewPresented }) => {
  const [loaded, setLoaded] = useState(false);
  const onPreviewPresentedRef = useRef(onPreviewPresented);
  onPreviewPresentedRef.current = onPreviewPresented;

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onPreviewPresentedRef.current?.();
  }, []);
  /** 加载失败时收起动画，露出 iframe 自己的失败提示与刷新按钮 */
  const handleError = useCallback(() => {
    setLoaded(true);
  }, []);
  /** 点刷新重试时重新盖上动画 */
  const handleRetry = useCallback(() => {
    setLoaded(false);
  }, []);

  return (
    <div className={cx(styles.iframeWrap)}>
      <AppDevProIframe
        src={src}
        iframeKey={iframeKey}
        title={title}
        onLoad={handleLoad}
        onError={handleError}
        onRetry={handleRetry}
      />
      {!loaded ? (
        <div className={cx(styles.loadingOverlay)}>
          <PreviewIframeLoading />
        </div>
      ) : null}
    </div>
  );
};

/**
 * 居中提示（准备中 / 启动预览）。
 *
 * @param props.title 标题
 * @param props.hint 说明
 * @param props.action 可选操作按钮
 * @param props.spinning 是否显示加载图标
 * @returns 居中内容
 */
const PreviewHero: React.FC<{
  title?: string;
  hint?: string;
  spinning?: boolean;
  error?: boolean;
  action?: React.ReactNode;
}> = ({ title, hint, spinning = false, error = false, action }) => (
  <div className={cx(styles.hero)}>
    {spinning ? (
      <LoadingOutlined style={{ fontSize: 22 }} />
    ) : error ? (
      <CloseCircleOutlined className={cx(styles.errorIcon)} />
    ) : (
      <div className={cx(styles.mark)} aria-hidden />
    )}
    {title ? (
      <p className={cx(styles.title, { [styles.errorTitle]: error })}>
        {title}
      </p>
    ) : null}
    {hint ? <p className={cx(styles.hint)}>{hint}</p> : null}
    {action}
  </div>
);

/**
 * AppDevPro 应用预览页签。
 * 开发环境：容器启动 → 预览准备中 → 启动服务 → iframe。
 * 线上环境：容器启动 → 直接 iframe，不展示预览准备中。
 * 容器启动失败时展示失败与重试；启动成功后再进入后续预览。
 *
 * @param props 预览面板属性
 * @returns 应用预览面板
 */
const AppDevAppPreviewPanel: React.FC<AppDevAppPreviewPanelProps> = ({
  previewUrl,
  refreshKey = 0,
  running = false,
  busy = false,
  phase = 'idle',
  services,
  errorMessage,
  previewLoadError = '',
  checking = false,
  cancelLoading = false,
  podReady = false,
  containerStatus,
  isGeneratingFiles = false,
  isWaitingForUserConfirmation = false,
  onCancelTask,
  onRetryStart,
  onStart,
  onRefreshPreview,
  onRetryContainer,
  devActionLocked = false,
  allowStoppedHero = false,
  directPreview = false,
  missingProjectFiles = false,
  hasValidProjectFiles = null,
  stopping = false,
  restarting = false,
  holdPreview = false,
  readinessStatus = null,
  readinessReady = null,
  readinessContainerStatus = null,
  readinessContainerOperationAction = null,
  previewAlreadyPresented = false,
  suppressReadinessStatus = false,
  onPreviewPresented,
  prodUndeployed = false,
  onDeploy,
}) => {
  /** 无有效项目文件时的居中提示 */
  const emptyProjectHero = (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        title={dict('PC.Pages.AppDevPro.previewNoProjectFiles')}
        hint={dict('PC.Pages.AppDevPro.previewNoProjectFilesHint')}
      />
    </div>
  );
  const logs = useMemo(() => {
    const lines = flattenTaskLogs(services);
    const errorText = errorMessage?.trim();
    if (errorText && !lines.includes(errorText)) {
      return [...lines, errorText];
    }
    return lines;
  }, [errorMessage, services]);
  /** 启动日志默认收起，点击「查看详情」后展开日志流 */
  const [logDetailOpen, setLogDetailOpen] = useState(false);
  const openStartLogs = useCallback(() => {
    setLogDetailOpen(true);
  }, []);
  /** 启动任务进行中：展示日志区与取消，不是进度条 */
  const isStarting = busy || phase === 'starting' || phase === 'building';
  /**
   * stream 开始或结束时把日志展开状态重置回默认隐藏：展开只有打开、没有
   * 收起入口，不重置的话用户点过一次「查看详情」后，本次失败日志和后续
   * 每次 stream 都会一直摊开，只能刷新页面恢复。成功、失败、取消都算结束。
   */
  const prevIsStartingRef = useRef(isStarting);
  useEffect(() => {
    if (prevIsStartingRef.current === isStarting) {
      return;
    }
    prevIsStartingRef.current = isStarting;
    setLogDetailOpen(false);
  }, [isStarting]);
  const startFailed = phase === 'failed' || phase === 'cancelled';
  /** 仅真正失败时把「启动失败」标红，取消启动不算失败 */
  const startError = phase === 'failed';
  const loadErrorText = previewLoadError.trim();
  /** 启动已成功但页面打不开：不要复用进度流日志板 */
  const previewLoadErrorHero = loadErrorText ? (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        error
        title={loadErrorText}
        action={
          onRefreshPreview ? (
            <Button type="primary" onClick={onRefreshPreview}>
              {dict('PC.Pages.AppDevEditorHeaderRight.refreshPreview')}
            </Button>
          ) : null
        }
      />
    </div>
  ) : null;

  const readinessKind = getUserAppReadinessUiKind(
    readinessStatus,
    readinessReady,
  );
  /** readiness 实测的容器状态：回包里 container.status 为 running */
  const readinessContainerRunning =
    readinessContainerStatus === UserAppContainerStatusEnum.Running;
  /**
   * 判断应用状态前先看容器：容器还没 running 时应用层无从谈起，
   * 预览区走容器启动提示（下方 containerStatus 分支），不按 starting / ready 判断应用。
   * 以页面层容器状态（containerStatus）为准；但 readiness 已实测容器 running 时，
   * 本地容器状态（尤其其他页签 ensure 成功前本页签留下的 error）视为过期，
   * 不再挡住应用状态判断与就绪预览。没有页面层容器状态时视为不拦。
   */
  const containerRunningForReadiness =
    !containerStatus ||
    containerStatus === 'running' ||
    readinessContainerRunning;
  /**
   * readiness 已确认可访问（status 为 ready 且 ready 为 true）时以它为准打开预览。
   * 本地 running 只代表本页签 runtime 的视角：多页签下服务是其他页签拉起的，
   * 本页签 running 可能仍为 false，不能因此挡住已就绪的预览。
   * 本页签的本地停止标记（suppress / 父页面 previewUserStopped）只用于防自动
   * 拉起和决定再启动走 start 还是 restart。展示按 readiness 判断，但本地刚
   * stop 成功、readiness 还停在 ready 的滞后窗口除外：此时服务其实正在下线，
   * 挂 iframe 只会打到预览代理返回的后端「服务已停止」页（见下方
   * stopPendingReadiness 的停止中过渡）。被其他页签重新拉起时，父页面会在
   * readiness 经过 starting（或从 stopping/stopped 跳到就绪）时清掉本地标记，
   * 之后 readiness 说可访问就正常打开。
   * 容器未 running 时不打开，应用状态不作数。
   */
  const readinessAccessible =
    readinessKind === 'access' &&
    !!previewUrl &&
    !suppressReadinessStatus &&
    containerRunningForReadiness;
  // 容器未 running 时一律不挂 iframe，避免打到还没起来的预览域名
  const canShowIframe =
    ((!!previewUrl && running) || readinessAccessible) &&
    containerRunningForReadiness;
  /**
   * 容器已经 running，应用还在准备资源。
   * 容器未 running 时仍走容器启动提示，不提前说容器已启动。
   */
  const showProvisioning =
    readinessKind === 'provisioning' &&
    readinessContainerStatus === UserAppContainerStatusEnum.Running;
  /**
   * 启动 stream 已经失败，但当前环境探测到应用真正就绪。
   * 不再停在失败日志上，直接用预览地址打开页面。
   */
  const previewReadyDespiteFailedStream =
    startFailed &&
    readinessKind === 'access' &&
    !!previewUrl &&
    containerRunningForReadiness;
  /**
   * 页面还没正常打开时，才用就绪状态替换预览。
   * 已经打开过的环境继续显示 iframe，后续探测抖动不再盖住页面。
   * 启动失败但应用已经 ready 且 ready 为 true 时，跳过失败流，直接预览。
   * 已经在调 start 时不再用就绪失败盖住启动过程。
   * 未部署还要已有有效项目文件，否则走「暂无可预览的项目」。
   * 容器已 running 且文件有效时，进页会直接 start，这里不再展示未部署。
   * 首次会话还在进行时不展示未部署，继续走「预览准备中」。
   */
  const conversationInProgress =
    isGeneratingFiles || isWaitingForUserConfirmation;
  /**
   * 已展示过预览的环境，服务明确停止 / 停止中 / 启动中时，
   * 就绪提示要重新挂回来：服务端侧重启（先停后起）不会走「电脑重启」
   * 复位 previewAlreadyPresented，不补这块 iframe 会直出 503 英文原文（NW-286）。
   * starting 在容器已 running 时按启动中展示（多页签下以 readiness 为准，
   * 不再当作瞬时抖动放行旧 iframe）；容器未 running 时不判断应用，
   * 由容器启动提示接管。待 status 为 ready 且 ready 为 true
   * 后自然落回 iframe 打开预览。
   */
  const readinessRegressed =
    readinessKind === 'stopping' ||
    readinessKind === 'stopped' ||
    (readinessKind === 'starting' && containerRunningForReadiness);
  /**
   * starting / stopping / stopped 是 readiness 明确给出的应用生命周期状态：
   * 只要本地没有正在跑的启动 stream，就直接按它展示，不再被「是否展示
   * 过预览」、本地陈旧的 startFailed 和本地停止标记挡住。
   * 多页签下其他页签启停时，本页签 runtime 的 phase 可能是上一次重复 start
   * 失败留下的 failed，若仍要求 !startFailed，启动中提示永远挂不出来，
   * 页面会一直停在已停止空态（顶栏徽标已是启动中，预览区却不变）。
   * 其余状态（provisioning / notDeployed / failed / incomplete）维持原有条件。
   * 容器未 running 时下方 containerStatus 分支会先于本提示返回，不受影响。
   */
  const readinessLifecycleHero =
    // 展示直接跟随 readiness：stop 接口成功只是受理，服务可能还在下线中，
    // 本地停止标记不再压制任何生命周期状态——stopping 显示停止中、
    // stopped 才显示已停止、starting 显示启动中。再启动走 start 还是
    // restart 由父页面按本地停止标记选 onStart，与展示无关。
    !isStarting &&
    (readinessKind === 'starting' ||
      readinessKind === 'stopping' ||
      readinessKind === 'stopped');
  const showReadinessHero =
    readinessLifecycleHero ||
    ((!previewAlreadyPresented || readinessRegressed) &&
      !startFailed &&
      !isStarting &&
      (showProvisioning ||
        (readinessKind === 'notDeployed' &&
          hasValidProjectFiles === true &&
          !conversationInProgress &&
          readinessContainerStatus !== UserAppContainerStatusEnum.Running) ||
        readinessKind === 'failed' ||
        readinessKind === 'incomplete'));
  const readinessTitle = (() => {
    switch (readinessKind) {
      case 'provisioning':
        return dict('PC.Pages.AppDevPro.readinessProvisioning');
      case 'stopping':
        return dict('PC.Pages.AppDevPro.readinessServiceStopping');
      case 'notDeployed':
        return dict('PC.Pages.AppDevPro.readinessNotDeployed');
      case 'failed':
        return dict('PC.Pages.AppDevPro.readinessStartFailed');
      case 'incomplete':
        return dict('PC.Pages.AppDevPro.readinessDevIncomplete');
      default:
        return dict('PC.Pages.AppDevPro.readinessServiceStarting');
    }
  })();
  /** 未部署和启动失败可以手动重启；开发未完成只提示，不提供重启 */
  const showReadinessRestart =
    readinessKind === 'notDeployed' || readinessKind === 'failed';
  const readinessIsError =
    readinessKind === 'failed' || readinessKind === 'incomplete';
  /**
   * 已停止（多为其他页签停的，本页签 suppressReadinessStatus 为 false）：
   * 与本页签主动停止后的空态一致，不转圈、不落到默认的「服务正在启动中」，
   * 展示已停止提示并提供「启动预览」。stopping 仍走上面的转圈提示。
   */
  const readinessStopped = readinessKind === 'stopped';
  const readinessHero = showReadinessHero ? (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        spinning={
          !readinessStopped &&
          !readinessIsError &&
          readinessKind !== 'notDeployed'
        }
        error={readinessIsError}
        title={
          readinessStopped
            ? undefined
            : readinessKind === 'stopping'
            ? // 与本页签停止中的提示同一套文案，避免多页签下 stopping 阶段展示不一致
              dict('PC.Pages.AppDevPro.previewStopping')
            : readinessTitle
        }
        hint={
          readinessStopped
            ? dict('PC.Pages.AppDevPro.previewStartHint')
            : readinessKind === 'stopping'
            ? dict('PC.Pages.AppDevPro.previewStoppingHint')
            : undefined
        }
        action={
          readinessStopped ? (
            onStart ? (
              <Tooltip
                title={
                  devActionLocked
                    ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                    : undefined
                }
              >
                <span>
                  <Button
                    type="primary"
                    disabled={devActionLocked}
                    onClick={onStart}
                  >
                    {dict('PC.Pages.AppDevPro.previewStartTitle')}
                  </Button>
                </span>
              </Tooltip>
            ) : null
          ) : showReadinessRestart && onRetryStart ? (
            <Tooltip
              title={
                devActionLocked
                  ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                  : undefined
              }
            >
              <span>
                <Button
                  type="primary"
                  loading={isStarting || restarting}
                  disabled={devActionLocked}
                  onClick={onRetryStart}
                >
                  {dict('PC.Pages.AppDevPro.readinessRestartApp')}
                </Button>
              </span>
            </Tooltip>
          ) : null
        }
      />
    </div>
  ) : null;

  /**
   * 本页签刚 stop 成功、readiness 还没跟上的过渡态：后端其实已经在下线，
   * readiness 却还停在 ready（滞后一两轮轮询）。这段时间不能按 ready 挂
   * iframe，否则会加载到预览代理返回的后端「服务已停止」页；也不能先报
   * 已停止。统一显示停止中，等 readiness 走到 stopping / stopped 再切换。
   * ready 但 ready 标记已先掉（kind 为 null）同理。
   */
  const stopPendingReadiness =
    suppressReadinessStatus &&
    !isStarting &&
    (readinessKind === 'access' ||
      (readinessStatus === UserAppReadinessStatusEnum.Ready &&
        readinessReady !== true));
  const stopPendingHero = stopPendingReadiness ? (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        spinning
        title={dict('PC.Pages.AppDevPro.previewStopping')}
        hint={dict('PC.Pages.AppDevPro.previewStoppingHint')}
      />
    </div>
  ) : null;

  /**
   * 线上 start / restart 都会先重启容器、再启动应用：容器还在 stopping 等
   * 过渡状态时，应用层 readiness 会先报 starting。操作页签靠本地 restarting
   * 显示「正在重启服务」，其他页签若只按应用状态会显示「服务正在启动中」，
   * 两边不一致。容器处于重启过渡（容器 stopping / restarting，或容器意图
   * 操作是 restart 且容器还没回到 running）且应用在 starting 时，非操作
   * 页签统一改为与操作页签相同的重启提示；容器回到 running 后再按应用
   * 状态展示启动中。本页签正在跑本地任务时不介入，走本地流程自己的提示。
   */
  const readinessContainerRestarting =
    directPreview &&
    !isStarting &&
    readinessKind === 'starting' &&
    readinessContainerStatus !== UserAppContainerStatusEnum.Running &&
    (readinessContainerStatus === UserAppContainerStatusEnum.Stopping ||
      readinessContainerStatus === UserAppContainerStatusEnum.Restarting ||
      readinessContainerOperationAction === 'restart');
  const containerRestartHero = readinessContainerRestarting ? (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        spinning
        title={dict('PC.Pages.AppDevPro.previewRestarting')}
        hint={dict('PC.Pages.AppDevPro.previewRestartingHint')}
      />
    </div>
  ) : null;

  if (prodUndeployed) {
    return (
      <div className={cx(styles.container, styles.stage)}>
        <PreviewHero
          title={dict('PC.Pages.AppDevPro.prodNotDeployedTitle')}
          hint={dict('PC.Pages.AppDevPro.prodNotDeployedHint')}
          action={
            onDeploy ? (
              <Button type="primary" onClick={onDeploy}>
                {dict('PC.Pages.AppDevPro.prodNotDeployedAction')}
              </Button>
            ) : null
          }
        />
      </div>
    );
  }

  // 容器启动失败时展示失败提示。资源准备中且容器已 running 时改走下面的就绪提示。
  // readiness 已实测容器 running 时，本地 error/starting 是过期状态（多页签下容器
  // 是其他页签拉起的），不展示失败，跟随 readiness 的应用状态走。
  if (
    containerStatus &&
    containerStatus !== 'running' &&
    !showProvisioning &&
    !readinessContainerRunning
  ) {
    return (
      <AppDevServiceStartStatus
        failed={containerStatus === 'error'}
        onRetry={onRetryContainer}
      />
    );
  }

  // 电脑重启后容器还没确认起来：卸掉 iframe，避免立刻去打预览域名
  if (holdPreview) {
    return (
      <div className={cx(styles.container, styles.stage)}>
        <PreviewHero
          spinning
          title={dict('PC.Pages.AppDevPro.previewRestarting')}
          hint={dict('PC.Pages.AppDevPro.previewRestartingHint')}
        />
      </div>
    );
  }

  // 没有有效项目文件时展示空项目提示
  if (
    !previewAlreadyPresented &&
    !suppressReadinessStatus &&
    !startFailed &&
    !conversationInProgress &&
    readinessKind === 'notDeployed' &&
    hasValidProjectFiles === false
  ) {
    return emptyProjectHero;
  }

  // 启动 stream 已成功，应用还不能访问：只显示 iframe 加载动画，先不放域名。
  // 放在就绪提示前面，避免探测先返回 failed 等状态把等待盖住。
  if (checking) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.iframeWrap)}>
          <div className={cx(styles.loadingOverlay)}>
            <PreviewIframeLoading />
          </div>
        </div>
      </div>
    );
  }

  if (stopPendingHero) {
    return stopPendingHero;
  }

  if (containerRestartHero) {
    return containerRestartHero;
  }

  if (readinessHero) {
    return readinessHero;
  }

  /** 线上环境：停止 / 重启 / 启动与开发环境同一套提示，仅在服务运行中展示 iframe */
  if (directPreview && !startFailed) {
    if (restarting) {
      return (
        <div className={cx(styles.container, styles.stage)}>
          <PreviewHero
            spinning
            title={dict('PC.Pages.AppDevPro.previewRestarting')}
            hint={dict('PC.Pages.AppDevPro.previewRestartingHint')}
          />
        </div>
      );
    }

    if (stopping) {
      return (
        <div className={cx(styles.container, styles.stage)}>
          <PreviewHero
            spinning
            title={dict('PC.Pages.AppDevPro.previewStopping')}
            hint={dict('PC.Pages.AppDevPro.previewStoppingHint')}
          />
        </div>
      );
    }

    if (missingProjectFiles) {
      return emptyProjectHero;
    }

    if (previewLoadErrorHero && !isStarting) {
      return previewLoadErrorHero;
    }

    // readiness 已就绪时不看本地 running，直接落到下面的 iframe
    if (!running && !readinessAccessible && allowStoppedHero) {
      return (
        <div className={cx(styles.container, styles.stage)}>
          <PreviewHero
            hint={dict('PC.Pages.AppDevPro.previewStartHint')}
            action={
              onStart ? (
                <Tooltip
                  title={
                    devActionLocked
                      ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                      : undefined
                  }
                >
                  <span>
                    <Button
                      type="primary"
                      loading={isStarting}
                      disabled={devActionLocked}
                      onClick={onStart}
                    >
                      {dict('PC.Pages.AppDevPro.previewStartTitle')}
                    </Button>
                  </span>
                </Tooltip>
              ) : null
            }
          />
        </div>
      );
    }

    if (!running && !readinessAccessible && !allowStoppedHero) {
      return (
        <div className={cx(styles.container, styles.stage)}>
          <PreviewHero
            spinning
            title={dict('PC.Pages.AppDevPro.previewPreparing')}
            hint={dict('PC.Pages.AppDevPro.previewPreparingHint')}
          />
        </div>
      );
    }

    if (previewUrl) {
      return (
        <div className={cx(styles.container)}>
          <PreviewIframeFrame
            key={`${previewUrl}-${refreshKey}`}
            src={previewUrl}
            iframeKey={`${previewUrl}-${refreshKey}`}
            title={dict('PC.Pages.AppDevPro.appPreview')}
            onPreviewPresented={onPreviewPresented}
          />
        </div>
      );
    }

    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.hero)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.appPreviewEmpty')}
          />
        </div>
      </div>
    );
  }

  if (stopping) {
    return (
      <div className={cx(styles.container, styles.stage)}>
        <PreviewHero
          spinning
          title={dict('PC.Pages.AppDevPro.previewStopping')}
          hint={dict('PC.Pages.AppDevPro.previewStoppingHint')}
        />
      </div>
    );
  }

  if (missingProjectFiles) {
    return emptyProjectHero;
  }

  if (previewLoadErrorHero && !isStarting) {
    return previewLoadErrorHero;
  }

  // 已有可预览内容时，新会话进行中仍保留当前页面，不切回准备中
  if (
    !canShowIframe &&
    !previewReadyDespiteFailedStream &&
    (isGeneratingFiles || isWaitingForUserConfirmation || !podReady)
  ) {
    return (
      <div className={cx(styles.container, styles.stage)}>
        <PreviewHero
          spinning
          title={
            isWaitingForUserConfirmation
              ? dict('PC.Pages.AppDevPro.confirmingDevelopment')
              : dict('PC.Pages.AppDevPro.previewPreparing')
          }
          hint={
            isWaitingForUserConfirmation
              ? dict('PC.Pages.AppDevPro.confirmingDevelopmentHint')
              : isGeneratingFiles
              ? dict('PC.Pages.AppDevPro.previewGeneratingHint')
              : dict('PC.Pages.AppDevPro.previewPreparingHint')
          }
        />
      </div>
    );
  }

  if ((isStarting || startFailed) && !previewReadyDespiteFailedStream) {
    const headText = startFailed
      ? phase === 'cancelled'
        ? dict('PC.Pages.AppDevPro.startCancelled')
        : dict('PC.Pages.AppDevPro.startFailed')
      : dict('PC.Pages.AppDevPro.startingService');

    return (
      <div className={cx(styles.container, styles.stage)}>
        <div className={cx(styles.logBoard)}>
          <div className={cx(styles.logHead)}>
            {!startFailed ? <LoadingOutlined /> : null}
            <span
              className={cx(
                styles.logHeadText,
                startError && styles.logHeadTextError,
              )}
            >
              {headText}
            </span>
            {isStarting && onCancelTask ? (
              <Button
                size="small"
                loading={cancelLoading}
                onClick={onCancelTask}
              >
                {dict('PC.Pages.AppDevPro.cancelTask')}
              </Button>
            ) : null}
            {startFailed && onRetryStart ? (
              <Tooltip
                title={
                  devActionLocked
                    ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                    : !podReady
                    ? dict('PC.Pages.AppDevPro.previewPreparing')
                    : undefined
                }
              >
                <span>
                  <Button
                    size="small"
                    type="primary"
                    disabled={devActionLocked || !podReady}
                    onClick={onRetryStart}
                  >
                    {dict('PC.Pages.AppDevPro.previewStartRetry')}
                  </Button>
                </span>
              </Tooltip>
            ) : null}
          </div>
          {logDetailOpen ? (
            <PreviewStartLogBoard
              logs={logs}
              waitingText={dict('PC.Pages.AppDevPro.waitingLogs')}
            />
          ) : (
            <div className={cx(styles.logHidden)}>
              <FileTextOutlined className={cx(styles.logHiddenIcon)} />
              <p className={cx(styles.logHiddenText)}>
                {dict('PC.Pages.AppDevPro.startLogsHiddenHint')}
                <button
                  type="button"
                  className={cx(styles.logHiddenAction)}
                  onClick={openStartLogs}
                >
                  {dict('PC.Pages.AppDevPro.viewStartLogs')}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (canShowIframe || previewReadyDespiteFailedStream) {
    return (
      <div className={cx(styles.container)}>
        <PreviewIframeFrame
          key={`${previewUrl}-${refreshKey}`}
          src={previewUrl}
          iframeKey={`${previewUrl}-${refreshKey}`}
          title={dict('PC.Pages.AppDevPro.appPreview')}
          onPreviewPresented={onPreviewPresented}
        />
      </div>
    );
  }

  if ((running || directPreview) && !previewUrl) {
    return (
      <div className={cx(styles.container)}>
        <div className={cx(styles.hero)}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={dict('PC.Pages.AppDevPro.appPreviewEmpty')}
          />
        </div>
      </div>
    );
  }

  if (!allowStoppedHero) {
    return (
      <div className={cx(styles.container, styles.stage)}>
        <PreviewHero
          spinning
          title={dict('PC.Pages.AppDevPro.previewPreparing')}
          hint={dict('PC.Pages.AppDevPro.previewPreparingHint')}
        />
      </div>
    );
  }

  return (
    <div className={cx(styles.container, styles.stage)}>
      <PreviewHero
        hint={dict('PC.Pages.AppDevPro.previewStartHint')}
        action={
          onStart ? (
            <Tooltip
              title={
                devActionLocked
                  ? dict('PC.Pages.AppDevPro.devActionBusyHint')
                  : undefined
              }
            >
              <span>
                <Button
                  type="primary"
                  disabled={devActionLocked}
                  onClick={onStart}
                >
                  {dict('PC.Pages.AppDevPro.previewStartTitle')}
                </Button>
              </span>
            </Tooltip>
          ) : null
        }
      />
    </div>
  );
};

export default AppDevAppPreviewPanel;
