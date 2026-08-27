import { dict } from '@/services/i18nRuntime';
import { ProcessingEnum } from '@/types/enums/common';
import {
  CheckOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import DsMarkdown from 'ds-markdown';
import { katexPlugin } from 'ds-markdown/plugins';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PlanDocumentData {
  /** 计划正文（markdown） */
  plan: string;
  /** 计划文件落盘路径（引擎随 ExitPlanMode 提供时展示） */
  planFilePath?: string;
}

/**
 * 从 ProcessingInfo.result 防御性提取 switch_mode（ExitPlanMode）计划文档。
 * 兼容服务端两种透传形状：
 * - result.kind 直挂、result.input 即 rawInput（与 edit 工具调用的 result.kind 同构）
 * - result.input 为 { kind, rawInput } 包装（会话 SSE 抓包形状）
 * 非计划工具调用或正文缺失时返回 null，调用方降级为通用工具卡片。
 */
export function extractPlanDocument(result: unknown): PlanDocumentData | null {
  if (!result || typeof result !== 'object') return null;
  const record = result as Record<string, any>;
  const input = record.input;
  const inputRecord =
    input && typeof input === 'object' ? (input as Record<string, any>) : null;
  const kind = record.kind ?? inputRecord?.kind;
  if (kind !== 'switch_mode') return null;
  const rawInput = (inputRecord?.rawInput ??
    inputRecord ??
    record.rawInput ??
    null) as Record<string, any> | null;
  const plan = typeof rawInput?.plan === 'string' ? rawInput.plan.trim() : '';
  if (!plan) return null;
  return {
    plan,
    planFilePath:
      typeof rawInput?.planFilePath === 'string' && rawInput.planFilePath
        ? rawInput.planFilePath
        : undefined,
  };
}

interface MarkdownCustomPlanDocProps {
  /** 原始工具标题（如 "Ready to code?"），存在时作为副标题展示 */
  title?: string;
  plan: string;
  planFilePath?: string;
  status?: ProcessingEnum | string;
}

const statusIcon = (status?: ProcessingEnum | string) => {
  const iconProps = { className: cx(styles['plan-doc-status-icon']) };
  switch (status) {
    case ProcessingEnum.FINISHED:
      return <CheckOutlined {...iconProps} />;
    case ProcessingEnum.FAILED:
      return <ExclamationCircleOutlined {...iconProps} />;
    case ProcessingEnum.EXECUTING:
      return <HourglassOutlined {...iconProps} />;
    default:
      return null;
  }
};

/**
 * 计划文档卡片（switch_mode / ExitPlanMode 专用）：
 * 计划正文以嵌套 DsMarkdown 结构化渲染（自定义标签内部文本不经过外层
 * react-markdown 块级解析），头部展示状态与原始工具标题，底部展示计划文件路径。
 */
const MarkdownCustomPlanDoc: React.FC<MarkdownCustomPlanDocProps> = ({
  title,
  plan,
  planFilePath,
  status,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const headerTitle = useMemo(
    () => dict('PC.Components.MarkdownCustomPlanDoc.title'),
    [],
  );

  return (
    <div
      className={cx(styles['markdown-custom-plan-doc'])}
      data-plan-doc="true"
    >
      <div
        className={cx(styles['plan-doc-header'])}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-label={headerTitle}
      >
        <FileTextOutlined className={cx(styles['plan-doc-icon'])} />
        <span className={cx(styles['plan-doc-title'])}>{headerTitle}</span>
        {title ? (
          <span className={cx(styles['plan-doc-subtitle'])}>{title}</span>
        ) : null}
        {statusIcon(status)}
        <DownOutlined
          className={cx(styles['plan-doc-arrow'], {
            [styles['plan-doc-arrow-collapsed']]: !isExpanded,
          })}
        />
      </div>
      {isExpanded ? (
        <>
          <div className={cx(styles['plan-doc-body'])}>
            <DsMarkdown
              disableTyping
              interval={30}
              timerType="requestAnimationFrame"
              plugins={[katexPlugin]}
              codeBlock={{ headerActions: true }}
              theme="light"
            >
              {plan}
            </DsMarkdown>
          </div>
          {planFilePath ? (
            <div
              className={cx(styles['plan-doc-file'])}
              title={planFilePath}
              data-plan-file="true"
            >
              {dict('PC.Components.MarkdownCustomPlanDoc.planFile')}:{' '}
              {planFilePath}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

export default MarkdownCustomPlanDoc;
