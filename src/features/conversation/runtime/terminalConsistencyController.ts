import {
  isTerminalTaskStatus,
  resolveTaskStatusFromMessageLists,
} from '@/features/conversation/domain/taskStatus';
import { TaskStatus } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

export type TerminalConsistencyDecision =
  | {
      type: 'terminal.confirmed';
      conversationId: number | string;
      status: TaskStatus;
      source: 'local-message' | 'snapshot-fallback';
    }
  | {
      type: 'terminal.unresolved';
      conversationId: number | string;
      observedStatus?: TaskStatus;
    };

export interface TerminalConsistencyController {
  confirmAfterStreamClose(
    conversationId: number | string,
    ...messageLists: Array<MessageInfo[] | undefined | null>
  ): Promise<TerminalConsistencyDecision>;
}

export interface TerminalConsistencyAdapters {
  fetchTaskStatus(
    conversationId: number | string,
  ): Promise<TaskStatus | undefined>;
}

/** 协议流关闭后的终态确认 Controller：本地消息优先，持久化快照只作 fallback。 */
export function createTerminalConsistencyController(
  adapters: TerminalConsistencyAdapters,
): TerminalConsistencyController {
  return {
    async confirmAfterStreamClose(conversationId, ...messageLists) {
      const localStatus = resolveTaskStatusFromMessageLists(...messageLists);
      if (localStatus && isTerminalTaskStatus(localStatus)) {
        return {
          type: 'terminal.confirmed',
          conversationId,
          status: localStatus,
          source: 'local-message',
        };
      }

      const observedStatus = await adapters.fetchTaskStatus(conversationId);
      if (observedStatus && isTerminalTaskStatus(observedStatus)) {
        return {
          type: 'terminal.confirmed',
          conversationId,
          status: observedStatus,
          source: 'snapshot-fallback',
        };
      }
      return {
        type: 'terminal.unresolved',
        conversationId,
        observedStatus,
      };
    },
  };
}
