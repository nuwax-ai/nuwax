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
  UpOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 底部控制台布局模式 */
type ConsoleLayoutMode = 'default' | 'expanded' | 'collapsed';

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
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>('terminal');
  const [layoutMode, setLayoutMode] = useState<ConsoleLayoutMode>('default');
  const terminalRef = useRef<XtermTerminalRef>(null);

  /** 放大：占满父级右侧面板高度；再次点击恢复默认高度 */
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
            wsUrl={wsUrl}
            wsSubprotocols={wsSubprotocols}
            wireProtocol={wireProtocol}
            autoConnect
            theme="dark"
            fontSize={12}
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
        {activeTab === 'terminal' ? renderTerminalTab() : renderLogsTab()}
      </div>
    </div>
  );
};

export default ConversationAgentBottomConsole;
