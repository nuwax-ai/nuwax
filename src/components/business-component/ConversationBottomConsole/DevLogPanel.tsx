/**
 * 开发日志面板（仅内容区，供底部合集控制台嵌入使用）
 */

import {
  formatTimestampDisplay,
  groupLogsByTimestamp,
  type LogGroup,
} from '@/pages/AppDev/utils/devLogParser';
import { t } from '@/services/i18nRuntime';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { LogLevel } from '@/types/interfaces/appDev';
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import './devLogPanel.less';

export interface DevLogPanelProps {
  /** 日志数据 */
  logs: DevLogEntry[];
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 最后加载的行号 */
  lastLine?: number;
  /** 添加日志到聊天框回调 */
  onAddToChat?: (content: string, isAuto?: boolean) => void;
  /** 是否正在发送消息 */
  isChatLoading?: boolean;
  /** 获取最新错误日志（自动处理问题） */
  latestErrorLogs?: string;
  /** 自定义根节点 className */
  className?: string;
}

const LogContentBlock: React.FC<{ logs: DevLogEntry[] }> = ({ logs }) => {
  const getGroupLevel = () => {
    if (logs.some((log) => log.level === LogLevel.ERROR)) return 'error';
    if (logs.some((log) => log.level === LogLevel.WARN)) return 'warn';
    if (logs.some((log) => log.level === LogLevel.INFO)) return 'info';
    return 'normal';
  };

  const renderHighlightedContent = () =>
    logs.map((log, index) => {
      let content = log.content.replace(
        /\[\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*/,
        '',
      );
      content = content.replace(/^\d+\|\s*/, '');

      return (
        <div
          key={`${log.line}-${index}`}
          className={`log-line log-line-${log.level.toLowerCase()}`}
        >
          <span className="log-content">{content}</span>
        </div>
      );
    });

  return (
    <div className={`log-content-block log-content-block-${getGroupLevel()}`}>
      <div className="log-text">{renderHighlightedContent()}</div>
    </div>
  );
};

const LogGroupItem: React.FC<{
  group: LogGroup;
  onAddToChat?: (content: string, isAuto?: boolean) => void;
}> = ({ group, onAddToChat }) => {
  const groupLogs = group.logs
    .map((log) => log.content)
    .join('\n')
    .trim();

  const handleClick = () => {
    if (onAddToChat && groupLogs) {
      onAddToChat(groupLogs, false);
    }
  };

  return (
    <div
      className="log-group"
      onClick={handleClick}
      style={{ cursor: onAddToChat ? 'pointer' : 'default' }}
    >
      <div className="log-group-header">
        <Tooltip
          title={
            onAddToChat
              ? t('PC.Pages.AppDevDevLogConsole.clickToAddToChat')
              : ''
          }
        >
          <div className="group-header-left">
            <span className="group-timestamp">
              {formatTimestampDisplay(group.timestamp)}
            </span>
          </div>
        </Tooltip>
      </div>
      <div className="log-group-content">
        <LogContentBlock logs={group.logs} />
      </div>
    </div>
  );
};

/**
 * 开发日志列表面板
 */
const DevLogPanel: React.FC<DevLogPanelProps> = ({
  logs,
  isLoading = false,
  lastLine = 0,
  onAddToChat,
  isChatLoading = false,
  latestErrorLogs,
  className,
}) => {
  const logListRef = useRef<HTMLDivElement>(null);
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    setLogGroups(groupLogsByTimestamp(logs));
  }, [logs]);

  useEffect(() => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (isLoading && lastLine <= 1) {
      if (!showLoading) {
        loadingStartTimeRef.current = Date.now();
        setShowLoading(true);
      }
    } else if (!isLoading && showLoading) {
      const elapsed = loadingStartTimeRef.current
        ? Date.now() - loadingStartTimeRef.current
        : 0;
      const remainingTime = Math.max(0, 500 - elapsed);

      loadingTimerRef.current = setTimeout(() => {
        setShowLoading(false);
        loadingStartTimeRef.current = null;
      }, remainingTime);
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [isLoading, lastLine, showLoading]);

  useEffect(() => {
    if (logGroups.length > 0 && logListRef.current) {
      setTimeout(() => {
        if (logListRef.current) {
          logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [logGroups.length, logGroups]);

  useEffect(() => {
    if (isChatLoading) return;
    if (latestErrorLogs) {
      onAddToChat?.(latestErrorLogs, true);
    }
  }, [logs, isChatLoading, latestErrorLogs, onAddToChat]);

  return (
    <div className={className ? `dev-log-panel ${className}` : 'dev-log-panel'}>
      {showLoading ? (
        <div className="loading-logs">
          <div className="loading-spinner">
            <ReloadOutlined spin />
          </div>
          <p>{t('PC.Pages.AppDevDevLogConsole.loadingLogs')}</p>
        </div>
      ) : logGroups.length > 0 ? (
        <div ref={logListRef} className="log-list">
          {logGroups.map((group, index) => (
            <LogGroupItem
              key={`${group.timestamp}-${index}`}
              group={group}
              onAddToChat={onAddToChat}
            />
          ))}
        </div>
      ) : (
        <div className="empty-logs">
          <BugOutlined className="empty-icon" />
          <p>{t('PC.Pages.AppDevDevLogConsole.noLogData')}</p>
        </div>
      )}
    </div>
  );
};

export default DevLogPanel;
