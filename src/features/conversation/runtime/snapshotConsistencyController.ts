import { AssistantRoleEnum, TaskStatus } from '@/types/enums/agent';
import type {
  ConversationInfo,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';

export type SnapshotTrigger = 'scheduled' | 'visibility';

export interface SnapshotRequestToken {
  requestId: number;
  generation: number;
  conversationId: number | string;
  trigger: SnapshotTrigger;
}

export type SnapshotRejectionReason =
  | 'stale-generation'
  | 'conversation-changed'
  | 'local-stream-active'
  | 'empty-snapshot'
  | 'user-tail-not-persisted';

export type SnapshotDecision =
  | {
      type: 'snapshot.accepted';
      token: SnapshotRequestToken;
      snapshot: ConversationInfo;
      observedTaskStatus?: TaskStatus;
      resumeMessageList?: MessageInfo[];
    }
  | {
      type: 'snapshot.rejected';
      token: SnapshotRequestToken;
      reason: SnapshotRejectionReason;
      snapshot?: ConversationInfo;
      observedTaskStatus?: TaskStatus;
      resumeMessageList?: MessageInfo[];
    };

export interface SnapshotConsumeState {
  conversationId?: number | string;
  isLocallyStreaming: boolean;
}

export interface SnapshotConsistencyController {
  beginRequest(
    trigger: SnapshotTrigger,
    conversationId: number | string,
  ): SnapshotRequestToken | undefined;
  invalidateGeneration(): number;
  getGeneration(): number;
  consume(
    token: SnapshotRequestToken,
    current: SnapshotConsumeState,
    snapshot: ConversationInfo | undefined,
  ): SnapshotDecision;
  release(token: SnapshotRequestToken): void;
}

const getResumeMessageList = (
  snapshot: ConversationInfo,
): MessageInfo[] | undefined =>
  snapshot.taskStatus === TaskStatus.EXECUTING
    ? snapshot.messageList
    : undefined;

/**
 * 历史快照一致性 Controller。
 *
 * 它拥有请求代际与 visibility 单飞锁，并把所有快照归一为 accepted/rejected 事件。
 * USER 尾只拒绝覆盖本地消息；其 taskStatus 与 messageList 仍可用于启动 sub 恢复。
 */
export function createSnapshotConsistencyController(): SnapshotConsistencyController {
  let generation = 0;
  let nextRequestId = 0;
  let visibilityRequestId: number | undefined;

  const release = (token: SnapshotRequestToken) => {
    if (
      token.trigger === 'visibility' &&
      visibilityRequestId === token.requestId
    ) {
      visibilityRequestId = undefined;
    }
  };

  return {
    beginRequest(trigger, conversationId) {
      if (trigger === 'visibility' && visibilityRequestId !== undefined) {
        return undefined;
      }
      nextRequestId += 1;
      const token: SnapshotRequestToken = {
        requestId: nextRequestId,
        generation,
        conversationId,
        trigger,
      };
      if (trigger === 'visibility') {
        visibilityRequestId = token.requestId;
      }
      return token;
    },

    invalidateGeneration() {
      generation += 1;
      return generation;
    },

    getGeneration() {
      return generation;
    },

    consume(token, current, snapshot) {
      release(token);
      const rejected = (reason: SnapshotRejectionReason): SnapshotDecision => ({
        type: 'snapshot.rejected',
        token,
        reason,
        snapshot,
        observedTaskStatus: snapshot?.taskStatus,
        resumeMessageList: snapshot
          ? getResumeMessageList(snapshot)
          : undefined,
      });

      if (token.generation !== generation) {
        return rejected('stale-generation');
      }
      if (String(current.conversationId) !== String(token.conversationId)) {
        return rejected('conversation-changed');
      }
      if (current.isLocallyStreaming) {
        return rejected('local-stream-active');
      }
      if (!snapshot) {
        return rejected('empty-snapshot');
      }
      if (
        snapshot.messageList?.[snapshot.messageList.length - 1]?.role ===
        AssistantRoleEnum.USER
      ) {
        return rejected('user-tail-not-persisted');
      }
      return {
        type: 'snapshot.accepted',
        token,
        snapshot,
        observedTaskStatus: snapshot.taskStatus,
        resumeMessageList: getResumeMessageList(snapshot),
      };
    },

    release,
  };
}
