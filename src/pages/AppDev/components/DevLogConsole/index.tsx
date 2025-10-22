/**
 * 开发日志控制台组件
 * 在预览页面下方展示开发服务器日志
 */

import type { DevLogEntry } from '@/types/interfaces/appDev';
import { LogLevel } from '@/types/interfaces/appDev';
import {
  BugOutlined,
  ClearOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Badge, Button, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  formatTimestampDisplay,
  groupLogsByTimestamp,
  type LogGroup,
} from '../../utils/devLogParser';
import './index.less';

/**
 * DevLogConsole 组件属性
 */
interface DevLogConsoleProps {
  /** 日志数据 */
  logs: DevLogEntry[];
  /** 错误计数 */
  errorCount: number;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 清空日志回调 */
  onClear?: () => void;
  /** 刷新日志回调 */
  onRefresh?: () => void;
  /** 关闭控制台回调 */
  onClose?: () => void;
}

/**
 * 日志内容合并渲染组件
 * 将组内所有日志合并成一个文本块展示
 */
const LogContentBlock: React.FC<{ logs: DevLogEntry[] }> = ({ logs }) => {
  // 合并所有日志内容，移除时间戳和行号
  const mergedContent = logs
    .map((log) => {
      // 移除时间戳标识符 [YYYY/MM/DD HH:mm:ss]
      let content = log.content.replace(
        /\[\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2}:\d{2}\]\s*/,
        '',
      );
      // 移除行号标识符 "123| "
      content = content.replace(/^\d+\|\s*/, '');
      return content;
    })
    .join('\n')
    .trim();

  // 获取组的最高级别
  const getGroupLevel = () => {
    if (logs.some((log) => log.level === LogLevel.ERROR)) return 'error';
    if (logs.some((log) => log.level === LogLevel.WARN)) return 'warn';
    if (logs.some((log) => log.level === LogLevel.INFO)) return 'info';
    return 'normal';
  };

  return (
    <div className={`log-content-block log-content-block-${getGroupLevel()}`}>
      <pre className="log-text">{mergedContent}</pre>
    </div>
  );
};

/**
 * 日志组渲染组件
 * 用于渲染一个时间戳分组的日志
 */
const LogGroupItem: React.FC<{ group: LogGroup }> = ({ group }) => {
  // const [isExpanded, setIsExpanded] = useState(true); // 暂时注释掉，后续可能需要

  return (
    <div className="log-group">
      {/* 组头 - 简洁的时间戳显示 */}
      <div className="log-group-header">
        <div className="group-header-left">
          <span className="group-timestamp">
            {formatTimestampDisplay(group.timestamp)}
          </span>
        </div>
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
  errorCount,
  isLoading = false,
  onClear,
  onRefresh,
  onClose,
}) => {
  const logListRef = useRef<HTMLDivElement>(null);
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);

  // 将日志按时间戳分组
  useEffect(() => {
    const groups = groupLogsByTimestamp(logs);
    setLogGroups(groups);
  }, [logs]);

  // 自动滚动到底部
  useEffect(() => {
    if (logs.length > 0 && logListRef.current) {
      logListRef.current.scrollTop = logListRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="dev-log-console">
      {/* 工具栏 */}
      <div className="dev-log-console-header">
        <div className="header-left">
          <BugOutlined className="header-icon" />
          <span className="header-title">开发服务器日志</span>
          {errorCount > 0 && (
            <Badge count={errorCount} size="small" className="error-badge" />
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
        {logGroups.length > 0 ? (
          <div ref={logListRef} className="log-list">
            {logGroups.map((group, index) => (
              <LogGroupItem key={`${group.timestamp}-${index}`} group={group} />
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
