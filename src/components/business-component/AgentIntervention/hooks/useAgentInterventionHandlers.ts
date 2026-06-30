import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiAgentInterventionRespond } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { message } from 'antd';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '../types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import { buildMcpAskResumeMessage } from '../utils/mcpAskResumeMessage';
import { isIdempotentAcpPermissionResolveError } from '../utils/reconcileAcpPermissionStatus';

export interface UseAgentInterventionHandlersOptions {
  setMessageList: Dispatch<SetStateAction<MessageInfo[]>>;
  conversationId?: number | null;
}

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
          const apiMessage = response.message || '';
          if (isIdempotentAcpPermissionResolveError(apiMessage)) {
            updateAcpPermissionInteraction(intervention.id, {
              responseStatus: 'submitted',
            });
            return;
          }
          throw new Error(
            apiMessage ||
              dict('PC.Models.ConversationInfo.permissionResponseFailed'),
          );
        }

        updateAcpPermissionInteraction(intervention.id, {
          responseStatus: 'submitted',
        });
      } catch (error) {
        if (isIdempotentAcpPermissionResolveError(error)) {
          updateAcpPermissionInteraction(intervention.id, {
            responseStatus: 'submitted',
            errorMessage: undefined,
          });
          return;
        }
        const errorMessage =
          error instanceof Error
            ? error.message
            : dict('PC.Models.ConversationInfo.permissionResponseFailed');
        updateAcpPermissionInteraction(intervention.id, {
          responseStatus: 'failed',
          errorMessage,
        });
        // 始终展示统一的友好提示，避免透传后端原始 message（已通过
        // skipErrorHandler 关闭全局 toast，确保只弹一次）。
        message.error(
          dict('PC.Models.ConversationInfo.permissionResponseFailed'),
        );
      }
    },
    [updateAcpPermissionInteraction, conversationId],
  );

  const respondMcpAsk = useCallback(
    async (interaction: McpAskInteraction, payload: McpAskRespondPayload) => {
      const requestId = interaction.input.requestId;
      const { action } = payload;

      const resolveStatus = (): McpAskInteraction['responseStatus'] => {
        if (action === 'cancel') return 'cancelled';
        if (action === 'skip') return 'skipped';
        return 'submitted';
      };

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
  };
}
