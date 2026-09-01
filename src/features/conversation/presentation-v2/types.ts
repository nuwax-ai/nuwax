/**
 * V2 可控会话渲染 · 投影层类型（specs/nuwax-conversation-renderer-v2.md）。
 *
 * 数据链（legacy model / runtime session）产出 MessageInfo[]，本层把它投影为
 * 「用户输入 + 整轮工作轨迹 + 最终回答」三段结构，供 ConversationRendererV2 渲染。
 * 纯类型，无 React 依赖，双数据线共用。
 */
import type {
  AttachmentFile,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';

/** 过程节点类型：思考 / 上下文(系统) / 工具 / 子智能体 / 计划 / 已完成交互 / 未知残留
 * （中间正文段 narration 不再是节点——直出展示，见 ConversationTurnPresentationV2.narrations） */
export type ConversationProcessNodeKind =
  | 'reasoning'
  | 'context'
  | 'tool'
  | 'subagent'
  | 'plan'
  | 'completed-interaction'
  | 'unknown';

/** 单类节点的展示档位：隐藏 / 单行摘要 / 展开 */
export type NodePresentationMode = 'hidden' | 'summary' | 'expanded';

/** V2 渲染偏好：三档预设 + 逐类高级覆盖 */
export interface ConversationRenderPreferencesV2 {
  preset: ConversationRendererPreset;
  nodeOverrides: Partial<
    Record<ConversationProcessNodeKind, NodePresentationMode>
  >;
}

export type ConversationRendererPreset = 'focused' | 'balanced' | 'detailed';

/** 已完成交互（提问/权限）节点的细类 */
export interface CompletedInteractionPayload {
  kind: 'ask' | 'permission';
  /** 问题标题或权限工具名 */
  title: string;
  /** 用户答复摘要（选项/答案），缺失时为空串 */
  answerSummary: string;
  toolCallId?: string;
  triggeredAt?: number;
}

/** 单个过程节点（轨迹内一行） */
export interface ConversationProcessNode {
  /** 稳定 ID：executeId / interaction id / 消息内序号兜底 */
  id: string;
  kind: ConversationProcessNodeKind;
  /** 行标题（解码后的工具名等），渲染层再叠加 i18n 默认标题 */
  title: string;
  /** 单行省略摘要（动态摘要的静态部分；运行态由渲染层追加动效） */
  summary: string;
  status: 'running' | 'finished' | 'failed' | 'unknown';
  failed: boolean;
  /** 关联的工具执行详情（processingList / componentExecutedList / finalResult 合并结果） */
  processing?: ProcessingInfo;
  /** 工具节点：稳定执行 ID（渲染层详情 join 与指标去重同源） */
  executeId?: string;
  /** 工具节点：协议 componentType（Plugin/Mcp/Skill/SubAgent/Plan/ToolCall…） */
  componentType?: string;
  /** 工具节点：标签上的原始 status 属性（processing 缺失时兜底传给工具卡） */
  segmentStatus?: string;
  /** reasoning 节点的思考全文 */
  thinkText?: string;
  /** unknown 节点的原始 Markdown */
  text?: string;
  /** completed-interaction 节点的载荷 */
  interaction?: CompletedInteractionPayload;
  /** 时间戳（ms epoch），用于排序与耗时兜底 */
  startTime?: number;
  endTime?: number;
}

/** 最终回答（始终常显在轨迹下方） */
export interface ConversationFinalAnswer {
  /** 剥离全部自定义标签后的 Markdown 正文；source=none 时为空串 */
  text: string;
  source: 'finalResult' | 'messageText' | 'none';
}

/** 整轮展示：用户原始输入（可选）+ 工作轨迹 + 最终回答 */
export interface ConversationTurnPresentationV2 {
  /** 轮次稳定键（leading message 的 clientRenderKey||id，兜底序号） */
  key: string;
  /** 用户原始输入消息（原样交 ChatView 渲染，不生成摘要） */
  userMessage?: MessageInfo;
  /** 用户附件（与 userMessage.attachments 同源，便于渲染层直接取用） */
  userAttachments?: AttachmentFile[];
  /** 本轮全部 assistant/system 消息（按会话顺序） */
  assistantMessages: MessageInfo[];
  /** 有序过程节点（真实发生顺序） */
  nodes: ConversationProcessNode[];
  /** 中间正文段（过程说明）：直接以正文展示，不进轨迹、不受预设/覆盖影响 */
  narrations: Array<{ id: string; text: string }>;
  finalAnswer: ConversationFinalAnswer;
  running: boolean;
  terminalStatus: 'complete' | 'error' | 'stopped';
  metrics: {
    /** 非空且去重后的工具执行数（Plan/Event 不计） */
    toolCount: number;
    /** reasoning+context+completed-interaction 计数（narration 直出不计） */
    messageCount: number;
    /** 终态耗时（ms）；运行态为 undefined，用 elapsedAnchor 每秒推进 */
    elapsedMs?: number;
    /** 运行态计时锚点（ms epoch） */
    elapsedAnchor?: number;
  };
}

/** 消息列表投影结果：按轮次排列的展示项 */
export interface ConversationPresentationV2 {
  turns: ConversationTurnPresentationV2[];
}
