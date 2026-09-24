/**
 * V2 轨迹原子事件行：类型图标 + 动作 + 目标 + 局部状态。
 * 只有存在有效详情的节点才渲染 button/disclosure，避免空节点伪装成可展开项。
 */
import SvgIcon from '@/components/base/SvgIcon';
import {
  getToolPresentationKind,
  type ToolPresentationKind,
} from '@/components/MarkdownCustomProcess/toolPresentation';
import { PureMarkdownRenderer } from '@/components/MarkdownRenderer';
import { normalizeV2ToolDetail } from '@/features/conversation/presentation-v2/toolDetail';
import { useUnifiedTheme } from '@/hooks/useUnifiedTheme';
import { dict } from '@/services/i18nRuntime';
import { resolveOpenUiDisplayState } from '@/utils/openUiArtifact';
import {
  BulbOutlined,
  CloseCircleOutlined,
  CodeOutlined,
  CommentOutlined,
  EditOutlined,
  FileTextOutlined,
  GlobalOutlined,
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
import React, { useEffect, useRef } from 'react';
import { THINK_DURATION_MIN_MS } from '../projectConversation';
import {
  getNodeToolActionKind,
  hasProcessNodeDetail,
  isOpenUiToolNode,
} from '../traceItems';
import type {
  ConversationProcessNode,
  ConversationToolActionKind,
  ConversationToolResource,
} from '../types';
import FileResourceLink from './FileResourceLink';
import { formatElapsed } from './formatElapsed';
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

/**
 * 运行中思考摘要的贴尾滚动：每帧把 scrollLeft 向最大滚动位推进
 * （指数缓出 + 最低速度），内容流式追加时呈现持续流动的播放感。
 * 与 MarkdownCustomThink 的 ticker 同一套 rAF 方案——滚动由 JS 驱动，
 * CSS 动画被系统「减弱动态效果」冻结时依然生效。
 */
const useTailGlide = (
  viewportRef: React.RefObject<HTMLSpanElement>,
  active: boolean,
) => {
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const glide = () => {
      const viewport = viewportRef.current;
      if (viewport) {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        if (maxScroll > 0) {
          const next =
            viewport.scrollLeft +
            (maxScroll - viewport.scrollLeft) * 0.08 +
            0.5;
          viewport.scrollLeft = Math.min(next, maxScroll);
        }
      }
      frame = requestAnimationFrame(glide);
    };
    frame = requestAnimationFrame(glide);
    return () => cancelAnimationFrame(frame);
  }, [active, viewportRef]);
};

export interface ToolNodePresentation {
  kind: ConversationToolActionKind;
  action: string;
  target: string;
  meta: string;
  isCreate: boolean;
  /** 文件类动作涉及的沙箱路径列表（读取/编辑；其余动作为空） */
  files: string[];
}

const openUiActionSuffix = (
  status: ConversationProcessNode['status'],
): string =>
  status === 'running'
    ? 'Running'
    : status === 'failed'
    ? 'Failed'
    : 'Finished';

/**
 * OpenUI 节点降级行（失败/终态无产物，不由渲染元素接管）：动作词条替代协议名，
 * 产物标题（有则取）作 target，协议工具名不外露。
 */
const openUiNodePresentation = (
  node: ConversationProcessNode,
): ToolNodePresentation => {
  const state = resolveOpenUiDisplayState(node.processing?.result);
  const title =
    state.status === 'ready'
      ? state.artifact?.title
      : state.status === 'input-only'
      ? state.renderInput?.title
      : undefined;
  return {
    kind: 'generic',
    action: dict(
      `PC.Components.ConversationRendererV2.toolActionOpenUi${openUiActionSuffix(
        node.status,
      )}`,
    ),
    target: title ?? '',
    meta: '',
    isCreate: false,
    files: [],
  };
};

