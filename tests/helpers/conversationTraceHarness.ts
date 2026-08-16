import type { TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

export type ConversationTraceSource =
  | 'user'
  | 'live'
  | 'sub'
  | 'snapshot'
  | 'timer'
  | 'visibility';

export interface ConversationTraceState {
  isConversationActive: boolean;
  isAwaitingChatTerminal: boolean;
  taskStatus?: TaskStatus;
  messages: Array<{
    id: string;
    role: string;
    status: string;
    text: string;
    think: string;
    processing: string[];
    hasFinalResult: boolean;
  }>;
}

export interface ConversationTraceEntry {
  seq: number;
  source: ConversationTraceSource;
  event: string;
  state: ConversationTraceState;
}

export interface ConversationTraceReadableState {
  isConversationActive: boolean;
  isAwaitingChatTerminal: boolean;
  conversationInfo?: { taskStatus?: TaskStatus } | null;
  messageList: MessageInfo[];
}

const summarizeMessage = (message: MessageInfo) => ({
  id: String(message.id ?? ''),
  role: String(message.role ?? ''),
  status: String(message.status ?? ''),
  text: message.text || '',
  think: message.think || '',
  processing: (message.processingList || []).map((item) =>
    String(item.status ?? ''),
  ),
  hasFinalResult: Boolean(message.finalResult),
});

/**
 * 重构双轨验证使用的确定性 Trace Recorder。
 *
 * 只保留业务状态，不记录时间、React 引用或用户敏感元数据；旧 model 与新 Runtime
 * 可对同一事件序列产出该结构并进行深比较。
 */
export function createConversationTraceRecorder() {
  const entries: ConversationTraceEntry[] = [];

  return {
    record(
      source: ConversationTraceSource,
      event: string,
      current: ConversationTraceReadableState,
    ): ConversationTraceEntry {
      const entry: ConversationTraceEntry = {
        seq: entries.length + 1,
        source,
        event,
        state: {
          isConversationActive: current.isConversationActive,
          isAwaitingChatTerminal: current.isAwaitingChatTerminal,
          taskStatus: current.conversationInfo?.taskStatus,
          messages: current.messageList.map(summarizeMessage),
        },
      };
      entries.push(entry);
      return entry;
    },
    snapshot(): ConversationTraceEntry[] {
      return structuredClone(entries);
    },
  };
}
