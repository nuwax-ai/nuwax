import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';

const LOCAL_STREAM_COOLDOWN_MS = 5000;
const SUB_MIN_ALIVE_MS = 3000;
const SUB_FAILURE_BASE_DELAY_MS = 2000;
const SUB_FAILURE_MAX_DELAY_MS = 30000;
const HISTORY_USER_RETRY_DELAYS_MS = [150, 300, 600, 900, 1200, 1800];

export type ResumeGate =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'local-stream-cooldown';
      elapsedMs: number;
      cooldownMs: number;
    }
  | {
      allowed: false;
      reason: 'sub-failure-backoff';
      failureCount: number;
      elapsedMs: number;
      backoffMs: number;
    };

export interface ResumeCloseResult {
  aliveMs: number;
  shortLived: boolean;
  failureCount: number;
}

export interface ResumeConsistencyController {
  readonly historyUserRetryDelaysMs: readonly number[];
  recordLocalStreamEnded(
    conversationId: number | string | undefined,
    at?: number,
  ): void;
  evaluateGate(conversationId: number | string, now?: number): ResumeGate;
  recordOpened(at?: number): void;
  recordClosed(at?: number): ResumeCloseResult;
  resetFailureBackoff(): void;
  isHistoryUserReady(
    base: MessageInfo[] | undefined | null,
    incoming: MessageInfo[] | undefined | null,
  ): boolean;
}

const getUserMessageCount = (list: MessageInfo[] | undefined | null): number =>
  (list || []).filter((message) => message.role === AssistantRoleEnum.USER)
    .length;

const isIncompleteAssistant = (message: MessageInfo | undefined): boolean =>
  message?.role === AssistantRoleEnum.ASSISTANT &&
  (message.status === MessageStatusEnum.Loading ||
    message.status === MessageStatusEnum.Incomplete);

/** sub 前历史等待、live 冷却与失败退避的状态 Controller。 */
export function createResumeConsistencyController(): ResumeConsistencyController {
  let localStreamEnded = {
    conversationId: undefined as number | string | undefined,
    at: 0,
  };
  let openedAt = 0;
  let failure = { count: 0, lastAt: 0 };

  return {
    historyUserRetryDelaysMs: HISTORY_USER_RETRY_DELAYS_MS,

    recordLocalStreamEnded(conversationId, at = Date.now()) {
      localStreamEnded = { conversationId, at };
    },

    evaluateGate(conversationId, now = Date.now()) {
      if (localStreamEnded.conversationId === conversationId) {
        const elapsedMs = now - localStreamEnded.at;
        if (elapsedMs < LOCAL_STREAM_COOLDOWN_MS) {
          return {
            allowed: false,
            reason: 'local-stream-cooldown',
            elapsedMs,
            cooldownMs: LOCAL_STREAM_COOLDOWN_MS,
          };
        }
      }
      if (failure.count > 0) {
        const backoffMs = Math.min(
          SUB_FAILURE_BASE_DELAY_MS * 2 ** (failure.count - 1),
          SUB_FAILURE_MAX_DELAY_MS,
        );
        const elapsedMs = now - failure.lastAt;
        if (elapsedMs < backoffMs) {
          return {
            allowed: false,
            reason: 'sub-failure-backoff',
            failureCount: failure.count,
            elapsedMs,
            backoffMs,
          };
        }
      }
      return { allowed: true };
    },

    recordOpened(at = Date.now()) {
      openedAt = at;
    },

    recordClosed(at = Date.now()) {
      const aliveMs = at - openedAt;
      const shortLived = aliveMs < SUB_MIN_ALIVE_MS;
      if (shortLived) {
        failure = { count: failure.count + 1, lastAt: at };
      } else {
        failure = { count: 0, lastAt: 0 };
      }
      return { aliveMs, shortLived, failureCount: failure.count };
    },

    resetFailureBackoff() {
      failure = { count: 0, lastAt: 0 };
    },

    isHistoryUserReady(base, incoming) {
      if (getUserMessageCount(incoming) > getUserMessageCount(base)) {
        return true;
      }
      const lastIncoming = incoming?.[incoming.length - 1];
      if (
        lastIncoming?.role === AssistantRoleEnum.USER ||
        isIncompleteAssistant(lastIncoming)
      ) {
        return true;
      }
      const lastBase = base?.[base.length - 1];
      return (
        lastBase?.role === AssistantRoleEnum.USER ||
        isIncompleteAssistant(lastBase)
      );
    },
  };
}
