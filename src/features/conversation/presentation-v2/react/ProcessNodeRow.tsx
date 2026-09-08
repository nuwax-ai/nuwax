/**
 * V2 轨迹原子事件行：类型图标 + 动作 + 目标 + 局部状态。
 * 只有存在有效详情的节点才渲染 button/disclosure，避免空节点伪装成可展开项。
 */
import {
  getToolPresentationKind,
  type ToolPresentationKind,
} from '@/components/MarkdownCustomProcess/toolPresentation';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import {
  BulbOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CommentOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  GlobalOutlined,
  LoadingOutlined,
  OrderedListOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  RobotOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { theme } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { getNodeToolActionKind, hasProcessNodeDetail } from '../traceItems';
import type {
  ConversationProcessNode,
  ConversationToolActionKind,
  ConversationToolResource,
} from '../types';
import styles from './index.less';
import ToolNodeDetail from './ToolNodeDetail';

const cx = classNames.bind(styles);

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
  'file-read': ReadOutlined,
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

const actionKeyByKind: Record<
  ConversationToolActionKind,
  Record<'running' | 'finished' | 'failed', string>
> = {
  terminal: {
    running: 'toolActionTerminalRunning',
    finished: 'toolActionTerminalFinished',
    failed: 'toolActionTerminalFailed',
  },
  'file-read': {
    running: 'toolActionFileReadRunning',
    finished: 'toolActionFileReadFinished',
    failed: 'toolActionFileReadFailed',
  },
  'file-edit': {
    running: 'toolActionFileEditRunning',
    finished: 'toolActionFileEditFinished',
    failed: 'toolActionFileEditFailed',
  },
  search: {
    running: 'toolActionSearchRunning',
    finished: 'toolActionSearchFinished',
    failed: 'toolActionSearchFailed',
  },
  browser: {
    running: 'toolActionBrowserRunning',
    finished: 'toolActionBrowserFinished',
    failed: 'toolActionBrowserFailed',
  },
  skill: {
    running: 'toolActionSkillRunning',
    finished: 'toolActionSkillFinished',
    failed: 'toolActionSkillFailed',
  },
  todo: {
    running: 'toolActionPlanRunning',
    finished: 'toolActionPlanFinished',
    failed: 'toolActionPlanFailed',
  },
  generic: {
    running: 'toolActionGenericRunning',
    finished: 'toolActionGenericFinished',
    failed: 'toolActionGenericFailed',
  },
};

const normalizedStatus = (
  status: ConversationProcessNode['status'],
): 'running' | 'finished' | 'failed' =>
  status === 'running'
    ? 'running'
    : status === 'failed'
    ? 'failed'
    : 'finished';

export const toolActionLabel = (
  kind: ConversationToolActionKind,
  status: ConversationProcessNode['status'],
  isCreate = false,
): string => {
  const resolvedStatus = normalizedStatus(status);
  if (kind === 'file-edit' && isCreate) {
    return dict(
      `PC.Components.ConversationRendererV2.toolActionFileCreate${
        resolvedStatus === 'running'
          ? 'Running'
          : resolvedStatus === 'failed'
          ? 'Failed'
          : 'Finished'
      }`,
    );
  }
  return dict(
    `PC.Components.ConversationRendererV2.${actionKeyByKind[kind][resolvedStatus]}`,
  );
};

const firstLine = (value?: string): string =>
  (value ?? '').split(/\r?\n/, 1)[0].trim();

export interface ToolNodePresentation {
  kind: ConversationToolActionKind;
  action: string;
  target: string;
  meta: string;
  isCreate: boolean;
}

export const getToolNodePresentation = (
  node: ConversationProcessNode,
): ToolNodePresentation => {
  const detail = normalizeV2ToolDetail({
    componentType: node.processing?.type ?? node.componentType,
    name: node.processing?.name ?? node.title,
    result: node.processing?.result,
  });
  const kind = getNodeToolActionKind(node);
  const target =
    kind === 'terminal'
      ? firstLine(detail.command) || node.title
      : kind === 'file-read'
      ? detail.filePath || node.title
      : kind === 'file-edit'
      ? detail.diffs.length > 1
        ? dict(
            'PC.Components.ConversationRendererV2.toolTargetFiles',
            detail.diffs.length,
          )
        : detail.diffs[0]?.path || detail.filePath || node.title
      : kind === 'search'
      ? detail.query || node.title
      : kind === 'browser'
      ? detail.resultTitle || detail.url || node.title
      : node.title;
  const meta =
    kind === 'file-edit' && (detail.additions || detail.deletions)
      ? `+${detail.additions} -${detail.deletions}`
      : '';
  return {
    kind,
    action: toolActionLabel(kind, node.status, detail.isCreate),
    target,
    meta,
    isCreate: detail.isCreate,
  };
};

export const ToolPresentationIcon: React.FC<{
  kind: ConversationToolActionKind;
  className?: string;
  style?: React.CSSProperties;
  'aria-hidden'?: boolean | 'true' | 'false';
}> = ({ kind, ...props }) => {
  const Icon = TOOL_PRESENTATION_ICONS[kind];
  return <Icon {...props} />;
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
  onOpenResource?: (resource: ConversationToolResource) => void;
}> = ({ node, onOpenResource }) => {
  if (
    node.kind === 'tool' ||
    node.kind === 'subagent' ||
    node.kind === 'plan'
  ) {
    return <ToolNodeDetail node={node} onOpenResource={onOpenResource} />;
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
  return <NodeDetailMarkdown nodeId={node.id} text={node.text ?? ''} />;
};

export interface ProcessNodeRowProps {
  node: ConversationProcessNode;
  expanded: boolean;
  onToggle: () => void;
  onOpenResource?: (resource: ConversationToolResource) => void;
  /** 工具组内行使用更紧凑的视觉缩进。 */
  grouped?: boolean;
}

const ProcessNodeRow: React.FC<ProcessNodeRowProps> = ({
  node,
  expanded,
  onToggle,
  onOpenResource,
  grouped = false,
}) => {
  const { token } = theme.useToken();
  const toolPresentation =
    node.kind === 'tool' ? getToolNodePresentation(node) : null;
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
  const hasDetail = hasProcessNodeDetail(node);
  const title = toolPresentation?.action ?? nodeDisplayTitle(node);
  const summaryText = toolPresentation
    ? toolPresentation.target
    : node.kind === 'completed-interaction'
    ? node.interaction?.answerSummary || node.summary
    : node.summary;
  const accessibleName = Array.from(
    new Set([title, summaryText, node.title].filter(Boolean)),
  ).join(' ');

  const content = (
    <>
      <KindIcon
        className={cx(styles['node-kind-icon'])}
        style={{
          color: node.failed ? token.colorError : token.colorTextTertiary,
        }}
        aria-hidden="true"
      />
      <span className={cx(styles['node-title'])}>{title}</span>
      <span className={cx(styles['node-summary'])}>{summaryText}</span>
      {toolPresentation?.meta && (
        <span className={cx(styles['node-meta'])}>{toolPresentation.meta}</span>
      )}
      {node.status === 'running' && (
        <LoadingOutlined
          className={cx(styles['node-status-icon'])}
          style={{ color: token.colorPrimary }}
          spin
          aria-hidden="true"
        />
      )}
      {node.failed && node.status !== 'running' && (
        <CloseCircleOutlined
          className={cx(styles['node-status-icon'])}
          style={{ color: token.colorError }}
          aria-hidden="true"
        />
      )}
      {hasDetail && (
        <DownOutlined
          data-testid="v2-node-disclosure"
          className={cx(styles['node-disclosure'], {
            [styles['node-disclosure-open']]: expanded,
          })}
          aria-hidden="true"
        />
      )}
    </>
  );

  return (
    <div
      className={cx(styles['node-row-wrapper'], {
        [styles['is-grouped']]: grouped,
        [styles['is-failed']]: node.failed,
      })}
      data-node-id={node.id}
      data-node-kind={node.kind}
    >
      {hasDetail ? (
        <button
          type="button"
          className={cx(styles['node-row'])}
          aria-expanded={expanded}
          aria-controls={detailId}
          aria-label={accessibleName}
          onClick={onToggle}
          style={{ color: token.colorText }}
        >
          {content}
        </button>
      ) : (
        <div
          className={cx(styles['node-row'], styles['is-static'])}
          style={{ color: token.colorText }}
        >
          {content}
        </div>
      )}
      {expanded && hasDetail && (
        <div
          id={detailId}
          className={cx(styles['node-detail'])}
          aria-label={nodeDisplayTitle(node)}
        >
          <NodeDetail node={node} onOpenResource={onOpenResource} />
        </div>
      )}
    </div>
  );
};

export default ProcessNodeRow;
