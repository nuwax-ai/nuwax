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
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

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

/**
 * 单组日志内容块
 * 按日志级别着色，组级别取组内最高级别（error > warn > info > normal）
 */
const LogContentBlock: React.FC<{ logs: DevLogEntry[] }> = ({ logs }) => {
  /** 组内最高日志级别（决定整块底色） */
  const getGroupLevel = () => {
    if (logs.some((log) => log.level === LogLevel.ERROR)) return 'error';
    if (logs.some((log) => log.level === LogLevel.WARN)) return 'warn';
    if (logs.some((log) => log.level === LogLevel.INFO)) return 'info';
    return 'normal';
  };

  /** 渲染日志行：去掉时间戳前缀与行号前缀后按级别着色 */
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
          className={cx(
            styles['log-line'],
            styles[`log-line-${log.level.toLowerCase()}`],
          )}
        >
          <span className={cx(styles['log-content'])}>{content}</span>
        </div>
      );
    });

  return (
    <div
      className={cx(
        styles['log-content-block'],
        styles[`log-content-block-${getGroupLevel()}`],
      )}
    >
      <div className={cx(styles['log-text'])}>{renderHighlightedContent()}</div>
    </div>
  );
};

/**
 * 单个日志分组项（时间戳 + 内容块）
 * 点击整组可将组内日志内容加入对话
 */
const LogGroupItem: React.FC<{
  group: LogGroup;
  onAddToChat?: (content: string, isAuto?: boolean) => void;
}> = ({ group, onAddToChat }) => {
  /** 组内日志拼接为一段文本（用于加入对话） */
  const groupLogs = group.logs
    .map((log) => log.content)
    .join('\n')
    .trim();

  /** 点击日志组：将整组内容加入对话（手动触发，isAuto=false） */
  const handleClick = () => {
    if (onAddToChat && groupLogs) {
      onAddToChat(groupLogs, false);
    }
  };

  return (
    <div
      className={cx(styles['log-group'])}
      onClick={handleClick}
      style={{ cursor: onAddToChat ? 'pointer' : 'default' }}
    >
      <div className={cx(styles['log-group-header'])}>
        <Tooltip
          title={
            onAddToChat
              ? t('PC.Pages.AppDevDevLogConsole.clickToAddToChat')
              : ''
          }
        >
          <div className={cx(styles['group-header-left'])}>
            <span className={cx(styles['group-timestamp'])}>
              {formatTimestampDisplay(group.timestamp)}
            </span>
          </div>
        </Tooltip>
      </div>
      <div className={cx(styles['log-group-content'])}>
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
  /** 日志列表容器引用（用于自动滚动到底部） */
  const logListRef = useRef<HTMLDivElement>(null);
  /** 按时间戳分组后的日志 */
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  /** 是否显示加载态（带最短展示时长，避免闪烁） */
  const [showLoading, setShowLoading] = useState(false);
  /** 延迟隐藏加载态的定时器 */
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  /** 加载态开始展示的时间戳（用于计算最短展示时长） */
  const loadingStartTimeRef = useRef<number | null>(null);

  /** 日志变化时重新按时间戳分组 */
  useEffect(() => {
    setLogGroups(groupLogsByTimestamp(logs));
  }, [logs]);

  /**
   * 加载态控制：仅首次加载（lastLine <= 1）时显示，
   * 且保证至少展示 500ms，避免快速加载时一闪而过
   */
  useEffect(() => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (isLoading && lastLine <= 1) {
      // 首次加载开始：记录起始时间并显示加载态
      if (!showLoading) {
        loadingStartTimeRef.current = Date.now();
        setShowLoading(true);
      }
    } else if (!isLoading && showLoading) {
      // 加载结束：不足 500ms 时延迟隐藏，补足最短展示时长
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

  /** 日志更新后自动滚动到底部（setTimeout 等待 DOM 渲染完成） */
  useEffect(() => {
    if (logGroups.length > 0 && logListRef.current) {
      setTimeout(() => {
        if (logListRef.current) {
          logListRef.current.scrollTop = logListRef.current.scrollHeight;
        }
      }, 0);
    }
  }, [logGroups.length, logGroups]);

  /** 检测到最新错误日志时自动加入对话（对话进行中时跳过） */
  useEffect(() => {
    if (isChatLoading) return;
    if (latestErrorLogs) {
      onAddToChat?.(latestErrorLogs, true);
    }
  }, [logs, isChatLoading, latestErrorLogs, onAddToChat]);

  return (
    <div className={cx(styles['dev-log-panel'], className)}>
      {showLoading ? (
        /* 加载态 */
        <div className={cx(styles['loading-logs'])}>
          <div className={cx(styles['loading-spinner'])}>
            <ReloadOutlined spin />
          </div>
          <p>{t('PC.Pages.AppDevDevLogConsole.loadingLogs')}</p>
        </div>
      ) : logGroups.length > 0 ? (
        /* 日志分组列表 */
        <div ref={logListRef} className={cx(styles['log-list'])}>
          {logGroups.map((group, index) => (
            <LogGroupItem
              key={`${group.timestamp}-${index}`}
              group={group}
              onAddToChat={onAddToChat}
            />
          ))}
        </div>
      ) : (
        /* 空态 */
        <div className={cx(styles['empty-logs'])}>
          <BugOutlined className={cx(styles['empty-icon'])} />
          <p>{t('PC.Pages.AppDevDevLogConsole.noLogData')}</p>
        </div>
      )}
    </div>
  );
};

export default DevLogPanel;
