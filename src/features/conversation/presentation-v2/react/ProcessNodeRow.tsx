/**
 * V2 轨迹单行节点：状态图标 + 标题 + 省略摘要常显；点击展开受限高度详情。
 * 工具/子智能体/计划详情复用现有 MarkdownCustomProcess（保留 Diff/终端/Plan/
 * OpenUI/文件操作专属卡能力，不重做工具卡）。
 */
import MarkdownCustomProcess from '@/components/MarkdownCustomProcess';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { ProcessingEnum } from '@/types/enums/common';
import {
  AlignLeftOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  FileTextOutlined,
  LoadingOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React from 'react';
import type { ConversationProcessNode } from '../types';
import styles from './index.less';

const cx = classNames.bind(styles);

const KIND_ICONS: Record<
  ConversationProcessNode['kind'],
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  reasoning: BulbOutlined,
  context: FileTextOutlined,
  narration: AlignLeftOutlined,
  tool: ToolOutlined,
  subagent: RobotOutlined,
  plan: OrderedListOutlined,
  'completed-interaction': CommentOutlined,
  unknown: QuestionCircleOutlined,
};

export const nodeDisplayTitle = (node: ConversationProcessNode): string => {
  if (node.title) return node.title;
  switch (node.kind) {
    case 'reasoning':
      return dict('PC.Components.ConversationRendererV2.nodeTitleReasoning');
    case 'context':
      return dict('PC.Components.ConversationRendererV2.nodeTitleContext');
    case 'narration':
      return dict('PC.Components.ConversationRendererV2.nodeTitleNarration');
    case 'tool':
      return dict('PC.Components.ConversationRendererV2.nodeTitleTool');
    case 'subagent':
      return dict('PC.Components.ConversationRendererV2.nodeTitleSubagent');
    case 'plan':
      return dict('PC.Components.ConversationRendererV2.nodeTitlePlan');
    case 'completed-interaction':
      return node.interaction?.kind === 'permission'
        ? dict(
            'PC.Components.ConversationRendererV2.nodeTitleInteractionPermission',
          )
        : dict('PC.Components.ConversationRendererV2.nodeTitleInteractionAsk');
    default:
      return dict('PC.Components.ConversationRendererV2.nodeTitleUnknown');
  }
};

const NODE_STATUS_TO_PROCESSING: Record<
  ConversationProcessNode['status'],
  ProcessingEnum
> = {
  running: ProcessingEnum.EXECUTING,
  finished: ProcessingEnum.FINISHED,
  failed: ProcessingEnum.FAILED,
  unknown: ProcessingEnum.FINISHED,
};

const NodeDetailMarkdown: React.FC<{ nodeId: string; text: string }> = ({
  nodeId,
  text,
}) => {
  const { data } = useUnifiedTheme();
  return (
    <PureMarkdownRenderer
      id={`v2-node-detail-${nodeId}`}
      theme={data.antdTheme === 'dark' ? 'dark' : 'light'}
      disableTyping
    >
      {text}
    </PureMarkdownRenderer>
  );
};

const NodeDetail: React.FC<{
  node: ConversationProcessNode;
  conversationId?: number | string;
}> = ({ node, conversationId }) => {
  if (
    node.kind === 'tool' ||
    node.kind === 'subagent' ||
    node.kind === 'plan'
  ) {
    const status =
      node.processing?.status ??
      NODE_STATUS_TO_PROCESSING[node.status] ??
      ProcessingEnum.FINISHED;
    return (
      <MarkdownCustomProcess
        executeId={node.executeId ?? node.id}
        dataKey={`v2-detail-${node.id}`}
        conversationId={conversationId ?? ''}
        type={
          (node.processing?.type ??
            (node.componentType as AgentComponentTypeEnum) ??
            AgentComponentTypeEnum.Plugin) as AgentComponentTypeEnum
        }
        status={status}
        name={node.title}
      />
    );
  }
  if (node.kind === 'reasoning') {
    return (
      <div className={cx(styles['node-detail-text'])}>
        {node.thinkText ?? ''}
      </div>
    );
  }
  if (node.kind === 'completed-interaction') {
    return (
      <div className={cx(styles['node-detail-text'])}>
        {node.interaction?.title
          ? `${node.interaction.title}${
              node.interaction.answerSummary
                ? ` · ${node.interaction.answerSummary}`
                : ''
            }`
          : nodeDisplayTitle(node)}
      </div>
    );
  }
  // narration / context / unknown：正文按 Markdown 渲染
  return <NodeDetailMarkdown nodeId={node.id} text={node.text ?? ''} />;
};

export interface ProcessNodeRowProps {
  node: ConversationProcessNode;
  expanded: boolean;
  onToggle: () => void;
  conversationId?: number | string;
}

const ProcessNodeRow: React.FC<ProcessNodeRowProps> = ({
  node,
  expanded,
  onToggle,
  conversationId,
}) => {
  const { token } = theme.useToken();
  const KindIcon = KIND_ICONS[node.kind] ?? QuestionCircleOutlined;
  const detailId = `v2-node-${node.id}`;

  const summaryText =
    node.kind === 'completed-interaction'
      ? node.interaction?.answerSummary || node.summary
      : node.summary;

  return (
    <div
      className={cx(styles['node-row-wrapper'])}
      data-node-id={node.id}
      data-node-kind={node.kind}
    >
      <button
        type="button"
        className={cx(styles['node-row'])}
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
        style={{ color: token.colorText }}
      >
        {node.status === 'running' ? (
          <LoadingOutlined
            className={cx(styles['node-kind-icon'])}
            style={{ color: token.colorPrimary }}
            spin
          />
        ) : (
          <KindIcon
            className={cx(styles['node-kind-icon'])}
            style={{
              color: node.failed ? token.colorError : token.colorTextTertiary,
            }}
          />
        )}
        <span className={cx(styles['node-title'])}>
          {nodeDisplayTitle(node)}
        </span>
        {summaryText ? (
          <span className={cx(styles['node-summary'])}>{summaryText}</span>
        ) : (
          <span className={cx(styles['node-summary'])} />
        )}
        {node.failed && (
          <CloseCircleOutlined
            className={cx(styles['node-status-icon'])}
            style={{ color: token.colorError }}
          />
        )}
        {!node.failed &&
          node.status === 'finished' &&
          node.kind !== 'reasoning' &&
          node.kind !== 'narration' &&
          node.kind !== 'context' && (
            <CheckCircleOutlined
              className={cx(styles['node-status-icon'])}
              style={{ color: token.colorSuccess }}
            />
          )}
      </button>
      {expanded && (
        <div
          id={detailId}
          className={cx(styles['node-detail'])}
          aria-label={nodeDisplayTitle(node)}
        >
          <NodeDetail node={node} conversationId={conversationId} />
        </div>
      )}
    </div>
  );
};

export default ProcessNodeRow;
