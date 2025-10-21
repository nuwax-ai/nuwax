/**
 * 开发日志控制台组件
 * 在预览页面下方展示开发服务器日志
 */

import type { DevLogEntry } from '@/types/interfaces/appDev';
import {
  BugOutlined,
  ClearOutlined,
  CloseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Badge, Button, List, Tooltip } from 'antd';
import React, { useEffect, useRef } from 'react';
import { formatLogDisplay } from '../../utils/devLogParser';
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
 * 单条日志渲染组件
 * 用于渲染单条日志条目
 */
const LogItem: React.FC<{ log: DevLogEntry }> = ({ log }) => {
  const displayText = formatLogDisplay(log, true, true);

  return (
    <div
      className={`dev-log-console-item dev-log-console-item-${log.level.toLowerCase()}`}
      title={log.content}
    >
      <span className="log-content">{displayText}</span>
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
        {logs.length > 0 ? (
          <div ref={logListRef} className="log-list">
            <List
              dataSource={logs}
              renderItem={(log) => <LogItem key={log.line} log={log} />}
              size="small"
            />
          </div>
        ) : (
          <div className="empty-logs">
            <BugOutlined className="empty-icon" />
            <p>暂无日志数据</p>
            <Button type="primary" size="small" onClick={onRefresh}>
              刷新日志
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DevLogConsole);
