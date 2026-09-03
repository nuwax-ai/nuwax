/**
 * V2 轨迹单行节点：状态图标 + 标题 + 省略摘要常显；点击展开受限高度详情。
 * 工具详情使用 V2 紧凑渲染器：外层行唯一负责标题、状态与 disclosure，
 * 详情只呈现归一化后的输入/输出，避免嵌套旧卡和原始协议 JSON。
 */
import CopyButton from '@/components/base/CopyButton';
import ShareMessageButton from '@/components/business-component/ConversationShareModal/ShareMessageButton';
import {
  getToolPresentationKind,
  type ToolPresentationKind,
} from '@/components/MarkdownCustomProcess/toolPresentation';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { formatDuration, getProcessDurationMs } from '@/utils/terminalOutput';
import {
  BulbOutlined,
  CaretRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CommentOutlined,
  EditOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LoadingOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { buildToolNodeShareText } from '../toolDetail';
import type { ConversationProcessNode } from '../types';
import styles from './index.less';
import ToolNodeDetail from './ToolNodeDetail';

const cx = classNames.bind(styles);

// 行图标仅覆盖节点行类型（narration 穿插直出、不渲染为行）
const KIND_ICONS: Record<
  Exclude<ConversationProcessNode['kind'], 'narration'>,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  reasoning: BulbOutlined,
  context: FileTextOutlined,
  tool: ToolOutlined,
  subagent: RobotOutlined,
  plan: OrderedListOutlined,
  'completed-interaction': CommentOutlined,
  unknown: QuestionCircleOutlined,
};

const TOOL_PRESENTATION_ICONS: Record<
  ToolPresentationKind,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  terminal: CodeOutlined,
  'file-edit': EditOutlined,
  todo: OrderedListOutlined,
  skill: ThunderboltOutlined,
  'file-read': FileTextOutlined,
  search: SearchOutlined,
  browser: GlobalOutlined,
  generic: ToolOutlined,
};

export const nodeDisplayTitle = (node: ConversationProcessNode): string => {
  if (node.title) return node.title;
  switch (node.kind) {
    case 'reasoning':
      return dict('PC.Components.ConversationRendererV2.nodeTitleReasoning');
    case 'context':
      return dict('PC.Components.ConversationRendererV2.nodeTitleContext');
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

const NodeDetail: React.FC<{ node: ConversationProcessNode }> = ({ node }) => {
  if (
    node.kind === 'tool' ||
    node.kind === 'subagent' ||
    node.kind === 'plan'
  ) {
    return <ToolNodeDetail node={node} />;
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
  // context / unknown：正文按 Markdown 渲染（narration 已改为直出，不再是节点）
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
}) => {
  const { token } = theme.useToken();
  // narration 不渲染为行（穿插直出），此处到达即异常路径——兜底问号图标
  const toolPresentationKind =
    node.kind === 'tool'
      ? getToolPresentationKind({
          componentType: node.processing?.type ?? node.componentType,
          name: node.processing?.name ?? node.title,
          result: node.processing?.result,
        })
      : null;
  const KindIcon = toolPresentationKind
    ? TOOL_PRESENTATION_ICONS[toolPresentationKind]
    : node.kind === 'narration'
    ? QuestionCircleOutlined
    : KIND_ICONS[node.kind] ?? QuestionCircleOutlined;
  const detailId = `v2-node-${node.id}`;

  const summaryText =
    node.kind === 'completed-interaction'
      ? node.interaction?.answerSummary || node.summary
      : node.summary;

  // 行尾操作区（展开态）：耗时 chip（V1 同款口径）+ 复制 + 分享。
  // 运行中 endTime 缺失时 getProcessDurationMs 返回 null，不占位。
  const durationMs = getProcessDurationMs(node.processing?.result);
  const durationText = durationMs === null ? '' : formatDuration(durationMs);
  const isToolish =
    node.kind === 'tool' || node.kind === 'subagent' || node.kind === 'plan';
  const shareText = isToolish
    ? buildToolNodeShareText({
        componentType: node.processing?.type ?? node.componentType,
        name: node.processing?.name ?? node.title,
        result: node.processing?.result,
      })
    : '';

  return (
    <div
      className={cx(styles['node-row-wrapper'])}
      data-node-id={node.id}
      data-node-kind={node.kind}
    >
      <div className={cx(styles['node-row-line'])}>
        <button
          type="button"
          className={cx(styles['node-row'])}
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={onToggle}
          style={{ color: token.colorText }}
        >
          {/* 类型图标恒在（运行中也不替换）：折叠条上一眼可辨节点类型；
              活动指示由行尾 spinner 承担，与类型语义解耦 */}
          <KindIcon
            className={cx(styles['node-kind-icon'])}
            style={{
              color: node.failed ? token.colorError : token.colorTextTertiary,
            }}
            aria-hidden="true"
          />
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
              aria-hidden="true"
            />
          )}
          {node.status === 'running' && (
            <LoadingOutlined
              className={cx(styles['node-status-icon'])}
              style={{ color: token.colorPrimary }}
              spin
              aria-hidden="true"
            />
          )}
          {!node.failed &&
            node.status === 'finished' &&
            node.kind !== 'reasoning' &&
            node.kind !== 'context' && (
              <CheckCircleOutlined
                className={cx(styles['node-status-icon'])}
                style={{ color: token.colorSuccess }}
                aria-hidden="true"
              />
            )}
          <CaretRightOutlined
            data-testid="v2-node-disclosure"
            className={cx(styles['node-disclosure'], {
              [styles['node-disclosure-open']]: expanded,
            })}
            aria-hidden="true"
          />
        </button>
        {/* 操作区在主 button 外侧：避免交互元素嵌套破坏原生语义 */}
        {expanded && (durationText || shareText) && (
          <div className={cx(styles['node-row-actions'])}>
            {durationText && (
              <span
                className={cx(styles['node-duration-chip'])}
                data-testid="v2-node-duration"
              >
                {durationText}
              </span>
            )}
            {shareText && (
              <>
                <CopyButton
                  text={shareText}
                  showSuccessMsg={false}
                  tooltipText={dict('PC.Common.Global.copy')}
                />
                <ShareMessageButton text={shareText} isUser={false} />
              </>
            )}
          </div>
        )}
      </div>
      {expanded && (
        <div
          id={detailId}
          className={cx(styles['node-detail'])}
          aria-label={nodeDisplayTitle(node)}
        >
          <NodeDetail node={node} />
        </div>
      )}
    </div>
  );
};

export default ProcessNodeRow;
