import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { useMemo } from 'react';
import type { AcpPermissionInteraction } from '../types/acpIntervention';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import { hasMcpAskResumeMessage } from '../utils/mcpAskResumeMessage';

export type InterventionQueueKind = 'acp_permission' | 'mcp_ask';

export interface AcpInterventionQueueItem {
  kind: 'acp_permission';
  messageId: string;
  messageIndex: number;
  interaction: AcpPermissionInteraction;
  sortKey: number;
}

export interface McpAskInterventionQueueItem {
  kind: 'mcp_ask';
  messageId: string;
  messageIndex: number;
  interaction: McpAskInteraction;
  sortKey: number;
}

export type InterventionQueueItem =
  | AcpInterventionQueueItem
  | McpAskInterventionQueueItem;

function isActiveResponseStatus(status: string | undefined): boolean {
  const value = status ?? 'pending';
  // `failed` is terminal: once the user has responded, the card closes
  // regardless of whether the API call succeeded, so a failed approval no
  // longer pins the front of the dock and blocks later approvals. The error
  // itself is still surfaced via toast in respondAcpPermission.
  return value === 'pending' || value === 'submitting';
}

function readMcpAskRequestId(rawInput: unknown): string | undefined {
  if (!rawInput || typeof rawInput !== 'object') {
    return undefined;
  }
  const input = rawInput as Record<string, unknown>;
  return typeof input.requestId === 'string' && input.requestId
    ? input.requestId
    : undefined;
}

export function useActiveInterventionQueue(
  messageList: MessageInfo[],
): InterventionQueueItem[] {
  return useMemo(() => {
    const pending: InterventionQueueItem[] = [];
    const permissionPendingToolCallIds = new Set<string>();
    const permissionPendingAskRequestIds = new Set<string>();
    let fallbackSeq = 0;

    const messages = [...(messageList ?? [])].sort(
      (a, b) => (a.index ?? 0) - (b.index ?? 0),
    );

    // 只渲染【最新一条消息】（sub 流的占位 / 当前 turn 的 assistant 消息）上的审批，
    // 不渲染历史会话消息里的审批——否则历史审批与 sub 重放的审批会同时入队，
    // 两者 intervention id 相同导致 DockPanel 卡片 key 冲突/反复挂载而闪烁。
    // 用未排序列表的末尾判定最新（流式占位无 index，按 index 排序会被排到队首）。
    const rawList = messageList ?? [];
    const latestMessage = rawList[rawList.length - 1];
    const latestMessageKey = latestMessage
      ? String(latestMessage.id ?? latestMessage.index)
      : null;

    // 会话已结束(Complete/Error/Stopped)时不显示审批——审批已 resolve 或失效。
    // 跨页签：别的页签审批后会话结束，本页签 sub 收到 end_turn 使消息变 Complete，
    // 审批应随之关闭，避免一直显示已失效的卡片。
    if (
      latestMessage &&
      (latestMessage.status === MessageStatusEnum.Complete ||
        latestMessage.status === MessageStatusEnum.Error ||
        latestMessage.status === MessageStatusEnum.Stopped)
    ) {
      return [];
    }

    // 当前焦点 executeId：取最新消息 processingList 末尾（最新产生）的 executeId。
    // agent 顺序执行，最新 processing 即当前焦点；更早 executeId 的审批已过去，应关闭其卡片。
    // 一个 turn 可能有多个 executeId（多个工具调用），各自独立判断，互不影响。
    let focusExecuteId: string | undefined;
    if (latestMessage) {
      const list = latestMessage.processingList;
      if (list?.length) {
        for (let j = list.length - 1; j >= 0; j--) {
          if (list[j].executeId) {
            focusExecuteId = list[j].executeId;
            break;
          }
        }
      }
    }

    // 审批是否过期：有 focusExecuteId 时，自身 executeId 非空且不匹配的算过期（关闭该卡）；
    // 自身 executeId 为空（历史/事件未带）时保守视为不过期，避免误关。
    const isExpired = (executeId: string | undefined) =>
      !!focusExecuteId && !!executeId && executeId !== focusExecuteId;

    messages.forEach((message) => {
      // 仅处理最新一条消息，跳过历史消息上的审批
      if (
        latestMessageKey !== null &&
        String(message.id ?? message.index) !== latestMessageKey
      ) {
        return;
      }
      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        if (isExpired(interaction.executeId)) {
          return;
        }
        const toolCall = interaction.intervention.acp.request.toolCall;
        if (toolCall.toolCallId) {
          permissionPendingToolCallIds.add(toolCall.toolCallId);
        }
        const askRequestId = readMcpAskRequestId(toolCall.rawInput);
        if (askRequestId) {
          permissionPendingAskRequestIds.add(askRequestId);
        }
      });
    });

    messages.forEach((message) => {
      // 仅处理最新一条消息，跳过历史消息上的审批
      if (
        latestMessageKey !== null &&
        String(message.id ?? message.index) !== latestMessageKey
      ) {
        return;
      }
      const messageId = String(message.id ?? message.index);
      const messageIndex = message.index ?? 0;

      message.acpPermissionInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        if (isExpired(interaction.executeId)) {
          return; // 该 executeId 已过去，关闭其审批卡
        }
        const sortKey =
          interaction.triggeredAt ??
          interaction.intervention.createdAt ??
          fallbackSeq++;
        pending.push({
          kind: 'acp_permission',
          messageId,
          messageIndex,
          interaction,
          sortKey,
        });
      });

      message.mcpAskInteractions?.forEach((interaction) => {
        if (!isActiveResponseStatus(interaction.responseStatus)) {
          return;
        }
        if (hasMcpAskResumeMessage(messages, interaction)) {
          return;
        }
        if (isExpired(interaction.executeId)) {
          return; // 该 executeId 已过去，关闭其审批卡
        }
        if (
          permissionPendingToolCallIds.has(interaction.toolCallId) ||
          permissionPendingAskRequestIds.has(interaction.input.requestId)
        ) {
          return;
        }
        const sortKey = interaction.triggeredAt ?? fallbackSeq++;
        pending.push({
          kind: 'mcp_ask',
          messageId,
          messageIndex,
          interaction,
          sortKey,
        });
      });
    });

    return pending.sort((a, b) => a.sortKey - b.sortKey);
  }, [messageList]);
}