export const getToolNodePresentation = (
  node: ConversationProcessNode,
): ToolNodePresentation => {
  if (isOpenUiToolNode(node)) {
    return openUiNodePresentation(node);
  }
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
    files:
      kind === 'file-read'
        ? detail.filePath
          ? [detail.filePath]
          : []
        : kind === 'file-edit'
        ? detail.diffs.map((diff) => diff.path)
        : [],
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

const NodeDetailMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const { data } = useUnifiedTheme();
  const markdownId = `v2-node-detail-${React.useId().replace(/:/g, '')}`;
  return (
    <PureMarkdownRenderer
      id={markdownId}
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
  return <NodeDetailMarkdown text={node.text ?? ''} />;
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
  const detailId = `v2-node-${React.useId().replace(/:/g, '')}`;
  const hasDetail = hasProcessNodeDetail(node);
  // 运行中的思考行走「正在思考 · 摘要贴尾滚动」形态（对齐参考交互），结束后回「思考」静态行
  const isRunningReasoning =
    node.kind === 'reasoning' && node.status === 'running';
  const tickerViewportRef = useRef<HTMLSpanElement>(null);
  useTailGlide(tickerViewportRef, isRunningReasoning);
  const title =
    toolPresentation?.action ??
    (isRunningReasoning
      ? dict('PC.Components.ConversationRendererV2.nodeTitleReasoningRunning')
      : nodeDisplayTitle(node));
  const summaryText = toolPresentation
    ? toolPresentation.target
    : node.kind === 'completed-interaction'
    ? node.interaction?.answerSummary || node.summary
    : node.summary;
  const accessibleName = Array.from(
    new Set([title, summaryText, node.title].filter(Boolean)),
  ).join(' ');
  // 完成态思考行有时长锚点时以「持续了 N 秒」替代首行摘要（历史无锚点保摘要）；
  // 不足 THINK_DURATION_MIN_MS 的窗口在秒级粒度下不可读（「持续了 0 秒」误导，
  // 禅道bug2492），与投影层同阈值双保险，回落首行摘要
  const finishedReasoningDuration =
    node.kind === 'reasoning' &&
    node.status !== 'running' &&
    typeof node.durationMs === 'number' &&
    node.durationMs >= THINK_DURATION_MIN_MS
      ? formatElapsed(node.durationMs)
      : '';

  const content = (
    <>
      <KindIcon
        className={cx(styles['node-kind-icon'])}
        style={{
          color: node.failed ? token.colorError : token.colorTextTertiary,
        }}
        aria-hidden="true"
      />
      <span
        className={cx(
          styles['node-title'],
          node.status === 'running' && styles['shimmer-text'],
        )}
      >
        {title}
      </span>
      {toolPresentation && toolPresentation.files.length > 0 ? (
        <>
          {toolPresentation.files.length > 1 && (
            <span className={cx(styles['node-summary'])}>
              {toolPresentation.target}
            </span>
          )}
          <span className={cx(styles['node-file-links'])}>
            {toolPresentation.files.map((filePath) => (
              <FileResourceLink key={filePath} target={filePath} inline />
            ))}
          </span>
        </>
      ) : isRunningReasoning && (node.thinkText ?? '').trim() ? (
        <>
          <span className={cx(styles['node-dot'])} aria-hidden="true">
            ·
          </span>
          <span
            ref={tickerViewportRef}
            className={cx(
              styles['node-summary'],
              styles['node-summary-ticker'],
            )}
            data-testid="v2-node-summary-ticker"
          >
            {/* 放全量思考文本(与 MarkdownCustomThink 同口径):换行在 nowrap
                视口内摊平成一行,rAF 贴尾才能持续追到最新追加的文字;
                summary 只是首行,内容一换行就冻结,滚动会停在旧文上 */}
            <span className={cx(styles['node-summary-ticker-text'])}>
              {node.thinkText}
            </span>
          </span>
        </>
      ) : finishedReasoningDuration ? (
        <>
          <span className={cx(styles['node-dot'])} aria-hidden="true">
            ·
          </span>
          <span className={cx(styles['node-summary'])}>
            {dict(
              'PC.Components.ConversationRendererV2.nodeThinkingDuration',
              finishedReasoningDuration,
            )}
          </span>
        </>
      ) : (
        <span className={cx(styles['node-summary'])}>{summaryText}</span>
      )}
      {toolPresentation?.meta && (
        <span className={cx(styles['node-meta'])}>{toolPresentation.meta}</span>
      )}
      {node.failed && node.status !== 'running' && (
        <CloseCircleOutlined
          className={cx(styles['node-status-icon'])}
          style={{ color: token.colorError }}
          aria-hidden="true"
        />
      )}
      {hasDetail && (
        <span
          data-testid="v2-node-disclosure"
          className={cx(styles['node-disclosure'], {
            [styles['node-disclosure-open']]: expanded,
          })}
          aria-hidden="true"
        >
          <SvgIcon name="icons-common-caret_down" style={{ fontSize: 10 }} />
        </span>
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
