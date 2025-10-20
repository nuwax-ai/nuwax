/**
 * 开发服务器日志查看器组件
 * 悬浮可拖拽的日志监控组件
 */

import type { DevLogEntry } from '@/types/interfaces/appDev';
import { formatLogDisplay } from '@/utils/devLogParser';
import {
  BugOutlined,
  ClearOutlined,
  DownOutlined,
  DragOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Badge, Button, List, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

/**
 * 日志条目组件属性
 */
interface LogItemProps {
  log: DevLogEntry;
  style?: React.CSSProperties;
}

/**
 * 单条日志渲染组件
 */
const LogItem: React.FC<LogItemProps> = ({ log, style }) => {
  const displayText = formatLogDisplay(log, true, true);

  return (
    <div
      className={`dev-log-item dev-log-item-${log.level.toLowerCase()}`}
      style={style}
      title={log.content}
    >
      <span className="log-content">{displayText}</span>
    </div>
  );
};

/**
 * 开发日志查看器组件属性
 */
interface DevLogViewerProps {
  /** 日志数据 */
  logs: DevLogEntry[];
  /** 错误计数 */
  errorCount: number;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 是否自动滚动到底部 */
  autoScroll?: boolean;
  /** 清空日志回调 */
  onClear?: () => void;
  /** 刷新日志回调 */
  onRefresh?: () => void;
  /** 组件是否可见 */
  visible?: boolean;
}

/**
 * 开发日志查看器组件
 */
const DevLogViewer: React.FC<DevLogViewerProps> = ({
  logs,
  errorCount,
  isLoading = false,
  autoScroll = true,
  onClear,
  onRefresh,
  visible = true,
}) => {
  // 组件状态
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    // 初始化位置设置为右下角
    const rightMargin = 20;
    const bottomMargin = 20;
    return {
      x: window.innerWidth - (60 + rightMargin), // 收起状态宽度 + 右边距
      y: window.innerHeight - (60 + bottomMargin), // 收起状态高度 + 下边距
    };
  });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragDistance, setDragDistance] = useState(0);
  const [isClick, setIsClick] = useState(true);

  // 引用
  const containerRef = useRef<HTMLDivElement>(null);

  // 切换展开/收起
  const toggleExpanded = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    // 如果从收起状态切换到展开状态，检查位置是否需要调整
    if (newExpanded) {
      setPosition((prevPosition) => {
        const maxX = window.innerWidth - 480;
        const maxY = window.innerHeight - 600;

        // 如果当前位置会导致组件超出视口，则调整位置
        if (prevPosition.x > maxX || prevPosition.y > maxY) {
          return {
            x: Math.max(0, Math.min(prevPosition.x, maxX)),
            y: Math.max(0, Math.min(prevPosition.y, maxY)),
          };
        }

        return prevPosition;
      });
    }
  }, [isExpanded]);

  // 拖拽处理（Pointer Events，提升快速移动时的稳定性）
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // 检查是否点击在拖拽手柄上，或者是整个容器
      const target = e.target as HTMLElement;
      const isDragHandle =
        target.classList.contains('dev-log-viewer-header') ||
        !!target.closest('.drag-handle-icon') ||
        !!(target as HTMLElement).closest('.dev-log-viewer-collapsed-content');

      if (isDragHandle) {
        setIsDragging(true);
        setIsClick(true);
        setDragDistance(0);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
        try {
          containerRef.current?.setPointerCapture(e.pointerId);
        } catch {}
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [position],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (isDragging) {
        // 若已无按键按下（如在窗口外松开），强制结束拖拽
        if (e.buttons === 0) {
          setIsDragging(false);
          setIsClick(true);
          setDragDistance(0);
          return;
        }
        const deltaX = e.clientX - dragStart.x - position.x;
        const deltaY = e.clientY - dragStart.y - position.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        setDragDistance(distance);

        // 如果拖拽距离超过阈值（5像素），则认为是拖拽而不是点击
        if (distance > 5) {
          setIsClick(false);
        }

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // 限制在视口内
        const maxX = window.innerWidth - (isExpanded ? 480 : 60);
        const maxY = window.innerHeight - (isExpanded ? 600 : 60);

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    },
    [isDragging, dragStart, isExpanded, position],
  );

  const handlePointerUp = useCallback(
    (e?: PointerEvent) => {
      if (isDragging) {
        // 如果是点击（拖拽距离小于阈值），则执行点击操作
        if (isClick && dragDistance <= 5) {
          // 点击收起状态的展开按钮
          if (!isExpanded) {
            toggleExpanded();
          }
        }

        if (e && containerRef.current) {
          try {
            containerRef.current.releasePointerCapture(e.pointerId);
          } catch {}
        }
        setIsDragging(false);
        setIsClick(true);
        setDragDistance(0);
      }
    },
    [isDragging, isClick, dragDistance, isExpanded, toggleExpanded],
  );

  // 绑定全局指针/窗口事件，确保在窗口外释放时也能结束拖拽
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true,
      });
      window.addEventListener('pointerup', handlePointerUp as EventListener);
      const cancelDrag = () => {
        setIsDragging(false);
        setIsClick(true);
        setDragDistance(0);
      };
      window.addEventListener('blur', cancelDrag);
      document.addEventListener('mouseleave', cancelDrag);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelDrag();
      });

      return () => {
        window.removeEventListener(
          'pointermove',
          handlePointerMove as EventListener,
        );
        window.removeEventListener(
          'pointerup',
          handlePointerUp as EventListener,
        );
        window.removeEventListener('blur', cancelDrag);
        document.removeEventListener('mouseleave', cancelDrag);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // 窗口大小变化时调整位置
  useEffect(() => {
    const handleResize = () => {
      setPosition((prevPosition) => {
        const maxX = window.innerWidth - (isExpanded ? 480 : 60);
        const maxY = window.innerHeight - (isExpanded ? 600 : 60);

        return {
          x: Math.max(0, Math.min(prevPosition.x, maxX)),
          y: Math.max(0, Math.min(prevPosition.y, maxY)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  // 点击外部时自动收起（还原更保守的策略，仅使用 pointerdown 捕获）
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: Event) => {
      if (isDragging) return; // 拖拽中不收起
      const target = e.target as Node | null;
      const container = containerRef.current;
      if (!container) return;
      if (target && !container.contains(target)) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('pointerdown', handleClickOutside, true);
    return () => {
      window.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [isExpanded, isDragging]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && isExpanded && logs.length > 0) {
      // 使用简单的滚动到底部逻辑
      const logContainer = containerRef.current?.querySelector('.log-list');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs.length, autoScroll, isExpanded]);

  // 清空日志
  const handleClear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  // 刷新日志
  const handleRefresh = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  if (!visible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`dev-log-viewer ${
        isExpanded ? 'dev-log-viewer-expanded' : 'dev-log-viewer-collapsed'
      }`}
      style={{
        left: position.x,
        top: position.y,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
    >
      {isExpanded ? (
        // 展开状态
        <div className="dev-log-viewer-content">
          {/* 头部工具栏 */}
          <div className="dev-log-viewer-header drag-handle">
            <div className="header-left">
              <BugOutlined className="header-icon" />
              <span className="header-title">开发服务器日志</span>
              {errorCount > 0 && (
                <Badge
                  count={errorCount}
                  size="small"
                  className="error-badge"
                />
              )}
            </div>
            <div className="header-right">
              <Tooltip title="刷新日志">
                <Button
                  type="text"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={isLoading}
                />
              </Tooltip>
              <Tooltip title="清空日志">
                <Button
                  type="text"
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                />
              </Tooltip>
              <Tooltip title="收起">
                <Button
                  type="text"
                  size="small"
                  icon={<DownOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleExpanded();
                  }}
                />
              </Tooltip>
              <Tooltip title="拖拽移动">
                <div className="drag-handle-icon">
                  <DragOutlined />
                </div>
              </Tooltip>
            </div>
          </div>

          {/* 日志列表 */}
          <div className="dev-log-viewer-body">
            {logs.length > 0 ? (
              <div
                className="log-list"
                style={{ height: 520, overflowY: 'auto' }}
              >
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
                <Button type="primary" size="small" onClick={handleRefresh}>
                  刷新日志
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // 收起状态
        <div className="dev-log-viewer-collapsed-content drag-handle">
          <BugOutlined
            className="expand-button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (isDragging) return;
              if (!isExpanded) {
                toggleExpanded();
              }
            }}
          />
          {errorCount > 0 && (
            <Badge
              count={errorCount}
              size="small"
              className="collapsed-error-badge"
            />
          )}
          <div className="drag-handle-icon collapsed-drag-handle">
            <DragOutlined />
          </div>
        </div>
      )}
    </div>
  );
};

export default DevLogViewer;
