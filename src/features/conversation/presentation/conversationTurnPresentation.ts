import {
  collapseTerminalProcesses,
  groupMarkdownProcesses,
} from '@/components/MarkdownRenderer/utils';
import { getLegacyThinkBlock } from '@/plugins/ds-markdown-think';
import {
  AgentComponentTypeEnum,
  AssistantRoleEnum,
  MessageModeEnum,
} from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

export interface ProcessSummaryMetrics {
  toolCallCount: number;
  messageCount: number;
  startedAt?: number;
  endedAt?: number;
}

export interface ConversationTurnPresentation {
  kind: 'turn';
  key: string;
  messages: MessageInfo[];
  messageInfo: MessageInfo;
  processMarkdown: string;
  summaryMarkdown: string;
  metrics: ProcessSummaryMetrics;
  isTerminal: boolean;
}

export interface ConversationMessagePresentation {
  kind: 'message';
  key: string;
  message: MessageInfo;
  sourceIndex: number;
}

export type ConversationListPresentation =
  | ConversationTurnPresentation
  | ConversationMessagePresentation;

const PROCESS_BLOCK_RE =
  /<div><markdown-custom-process-group\b[^>]*\bterminal="true"[^>]*>([\s\S]*?)<\/markdown-custom-process-group><\/div>/i;
const PROCESS_TAG_RE =
  /<markdown-custom-process(?![\w-])([^>]*)>(?:<\/markdown-custom-process>)?/gi;
const THINK_TAG_RE =
  /<markdown-custom-think\b[^>]*>(?:<\/markdown-custom-think>)?/gi;
const HTML_WRAPPER_RE = /<\/?(?:div|p)>/gi;

const messageIdentity = (message: MessageInfo, fallback: number) => {
  const id = message.clientRenderKey || message.id;
  return id === null || id === undefined || String(id).trim() === ''
    ? `fallback-${message.role}-${message.index ?? fallback}`
    : String(id);
};

const isTerminalMessage = (message: MessageInfo) =>
  Boolean(message.finalResult) ||
  (message.status !== MessageStatusEnum.Incomplete &&
    message.status !== MessageStatusEnum.Loading);

const normalizeMessageMarkdown = (message: MessageInfo): string => {
  const rawText = message.text || '';
  const withThink =
    !rawText.includes('markdown-custom-think') && message.think
      ? `${getLegacyThinkBlock(message.think)}${rawText}`
      : rawText;
  return groupMarkdownProcesses(withThink);
};

const splitTerminalMarkdown = (
  markdown: string,
): { processMarkdown: string; summaryMarkdown: string } => {
  const collapsed = collapseTerminalProcesses(markdown);
  const match = PROCESS_BLOCK_RE.exec(collapsed);
  if (!match) {
    return { processMarkdown: '', summaryMarkdown: markdown.trim() };
  }
  return {
    processMarkdown: match[1].trim(),
    summaryMarkdown: collapsed
      .slice((match.index || 0) + match[0].length)
      .trim(),
  };
};

const stripSummarySuffix = (markdown: string, summary: string) => {
  const normalizedSummary = summary.trim();
  if (!normalizedSummary) return markdown.trim();
  const trimmed = markdown.trimEnd();
  return trimmed.endsWith(normalizedSummary)
    ? trimmed.slice(0, -normalizedSummary.length).trim()
    : markdown.trim();
};

const parseAttribute = (source: string, name: string): string | undefined => {
  const match = source.match(
    new RegExp(`${name}=(?:\\\\?"|\\\\?')([^"']+)(?:\\\\?"|\\\\?')`, 'i'),
  );
  return match?.[1];
};

const isToolType = (type?: string) =>
  Boolean(type) &&
  type !== AgentComponentTypeEnum.Plan &&
  type !== AgentComponentTypeEnum.Event &&
  type !== 'Plan' &&
  type !== 'Event';

const collectToolCallIds = (messages: MessageInfo[]): Set<string> => {
  const ids = new Set<string>();
  let anonymousIndex = 0;
  const add = (id: unknown, type: unknown) => {
    if (!isToolType(typeof type === 'string' ? type : undefined)) return;
    ids.add(
      typeof id === 'string' && id.trim()
        ? id
        : `anonymous-tool-${anonymousIndex++}`,
    );
  };

  messages.forEach((message) => {
    message.processingList?.forEach((item) =>
      add(item.executeId || item.result?.executeId, item.type),
    );
    message.finalResult?.componentExecuteResults?.forEach((item) =>
      add(item.executeId, item.type),
    );
    const markdown = normalizeMessageMarkdown(message);
    let match: RegExpExecArray | null;
    PROCESS_TAG_RE.lastIndex = 0;
    while ((match = PROCESS_TAG_RE.exec(markdown))) {
      const attrs = match[1] || '';
      add(
        parseAttribute(attrs, 'executeId') ||
          parseAttribute(attrs, 'executeid') ||
          parseAttribute(attrs, 'toolCallId'),
        parseAttribute(attrs, 'type') || AgentComponentTypeEnum.ToolCall,
      );
    }
  });
  return ids;
};

