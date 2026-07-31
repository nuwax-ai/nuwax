/**
 * 将 ACP / agentSessionUpdate 的 nuwax_render_openui 完成态映射为
 * processingList + markdown-custom-process，供 MarkdownCustomProcess /
 * OpenUiArtifactView 消费（sidecar / autoOpen）。
 *
 * 背景：ask-question 靠 rawInput 出 DockPanel；OpenUI sidecar 靠完成态
 * rawOutput.structuredContent（nuwax.openui-ref）。nuwaxcode 1.17.6 已透传
 * structuredContent；Claude 完成态常把 openui-ref 放在 rawOutput 字符串且
 * 缺 title/rawInput。Host 需同时兼容这两种形态。
 */
import { getCustomBlock } from '@/plugins/ds-markdown-process';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { MessageStatusEnum, ProcessingEnum } from '@/types/enums/common';
import type {
  ConversationChatResponse,
  MessageInfo,
  ProcessingInfo,
} from '@/types/interfaces/conversationInfo';
import type { OpenUiArtifact } from '@/types/interfaces/openUi';
import {
  extractOpenUiArtifact,
  isOpenUiRenderToolName,
} from '@/utils/openUiArtifact';
import { isOpenUiRenderInputSchemaVersion } from '@nuwax-ai/openui-mcp/contracts';
import {
  extractEventData,
  parseSseEventEnvelope,
} from './parseSseEventEnvelope';

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function readToolCallId(
  eventData: Record<string, unknown>,
): string | undefined {
  const id =
    eventData.toolCallId || eventData.tool_call_id || eventData.executeId;
  return typeof id === 'string' && id.trim() ? id : undefined;
}

