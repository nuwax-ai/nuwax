import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiEnsurePod, apiKeepalivePod } from '@/services/vncDesktop';
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
import type { EmbeddedConsoleTerminalRef } from '../Terminal/EmbeddedConsoleTerminal';
import EmbeddedConsoleTerminal from '../Terminal/EmbeddedConsoleTerminal';
import type { TerminalWireProtocol } from '../Terminal/type';
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

/** 底部控制台布局模式 */
export type ConsoleLayoutMode = 'default' | 'expanded' | 'collapsed';

/** 开发服务器日志相关配置（网页应用） */
export interface ConversationBottomConsoleDevLogProps {
  logs: DevLogEntry[];
  latestErrorLogs?: string;
  isLoading?: boolean;
  lastLine?: number;
  onAddToChat?: (content: string, isAuto?: boolean) => void;
  isChatLoading?: boolean;
}

export interface ConversationBottomConsoleProps {
  /** 是否显示面板 @default true */
  visible?: boolean;
  /** 运行日志纯文本（会话智能体） */
  runtimeLogs?: string;
  /** 开发服务器结构化日志；传入后日志 Tab 使用 DevLogPanel */
  devLog?: ConversationBottomConsoleDevLogProps;
  /** 终端 WebSocket 地址；传入后终端 Tab 渲染 XtermTerminal */
  wsUrl?: string;
  /**
   * 会话 ID；传入后组件挂载时自动调用 apiEnsurePod 启动容器，
   * 容器启动成功后才允许终端发起 WebSocket 连接。
   * 若不传，则不启动容器，终端在有 wsUrl 时直接连接。
   */
  conversationId?: number;
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
  /** 信号值变化时切到日志 Tab（折叠时恢复默认高度，如点击「日志」图标） */
  logsSignal?: number;
  /** 布局模式变化回调（供外部感知折叠/展开状态） */
  onLayoutModeChange?: (mode: ConsoleLayoutMode) => void;
  /** 激活 Tab 变化回调（供外部感知当前显示终端还是日志） */
  onActiveTabChange?: (tab: 'terminal' | 'logs') => void;
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
 * 底部终端 + 日志合集面板
 * - 终端 Tab：XtermTerminal（wsUrl）或空态
 * - 日志 Tab：DevLogPanel（devLog）或 runtimeLogs 纯文本
 */
const ConversationBottomConsole: React.FC<ConversationBottomConsoleProps> = ({
  visible = true,
  runtimeLogs = '',
  devLog,
  wsUrl,
  conversationId,
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
  logsSignal,
  onLayoutModeChange,
  onActiveTabChange,
  defaultActiveTab = 'terminal',
  defaultLayoutMode = 'collapsed',
  showLogsTab = true,
  logsExtra,
  className,
}) => {
  /** 当前激活的 Tab（终端 / 日志） */
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>(
    showLogsTab ? defaultActiveTab : 'terminal',
  );
  /** 面板布局模式：default 默认高度 / expanded 全屏 / collapsed 仅保留头部 */
  const [layoutMode, setLayoutMode] =
    useState<ConsoleLayoutMode>(defaultLayoutMode);
  /** 终端主题（非受控时的内部状态） */
  const [internalAppearance, setInternalAppearance] =
    useState<TerminalAppearanceMode>(defaultTerminalAppearance);
  /** 终端实例引用（用于主动 refresh 修复切换 Tab 后的渲染残影） */
  const terminalRef = useRef<EmbeddedConsoleTerminalRef>(null);
  /** 终端当前连接状态（用于控制断连后再触发容器兜底重启） */
  const terminalConnectedRef = useRef<boolean>(false);
  /** 终端是否曾成功连接过（避免首次连接前误判为”断开”） */
  const terminalConnectedOnceRef = useRef<boolean>(false);
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

  /**
   * 容器启动状态机：
   * - idle：未传 conversationId，无需启动容器，终端在有 wsUrl 时直接连接
   * - starting：apiEnsurePod 调用中，终端等待
   * - running：容器已就绪，终端可连接，保活轮询中
   * - error：容器启动或保活失败，显示重试按钮，终端不可连接
   */
  const [containerStatus, setContainerStatus] = useState<
    'idle' | 'starting' | 'running' | 'error'
  >('idle');
  const [containerError, setContainerError] = useState<string>('');

  /**
   * 保活轮询（useRequest 自动管理定时器、页面可见性暂停/恢复）
   * 使用 ref 持有 run/cancel，避免闭包陷阱并保证 startContainer 引用稳定
   */
  const runKeepaliveRef = useRef<(cId: number) => void>(() => {});
  const stopKeepaliveRef = useRef<() => void>(() => {});

  const { run: runKeepalivePodPolling, cancel: stopKeepalivePodPolling } =
    useRequest(apiKeepalivePod, {
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
            await apiEnsurePod(params[0]);
          } catch (error) {
            console.error('[keepalive] apiEnsurePod failed:', error);
          }
        }
      },
      onSuccess: (result) => {
        // HTTP 成功但业务码失败 → 视为保活失败，停止轮询并显示错误
        if (result.code !== SUCCESS_CODE) {
          setContainerStatus('error');
          setContainerError(
            result.message ||
              dict(
                'PC.Components.ConversationBottomConsole.containerKeepaliveFailed',
              ),
          );
          stopKeepaliveRef.current();
        }
      },
      onError: (error) => {
        console.error('[keepalive] Pod keepalive error:', error);
        setContainerStatus('error');
        setContainerError(
          dict(
            'PC.Components.ConversationBottomConsole.containerKeepaliveError',
          ),
        );
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
      setContainerError('');
      try {
        const { code } = await apiEnsurePod(cId);
        if (code === SUCCESS_CODE) {
          setContainerStatus('running');
          if (enableKeepalivePolling) {
            runKeepaliveRef.current(cId);
          }
          return true;
        } else {
          setContainerStatus('error');
          setContainerError(
            dict(
              'PC.Components.ConversationBottomConsole.containerStartFailed',
            ),
          );
          return false;
        }
      } catch (error: any) {
        setContainerStatus('error');
        setContainerError(
          dict('PC.Components.ConversationBottomConsole.containerStartError'),
        );
        return false;
      }
    },
    [enableKeepalivePolling],
  );

  /** 挂载时仅清理状态，不自动启动容器；等用户首次展开时触发 */
  useLayoutEffect(() => {
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

  /** 用户首次展开终端面板时，触发容器启动 / 终端直接连接 */
  const handleFirstExpand = useCallback(() => {
    terminalActivatedRef.current = true;

    // 云端电脑：容器尚未启动时触发启动
    if (conversationId && containerStatus === 'idle') {
      startContainer(conversationId);
    }
  }, [conversationId, containerStatus, startContainer]);

  /** 监听 layoutMode 变化，检测首次从 collapsed 展开 */
  useEffect(() => {
    // 从 collapsed 展开为非 collapsed 状态时触发
    if (
      layoutMode !== 'collapsed' &&
      prevLayoutModeRef.current === 'collapsed'
    ) {
      handleFirstExpand();
    }
    prevLayoutModeRef.current = layoutMode;
  }, [layoutMode, handleFirstExpand]);

  /**
   * 终端连接开关（完全由内部容器状态控制）：
   * - idle：未传 conversationId，无需容器，终端在有 wsUrl 时直接连接
   * - running：容器就绪，终端可连接
   * - starting / error：容器未就绪，终端不可连接
   * 面板折叠或整体隐藏时不建立连接，避免在 display:none 容器内 init ttyd 导致无法输入
   * 例外：用户已首次展开过终端面板后，即使折叠也保持连接不断
   */
  const terminalAutoConnect =
    (containerStatus === 'idle' || containerStatus === 'running') &&
    visible &&
    (layoutMode !== 'collapsed' || terminalActivatedRef.current);
  /** 上一次 visible 值（用于识别「重新打开」时机） */
  const prevVisibleRef = useRef(visible);
  /** 外部信号上一次值（避免组件 remount 时重复触发） */
  const prevLayoutResetSignalRef = useRef(layoutResetSignal);
  const prevExpandSignalRef = useRef(expandSignal);
  const prevTerminalSignalRef = useRef(terminalSignal);
  const prevLogsSignalRef = useRef(logsSignal);

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
      setActiveTab(defaultActiveTab);
      setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
    }
    prevVisibleRef.current = visible;
  }, [visible, defaultActiveTab]);

  /** 切换终端深浅色主题（受控模式下仅触发回调） */
  const handleToggleTerminalAppearance = useCallback(() => {
    const next: TerminalAppearanceMode =
      terminalAppearance === 'dark' ? 'light' : 'dark';
    if (!isControlled) {
      setInternalAppearance(next);
    }
    onTerminalAppearanceChange?.(next);
  }, [isControlled, onTerminalAppearanceChange, terminalAppearance]);

  /**
   * 切换到终端 Tab / 布局或主题变化 / visible 从 false 变为 true 后，
   * 延迟重新计算终端 cols/rows（fit）并同步 ttyd 尺寸、聚焦终端，
   * 避免容器从 display:none / visibility:hidden 恢复后 xterm-screen 尺寸停留在初始极小值。
   */
  useEffect(() => {
    if (
      activeTab !== 'terminal' ||
      !wsUrl ||
      !visible ||
      layoutMode === 'collapsed'
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      terminalRef.current?.fitAndSyncBackend();
      terminalRef.current?.focus();
      const term = terminalRef.current?.getTerminal();
      if (!term) return;
      try {
        term.refresh(0, Math.max(term.rows - 1, 0));
      } catch {
        /* ignore */
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeTab, layoutMode, wsUrl, terminalAppearance, visible]);

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
    setActiveTab('terminal');
    setLayoutMode('expanded');
  }, [expandSignal]);

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
    setActiveTab('terminal');
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
  }, [terminalSignal]);

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
    onActiveTabChange?.(activeTab);
  }, [activeTab, onActiveTabChange]);

  /** 全屏展开 / 恢复默认高度 */
  const handleToggleExpand = () => {
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : 'expanded'));
  };

  /** 折叠到仅头部 / 恢复默认高度 */
  const handleToggleCollapse = () => {
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : 'collapsed'));
  };

  /** 手动重连终端：云端容器先 ensurePod，本地直连场景直接重连 WS */
  const handleReconnectTerminal = useCallback(async () => {
    if (!wsUrl || isTerminalReconnecting) {
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
      terminalRef.current?.reconnect(wsUrl);
      setActiveTab('terminal');
      setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
    } finally {
      setIsTerminalReconnecting(false);
    }
  }, [conversationId, isTerminalReconnecting, startContainer, wsUrl]);

  /** 切换 Tab；折叠状态下点击 Tab 自动恢复默认高度 */
  const handleTabClick = (tab: 'terminal' | 'logs') => {
    setActiveTab(tab);
    if (layoutMode === 'collapsed') {
      setLayoutMode('default');
    }
    if (tab === 'terminal') {
      window.setTimeout(() => {
        terminalRef.current?.fitAndSyncBackend();
        terminalRef.current?.focus();
      }, 100);
    }
  };

  /** 终端 Tab 内容：容器就绪后渲染交互式终端，否则展示加载/错误/空态 */
  const renderTerminalTab = () => {
    // 容器正在启动中
    if (containerStatus === 'starting') {
      return (
        <div className={cx(styles['console-body'])}>
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
      );
    }

    // 容器启动或保活失败，显示重试按钮
    if (containerStatus === 'error') {
      return (
        <div className={cx(styles['console-body'])}>
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
            <span className={cx(styles['container-error-text'])}>
              {containerError ||
                dict(
                  'PC.Components.ConversationBottomConsole.containerStartFailed',
                )}
            </span>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              className={cx(styles['container-retry-btn'])}
              onClick={() => conversationId && startContainer(conversationId)}
            >
              {dict(
                'PC.Components.ConversationBottomConsole.retryStartContainer',
              )}
            </Button>
          </div>
        </div>
      );
    }

    if (wsUrl) {
      return (
        <div className={cx(styles['xterm-container'])}>
          <EmbeddedConsoleTerminal
            ref={terminalRef}
            className={cx(styles['terminal-embedded'], {
              [styles['terminal-embedded-light']]: isLightTerminal,
              [styles['terminal-embedded-dark']]: !isLightTerminal,
            })}
            wsUrl={wsUrl}
            wsSubprotocols={wsSubprotocols}
            wireProtocol={wireProtocol}
            autoConnect={terminalAutoConnect}
            theme={getConsoleTerminalTheme(terminalAppearance)}
            fontSize={13}
            fontFamily={CONSOLE_TERMINAL_FONT_FAMILY}
            lineHeight={1.35}
            cursorBlink
            reconnect={{ enabled: true, maxRetries: 3, retryDelay: 2000 }}
            onConnect={() => {
              terminalConnectedRef.current = true;
              terminalConnectedOnceRef.current = true;
              setShowTerminalReconnect(false);
              terminalRef.current?.writeln(
                // 使用 ANSI 真彩 + 加粗，确保连接提示在不同主题下都有明显高亮
                '\x1b[1;38;2;22;163;74m[Terminal connected]\x1b[0m',
              );
            }}
            onDisconnect={() => {
              terminalConnectedRef.current = false;
              terminalRef.current?.writeln(
                // 使用 ANSI 真彩 + 加粗，确保断开提示在不同主题下都有明显高亮
                '\x1b[1;38;2;220;38;38m[Terminal disconnected]\x1b[0m',
              );
            }}
            onReconnectFailed={() => {
              terminalConnectedRef.current = false;
              setShowTerminalReconnect(true);
            }}
          />
        </div>
      );
    }

    // 空态（无 wsUrl 且无需启动容器时）
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
                activeTab === 'terminal' && layoutMode !== 'collapsed',
            })}
            onClick={() => handleTabClick('terminal')}
          >
            {dict('PC.Components.ConversationBottomConsole.tabTerminal')}
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
          {activeTab === 'terminal' && showTerminalReconnect && (
            <TooltipIcon
              title={dict(
                'PC.Components.ConversationBottomConsole.retryStartContainer',
              )}
              className={cx(
                styles['console-action-btn'],
                styles['console-action-restart-btn'],
              )}
              icon={
                <Button
                  danger
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={isTerminalReconnecting}
                >
                  {dict(
                    'PC.Components.ConversationBottomConsole.retryStartContainer',
                  )}
                </Button>
              }
              onClick={handleReconnectTerminal}
            />
          )}

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
      {/* 内容区：两个 Tab 面板常驻渲染，通过样式切换显隐（保持终端连接不断开） */}
      <div className={cx(styles['console-content'])}>
        <div
          className={cx(styles['tab-pane'], {
            [styles['tab-pane-active']]: activeTab === 'terminal',
          })}
          aria-hidden={activeTab !== 'terminal'}
        >
          {renderTerminalTab()}
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

export default ConversationBottomConsole;
