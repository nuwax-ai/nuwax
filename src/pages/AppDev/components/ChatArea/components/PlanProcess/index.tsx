import type { PlanEntry } from '@/types/interfaces/appDev';
import {
  BorderOutlined,
  CheckSquareOutlined,
  CloseSquareOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

interface PlanProcessProps {
  planId: string;
  entries: PlanEntry[];
  dataKey: string;
  textTruncateMode?: 'ellipsis' | 'middle' | 'fade' | 'none';
  maxLength?: number;
}

/**
 * Plan 执行过程组件
 * 参考 MarkdownCustomProcess 的结构，展示执行计划任务列表
 */
const PlanProcess: React.FC<PlanProcessProps> = ({
  // planId, // 暂时未使用
  entries,
  dataKey,
  textTruncateMode = 'ellipsis',
  maxLength = 50,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 状态统计
  const stats = useMemo(
    () => ({
      total: entries.length,
      completed: entries.filter((e) => e.status === 'completed').length,
      in_progress: entries.filter((e) => e.status === 'in_progress').length,
      failed: entries.filter((e) => e.status === 'failed').length,
    }),
    [entries],
  );

  // 获取整体状态
  const getOverallStatus = () => {
    if (stats.failed > 0) return 'failed';
    if (stats.completed === stats.total) return 'completed';
    if (stats.in_progress > 0) return 'in_progress';
    return 'pending';
  };

  // 获取状态文本
  const getStatusText = () => {
    const overallStatus = getOverallStatus();
    switch (overallStatus) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '执行中';
      case 'failed':
        return '部分失败';
      default:
        return '待执行';
    }
  };

  // 获取状态点样式类名
  const getStatusDotClass = () => {
    const overallStatus = getOverallStatus();
    return `statusDot status${
      overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)
    }`;
  };

  // 获取任务状态点样式类名
  // const getTaskStatusDotClass = (status: string) => {
  //   return `statusDot status${
  //     status.charAt(0).toUpperCase() + status.slice(1)
  //   }`;
  // };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckSquareOutlined style={{ fontSize: 14 }} />;
      case 'pending':
        return <BorderOutlined style={{ fontSize: 14 }} />;
      case 'failed':
        return <CloseSquareOutlined style={{ fontSize: 14 }} />;
      case 'in_progress':
        return <HourglassOutlined style={{ fontSize: 14 }} />;
      default:
        return <BorderOutlined style={{ fontSize: 14 }} />;
    }
  };

  // 文本截取工具函数
  const truncateText = (text: string, mode: string, maxLen: number) => {
    if (text.length <= maxLen) return text;

    switch (mode) {
      case 'ellipsis':
        return text.substring(0, maxLen) + '...';
      case 'middle': {
        const start = Math.floor(maxLen / 2) - 1;
        const end = Math.ceil(maxLen / 2) + 1;
        return (
          text.substring(0, start) + '...' + text.substring(text.length - end)
        );
      }
      case 'fade':
        return text.substring(0, maxLen);
      case 'none':
      default:
        return text;
    }
  };

  // 获取截取后的计划文本
  const getTruncatedPlanText = () => {
    const fullText = `执行计划 (${stats.completed}/${stats.total} 已完成)`;
    return truncateText(fullText, textTruncateMode, maxLength);
  };

  return (
    <div className={styles.planProcess} data-key={dataKey}>
      {/* 主操作行 - 参考效果图的简洁设计 */}
      <div className={styles.operationRow}>
        <div className={styles.operationInfo}>
          <span className={styles[getStatusDotClass()]} />
          <Tooltip
            title={`执行计划 (${stats.completed}/${stats.total} 已完成)`}
            placement="topLeft"
          >
            <span
              className={`${styles.operationText} ${
                styles[`truncate-${textTruncateMode}`]
              }`}
            >
              {getTruncatedPlanText()}
            </span>
          </Tooltip>
        </div>
        <div className={styles.operationStatus}>
          <span className={styles.statusText}>{getStatusText()}</span>
          <Button
            type="text"
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            className={styles.toggleButton}
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </div>

      {/* 详细信息 - 可折叠 */}
      {isExpanded && (
        <div className={styles.detailsRow}>
          <div className={styles.detailsContent}>
            {/* 任务列表 */}
            <div className={styles.taskList}>
              {entries.map((entry, index) => (
                <div key={index} className={styles.taskItem}>
                  {getStatusIcon(entry.status)}
                  {/* <Tooltip title={entry.content} placement="right"> */}
                  <span className={`${styles.taskText}`}>{entry.content}</span>
                  {/* </Tooltip> */}
                  {/* <span className={styles.taskStatus}>
                    {entry.status === 'pending' && '待执行'}
                    {entry.status === 'in_progress' && '执行中'}
                    {entry.status === 'completed' && '已完成'}
                    {entry.status === 'failed' && '失败'}
                  </span> */}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanProcess;