const countProcessMessages = (processMarkdown: string): number => {
  if (!processMarkdown.trim()) return 0;
  const thinkCount = (processMarkdown.match(THINK_TAG_RE) || []).length;
  const visibleText = processMarkdown
    .replace(PROCESS_TAG_RE, '')
    .replace(THINK_TAG_RE, '')
    .replace(HTML_WRAPPER_RE, '')
    .trim();
  return thinkCount + (visibleText ? 1 : 0);
};
const resolveTiming = (messages: MessageInfo[]) => {
  for (let index = messages.length - 1; index >= 0; index--) {
    const result = messages[index].finalResult;
    if (result?.startTime) {
      return {
        startedAt: result.startTime,
        endedAt: result.endTime || undefined,
      };
    }
  }

  const starts: number[] = [];
  const ends: number[] = [];
  messages.forEach((message) =>
    message.processingList?.forEach((item) => {
      if (item.result?.startTime) starts.push(item.result.startTime);
      if (item.result?.endTime) ends.push(item.result.endTime);
    }),
  );
  return {
    startedAt: starts.length ? Math.min(...starts) : undefined,
    endedAt: ends.length ? Math.max(...ends) : undefined,
  };
};

const buildTurn = (
  messages: MessageInfo[],
  fallbackIndex: number,
): ConversationTurnPresentation => {
  const messageInfo = messages[messages.length - 1];
  const isTerminal = isTerminalMessage(messageInfo);
  const normalized = messages.map(normalizeMessageMarkdown);

  let summarySource = -1;
  let summaryMarkdown = '';
  for (let index = messages.length - 1; index >= 0; index--) {
    const output = messages[index].finalResult?.outputText?.trim();
    if (output) {
      summarySource = index;
      summaryMarkdown = output;
      break;
    }
  }

  if (summarySource < 0 && isTerminal) {
    for (let index = messages.length - 1; index >= 0; index--) {
      const message = messages[index];
      const isAnswer =
        message.type === MessageModeEnum.CHAT ||
        message.type === MessageModeEnum.ANSWER ||
        message.type === undefined;
      if (isAnswer && normalized[index].trim()) {
        const split = splitTerminalMarkdown(normalized[index]);
        summarySource = index;
        summaryMarkdown = split.summaryMarkdown;
        break;
      }
    }
  }

  const processParts = normalized.map((markdown, index) => {
    if (index !== summarySource) return markdown.trim();
    if (!summaryMarkdown) return markdown.trim();
    const split = splitTerminalMarkdown(markdown);
    if (split.summaryMarkdown === summaryMarkdown) return split.processMarkdown;
    return stripSummarySuffix(markdown, summaryMarkdown);
  });
  const processMarkdown = processParts.filter(Boolean).join('\n\n').trim();
  const timing = resolveTiming(messages);
  const requestId = messages.find((message) => message.requestId)?.requestId;

  return {
    kind: 'turn',
    key: `turn-${requestId || messageIdentity(messages[0], fallbackIndex)}`,
    messages,
    messageInfo: {
      ...messageInfo,
      text: summaryMarkdown,
      think: '',
    },
    processMarkdown,
    summaryMarkdown,
    metrics: {
      toolCallCount: collectToolCallIds(messages).size,
      messageCount: countProcessMessages(processMarkdown),
      ...timing,
    },
    isTerminal,
  };
};

/**
 * 将普通会话消息投影为 USER 消息 + 助手轮次。requestId 优先，旧历史数据则以
 * USER 消息作为边界；实时流和历史回放共用这一条纯函数路径。
 */
export const projectConversationTurns = (
  messages: MessageInfo[],
): ConversationListPresentation[] => {
  const result: ConversationListPresentation[] = [];
  let turnMessages: MessageInfo[] = [];
  let turnStart = 0;

  const flushTurn = () => {
    if (!turnMessages.length) return;
    result.push(buildTurn(turnMessages, turnStart));
    turnMessages = [];
  };

  messages.forEach((message, index) => {
    if (message.role === AssistantRoleEnum.USER) {
      flushTurn();
      result.push({
        kind: 'message',
        key: `message-${messageIdentity(message, index)}`,
        message,
        sourceIndex: index,
      });
      return;
    }

    const activeRequestId = turnMessages.find(
      (item) => item.requestId,
    )?.requestId;
    if (
      turnMessages.length &&
      activeRequestId &&
      message.requestId &&
      message.requestId !== activeRequestId
    ) {
      flushTurn();
    }
    if (!turnMessages.length) turnStart = index;
    turnMessages.push(message);
  });
  flushTurn();
  return result;
};
