import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentInterventionRespond } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import {
  injectAcpPermissionIntoMessageList,
  isAcpMockLocalRespondEnabled,
  type AcpPermissionMockScenario,
} from '../acp-permission/mock';
import {
  injectMcpAskIntoMessageList,
  isMcpAskMockLocalRespondEnabled,
  type McpAskQuestionMockScenario,
} from '../mcp-ask/mock';
import { buildMcpAskResumeMessage } from '../mcp-ask/utils/resume-message';
import { injectAllInterventionMocks } from '../mock/demo-stack';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types';
import { isMockMcpAskRequestId } from '../utils/mock-ids';

export interface UseAgentInterventionHandlersOptions {
  setMessageList: Dispatch<SetStateAction<MessageInfo[]>>;
  conversationId?: number | null;
}

/**
 * Agent 干预（ACP 权限 + MCP Ask）的消息更新与响应提交
 */
export function useAgentInterventionHandlers({
  setMessageList,
  conversationId,
}: UseAgentInterventionHandlersOptions) {
  const updateAcpPermissionInteraction = useCallback(
    (interventionId: string, updates: Partial<AcpPermissionInteraction>) => {
      setMessageList((list) =>
        list.map((item) => {
          const interactions = item.acpPermissionInteractions;
          if (
            !interactions?.some(
              (interaction) => interaction.intervention.id === interventionId,
            )
          ) {
            return item;
          }
          return {
            ...item,
            acpPermissionInteractions: interactions.map((interaction) =>
              interaction.intervention.id === interventionId
                ? { ...interaction, ...updates }
                : interaction,
            ),
          };
        }),
      );
    },
    [setMessageList],
  );

  const updateMcpAskInteraction = useCallback(
    (requestId: string, updates: Partial<McpAskInteraction>) => {
      setMessageList((list) =>
        list.map((item) => {
          const interactions = item.mcpAskInteractions;
          if (!interactions?.some((x) => x.input.requestId === requestId)) {
            return item;
          }
          return {
            ...item,
            mcpAskInteractions: interactions.map((interaction) =>
              interaction.input.requestId === requestId
                ? { ...interaction, ...updates }
                : interaction,
            ),
          };
        }),
      );
    },
    [setMessageList],
  );

  const injectMockAcpPermission = useCallback(
    (
      scenario: AcpPermissionMockScenario = 'pending',
      targetMessageId?: string,
    ) => {
      setMessageList((list) =>
        injectAcpPermissionIntoMessageList(list, scenario, targetMessageId),
      );
    },
    [setMessageList],
  );

  const injectMockMcpAsk = useCallback(
    (
      scenario: McpAskQuestionMockScenario = 'choice',
      targetMessageId?: string,
    ) => {
      setMessageList((list) => {
        const { list: nextList, injected } = injectMcpAskIntoMessageList(
          list,
          scenario,
          targetMessageId,
        );
        if (!injected) {
          console.warn(
            '[mcpAskQuestionMock] 注入失败：请确认会话中已有 Agent 回复消息',
          );
        }
        return nextList;
      });
    },
    [setMessageList],
  );

  const injectAllInterventionMocksHandler = useCallback(() => {
    setMessageList((list) => injectAllInterventionMocks(list));
  }, [setMessageList]);

  const respondAcpPermission = useCallback(
    async (
      interaction: AcpPermissionInteraction,
      acpResponse: AcpRequestPermissionResponse,
    ) => {
      const { intervention } = interaction;
      updateAcpPermissionInteraction(intervention.id, {
        responseStatus: 'submitting',
        selectedOptionId:
          acpResponse.outcome.outcome === 'selected'
            ? acpResponse.outcome.optionId
            : undefined,
        errorMessage: undefined,
      });

      if (isAcpMockLocalRespondEnabled()) {
        await new Promise((resolve) => {
          setTimeout(resolve, 400);
        });
        updateAcpPermissionInteraction(intervention.id, {
          responseStatus: 'submitted',
        });
        return;
      }

      try {
        const isSelected = acpResponse.outcome.outcome === 'selected';
        const sessionId =
          intervention.acp?.request?.sessionId || intervention.sessionId;
        const toolCallId = intervention.acp?.request?.toolCall?.toolCallId;

        const response = await apiAgentInterventionRespond({
          interventionId: intervention.id,
          permission_resolve_request: {
            request_permission_response: {
              outcome: isSelected
                ? { Selected: { option_id: acpResponse.outcome.optionId } }
                : { Cancelled: null },
            },
            session_id: sessionId,
            tool_call_id: toolCallId,
            save_rule: false,
          },
          user_id: String(conversationId),
          conversation_id: conversationId || undefined,
        });

        if (response?.code && response.code !== SUCCESS_CODE) {
          throw new Error(
            response.message ||
              dict('PC.Models.ConversationInfo.permissionResponseFailed'),
          );
        }

        updateAcpPermissionInteraction(intervention.id, {
          responseStatus: 'submitted',
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : dict('PC.Models.ConversationInfo.permissionResponseFailed');
        updateAcpPermissionInteraction(intervention.id, {
          responseStatus: 'failed',
          errorMessage,
        });
        message.error(errorMessage);
      }
    },
    [updateAcpPermissionInteraction, conversationId],
  );

  const respondMcpAsk = useCallback(
    async (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      const requestId = interaction.input.requestId;
      const { action } = payload;

      updateMcpAskInteraction(requestId, {
        responseStatus: 'submitting',
        formData: payload.formData,
        errorMessage: undefined,
      });

      const resolveStatus = (): McpAskInteraction['responseStatus'] => {
        if (action === 'cancel') return 'cancelled';
        if (action === 'skip') return 'skipped';
        return 'submitted';
      };

      if (
        isMcpAskMockLocalRespondEnabled() &&
        isMockMcpAskRequestId(requestId)
      ) {
        await new Promise((resolve) => {
          setTimeout(resolve, 400);
        });
        updateMcpAskInteraction(requestId, {
          responseStatus: resolveStatus(),
          formData: payload.formData,
        });
        return null;
      }

      updateMcpAskInteraction(requestId, {
        responseStatus: resolveStatus(),
        formData: payload.formData,
      });
      return buildMcpAskResumeMessage(interaction, payload);
    },
    [updateMcpAskInteraction],
  );

  return {
    respondAcpPermission,
    respondMcpAsk,
    injectMockAcpPermission,
    injectMockMcpAsk,
    injectAllInterventionMocks: injectAllInterventionMocksHandler,
  };
}
