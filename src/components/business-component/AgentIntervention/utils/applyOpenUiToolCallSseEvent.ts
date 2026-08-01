/**
 * 将后端 RENDER_UI 专用 SSE 事件映射为 processingList + markdown-custom-process，
 * 供 MarkdownCustomProcess / OpenUiArtifactView 消费（sidecar / autoOpen）。
 *
 * 设计对齐 ASK_QUESTION：后端把 nuwax_render_openui 的产物作为一等公民事件下发——
 * `eventType=PROCESSING + subEventType=RENDER_UI`，`nuwax.openui-ref` 放在 `result.data`，
 * 并携带状态生命周期（EXECUTING → FINISHED → FAILED，operation created/updated）。
 *
 * 不再靠工具名 / schemaVersion / 输出通道嗅探识别渲染结果：旧通用 `tool_call` 形态
 * （title 含 `nuwax_render_openui`、structuredContent / rawOutput 散落）一律不再处理。
 */
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import {
  AgentComponentTypeEnum,
  ConversationEventTypeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import { extractOpenUiArtifact } from '@/utils/openUiArtifact';
import { OPENUI_RENDER_TOOL_BASE_NAME } from '@nuwax-ai/openui-mcp/contracts';
import {
  extractEventData,
  parseSseEventEnvelope,
} from './parseSseEventEnvelope';

/** RENDER_UI 事件可能的 eventName 变体（对齐 ASK_QUESTION 的 Backend.Sandbox.Event.* 命名）。 */
const RENDER_UI_EVENT_NAMES = new Set<string>([
  'RenderUi',
  'RenderUI',
  'Backend.Sandbox.Event.RenderUi',
  'Backend.Sandbox.Event.RenderUI',
]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function mapToolStatus(status: unknown): ProcessingEnum {
  if (status === 'failed' || status === 'error') return ProcessingEnum.FAILED;
  if (status === 'completed' || status === 'FINISHED') {
    return ProcessingEnum.FINISHED;
  }
  return ProcessingEnum.EXECUTING;
}

function readString(...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return undefined;
}

/**
 * 是否为 RENDER_UI 专用 PROCESSING 事件。
 *
 * 判别：`eventType === PROCESSING`，且 subEventType 为 `RENDER_UI`，或 eventName 命中
 * Backend.Sandbox.Event.RenderUi 变体。导出供单测与历史恢复复用判别口径。
 */
export function isRenderUiSseEvent(
  res: ConversationChatResponse,
  eventData: Record<string, unknown>,
): boolean {
  if (res.eventType !== ConversationEventTypeEnum.PROCESSING) return false;
  const envelope = parseSseEventEnvelope(res);
  const subEventType = readString(
    eventData.subEventType,
    eventData.sub_event_type,
    envelope.subEventType,
    envelope.sub_type,
    envelope.sub_event_type,
  );
  if (subEventType === 'RENDER_UI') return true;
  const result = asRecord(eventData.result);
  const eventName = readString(eventData.name, result?.name);
  return eventName !== undefined && RENDER_UI_EVENT_NAMES.has(eventName);
}

/**
 * 从 RENDER_UI 的 PROCESSING 事件构造 / 更新 OpenUI ProcessingInfo。
 *
 * 非渲染事件返回 null，交由 ask / acp 等其它 applier 继续判别。
 */
export function applyOpenUiToolCallSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const envelope = parseSseEventEnvelope(res);
  const eventData = extractEventData(envelope, res);

  if (!isRenderUiSseEvent(res, eventData)) {
    return null;
  }

  const result = asRecord(eventData.result);
  // RENDER_UI 的 openui-ref 直接放在 result.data（对齐 ASK_QUESTION）。
  const openUiArtifact = extractOpenUiArtifact(result?.data);
  const processingStatus = mapToolStatus(eventData.status ?? result?.status);

  const artifactId = openUiArtifact
    ? (openUiArtifact as { artifactId?: unknown }).artifactId
    : undefined;
  const executeId =
    readString(eventData.executeId, result?.executeId, artifactId) ?? undefined;

  // 完成态必须有 openui-ref；prose-only 完成不建空壳 processing 项
  if (processingStatus === ProcessingEnum.FINISHED && !openUiArtifact) {
    return null;
  }
  // 无法定位稳定 executeId 时不能 upsert（执行态无 ref 时至少需要 executeId）
  if (!executeId) {
    return null;
  }

  const toolName =
    readString(eventData.name, result?.name) ?? OPENUI_RENDER_TOOL_BASE_NAME;

  // 复用旧 tool_call 形态产出的 result 结构：下游 MarkdownCustomProcess →
  // resolveOpenUiDisplayState 优先读 structuredContent / rawOutput / data，保持不变。
  const resultPayload: Record<string, unknown> = {
    executeId,
    name: toolName,
    type: AgentComponentTypeEnum.ToolCall,
    success: processingStatus !== ProcessingEnum.FAILED,
    error: '',
    data: openUiArtifact,
    input: {},
    startTime: Date.now(),
    endTime: Date.now(),
    ...(openUiArtifact
      ? {
          structuredContent: openUiArtifact,
          rawOutput: { structuredContent: openUiArtifact },
        }
      : {}),
  };

  const processingItem: ProcessingInfo = {
    executeId,
    name: toolName,
    type: AgentComponentTypeEnum.ToolCall,
    status: processingStatus,
    result: resultPayload as unknown as ProcessingInfo['result'],
    targetId: -1,
    cardBindConfig: null as unknown as ProcessingInfo['cardBindConfig'],
    subEventType: null,
  };

  const processingList = [
    ...(currentMessage.processingList || []),
  ] as ProcessingInfo[];
  const existingIndex = processingList.findIndex(
    (item) => item.executeId === executeId,
  );
  if (existingIndex > -1) {
    processingList[existingIndex] = processingItem;
  } else {
    processingList.push(processingItem);
  }

  return {
    ...currentMessage,
    text: getCustomBlock(currentMessage.text || '', processingItem),
    processingList,
    status: MessageStatusEnum.Loading,
  };
}
