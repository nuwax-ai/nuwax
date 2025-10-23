/**
 * 开发日志控制台组件
 * 在预览页面下方展示开发服务器日志
 */

import SvgIcon from '@/components/base/SvgIcon';
import type { DevLogEntry } from '@/types/interfaces/appDev';
import { LogLevel } from '@/types/interfaces/appDev';
import {
  BugOutlined,
  ClearOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  formatTimestampDisplay,
  groupLogsByTimestamp,
  isErrorLog,
  type LogGroup,
} from '../../utils/devLogParser';
import './index.less';

/**
 * DevLogConsole 组件属性
 */
interface DevLogConsoleProps {
  /** 日志数据 */
  logs: DevLogEntry[];
  /** 最新日志块是否包含错误 */
  hasErrorInLatestBlock: boolean;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 最后加载的行号 */
  lastLine?: number;
  /** 清空日志回调 */
  onClear?: () => void;
  /** 刷新日志回调 */
  onRefresh?: () => void;
  /** 关闭控制台回调 */
  onClose?: () => void;
  /** 添加日志到聊天框回调 */
  onAddToChat?: (content: string, isAuto?: boolean) => void;
}

/**
 * 日志内容合并渲染组件
 * 将组内所有日志合并成一个文本块展示，支持错误高亮
 */
const LogContentBlock: React.FC<{
  logs: DevLogEntry[];
}> = ({ logs }) => {
  // 获取组的最高级别
  const getGroupLevel = () => {
    if (logs.some((log) => log.level === LogLevel.ERROR)) return 'error';
    if (logs.some((log) => log.level === LogLevel.WARN)) return 'warn';
    if (logs.some((log) => log.level === LogLevel.INFO)) return 'info';
    return 'normal';
  };

  // 渲染带高亮的日志内容
  const renderHighlightedContent = () => {
    return logs.map((log, index) => {
      // 移除时间戳标识符 [YYYY/MM/DD HH:mm:ss]
      let content = log.content.replace(
        /\[\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*/,
        '',
      );
      // 移除行号标识符 "123| "
      content = content.replace(/^\d+\|\s*/, '');

      // 根据日志级别添加高亮样式
      const logClassName = `log-line log-line-${log.level.toLowerCase()}`;

      return (
        <div key={`${log.line}-${index}`} className={logClassName}>
          <span className="log-content">{content}</span>
        </div>
      );
    });
  };

  return (
    <div className={`log-content-block log-content-block-${getGroupLevel()}`}>
      <div className="log-text">{renderHighlightedContent()}</div>
    </div>
  );
};

/**
 * 日志组渲染组件
 * 用于渲染一个时间戳分组的日志
 */
const LogGroupItem: React.FC<{
  group: LogGroup;
  onAddToChat?: (content: string) => void;
}> = ({ group, onAddToChat }) => {
  // const [isExpanded, setIsExpanded] = useState(true); // 暂时注释掉，后续可能需要
  const groupLogs = group.logs
    .map((log) => log.content)
    .join('\n')
    .trim();
  // 处理点击事件
  const handleClick = () => {
    if (onAddToChat && groupLogs) {
      onAddToChat(groupLogs);
    }
  };
  return (
    <div
      className="log-group"
      onClick={handleClick}
      style={{ cursor: onAddToChat ? 'pointer' : 'default' }}
    >
      {/* 组头 - 简洁的时间戳显示 */}
      <div className="log-group-header">
        <Tooltip title={onAddToChat ? '点击添加到聊天框' : ''}>
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
 * 开发日志控制台组件
 */
const DevLogConsole: React.FC<DevLogConsoleProps> = ({
  logs,
  hasErrorInLatestBlock,
  isLoading = false,
  lastLine = 0,
  onClear,
  onRefresh,
  onClose,
  onAddToChat,
}) => {
  const logListRef = useRef<HTMLDivElement>(null);
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [showLoading, setShowLoading] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingStartTimeRef = useRef<number | null>(null);

  // 将日志按时间戳分组
  useEffect(() => {
    const groups = groupLogsByTimestamp(logs);
    setLogGroups(groups);
  }, [logs]);

  // 处理 loading 状态，确保至少显示 500ms
  useEffect(() => {
    // 清除之前的定时器
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (isLoading && lastLine <= 1) {
      // 只有在第一次加载（lastLine <= 1）且正在加载时才显示
      if (!showLoading) {
        loadingStartTimeRef.current = Date.now();
        setShowLoading(true);
      }
    } else if (!isLoading && showLoading) {
      // 停止加载时，计算剩余时间确保至少显示 500ms
      const elapsed = loadingStartTimeRef.current
        ? Date.now() - loadingStartTimeRef.current
        : 0;
      const remainingTime = Math.max(0, 500 - elapsed);

      loadingTimerRef.current = setTimeout(() => {
        setShowLoading(false);
        loadingStartTimeRef.current = null;
      }, remainingTime);
    }

    // 清理函数
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [isLoading, lastLine, showLoading]);

  // 自动滚动到底部
  useEffect(() => {
    if (logGroups.length > 0 && logListRef.current) {
      // 使用 setTimeout 确保 DOM 更新完成后再滚动
      setTimeout(() => {
        if (logListRef.current) {
          logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [logGroups.length, logGroups]);

  // 组件挂载时滚动到底部
  useEffect(() => {
    if (logGroups.length > 0 && logListRef.current) {
      // 延迟执行，确保组件完全渲染
      const timer = setTimeout(() => {
        if (logListRef.current) {
          logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);
  const handleFindLatestErrorLogs = useCallback(() => {
    // 查找到最新错误日志所在的组
    const latestErrorGroup = logGroups.findLast((group) =>
      group.logs.some((log) => isErrorLog(log)),
    );
    if (latestErrorGroup) {
      onAddToChat?.(
        latestErrorGroup.logs
          .map((log) => log.content)
          .join('\n')
          .trim(),
        true,
      );
    }
  }, [logGroups, onAddToChat]);

  return (
    <div className="dev-log-console">
      {/* 工具栏 */}
      <div className="dev-log-console-header">
        <div className="header-left">
          <BugOutlined className="header-icon" />
          <span className="header-title">开发服务器日志</span>
          {hasErrorInLatestBlock && (
            <>
              <Tooltip title="最新日志包含错误">
                <Badge status="error" className="error-badge" />
              </Tooltip>
              {onAddToChat && (
                <Button
                  size="small"
                  danger
                  icon={
                    <SvgIcon
                      name="icons-common-stars"
                      style={{ fontSize: '12px' }}
                    />
                  }
                  onClick={handleFindLatestErrorLogs}
                >
                  一键问题处理
                </Button>
              )}
            </>
          )}
        </div>
        <div className="header-right">
          <Tooltip title="刷新日志">
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={isLoading}
            />
          </Tooltip>
          <Tooltip title="清空日志">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={onClear}
            />
          </Tooltip>
          <Tooltip title="关闭日志控制台">
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Tooltip>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="dev-log-console-body">
        {showLoading ? (
          <div className="loading-logs">
            <div className="loading-spinner">
              <ReloadOutlined spin />
            </div>
            <p>正在加载日志...</p>
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
            <p>暂无日志数据</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DevLogConsole);
