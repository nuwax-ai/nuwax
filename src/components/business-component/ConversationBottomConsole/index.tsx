import { SvgIcon } from '@/components/base';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import {
  ClearOutlined,
  CloseOutlined,
  DownOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  ReloadOutlined,
  SunOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
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
  hasErrorInLatestBlock?: boolean;
  latestErrorLogs?: string;
  isLoading?: boolean;
  lastLine?: number;
  onClear?: () => void;
  onRefresh?: () => void;
  onAddToChat?: (content: string, isAuto?: boolean) => void;
  isChatLoading?: boolean;
  onResetAutoRetry?: () => void;
}

export interface ConversationBottomConsoleProps {
  visible?: boolean;
  onClose?: () => void;
  /** 终端纯文本回退内容（无 wsUrl 时） */
  terminalLogs?: string;
  /** 运行日志纯文本（会话智能体） */
  runtimeLogs?: string;
  /** 开发服务器结构化日志；传入后日志 Tab 使用 DevLogPanel */
  devLog?: ConversationBottomConsoleDevLogProps;
  wsUrl?: string;
  wsSubprotocols?: string | string[];
  wireProtocol?: TerminalWireProtocol;
  terminalAppearance?: TerminalAppearanceMode;
  defaultTerminalAppearance?: TerminalAppearanceMode;
  onTerminalAppearanceChange?: (mode: TerminalAppearanceMode) => void;
  showTerminalAppearanceToggle?: boolean;
  layoutResetSignal?: number;
  expandSignal?: number;
  /** 打开控制台时的默认 Tab @default 'terminal' */
  defaultActiveTab?: 'terminal' | 'logs';
}

/**
 * 底部终端 + 日志合集面板
 * - 终端 Tab：XtermTerminal（wsUrl）或纯文本回退
 * - 日志 Tab：DevLogPanel（devLog）或 runtimeLogs 纯文本
 */
const ConversationBottomConsole: React.FC<ConversationBottomConsoleProps> = ({
  visible = true,
  onClose,
  terminalLogs = '',
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
  defaultActiveTab = 'terminal',
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>(
    defaultActiveTab,
  );
  const [layoutMode, setLayoutMode] = useState<ConsoleLayoutMode>('default');
  const [internalAppearance, setInternalAppearance] =
    useState<TerminalAppearanceMode>(defaultTerminalAppearance);
  const terminalRef = useRef<XtermTerminalRef>(null);
  const prevVisibleRef = useRef(visible);

  const useDevLogPanel = Boolean(devLog);
  const isControlled = terminalAppearanceProp !== undefined;
  const terminalAppearance = isControlled
    ? terminalAppearanceProp
    : internalAppearance;
  const isLightTerminal = terminalAppearance === 'light';

  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setActiveTab(defaultActiveTab);
    }
    prevVisibleRef.current = visible;
  }, [visible, defaultActiveTab]);

  const handleToggleTerminalAppearance = useCallback(() => {
    const next: TerminalAppearanceMode =
      terminalAppearance === 'dark' ? 'light' : 'dark';
    if (!isControlled) {
      setInternalAppearance(next);
    }
    onTerminalAppearanceChange?.(next);
  }, [isControlled, onTerminalAppearanceChange, terminalAppearance]);

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

  useEffect(() => {
    if (!layoutResetSignal) return;
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : prev));
  }, [layoutResetSignal]);

  useEffect(() => {
    if (!expandSignal) return;
    setActiveTab('terminal');
    setLayoutMode('expanded');
  }, [expandSignal]);

  const handleFindLatestErrorLogs = useCallback(() => {
    if (
      !devLog?.onAddToChat ||
      devLog.isChatLoading ||
      !devLog.onResetAutoRetry
    ) {
      return;
    }
    devLog.onResetAutoRetry();
    if (devLog.latestErrorLogs) {
      devLog.onAddToChat(devLog.latestErrorLogs, true);
    }
  }, [devLog]);

  const handleToggleExpand = () => {
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : 'expanded'));
  };

  const handleToggleCollapse = () => {
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : 'collapsed'));
  };

  const handleTabClick = (tab: 'terminal' | 'logs') => {
    setActiveTab(tab);
    if (layoutMode === 'collapsed') {
      setLayoutMode('default');
    }
  };

  if (!visible) {
    return null;
  }

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

    return (
      <div className={cx(styles['console-body'])}>
        {terminalLogs ? (
          terminalLogs
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
            {dict('PC.Components.ConversationBottomConsole.terminalEmpty')}
          </div>
        )}
      </div>
    );
  };

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
          {useDevLogPanel && devLog && (
            <div className={cx(styles['console-log-actions'])}>
              {devLog.hasErrorInLatestBlock && devLog.onAddToChat && (
                <>
                  <Tooltip
                    title={dict(
                      'PC.Pages.AppDevDevLogConsole.latestLogsContainErrors',
                    )}
                  >
                    <Badge status="error" />
                  </Tooltip>
                  <Button
                    size="small"
                    danger
                    className={cx(styles['console-quick-fix-btn'])}
                    disabled={devLog.isChatLoading}
                    icon={
                      <SvgIcon
                        name="icons-common-stars"
                        style={{ fontSize: 12 }}
                      />
                    }
                    onClick={handleFindLatestErrorLogs}
                  >
                    {dict('PC.Pages.AppDevDevLogConsole.quickIssueFix')}
                  </Button>
                </>
              )}
              <Tooltip title={dict('PC.Pages.AppDevDevLogConsole.refreshLogs')}>
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={devLog.onRefresh}
                />
              </Tooltip>
              <Tooltip title={dict('PC.Pages.AppDevDevLogConsole.clearLogs')}>
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={devLog.onClear}
                />
              </Tooltip>
            </div>
          )}
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
          <TooltipIcon
            title={
              layoutMode === 'collapsed'
                ? dict('PC.Components.ConversationBottomConsole.restoreHeight')
                : dict('PC.Components.ConversationBottomConsole.collapsePanel')
            }
            placement="top"
            className={cx(styles['console-action-btn'])}
            icon={
              layoutMode === 'collapsed' ? (
                <UpOutlined style={{ fontSize: 12 }} />
              ) : (
                <DownOutlined style={{ fontSize: 12 }} />
              )
            }
            onClick={handleToggleCollapse}
          />
          {onClose && (
            <Tooltip
              title={dict('PC.Pages.AppDevDevLogConsole.closeLogConsole')}
            >
              <Button
                type="text"
                size="small"
                className={cx(styles['console-action-btn'])}
                icon={<CloseOutlined />}
                onClick={onClose}
              />
            </Tooltip>
          )}
        </div>
      </div>
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
