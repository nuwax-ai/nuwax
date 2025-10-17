import { Button, Tooltip } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

interface ToolCallProcessProps {
  toolCallId: string;
  title: string;
  kind: 'read' | 'edit' | 'write' | 'execute';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  content?: any;
  locations?: Array<{ line: number; path: string; type: 'ToolCallLocation' }>;
  rawInput?: Record<string, any>;
  timestamp: string;
  dataKey: string;
  type: 'tool_call' | 'tool_call_update'; // 新增 type 字段
  textTruncateMode?: 'ellipsis' | 'middle' | 'fade' | 'none';
  maxLength?: number;
}

/**
 * Tool Call 执行过程组件
 * 参考 MarkdownCustomProcess 的结构，展示工具调用详情
 */
const ToolCallProcess: React.FC<ToolCallProcessProps> = ({
  // toolCallId, // 暂时未使用
  title,
  kind,
  status,
  content,
  locations,
  timestamp,
  dataKey,
  type = 'tool_call',
  textTruncateMode = 'ellipsis',
  maxLength = 50,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 获取操作描述文本
  const getOperationText = () => {
    const filePath = locations && locations.length > 0 ? locations[0].path : '';
    const lineInfo =
      locations && locations.length > 0 && locations[0].line
        ? `:${locations[0].line}`
        : '';

    // 根据 type 添加不同的前缀
    const typePrefix = type === 'tool_call_update' ? '[更新] ' : '';

    switch (kind) {
      case 'read':
        return `${typePrefix}读取文件 ${filePath}${lineInfo}`;
      case 'edit':
        return `${typePrefix}编辑文件 ${filePath}${lineInfo}`;
      case 'write':
        return `${typePrefix}创建文件 ${filePath}`;
      case 'execute':
        return `${typePrefix}执行命令 ${title || '执行命令'}`;
      default:
        return `${typePrefix}${title || '工具调用'} ${filePath}${lineInfo}`;
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'in_progress':
        return '执行中';
      case 'failed':
        return '失败';
      default:
        return '待执行';
    }
  };

  // 获取状态点样式类名
  const getStatusDotClass = () => {
    return `statusDot status${
      status?.charAt?.(0).toUpperCase() + status?.slice?.(1)
    }`;
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

  // 获取截取后的操作文本
  const getTruncatedOperationText = () => {
    const fullText = getOperationText();
    return truncateText(fullText, textTruncateMode, maxLength);
  };

  // 渲染文件列表内容
  const renderFileList = (text: string) => {
    const lines = text.split('\n');
    const isFileList = lines.some(
      (line) =>
        line.includes('drwx') || line.includes('-rw-') || line.includes('总计'),
    );

    if (isFileList) {
      return (
        <div className={styles.fileListContainer}>
          {lines.map((line, index) => {
            if (line.includes('drwx')) {
              // 目录行
              return (
                <div key={index} className={styles.fileListLine}>
                  <span className={styles.fileIcon}>📁</span>
                  <span className={styles.directoryLine}>{line}</span>
                </div>
              );
            } else if (line.includes('-rw-')) {
              // 文件行
              const fileName = line.split(' ').pop() || '';
              const isCodeFile =
                /\.(js|ts|jsx|tsx|py|java|cpp|c|h|css|less|scss|html|xml|json|md|txt)$/i.test(
                  fileName,
                );
              const isConfigFile =
                /^\./.test(fileName) ||
                /\.(config|conf|ini|yaml|yml|toml)$/i.test(fileName);

              // 确定文件行的 CSS 类名
              const fileLineClass = isCodeFile
                ? `${styles.fileLine} ${styles.codeFile}`
                : isConfigFile
                ? `${styles.fileLine} ${styles.configFile}`
                : styles.fileLine;

              return (
                <div key={index} className={styles.fileListLine}>
                  <span className={styles.fileIcon}>
                    {isCodeFile ? '📄' : isConfigFile ? '⚙️' : '📄'}
                  </span>
                  <span className={fileLineClass}>{line}</span>
                </div>
              );
            } else if (line.includes('总计')) {
              // 统计行
              return (
                <div key={index} className={styles.fileListSummary}>
                  <span className={styles.summaryText}>{line}</span>
                </div>
              );
            } else {
              // 其他行
              return (
                <div key={index} className={styles.fileListLine}>
                  <span className={styles.fileIcon}>📄</span>
                  <span className={styles.otherLine}>{line}</span>
                </div>
              );
            }
          })}
        </div>
      );
    }

    // 不是文件列表，返回普通文本
    return <pre className={styles.contentPre}>{text}</pre>;
  };

  // 渲染内容 - 支持多种内容类型
  const renderContent = () => {
    if (!content) return null;

    // 如果是数组格式的内容（如文件列表）
    if (Array.isArray(content)) {
      return (
        <div className={styles.contentArray}>
          {content.map((item, index) => {
            if (item.type === 'content' && item.content) {
              if (item.content.type === 'text') {
                return (
                  <div key={index} className={styles.textContent}>
                    {renderFileList(item.content.text)}
                  </div>
                );
              }
            }
            return (
              <div key={index} className={styles.unknownContent}>
                <pre className={styles.contentPre}>
                  {JSON.stringify(item, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>
      );
    }

    // 如果是字符串内容
    if (typeof content === 'string') {
      return (
        <div className={styles.textContent}>
          <pre className={styles.contentPre}>{content}</pre>
        </div>
      );
    }

    // 如果是对象内容
    if (typeof content === 'object') {
      return (
        <div className={styles.objectContent}>
          <pre className={styles.contentPre}>
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
    }

    // 其他类型
    return (
      <div className={styles.unknownContent}>
        <pre className={styles.contentPre}>{String(content)}</pre>
      </div>
    );
  };

  return (
    <div className={styles.toolCallProcess} data-key={dataKey}>
      {/* 主操作行 - 参考效果图的简洁设计 */}
      <div className={styles.operationRow}>
        <div className={styles.operationInfo}>
          <span className={styles[getStatusDotClass()]} />
          <Tooltip title={getOperationText()} placement="topLeft">
            <span
              className={`${styles.operationText} ${
                styles[`truncate-${textTruncateMode}`]
              }`}
            >
              {getTruncatedOperationText()}
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
            {content ? (
              renderContent()
            ) : (
              <div className={styles.noContent}>
                <div className={styles.statusInfo}>
                  <span className={styles.statusLabel}>状态:</span>
                  <span className={styles.statusValue}>{getStatusText()}</span>
                </div>
                <div className={styles.timeInfo}>
                  <span className={styles.timeLabel}>时间:</span>
                  <span className={styles.timeValue}>
                    {new Date(timestamp).toLocaleString()}
                  </span>
                </div>
                {type === 'tool_call_update' && (
                  <div className={styles.updateInfo}>
                    <span className={styles.updateLabel}>类型:</span>
                    <span className={styles.updateValue}>工具调用更新</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCallProcess;
