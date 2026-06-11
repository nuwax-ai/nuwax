import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import {
  CloseOutlined,
  DownOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  SunOutlined,
  UpOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import XtermTerminal from '../Terminal';
import type { TerminalWireProtocol, XtermTerminalRef } from '../Terminal/type';
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
  /** 关闭回调；传入后头部显示关闭按钮 */
  onClose?: () => void;
  /** 运行日志纯文本（会话智能体） */
  runtimeLogs?: string;
  /** 开发服务器结构化日志；传入后日志 Tab 使用 DevLogPanel */
  devLog?: ConversationBottomConsoleDevLogProps;
  /** 终端 WebSocket 地址；传入后终端 Tab 渲染 XtermTerminal */
  wsUrl?: string;
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
  /** 头部操作区额外内容（渲染在内置按钮之前），仅日志 Tab 激活时显示 */
  logsExtra?: React.ReactNode;
}

/**
 * 底部终端 + 日志合集面板
 * - 终端 Tab：XtermTerminal（wsUrl）或空态
 * - 日志 Tab：DevLogPanel（devLog）或 runtimeLogs 纯文本
 */
const ConversationBottomConsole: React.FC<ConversationBottomConsoleProps> = ({
  visible = true,
  onClose,
  runtimeLogs = '',
  devLog,
  wsUrl,
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
  logsExtra,
}) => {
  /** 当前激活的 Tab（终端 / 日志） */
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>(
    defaultActiveTab,
  );
  /** 面板布局模式：default 默认高度 / expanded 全屏 / collapsed 仅保留头部 */
  const [layoutMode, setLayoutMode] = useState<ConsoleLayoutMode>('collapsed');
  /** 终端主题（非受控时的内部状态） */
  const [internalAppearance, setInternalAppearance] =
    useState<TerminalAppearanceMode>(defaultTerminalAppearance);
  /** 终端实例引用（用于主动 refresh 修复切换 Tab 后的渲染残影） */
  const terminalRef = useRef<XtermTerminalRef>(null);
  /** 上一次 visible 值（用于识别「重新打开」时机） */
  const prevVisibleRef = useRef(visible);

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
   * 切换到终端 Tab / 布局或主题变化后，延迟刷新 xterm 渲染，
   * 避免 display:none 期间的尺寸变化导致内容残影或空白
   */
  useEffect(() => {
    if (activeTab !== 'terminal' || !wsUrl) return;
    const timer = window.setTimeout(() => {
      const term = terminalRef.current?.getTerminal();
      if (!term) return;
      try {
        term.refresh(0, Math.max(term.rows - 1, 0));
      } catch {
        /* ignore */
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [activeTab, layoutMode, wsUrl, terminalAppearance]);

  /** 外部信号：将全屏布局重置回默认高度（collapsed 状态保持不变） */
  useEffect(() => {
    if (!layoutResetSignal) return;
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : prev));
  }, [layoutResetSignal]);

  /** 外部信号：切到终端 Tab 并全屏展开 */
  useEffect(() => {
    if (!expandSignal) return;
    setActiveTab('terminal');
    setLayoutMode('expanded');
  }, [expandSignal]);

  /** 外部信号：切到终端 Tab（折叠时恢复默认高度） */
  useEffect(() => {
    if (!terminalSignal) return;
    setActiveTab('terminal');
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
  }, [terminalSignal]);

  /** 外部信号：切到日志 Tab（折叠时恢复默认高度） */
  useEffect(() => {
    if (!logsSignal) return;
    setActiveTab('logs');
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : prev));
  }, [logsSignal]);

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

  /** 切换 Tab；折叠状态下点击 Tab 自动恢复默认高度 */
  const handleTabClick = (tab: 'terminal' | 'logs') => {
    setActiveTab(tab);
    if (layoutMode === 'collapsed') {
      setLayoutMode('default');
    }
  };

  if (!visible) {
    return null;
  }

  /** 终端 Tab 内容：有 wsUrl 时渲染交互式终端，否则展示空态 */
  const renderTerminalTab = () => {
    if (wsUrl) {
      return (
        <div className={cx(styles['xterm-container'])}>
          <XtermTerminal
            ref={terminalRef}
            embedded
            className={cx(styles['terminal-embedded'], {
              [styles['terminal-embedded-light']]: isLightTerminal,
              [styles['terminal-embedded-dark']]: !isLightTerminal,
            })}
            wsUrl={wsUrl}
            wsSubprotocols={wsSubprotocols}
            wireProtocol={wireProtocol}
            autoConnect
            theme={getConsoleTerminalTheme(terminalAppearance)}
            fontSize={13}
            fontFamily={CONSOLE_TERMINAL_FONT_FAMILY}
            lineHeight={1.35}
            cursorBlink
            enableWebgl={false}
            reconnect={{ enabled: true, maxRetries: 5, retryDelay: 2000 }}
            onConnect={() => {
              terminalRef.current?.writeln(
                '\x1b[32m[Terminal connected]\x1b[0m',
              );
            }}
            onDisconnect={() => {
              terminalRef.current?.writeln(
                '\x1b[31m[Terminal disconnected]\x1b[0m',
              );
            }}
          />
        </div>
      );
    }

    // 空态（无 wsUrl 时）
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
      className={cx(styles.console, {
        [styles['console-expanded']]: layoutMode === 'expanded',
        [styles['console-collapsed']]: layoutMode === 'collapsed',
        [styles['console-terminal-light']]: isLightTerminal,
        [styles['console-terminal-dark']]: !isLightTerminal,
      })}
    >
      {/* 头部：左侧 Tab 切换 + 右侧操作按钮 */}
      <div className={cx(styles['console-header'])}>
        <div className={cx(styles['console-tabs'])}>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]: activeTab === 'terminal',
            })}
            onClick={() => handleTabClick('terminal')}
          >
            {dict('PC.Components.ConversationBottomConsole.tabTerminal')}
          </span>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]: activeTab === 'logs',
            })}
            onClick={() => handleTabClick('logs')}
          >
            {dict('PC.Components.ConversationBottomConsole.tabLogs')}
          </span>
        </div>
        <div className={cx(styles['console-actions'])}>
          {/* 页面注入的额外操作（如开发日志操作按钮组），仅日志 Tab 显示 */}
          {activeTab === 'logs' && logsExtra}

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

          {/* 关闭按钮 */}
          {onClose && (
            <TooltipIcon
              title={dict('PC.Pages.AppDevDevLogConsole.closeLogConsole')}
              className={cx(styles['console-action-btn'])}
              onClick={onClose}
              icon={<CloseOutlined />}
            />
          )}
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