function readToolName(
  eventData: Record<string, unknown>,
  rawInput?: Record<string, unknown>,
  fallbackName?: string,
): string {
  const candidates = [
    eventData.title,
    eventData.name,
    eventData.toolName,
    eventData.tool_name,
    rawInput?.toolName,
    fallbackName,
  ];
  for (const name of candidates) {
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return 'nuwax_render_openui';
}

function readRawInput(
  eventData: Record<string, unknown>,
): Record<string, unknown> | undefined {
  return (
    asRecord(eventData.rawInput) ||
    asRecord(eventData.raw_input) ||
    asRecord(asRecord(eventData.ext)?.rawInput) ||
    asRecord(asRecord(eventData.ext)?.raw_input)
  );
}

/**
 * 读取 ACP 完成态输出。nuwaclaw mapper 有时把 rawOutput 映成 `output`；
 * Claude 常把 openui-ref 直接放在字符串 rawOutput 里。
 */
function readRawOutput(eventData: Record<string, unknown>): unknown {
  if ('rawOutput' in eventData) return eventData.rawOutput;
  if ('raw_output' in eventData) return eventData.raw_output;
  if ('output' in eventData) return eventData.output;
  const ext = asRecord(eventData.ext);
  if (ext && 'rawOutput' in ext) return ext.rawOutput;
  if (ext && 'raw_output' in ext) return ext.raw_output;
  return undefined;
}

function mapToolStatus(status: unknown): ProcessingEnum {
  if (status === 'failed' || status === 'error') return ProcessingEnum.FAILED;
  if (status === 'completed' || status === 'FINISHED') {
    return ProcessingEnum.FINISHED;
  }
  return ProcessingEnum.EXECUTING;
}

/**
 * 仅从完成态输出通道解析 openui-ref，避免对整包 eventData（含巨大 rawInput）
 * 做 BFS——每个非 OpenUI tool_call_update 都会走识别失败兜底。
 */
function extractOpenUiArtifactFromOutputChannels(
  eventData: Record<string, unknown>,
  rawOutput?: unknown,
): OpenUiArtifact | null {
  return (
    extractOpenUiArtifact(rawOutput) ||
    extractOpenUiArtifact(eventData.content) ||
    extractOpenUiArtifact(eventData.structuredContent) ||
    extractOpenUiArtifact(eventData.structured_content) ||
    null
  );
}

/**
 * 是否为 OpenUI render 工具调用（名称、入参契约，或输出通道已是 openui-ref）。
 */
export function isOpenUiRenderToolCallEvent(
  eventData: Record<string, unknown>,
  rawInput?: Record<string, unknown>,
  rawOutput?: unknown,
  cachedArtifact?: OpenUiArtifact | null,
): boolean {
  const names = [
    eventData.title,
    eventData.name,
    eventData.toolName,
    eventData.tool_name,
    rawInput?.toolName,
  ];
  if (names.some((name) => isOpenUiRenderToolName(name))) {
    return true;
  }
  // render 入参契约：由 openui-mcp contracts 统一判断 schemaVersion 族
  if (isOpenUiRenderInputSchemaVersion(rawInput?.schemaVersion)) {
    return true;
  }
  // Claude 完成态常无 title/rawInput，但 rawOutput/content 已是 openui-ref
  if (cachedArtifact !== undefined) return !!cachedArtifact;
  return !!extractOpenUiArtifactFromOutputChannels(eventData, rawOutput);
}

/**
 * 已有同 toolCallId 的 OpenUI processing 项时，允许无 title/rawInput 的完成态续写。
 */
function hasExistingOpenUiProcess(
  currentMessage: MessageInfo,
  toolCallId: string,
): boolean {
  const existing = (currentMessage.processingList || []).find(
    (item) => item.executeId === toolCallId,
  );
  if (!existing) return false;
  if (isOpenUiRenderToolName(existing.name)) return true;
  return !!extractOpenUiArtifact(existing.result);
}

/**
 * 从 ACP tool_call_update 构造 / 更新 OpenUI ProcessingInfo。
 */
export function applyOpenUiToolCallSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const envelope = parseSseEventEnvelope(res);
  const eventData = extractEventData(envelope, res);
  const subType = envelope.subType ?? envelope.sub_type;

  const isToolCallLikeSubType =
    subType === 'tool_call' || subType === 'tool_call_update';
  const isToolCallEvent =
    (envelope.message_type === 'tool_call' ||
      envelope.messageType === 'tool_call' ||
      isToolCallLikeSubType) &&
    !!(
      eventData.tool_call_id ||
      eventData.toolCallId ||
      eventData.raw_input ||
      eventData.rawInput ||
      eventData.rawOutput ||
      eventData.raw_output ||
      eventData.output ||
      eventData.title
    );

  if (!isToolCallEvent) {
    return null;
  }

  const toolCallId = readToolCallId(eventData);
  if (!toolCallId) {
    return null;
  }

  const rawInput = readRawInput(eventData);
  const rawOutput = readRawOutput(eventData);
  // 只扫输出通道一次，供识别与写入共用，避免重复 BFS / 扫整包 eventData
  const openUiArtifact = extractOpenUiArtifactFromOutputChannels(
    eventData,
    rawOutput,
  );
  const existingOpenUi = hasExistingOpenUiProcess(currentMessage, toolCallId);

  // 新事件需能识别为 OpenUI；同 id 续写则放行（Claude 完成态常缺 title）
  if (
    !existingOpenUi &&
    !isOpenUiRenderToolCallEvent(eventData, rawInput, rawOutput, openUiArtifact)
  ) {
    return null;
  }

  const existingItem = (currentMessage.processingList || []).find(
    (item) => item.executeId === toolCallId,
  );
  const toolName = readToolName(eventData, rawInput, existingItem?.name);
  const processingStatus = mapToolStatus(eventData.status);

  // 完成态必须有 openui-ref；prose-only rawOutput 不建空壳 processing 项
  if (processingStatus === ProcessingEnum.FINISHED && !openUiArtifact) {
    return null;
  }

  // pending / in_progress：无 ref 时需有 rawInput（或已有同 id 项）才记 EXECUTING
  if (
    processingStatus === ProcessingEnum.EXECUTING &&
    !openUiArtifact &&
    !rawInput &&
    !existingOpenUi
  ) {
    return null;
  }

  const existingInput = asRecord(
    asRecord(existingItem?.result as unknown)?.input,
  );
  const resultPayload: Record<string, unknown> = {
    executeId: toolCallId,
    name: toolName,
    type: AgentComponentTypeEnum.ToolCall,
    success: processingStatus !== ProcessingEnum.FAILED,
    error: '',
    data: openUiArtifact,
    input: rawInput || existingInput || {},
    startTime: Date.now(),
    endTime: Date.now(),
    // MarkdownCustomProcess → resolveOpenUiDisplayState 优先读这些键
    ...(openUiArtifact
      ? {
          structuredContent: openUiArtifact,
          rawOutput: rawOutput ?? { structuredContent: openUiArtifact },
        }
      : rawOutput !== undefined
      ? { rawOutput }
      : {}),
  };

  const processingItem: ProcessingInfo = {
    executeId: toolCallId,
    name: toolName,
    type: AgentComponentTypeEnum.ToolCall,
    status: processingStatus,
    // ACP 完成态字段与后端 ExecuteResultInfo 不完全同构；下游 extractOpenUiArtifact
    // 只关心 structuredContent / rawOutput / input，故经 unknown 收窄写入。
    result: resultPayload as unknown as ProcessingInfo['result'],
    targetId: -1,
    cardBindConfig: null as unknown as ProcessingInfo['cardBindConfig'],
    subEventType: null,
  };

  const processingList = [
    ...(currentMessage.processingList || []),
  ] as ProcessingInfo[];
  const existingIndex = processingList.findIndex(
    (item) => item.executeId === toolCallId,
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
