import { SvgIcon } from '@/components/base';
import { XtermTerminal } from '@/components/business-component';
import type {
  TerminalWireProtocol,
  XtermTerminalRef,
} from '@/components/business-component/Terminal/type';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import {
  DownOutlined,
  FullscreenExitOutlined,
  MoonOutlined,
  SunOutlined,
  UpOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

interface ConversationAgentBottomConsoleProps {
  /** 是否显示控制台 */
  visible?: boolean;
  /** 终端日志内容（纯文本模式，wsUrl 不存在时使用） */
  terminalLogs?: string;
  /** 运行日志内容 */
  runtimeLogs?: string;
  /** 终端 WebSocket 连接地址，传入后启用交互式终端 */
  wsUrl?: string;
  /** WebSocket 子协议（连接 ttyd 时需 ['tty']） */
  wsSubprotocols?: string | string[];
  /** 与后端约定的消息格式 */
  wireProtocol?: TerminalWireProtocol;
  /**
   * 终端外观（受控）
   * 与 onTerminalAppearanceChange 配合由父组件管理；不传则走非受控逻辑
   */
  terminalAppearance?: TerminalAppearanceMode;
  /** 非受控时的默认外观 @default 'light' */
  defaultTerminalAppearance?: TerminalAppearanceMode;
  /** 外观切换回调 */
  onTerminalAppearanceChange?: (mode: TerminalAppearanceMode) => void;
  /** 是否显示深浅色切换按钮 @default true */
  showTerminalAppearanceToggle?: boolean;
  /**
   * 父组件在切换预览标签/文件时递增，用于将 expanded 恢复为 default
   */
  layoutResetSignal?: number;
}

/**
 * ConversationAgent 底部终端/日志面板
 *
 * - 「终端」标签页：优先使用 XtermTerminal（传入 wsUrl 时启用交互式终端），
 *   否则回退到纯文本显示 terminalLogs
 * - 「日志」标签页：纯文本显示 runtimeLogs
 */
const ConversationAgentBottomConsole: React.FC<
  ConversationAgentBottomConsoleProps
> = ({
  visible = true,
  terminalLogs = '',
  runtimeLogs = '',
  wsUrl,
  wsSubprotocols,
  wireProtocol,
  terminalAppearance: terminalAppearanceProp,
  defaultTerminalAppearance = DEFAULT_TERMINAL_APPEARANCE,
  onTerminalAppearanceChange,
  showTerminalAppearanceToggle = true,
  layoutResetSignal,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>('terminal');
  const [layoutMode, setLayoutMode] = useState<ConsoleLayoutMode>('default');
  const [internalAppearance, setInternalAppearance] =
    useState<TerminalAppearanceMode>(defaultTerminalAppearance);
  const terminalRef = useRef<XtermTerminalRef>(null);

  const isControlled = terminalAppearanceProp !== undefined;
  const terminalAppearance = isControlled
    ? terminalAppearanceProp
    : internalAppearance;
  const isLightTerminal = terminalAppearance === 'light';

  /** 切换终端深色 / 浅色外观 */
  const handleToggleTerminalAppearance = useCallback(() => {
    const next: TerminalAppearanceMode =
      terminalAppearance === 'dark' ? 'light' : 'dark';
    if (!isControlled) {
      setInternalAppearance(next);
    }
    onTerminalAppearanceChange?.(next);
  }, [isControlled, onTerminalAppearanceChange, terminalAppearance]);

  /** 切换回终端 tab 或布局变化后，触发 xterm 重新 fit */
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

  /** 切换预览标签/文件时，若处于放大态则恢复默认高度 */
  useEffect(() => {
    if (!layoutResetSignal) {
      return;
    }
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : prev));
  }, [layoutResetSignal]);

  /** 放大：占满 Tab 栏下方主区域；再次点击恢复默认高度 */
  const handleToggleExpand = () => {
    setLayoutMode((prev) => (prev === 'expanded' ? 'default' : 'expanded'));
  };

  /** 折叠：仅保留底部标签栏；再次点击恢复默认高度 */
  const handleToggleCollapse = () => {
    setLayoutMode((prev) => (prev === 'collapsed' ? 'default' : 'collapsed'));
  };

  /** 切换标签；折叠状态下点击任意标签则展开控制台 */
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
    // 有 wsUrl → 渲染交互式 xterm.js 终端
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

    // 无 wsUrl → 回退到纯文本终端日志显示
    return (
      <div className={cx(styles['console-body'])}>
        {terminalLogs ? (
          terminalLogs
        ) : (
          <div className={cx(styles['console-empty'])}>暂无日志输出</div>
        )}
      </div>
    );
  };

  const renderLogsTab = () => (
    <div className={cx(styles['console-body'])}>
      {runtimeLogs ? (
        runtimeLogs
      ) : (
        <div className={cx(styles['console-empty'])}>暂无日志输出</div>
      )}
    </div>
  );

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
            终端
          </span>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]: activeTab === 'logs',
            })}
            onClick={() => handleTabClick('logs')}
          >
            日志
          </span>
        </div>
        <div className={cx(styles['console-actions'])}>
          {showTerminalAppearanceToggle && (
            <TooltipIcon
              title={
                isLightTerminal
                  ? dict(
                      'PC.Pages.ConversationAgentBottomConsole.terminalThemeDark',
                    )
                  : dict(
                      'PC.Pages.ConversationAgentBottomConsole.terminalThemeLight',
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
                ? dict('PC.Pages.ConversationAgentBottomConsole.restoreHeight')
                : dict('PC.Pages.ConversationAgentBottomConsole.expandHeight')
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
                ? dict('PC.Pages.ConversationAgentBottomConsole.restoreHeight')
                : dict('PC.Pages.ConversationAgentBottomConsole.collapsePanel')
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
        </div>
      </div>
      <div className={cx(styles['console-content'])}>
        {/* 两栏同时挂载，避免切换 tab 时卸载 xterm 导致内容与连接丢失 */}
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

export default ConversationAgentBottomConsole;
