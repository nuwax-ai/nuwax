import { XtermTerminal } from '@/components/business-component';
import type { XtermTerminalRef } from '@/components/business-component/Terminal/type';
import classNames from 'classnames';
import React, { useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ConversationAgentBottomConsoleProps {
  /** 是否显示控制台 */
  visible?: boolean;
  /** 终端日志内容（纯文本模式，wsUrl 不存在时使用） */
  terminalLogs?: string;
  /** 运行日志内容 */
  runtimeLogs?: string;
  /** 终端 WebSocket 连接地址，传入后启用交互式终端 */
  wsUrl?: string;
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
> = ({ visible = true, terminalLogs = '', runtimeLogs = '', wsUrl }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'logs'>('terminal');
  const terminalRef = useRef<XtermTerminalRef>(null);

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
    <div className={cx(styles.console)}>
      <div className={cx(styles['console-header'])}>
        <div className={cx(styles['console-tabs'])}>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]: activeTab === 'terminal',
            })}
            onClick={() => setActiveTab('terminal')}
          >
            终端
          </span>
          <span
            className={cx(styles['console-tab'], {
              [styles.active]: activeTab === 'logs',
            })}
            onClick={() => setActiveTab('logs')}
          >
            日志
          </span>
        </div>
      </div>
      {activeTab === 'terminal' ? renderTerminalTab() : renderLogsTab()}
    </div>
  );
};

export default ConversationAgentBottomConsole;
