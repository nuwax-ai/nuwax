import { ConversationEventTypeEnum } from '@/types/enums/agent';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import {
  extractEventData,
  parseSseEventEnvelope,
} from '../AgentIntervention/utils/parseSseEventEnvelope';
import type { OpenUiArtifact } from './types';
import { OPENUI_SCHEMA_VERSION } from './types';

const OPENUI_TOOL_NAMES = new Set([
  'render_openui_inline',
  'render_openui_page',
]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;
}

function readRawInput(
  eventData: Record<string, unknown>,
  result?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const ext = asRecord(eventData.ext);
  const resultExt = asRecord(result?.ext);
  return (
    asRecord(eventData.raw_input) ??
    asRecord(eventData.rawInput) ??
    asRecord(ext?.raw_input) ??
    asRecord(ext?.rawInput) ??
    asRecord(result?.input) ??
    asRecord(resultExt?.raw_input) ??
    asRecord(resultExt?.rawInput)
  );
}

function readStructuredArtifact(
  result?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const data = result?.data;
  if (!Array.isArray(data)) {
    return undefined;
  }

  for (const item of data) {
    const entry = asRecord(item);
    const content = asRecord(entry?.content);
    if (content?.type !== 'text' || typeof content.text !== 'string') {
      continue;
    }
    try {
      const parsed = JSON.parse(content.text) as Record<string, unknown>;
      const artifact = asRecord(parsed.artifact);
      if (artifact && parsed.renderTarget) {
        return artifact;
      }
    } catch {
      // 非 OpenUI structuredContent 文本，继续读取下一个结果块。
    }
  }

  return undefined;
}

function readToolName(
  eventData: Record<string, unknown>,
  result?: Record<string, unknown>,
): string | undefined {
  const candidates = [
    eventData.name,
    eventData.toolName,
    eventData.tool_name,
    result?.name,
    result?.toolName,
    result?.tool_name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const matched = [...OPENUI_TOOL_NAMES].find(
      (toolName) =>
        candidate === toolName || candidate.endsWith(`__${toolName}`),
    );
    if (matched) {
      return matched;
    }
  }
  return undefined;
}

export function parseOpenUiArtifact(
  rawInput: Record<string, unknown> | undefined,
  toolName?: string,
): OpenUiArtifact | null {
  if (!rawInput || rawInput.schemaVersion !== OPENUI_SCHEMA_VERSION) {
    return null;
  }
  const artifactId = rawInput.artifactId;
  const title = rawInput.title;
  const revision = rawInput.revision;
  if (
    typeof artifactId !== 'string' ||
    typeof title !== 'string' ||
    typeof revision !== 'number' ||
    !Number.isInteger(revision)
  ) {
    return null;
  }

  if (
    toolName === 'render_openui_inline' ||
    typeof rawInput.openuiLang === 'string'
  ) {
    if (typeof rawInput.openuiLang !== 'string') {
      return null;
    }
    return {
      schemaVersion: OPENUI_SCHEMA_VERSION,
      artifactId,
      title,
      openuiLang: rawInput.openuiLang,
      isStreaming: rawInput.isStreaming === true,
      revision,
      renderTarget: 'inline',
    };
  }

  if (
    toolName === 'render_openui_page' ||
    typeof rawInput.workspaceUrl === 'string'
  ) {
    if (typeof rawInput.workspaceUrl !== 'string') {
      return null;
    }
    try {
      const workspaceUrl = new URL(rawInput.workspaceUrl);
      if (!['http:', 'https:'].includes(workspaceUrl.protocol)) {
        return null;
      }
      return {
        schemaVersion: OPENUI_SCHEMA_VERSION,
        artifactId,
        title,
        workspaceUrl: workspaceUrl.toString(),
        revision,
        renderTarget: 'iframe',
      };
    } catch {
      return null;
    }
  }

  return null;
}

export function hydrateOpenUiArtifactsFromExecutedComponents(
  message: MessageInfo,
): MessageInfo {
  const components = Array.isArray(message.componentExecutedList)
    ? message.componentExecutedList
    : [];
  if (!components.length) {
    return message;
  }

  const existing = message.openUiArtifacts ?? [];
  const artifacts = [...existing];
  components.forEach((component) => {
    const record = asRecord(component);
    const result = asRecord(record?.result);
    const toolName = readToolName(
      { name: record?.name ?? record?.originalTitle },
      result,
    );
    const artifact = parseOpenUiArtifact(
      readStructuredArtifact(result) ?? readRawInput({}, result),
      toolName,
    );
    if (!artifact) {
      return;
    }
    const existingIndex = artifacts.findIndex(
      (item) => item.artifactId === artifact.artifactId,
    );
    if (existingIndex >= 0) {
      if (artifacts[existingIndex].revision <= artifact.revision) {
        artifacts[existingIndex] = artifact;
      }
    } else {
      artifacts.push(artifact);
    }
  });

  return artifacts.length === existing.length &&
    artifacts.every((item, index) => item === existing[index])
    ? message
    : { ...message, openUiArtifacts: artifacts };
}

export function applyOpenUiToolCallSseEvent(
  res: ConversationChatResponse,
  currentMessage: MessageInfo,
): MessageInfo | null {
  const envelope = parseSseEventEnvelope(res);
  const eventData = extractEventData(envelope, res);
  const result = asRecord(eventData.result);
  const subType = envelope.subType ?? envelope.sub_type;
  const isToolCall =
    envelope.messageType === 'tool_call' ||
    envelope.message_type === 'tool_call' ||
    subType === 'tool_call' ||
    subType === 'tool_call_update' ||
    res.eventType === ConversationEventTypeEnum.PROCESSING;
  if (!isToolCall) {
    return null;
  }

  const artifact = parseOpenUiArtifact(
    readStructuredArtifact(result) ?? readRawInput(eventData, result),
    readToolName(eventData, result),
  );
  if (!artifact) {
    return null;
  }

  const currentArtifacts = currentMessage.openUiArtifacts ?? [];
  const existingIndex = currentArtifacts.findIndex(
    (item) => item.artifactId === artifact.artifactId,
  );
  if (
    existingIndex >= 0 &&
    currentArtifacts[existingIndex].revision > artifact.revision
  ) {
    return null;
  }
  const nextArtifacts = [...currentArtifacts];
  if (existingIndex >= 0) {
    nextArtifacts[existingIndex] = artifact;
  } else {
    nextArtifacts.push(artifact);
  }

  return { ...currentMessage, openUiArtifacts: nextArtifacts };
}
