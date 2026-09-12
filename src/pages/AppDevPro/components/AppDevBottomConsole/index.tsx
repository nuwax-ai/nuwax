import { SvgIcon } from '@/components/base';
import type { EmbeddedConsoleTerminalRef } from '@/components/business-component/Terminal/EmbeddedConsoleTerminal';
import EmbeddedConsoleTerminal from '@/components/business-component/Terminal/EmbeddedConsoleTerminal';
import { DEFAULT_TERMINAL_RECONNECT } from '@/components/business-component/Terminal/terminalReconnect';
import type { TerminalWireProtocol } from '@/components/business-component/Terminal/type';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiEnsurePod,
  apiKeepalivePod,
  isEnsurePodThrottledError,
  type ComputerPodAppStage,
} from '@/services/vncDesktop';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import {
  DownOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  ReloadOutlined,
  SunOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { UserAppDbEnvEnum } from '../../services/appDb';
import DevLogPanel from './DevLogPanel';
import styles from './index.less';
import {
  CONSOLE_TERMINAL_FONT_FAMILY,
  DEFAULT_TERMINAL_APPEARANCE,
  getConsoleTerminalTheme,
  type TerminalAppearanceMode,
} from './terminalTheme';

export type { TerminalAppearanceMode } from './terminalTheme';

const cx = classNames.bind(styles);

/** 底部控制台内部 Tab：开发终端 / 线上终端 / 日志 */
export type AppDevConsoleTab = 'terminal-dev' | 'terminal-prod' | 'logs';

/** 对外仍按「终端 / 日志」两组回传，避免页面其它逻辑改动 */
export type AppDevConsoleTabGroup = 'terminal' | 'logs';

/** 底部控制台布局模式 */
export type ConsoleLayoutMode = 'default' | 'expanded' | 'collapsed';

/**
 * 页面层容器状态。
 * 未传时打开终端仍由本组件 ensure；传入后打开终端优先复用进页启动结果。
 */
export type ConsoleExternalContainerStatus = 'starting' | 'running' | 'error';

/** 按 Header 环境落到对应终端 Tab */
const tabFromEnv = (env: UserAppDbEnvEnum): AppDevConsoleTab =>
  env === UserAppDbEnvEnum.Prod ? 'terminal-prod' : 'terminal-dev';

/** 内部 Tab 映射为页面对外感知的终端 / 日志分组 */
const toTabGroup = (tab: AppDevConsoleTab): AppDevConsoleTabGroup =>
  tab === 'logs' ? 'logs' : 'terminal';

/** 开发服务器日志相关配置（网页应用） */
export interface AppDevBottomConsoleDevLogProps {
  logs: DevLogEntry[];
  latestErrorLogs?: string;
  isLoading?: boolean;
  lastLine?: number;
  onAddToChat?: (content: string, isAuto?: boolean) => void;
  isChatLoading?: boolean;
}

export interface AppDevBottomConsoleProps {
  /** 是否显示面板 @default true */
  visible?: boolean;
  /** 运行日志纯文本 */
  runtimeLogs?: string;
  /** 开发服务器结构化日志；传入后日志 Tab 使用 DevLogPanel */
  devLog?: AppDevBottomConsoleDevLogProps;
  /** Header 当前环境：切换时展示对应终端 Tab */
  env?: UserAppDbEnvEnum;
  /** 开发环境终端 WebSocket 地址 */
  devWsUrl?: string;
  /** 线上环境终端 WebSocket 地址 */
  prodWsUrl?: string;
  /**
   * 会话 ID；传入后首次展开终端时按需接入容器，
   * 容器就绪后才允许终端发起 WebSocket 连接。
   * 若不传，则不启动容器，终端在有 wsUrl 时直接连接。
   */
  conversationId?: number;
  /**
   * 全栈应用环境，用于 computer/pod 接口的 appStage。
   * 打开某个终端 Tab 时按该 Tab 对应环境 ensure；此值作为日志 Tab 下的兜底。
   */
  appStage?: ComputerPodAppStage;
  /**
   * 页面层容器状态（仅开发环境预启动）。
   * - running：进页已启动成功，打开开发终端只保活并连接，不再 ensure
   * - starting：进页正在启动，打开开发终端等待页面结果
   * - error：进页启动失败，打开开发终端再 ensure
   * 线上终端始终由本组件 ensure。
   */
  externalContainerStatus?: ConsoleExternalContainerStatus;
  /**
   * 容器启动成功后是否开启保活轮询 @default true
   * 网页应用开发只需要确保/重启服务，不需要轮询保活接口。
   */
  enableKeepalivePolling?: boolean;
  /** WebSocket 子协议（ttyd 需传 ['tty']） */
  wsSubprotocols?: string | string[];
  /** 终端消息格式（'plain' | 'ttyd'） */
  wireProtocol?: TerminalWireProtocol;
  /** 终端主题（受控）；不传时由组件内部维护 */
  terminalAppearance?: TerminalAppearanceMode;
  /** 终端主题默认值（非受控） */
  defaultTerminalAppearance?: TerminalAppearanceMode;
  /** 终端主题切换回调 */
  onTerminalAppearanceChange?: (mode: TerminalAppearanceMode) => void;
  /** 是否显示终端主题切换按钮 @default true */
  showTerminalAppearanceToggle?: boolean;
  /** 信号值变化时将 expanded 布局重置为 default（如外部布局变动） */
  layoutResetSignal?: number;
  /** 信号值变化时切到终端 Tab 并全屏展开（如点击「终端」入口） */
  expandSignal?: number;
  /** 信号值变化时切到终端 Tab（折叠时恢复默认高度，如点击「终端」图标） */
  terminalSignal?: number;
  /** 信号值变化时将面板折叠为仅保留头部 */
  collapseSignal?: number;
  /** 信号值变化时切到日志 Tab（折叠时恢复默认高度，如点击「日志」图标） */
  logsSignal?: number;
  /** 布局模式变化回调（供外部感知折叠/展开状态） */
  onLayoutModeChange?: (mode: ConsoleLayoutMode) => void;
  /** 激活 Tab 变化回调（供外部感知当前显示终端还是日志） */
  onActiveTabChange?: (tab: AppDevConsoleTabGroup) => void;
  /** 打开控制台时的默认 Tab @default 'terminal' */
  defaultActiveTab?: 'terminal' | 'logs';
  /** 打开控制台时的默认布局模式 @default 'collapsed' */
  defaultLayoutMode?: ConsoleLayoutMode;
  /** 是否显示日志 Tab @default true */
  showLogsTab?: boolean;
  /** 头部操作区额外内容（渲染在内置按钮之前），仅日志 Tab 激活时显示 */
  logsExtra?: React.ReactNode;
  className?: string;
}

/**
 * AppDevPro 底部终端 + 日志合集面板（页面内副本，不影响其它页面）。
 * - 开发 / 线上两个终端 Tab 常驻挂载，Header 环境切换时展示对应终端
 * - 日志 Tab：DevLogPanel（devLog）或 runtimeLogs 纯文本
 */
const AppDevBottomConsole: React.FC<AppDevBottomConsoleProps> = ({
  visible = true,
  runtimeLogs = '',
  devLog,
  env = UserAppDbEnvEnum.Dev,
  devWsUrl,
  prodWsUrl,
  conversationId,
  appStage,
  externalContainerStatus,
  enableKeepalivePolling = true,
  wsSubprotocols,
  wireProtocol,
  terminalAppearance: terminalAppearanceProp,
  defaultTerminalAppearance = DEFAULT_TERMINAL_APPEARANCE,
  onTerminalAppearanceChange,
  showTerminalAppearanceToggle = true,
  layoutResetSignal,
  expandSignal,
  terminalSignal,
  collapseSignal,
  logsSignal,
  onLayoutModeChange,
  onActiveTabChange,
  defaultActiveTab = 'terminal',
  defaultLayoutMode = 'collapsed',
  showLogsTab = true,
  logsExtra,
  className,
}) => {
  /** 当前激活的 Tab（开发终端 / 线上终端 / 日志） */
  const [activeTab, setActiveTab] = useState<AppDevConsoleTab>(
    showLogsTab && defaultActiveTab === 'logs' ? 'logs' : tabFromEnv(env),
  );
  /** 面板布局模式：default 默认高度 / expanded 全屏 / collapsed 仅保留头部 */
  const [layoutMode, setLayoutMode] =
    useState<ConsoleLayoutMode>(defaultLayoutMode);
  /** 终端主题（非受控时的内部状态） */
  const [internalAppearance, setInternalAppearance] =
    useState<TerminalAppearanceMode>(defaultTerminalAppearance);
  /** 开发环境终端实例 */
  const devTerminalRef = useRef<EmbeddedConsoleTerminalRef>(null);
  /** 线上环境终端实例 */
  const prodTerminalRef = useRef<EmbeddedConsoleTerminalRef>(null);
  /** 终端当前连接状态（用于控制断连后再触发容器兜底重启） */
  const terminalConnectedRef = useRef<boolean>(false);
  /** 终端是否曾成功连接过（避免首次连接前误判为”断开”） */
  const terminalConnectedOnceRef = useRef<boolean>(false);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;
  const layoutModeRef = useRef(layoutMode);
  layoutModeRef.current = layoutMode;
  /** 用户是否曾展开过终端面板（首次展开后才触发容器启动/WS连接） */
  const terminalActivatedRef = useRef<boolean>(false);
  /** 上一次 layoutMode 值，用于检测首次从 collapsed 展开 */
  const prevLayoutModeRef = useRef<ConsoleLayoutMode>(defaultLayoutMode);
  /** 终端自动重连耗尽后显示手动重连按钮 */
  const [showTerminalReconnect, setShowTerminalReconnect] =
    useState<boolean>(false);
  /** 手动重连 loading */
  const [isTerminalReconnecting, setIsTerminalReconnecting] =
    useState<boolean>(false);
  /** 断连后预热容器的防抖定时器（自动重连前尽量 ensurePod） */
  const ensurePodOnDisconnectTimerRef = useRef<number | null>(null);
  /** ensure 进行中，避免 handleFirstExpand 重复触发 */
  const ensureInFlightRef = useRef<boolean>(false);

  /** 是否需要先启动服务再连接终端（由 conversationId 决定） */
  const requiresServiceStart = Boolean(conversationId);

  const getTerminalRef = (targetEnv: UserAppDbEnvEnum) =>
    targetEnv === UserAppDbEnvEnum.Prod ? prodTerminalRef : devTerminalRef;

  const getTerminalWsUrl = (targetEnv: UserAppDbEnvEnum) =>
    targetEnv === UserAppDbEnvEnum.Prod ? prodWsUrl : devWsUrl;

  /** 当前可见终端对应的环境（日志 Tab 时按开发兜底，ensure 另用上次环境） */
  const activeTerminalEnv: UserAppDbEnvEnum =
    activeTab === 'terminal-prod'
      ? UserAppDbEnvEnum.Prod
      : UserAppDbEnvEnum.Dev;
  const activeWsUrl = getTerminalWsUrl(activeTerminalEnv);
  const lastEnsureStageRef = useRef<ComputerPodAppStage>(
    appStage ?? UserAppDbEnvEnum.Dev,
  );
  const activeEnsureStage: ComputerPodAppStage =
    activeTab === 'logs' ? lastEnsureStageRef.current : activeTerminalEnv;
  if (activeTab !== 'logs') {
    lastEnsureStageRef.current = activeEnsureStage;
  }
  const activeEnsureStageRef = useRef(activeEnsureStage);
  activeEnsureStageRef.current = activeEnsureStage;

  /**
   * 容器启动状态机：
   * - idle：未启动 / 未传 conversationId（后者表示无需容器，终端可直接连 WS）
   * - starting：apiEnsurePod 调用中，终端等待
   * - running：容器已就绪，终端可连接，保活轮询中
   * - error：容器启动或保活失败，显示重试按钮，终端不可连接
   */
  const [containerStatus, setContainerStatus] = useState<
    'idle' | 'starting' | 'running' | 'error'
  >('idle');
  const containerStatusRef = useRef(containerStatus);
  containerStatusRef.current = containerStatus;

  /**
   * 保活轮询（useRequest 自动管理定时器、页面可见性暂停/恢复）
   * 使用 ref 持有 run/cancel，避免闭包陷阱并保证 startContainer 引用稳定
   */
  const runKeepaliveRef = useRef<(cId: number) => void>(() => {});
  const stopKeepaliveRef = useRef<() => void>(() => {});
  /** 用 ref 持有当前终端环境，避免保活轮询闭包读到过期环境 */
  const appStageRef = useRef<ComputerPodAppStage | undefined>(
    activeEnsureStage,
  );
  appStageRef.current = activeEnsureStage;

  const ensurePodWithStage = useCallback(
    (cId: number) => apiEnsurePod(cId, appStageRef.current),
    [],
  );
  const keepalivePodWithStage = useCallback(
    (cId: number) => apiKeepalivePod(cId, appStageRef.current),
    [],
  );

  const { run: runKeepalivePodPolling, cancel: stopKeepalivePodPolling } =
    useRequest(keepalivePodWithStage, {
      manual: true,
      loadingDelay: 30000,
      debounceWait: 5000,
      pollingInterval: 60000, // 60 秒保活一次
      pollingWhenHidden: false, // 屏幕不可见时暂停
      pollingErrorRetryCount: -1, // 网络错误无限重试
      // 页面重新可见时，调用 apiEnsurePod 确保容器运行
      onBefore: async (params) => {
        const shouldEnsureContainer =
          document.visibilityState === 'visible' &&
          params[0] &&
          terminalConnectedOnceRef.current &&
          !terminalConnectedRef.current;

        if (shouldEnsureContainer) {
          try {
            await ensurePodWithStage(params[0]);
          } catch (error) {
            console.error('[keepalive] apiEnsurePod failed:', error);
          }
        }
      },
      onSuccess: (result) => {
        // HTTP 成功但业务码失败 → 视为保活失败，停止轮询并显示错误
        if (result.code !== SUCCESS_CODE) {
          setContainerStatus('error');
          stopKeepaliveRef.current();
        }
      },
      onError: (error) => {
        console.error('[keepalive] Pod keepalive error:', error);
        setContainerStatus('error');
        stopKeepaliveRef.current();
      },
    });

  // 同步 ref，保证 startContainer / useLayoutEffect 中始终拿到最新引用
  runKeepaliveRef.current = runKeepalivePodPolling;
  stopKeepaliveRef.current = stopKeepalivePodPolling;

  /** 启动容器并开启保活轮询 */
  const startContainer = useCallback(
    async (cId: number): Promise<boolean> => {
      setContainerStatus('starting');
      try {
        const { code } = await ensurePodWithStage(cId);
        if (code === SUCCESS_CODE) {
          setContainerStatus('running');
          if (enableKeepalivePolling) {
            runKeepaliveRef.current(cId);
          }
          return true;
        } else {
          setContainerStatus('error');
          return false;
        }
      } catch (error: unknown) {
        // 智能体电脑等外部刚调过 ensure 时会被 5s 限流，容器已在运行，终端可直接连接
        if (isEnsurePodThrottledError(error)) {
          setContainerStatus('running');
          if (enableKeepalivePolling) {
            runKeepaliveRef.current(cId);
          }
          return true;
        }
        setContainerStatus('error');
        return false;
      }
    },
    [enableKeepalivePolling, ensurePodWithStage],
  );

  /** 挂载时仅清理状态，不自动启动容器；等用户首次展开时触发 */
  useLayoutEffect(() => {
    ensureInFlightRef.current = false;

    if (!conversationId) {
      setContainerStatus('idle');
      terminalConnectedRef.current = false;
      terminalConnectedOnceRef.current = false;
      return;
    }

    // 清理旧的保活轮询，重置状态，但不启动容器
    if (enableKeepalivePolling) {
      stopKeepaliveRef.current();
    }
    setContainerStatus('idle');
    terminalConnectedRef.current = false;
    terminalConnectedOnceRef.current = false;

    return () => {
      if (enableKeepalivePolling) {
        stopKeepaliveRef.current();
      }
    };
  }, [conversationId, enableKeepalivePolling]);

  useEffect(() => {
    return () => {
      if (ensurePodOnDisconnectTimerRef.current) {
        window.clearTimeout(ensurePodOnDisconnectTimerRef.current);
        ensurePodOnDisconnectTimerRef.current = null;
      }
    };
  }, [conversationId]);

  /** 用 ref 持有页面层容器状态，避免 attach 闭包读到过期值 */
  const externalContainerStatusRef = useRef(externalContainerStatus);
  externalContainerStatusRef.current = externalContainerStatus;

  /**
   * 打开终端时接入容器：
   * - 页面层已 running：不再 ensure，只保活后连接
   * - 页面层正在 starting：等待页面结果
   * - 页面层失败或未接管：由终端 ensure 成功后再连接
   */
  const attachOrStartContainer = useCallback(() => {
    // 折叠时不 ensure / 不拉起新连接，等展开或点击终端图标再接入
    if (
      !conversationId ||
      ensureInFlightRef.current ||
      layoutModeRef.current === 'collapsed'
    ) {
      return;
    }

    // 进页预启动只覆盖开发环境；线上终端始终由本组件 ensure
    const external =
      activeEnsureStageRef.current === UserAppDbEnvEnum.Dev
        ? externalContainerStatusRef.current
        : undefined;
    const status = containerStatusRef.current;

    if (external === 'running') {
      if (status !== 'running') {
        setContainerStatus('running');
        if (enableKeepalivePolling) {
          runKeepaliveRef.current(conversationId);
        }
      }
      return;
    }

    if (external === 'starting') {
      if (status !== 'starting') {
        setContainerStatus('starting');
      }
      return;
    }

    // 页面未接管或启动失败：running 说明终端侧已经拉起过，不再重复 ensure
    if (status === 'running') {
      return;
    }

    ensureInFlightRef.current = true;
    void startContainer(conversationId).finally(() => {
      ensureInFlightRef.current = false;
    });
  }, [conversationId, enableKeepalivePolling, startContainer]);

  /** 用户首次展开终端面板时，触发容器接入 / 终端直接连接 */
  const handleFirstExpand = useCallback(() => {
    terminalActivatedRef.current = true;
    attachOrStartContainer();
  }, [attachOrStartContainer]);

  /**
   * 进页容器状态变化后，若用户已打开终端，按最新结果接入：
   * 启动成功则只保活；启动失败则由终端 ensure。
   */
  useEffect(() => {
    if (!conversationId || !terminalActivatedRef.current) {
      return;
    }
    attachOrStartContainer();
  }, [attachOrStartContainer, conversationId, externalContainerStatus]);

  /**
   * 切换开发/线上终端后，当前容器状态作废。
   * 若终端已打开，按新环境重新接入（已就绪则只保活，否则 ensure）。
   */
  const prevEnsureStageRef = useRef(activeEnsureStage);
  useEffect(() => {
    if (prevEnsureStageRef.current === activeEnsureStage) {
      return;
    }
    prevEnsureStageRef.current = activeEnsureStage;
    if (!conversationId) {
      return;
    }
    ensureInFlightRef.current = false;
    if (enableKeepalivePolling) {
      stopKeepaliveRef.current();
    }
    setContainerStatus('idle');
    containerStatusRef.current = 'idle';
    setShowTerminalReconnect(false);
    // 折叠时只记住新环境，不 ensure、不连 WS；展开后再接入
    if (terminalActivatedRef.current && layoutModeRef.current !== 'collapsed') {
      attachOrStartContainer();
    }
  }, [
    activeEnsureStage,
    attachOrStartContainer,
    conversationId,
    enableKeepalivePolling,
  ]);

  /** 终端可见后 fit / sync / focus（委托给 EmbeddedConsoleTerminal） */
  const syncTerminalLayoutAndFocus = useCallback(() => {
    const targetEnv =
      activeTabRef.current === 'terminal-prod'
        ? UserAppDbEnvEnum.Prod
        : UserAppDbEnvEnum.Dev;
    getTerminalRef(targetEnv).current?.restoreAfterVisibilityChange();
  }, []);

  /** 折叠恢复可见后多轮 restore，覆盖布局动画与浏览器重排延迟 */
  const scheduleTerminalRestoreAfterExpand = useCallback(() => {
    const restore = () => {
      const targetEnv =
        activeTabRef.current === 'terminal-prod'
          ? UserAppDbEnvEnum.Prod
          : UserAppDbEnvEnum.Dev;
      getTerminalRef(targetEnv).current?.restoreAfterVisibilityChange();
    };
    window.requestAnimationFrame(() => {
      restore();
      window.setTimeout(restore, 50);
      window.setTimeout(restore, 150);
      window.setTimeout(restore, 350);
    });
  }, []);

  /** 监听 layoutMode 变化，检测首次从 collapsed 展开 */
  useEffect(() => {
    const prevMode = prevLayoutModeRef.current;
    // 两种情况触发首次启动：
    // 1. 首次渲染时已是非折叠状态（如 defaultLayoutMode="default"）
    // 2. 从折叠展开为非折叠状态
    const isFirstExpand =
      (!terminalActivatedRef.current && layoutMode !== 'collapsed') ||
      (layoutMode !== 'collapsed' && prevMode === 'collapsed');

    if (isFirstExpand) {
      handleFirstExpand();
    }

    // 从折叠恢复：终端仍连着 WS 但 xterm 在 display:none 内尺寸/焦点会失效
    if (
      layoutMode !== 'collapsed' &&
      prevMode === 'collapsed' &&
      activeTab !== 'logs' &&
      activeWsUrl &&
      visible
    ) {
      scheduleTerminalRestoreAfterExpand();
    }

    prevLayoutModeRef.current = layoutMode;
  }, [
    activeTab,
    activeWsUrl,
    handleFirstExpand,
    layoutMode,
    scheduleTerminalRestoreAfterExpand,
    visible,
  ]);

  /**
   * 终端连接开关（完全由内部容器状态控制）：
   * - 未传 conversationId：无需启动服务，有 wsUrl 且面板可见时直接连接
   * - 传入 conversationId：仅 containerStatus === 'running' 后连接
   * - starting / error：服务未就绪，终端不可连接
   * 面板折叠或整体隐藏时不建立连接，避免在 display:none 内 init ttyd；
   * Header 切环境时若仍折叠，也不预连，等展开或点击终端图标再连
   * 终端重连失败展示重试面板时暂停自动连接
   */
  const isServiceReadyForTerminal = requiresServiceStart
    ? containerStatus === 'running'
    : true;
  const canAutoConnect =
    isServiceReadyForTerminal &&
    visible &&
    !showTerminalReconnect &&
    layoutMode !== 'collapsed';
  /** 仅当前可见环境的终端自动连接，避免隐藏环境连到错误容器 */
  const devTerminalAutoConnect = canAutoConnect && activeTab === 'terminal-dev';
  const prodTerminalAutoConnect =
    canAutoConnect && activeTab === 'terminal-prod';
  /** 上一次 visible 值（用于识别「重新打开」时机） */
  const prevVisibleRef = useRef(visible);
  /** 外部信号上一次值（undefined 表示未消费，避免 lazy mount 时与当前 signal 相同而跳过） */
  const prevLayoutResetSignalRef = useRef<number | undefined>(undefined);
  const prevExpandSignalRef = useRef<number | undefined>(undefined);
  const prevTerminalSignalRef = useRef<number | undefined>(undefined);
  const prevCollapseSignalRef = useRef<number | undefined>(undefined);
  const prevLogsSignalRef = useRef<number | undefined>(undefined);

  /** 日志 Tab 是否使用结构化日志面板（DevLogPanel） */
  const useDevLogPanel = Boolean(devLog);
  /** 终端主题是否为受控模式 */
  const isControlled = terminalAppearanceProp !== undefined;
  const terminalAppearance = isControlled
    ? terminalAppearanceProp
    : internalAppearance;
  const isLightTerminal = terminalAppearance === 'light';

  /** 面板重新打开时恢复默认 Tab；若上次处于折叠状态则恢复默认高度 */
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setActiveTab(
        defaultActiveTab === 'logs' && showLogsTab ? 'logs' : tabFromEnv(env),
      );
      setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
    }
    prevVisibleRef.current = visible;
  }, [defaultActiveTab, env, showLogsTab, visible]);

  /** Header 环境切换时，若当前在终端 Tab 则展示对应环境终端 */
  const prevEnvRef = useRef(env);
  useEffect(() => {
    if (prevEnvRef.current === env) {
      return;
    }
    prevEnvRef.current = env;
    setActiveTab((prev) => (prev === 'logs' ? prev : tabFromEnv(env)));
  }, [env]);

  /** 切换终端深浅色主题（受控模式下仅触发回调） */
  const handleToggleTerminalAppearance = useCallback(() => {
    const next: TerminalAppearanceMode =
      terminalAppearance === 'dark' ? 'light' : 'dark';
    if (!isControlled) {
      setInternalAppearance(next);
    }
    onTerminalAppearanceChange?.(next);
  }, [isControlled, onTerminalAppearanceChange, terminalAppearance]);

  useEffect(() => {
    if (
      activeTab === 'logs' ||
      !activeWsUrl ||
      !visible ||
      layoutMode === 'collapsed' ||
      (requiresServiceStart && containerStatus !== 'running')
    ) {
      return;
    }
    const timer = window.setTimeout(syncTerminalLayoutAndFocus, 100);
    const retryTimer = window.setTimeout(syncTerminalLayoutAndFocus, 300);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(retryTimer);
    };
  }, [
    activeTab,
    containerStatus,
    requiresServiceStart,
    layoutMode,
    syncTerminalLayoutAndFocus,
    activeWsUrl,
    terminalAppearance,
    visible,
  ]);

  /** 外部信号：将全屏布局重置回默认高度（collapsed 状态保持不变） */
  useEffect(() => {
    if (
      layoutResetSignal === undefined ||
      layoutResetSignal === prevLayoutResetSignalRef.current
    ) {
      return;
    }
    prevLayoutResetSignalRef.current = layoutResetSignal;
    if (!layoutResetSignal) return;
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : prev));
  }, [layoutResetSignal]);

  /** 外部信号：切到终端 Tab 并全屏展开 */
  useEffect(() => {
    if (
      expandSignal === undefined ||
      expandSignal === prevExpandSignalRef.current
    ) {
      return;
    }
    prevExpandSignalRef.current = expandSignal;
    if (!expandSignal) return;
    setActiveTab(tabFromEnv(env));
    setLayoutMode('expanded');
  }, [env, expandSignal]);

  /** 外部信号：切到终端 Tab（折叠时恢复默认高度） */
  useEffect(() => {
    if (
      terminalSignal === undefined ||
      terminalSignal === prevTerminalSignalRef.current
    ) {
      return;
    }
    prevTerminalSignalRef.current = terminalSignal;
    if (!terminalSignal) return;
    setActiveTab(tabFromEnv(env));
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
  }, [env, terminalSignal]);

  /** 外部信号：折叠面板（仅保留头部） */
  useEffect(() => {
    if (
      collapseSignal === undefined ||
      collapseSignal === prevCollapseSignalRef.current
    ) {
      return;
    }
    prevCollapseSignalRef.current = collapseSignal;
    if (!collapseSignal) return;
    setLayoutMode('collapsed');
  }, [collapseSignal]);

  /** 外部信号：切到日志 Tab（折叠时恢复默认高度） */
  useEffect(() => {
    if (
      logsSignal === undefined ||
      !showLogsTab ||
      logsSignal === prevLogsSignalRef.current
    ) {
      return;
    }
    prevLogsSignalRef.current = logsSignal;
    if (!logsSignal) return;
    setActiveTab('logs');
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
  }, [logsSignal, showLogsTab]);

  /** 布局模式变化时通知外部 */
  useEffect(() => {
    onLayoutModeChange?.(layoutMode);
  }, [layoutMode, onLayoutModeChange]);

  /** 激活 Tab 变化时通知外部 */
  useEffect(() => {
    onActiveTabChange?.(toTabGroup(activeTab));
  }, [activeTab, onActiveTabChange]);

  /** 全屏展开 / 恢复默认高度 */
  const handleToggleExpand = () => {
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : 'expanded'));
  };

  /** 折叠到仅头部 / 恢复默认高度 */
  const handleToggleCollapse = () => {
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : 'collapsed'));
  };

  /**
   * 手动重连：有 conversationId 时始终 ensurePod 再连终端。
   * 不能仅依赖 containerStatus === 'running' 跳过启动——未开保活或保活间隔内
   * 容器已停而前端状态未更新时，必须先拉起服务才能连终端。
   * apiEnsurePod 对已在运行的容器是幂等的，重复调用开销可接受。
   */
  const handleReconnectTerminal = useCallback(async () => {
    const targetEnv =
      activeTabRef.current === 'terminal-prod'
        ? UserAppDbEnvEnum.Prod
        : UserAppDbEnvEnum.Dev;
    const targetWsUrl = getTerminalWsUrl(targetEnv);
    if (!targetWsUrl || isTerminalReconnecting) {
      return;
    }

    setIsTerminalReconnecting(true);
    try {
      if (conversationId) {
        const isReady = await startContainer(conversationId);
        if (!isReady) {
          return;
        }
      }

      setShowTerminalReconnect(false);
      setActiveTab(tabFromEnv(targetEnv));
      setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));

      window.requestAnimationFrame(() => {
        getTerminalRef(targetEnv).current?.reconnect(targetWsUrl);
      });
    } finally {
      setIsTerminalReconnecting(false);
    }
  }, [
    conversationId,
    isTerminalReconnecting,
    startContainer,
    devWsUrl,
    prodWsUrl,
  ]);

  /** 容器启动失败或终端连接失败时，展示统一的重启服务面板（叠加层内容） */
  const renderTerminalRetryOverlay = () => (
    <div
      className={cx(
        styles['console-empty'],
        'flex',
        'flex-col',
        'items-center',
        'content-center',
        'h-full',
        'gap-8',
      )}
    >
      <Button
        type="primary"
        icon={<ReloadOutlined />}
        loading={isTerminalReconnecting}
        className={cx(styles['container-retry-btn'])}
        onClick={handleReconnectTerminal}
      >
        {dict('PC.Components.ConversationBottomConsole.retryStartContainer')}
      </Button>
    </div>
  );

  /** 切换 Tab；折叠状态下点击 Tab 自动恢复默认高度 */
  const handleTabClick = (tab: AppDevConsoleTab) => {
    const wasCollapsed = layoutMode === 'collapsed';
    setActiveTab(tab);
    if (wasCollapsed) {
      setLayoutMode('default');
    }
    if (tab !== 'logs') {
      if (wasCollapsed) {
        scheduleTerminalRestoreAfterExpand();
      } else {
        window.setTimeout(syncTerminalLayoutAndFocus, 100);
      }
    }
  };

  /**
   * 终端 Tab：终端始终挂载，加载/错误态以叠加层淡入淡出展示。
   * 两个环境各渲染一份，通过样式切换显隐以保持各自连接。
   */
  const renderTerminalTab = (targetEnv: UserAppDbEnvEnum) => {
    const targetWsUrl = getTerminalWsUrl(targetEnv);
    const targetRef = getTerminalRef(targetEnv);
    const isActivePane =
      targetEnv === UserAppDbEnvEnum.Prod
        ? activeTab === 'terminal-prod'
        : activeTab === 'terminal-dev';
    const showStartingOverlay = isActivePane && containerStatus === 'starting';
    const showRetryOverlay =
      isActivePane && (containerStatus === 'error' || showTerminalReconnect);
    const autoConnect =
      targetEnv === UserAppDbEnvEnum.Prod
        ? prodTerminalAutoConnect
        : devTerminalAutoConnect;

    if (!targetWsUrl) {
      return (
        <div className={cx(styles['console-body'])}>
          <div
            className={cx(
              styles['console-empty'],
              'flex',
              'items-center',
              'content-center',
              'h-full',
            )}
          >
            {dict('PC.Components.ConversationBottomConsole.terminalEmpty')}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cx(styles['terminal-tab-stage'], {
          [styles['terminal-tab-stage-light']]: isLightTerminal,
          [styles['terminal-tab-stage-dark']]: !isLightTerminal,
        })}
      >
        <div
          className={cx(styles['xterm-container'])}
          onMouseDown={(event) => {
            if (event.button !== 0 || showStartingOverlay || showRetryOverlay) {
              return;
            }
            targetRef.current?.focus();
          }}
        >
          <EmbeddedConsoleTerminal
            ref={targetRef}
            className={cx(styles['terminal-embedded'], {
              [styles['terminal-embedded-light']]: isLightTerminal,
              [styles['terminal-embedded-dark']]: !isLightTerminal,
            })}
            wsUrl={targetWsUrl}
            wsSubprotocols={wsSubprotocols}
            wireProtocol={wireProtocol}
            autoConnect={autoConnect}
            theme={getConsoleTerminalTheme(terminalAppearance)}
            fontSize={13}
            fontFamily={CONSOLE_TERMINAL_FONT_FAMILY}
            lineHeight={1.35}
            cursorBlink
            reconnect={DEFAULT_TERMINAL_RECONNECT}
            onConnect={() => {
              const isReconnect = terminalConnectedOnceRef.current;
              terminalConnectedRef.current = true;
              terminalConnectedOnceRef.current = true;
              setShowTerminalReconnect(false);
              if (isReconnect) {
                targetRef.current?.getTerminal()?.write('\r\n');
              }
              targetRef.current?.writeln(
                '\x1b[1;38;2;22;163;74m[Terminal connected]\x1b[0m',
              );
              // 重连后 fit + focus；shell 提示符由 EmbeddedConsoleTerminal 内 requestShellPrompt 补发
              targetRef.current?.restoreAfterVisibilityChange();
              window.setTimeout(
                () => targetRef.current?.restoreAfterVisibilityChange(),
                50,
              );
              window.setTimeout(
                () => targetRef.current?.restoreAfterVisibilityChange(),
                250,
              );
            }}
            onDisconnect={() => {
              terminalConnectedRef.current = false;
              targetRef.current?.getTerminal()?.write('\r\n');
              targetRef.current?.writeln(
                '\x1b[1;38;2;220;38;38m[Terminal disconnected]\x1b[0m',
              );
              // 仅当前可见终端、且需先启动容器时，断连后预热服务
              const isCurrentEnv =
                (targetEnv === UserAppDbEnvEnum.Prod &&
                  activeTabRef.current === 'terminal-prod') ||
                (targetEnv === UserAppDbEnvEnum.Dev &&
                  activeTabRef.current === 'terminal-dev');
              if (
                isCurrentEnv &&
                requiresServiceStart &&
                containerStatus === 'running'
              ) {
                if (ensurePodOnDisconnectTimerRef.current) {
                  window.clearTimeout(ensurePodOnDisconnectTimerRef.current);
                }
                ensurePodOnDisconnectTimerRef.current = window.setTimeout(
                  () => {
                    ensurePodOnDisconnectTimerRef.current = null;
                    if (!conversationId) {
                      return;
                    }
                    void ensurePodWithStage(conversationId).catch((error) => {
                      console.error(
                        '[AppDevBottomConsole] ensurePod on disconnect failed:',
                        error,
                      );
                    });
                  },
                  300,
                );
              }
            }}
            onReconnectFailed={() => {
              terminalConnectedRef.current = false;
              if (
                (targetEnv === UserAppDbEnvEnum.Prod &&
                  activeTabRef.current === 'terminal-prod') ||
                (targetEnv === UserAppDbEnvEnum.Dev &&
                  activeTabRef.current === 'terminal-dev')
              ) {
                setShowTerminalReconnect(true);
              }
            }}
          />
        </div>

        <div
          className={cx(
            styles['terminal-tab-overlay'],
            styles['terminal-tab-overlay-instant'],
            {
              [styles['terminal-tab-overlay-visible']]: showStartingOverlay,
            },
          )}
          aria-hidden={!showStartingOverlay}
        >
          <div
            className={cx(
              styles['console-empty'],
              'flex',
              'flex-col',
              'items-center',
              'content-center',
              'h-full',
              'gap-8',
            )}
          >
            <span>
              {dict(
                'PC.Components.ConversationBottomConsole.containerStarting',
              )}
            </span>
          </div>
        </div>

        <div
          className={cx(styles['terminal-tab-overlay'], {
            [styles['terminal-tab-overlay-visible']]: showRetryOverlay,
          })}
          aria-hidden={!showRetryOverlay}
        >
          {renderTerminalRetryOverlay()}
        </div>
      </div>
    );
  };

  /** 日志 Tab 内容：有 devLog 时渲染结构化日志面板，否则展示纯文本/空态 */
  const renderLogsTab = () => {
    if (useDevLogPanel && devLog) {
      return (
        <div className={cx(styles['dev-log-pane'])}>
          <DevLogPanel
            logs={devLog.logs}
            isLoading={devLog.isLoading}
            lastLine={devLog.lastLine}
            onAddToChat={devLog.onAddToChat}
            isChatLoading={devLog.isChatLoading}
            latestErrorLogs={devLog.latestErrorLogs}
          />
        </div>
      );
    }

    return (
      <div className={cx(styles['console-body'])}>
        {runtimeLogs ? (
          runtimeLogs
        ) : (
          <div
            className={cx(
              styles['console-empty'],
              'flex',
              'items-center',
              'content-center',
              'h-full',
            )}
          >
            {dict('PC.Components.ConversationBottomConsole.logsEmpty')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cx(
        styles.console,
        {
          [styles['console-expanded']]: layoutMode === 'expanded',
          [styles['console-collapsed']]: layoutMode === 'collapsed',
          [styles['console-hidden']]: !visible,
          [styles['console-terminal-light']]: isLightTerminal,
          [styles['console-terminal-dark']]: !isLightTerminal,
        },
        className,
      )}
    >
      {/* 头部：左侧 Tab 切换 + 右侧操作按钮 */}
      <div className={cx(styles['console-header'])}>
        <div className={cx(styles['console-tabs'])}>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]:
                activeTab === 'terminal-dev' && layoutMode !== 'collapsed',
            })}
            onClick={() => handleTabClick('terminal-dev')}
          >
            {dict('PC.Pages.AppDevPro.tabTerminalDev')}
          </span>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]:
                activeTab === 'terminal-prod' && layoutMode !== 'collapsed',
            })}
            onClick={() => handleTabClick('terminal-prod')}
          >
            {dict('PC.Pages.AppDevPro.tabTerminalProd')}
          </span>
          {showLogsTab && (
            <span
              className={cx(styles['console-tab'], {
                [styles.active]:
                  activeTab === 'logs' && layoutMode !== 'collapsed',
              })}
              onClick={() => handleTabClick('logs')}
            >
              {dict('PC.Components.ConversationBottomConsole.tabLogs')}
            </span>
          )}
        </div>
        <div className={cx(styles['console-actions'])}>
          {/* 页面注入的额外操作（如开发日志操作按钮组），仅日志 Tab 显示 */}
          {showLogsTab && activeTab === 'logs' && logsExtra}

          {/* 终端主题切换按钮 */}
          {showTerminalAppearanceToggle && (
            <TooltipIcon
              title={
                isLightTerminal
                  ? dict(
                      'PC.Components.ConversationBottomConsole.terminalThemeDark',
                    )
                  : dict(
                      'PC.Components.ConversationBottomConsole.terminalThemeLight',
                    )
              }
              placement="top"
              className={cx(styles['console-action-btn'])}
              icon={
                isLightTerminal ? (
                  <MoonOutlined style={{ fontSize: 14 }} />
                ) : (
                  <SunOutlined style={{ fontSize: 14 }} />
                )
              }
              onClick={handleToggleTerminalAppearance}
            />
          )}

          {/* 全屏展开 / 恢复默认高度按钮 */}
          <TooltipIcon
            title={
              layoutMode === 'expanded'
                ? dict('PC.Components.ConversationBottomConsole.restoreHeight')
                : dict('PC.Components.ConversationBottomConsole.expandHeight')
            }
            placement="top"
            className={cx(styles['console-action-btn'])}
            icon={
              layoutMode === 'expanded' ? (
                <FullscreenExitOutlined style={{ fontSize: 16 }} />
              ) : (
                <SvgIcon
                  name="icons-common-fullscreen"
                  style={{ fontSize: 16 }}
                />
              )
            }
            onClick={handleToggleExpand}
          />

          {/* 折叠到底部 / 恢复默认高度按钮 */}
          <TooltipIcon
            title={
              layoutMode === 'collapsed'
                ? dict('PC.Components.ConversationBottomConsole.restoreHeight')
                : dict('PC.Components.ConversationBottomConsole.collapsePanel')
            }
            placement="top"
            className={cx(styles['console-action-btn'])}
            icon={
              layoutMode === 'collapsed' ? <UpOutlined /> : <DownOutlined />
            }
            onClick={handleToggleCollapse}
          />
        </div>
      </div>
      {/* 内容区：开发/线上终端与日志常驻渲染，通过样式切换显隐 */}
      <div className={cx(styles['console-content'])}>
        <div
          className={cx(styles['tab-pane'], {
            [styles['tab-pane-active']]: activeTab === 'terminal-dev',
          })}
          aria-hidden={activeTab !== 'terminal-dev'}
        >
          {renderTerminalTab(UserAppDbEnvEnum.Dev)}
        </div>
        <div
          className={cx(styles['tab-pane'], {
            [styles['tab-pane-active']]: activeTab === 'terminal-prod',
          })}
          aria-hidden={activeTab !== 'terminal-prod'}
        >
          {renderTerminalTab(UserAppDbEnvEnum.Prod)}
        </div>
        <div
          className={cx(styles['tab-pane'], {
            [styles['tab-pane-active']]: activeTab === 'logs',
          })}
          aria-hidden={activeTab !== 'logs'}
        >
          {renderLogsTab()}
        </div>
      </div>
    </div>
  );
};

export default AppDevBottomConsole;
