import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { renderHook } from '@testing-library/react';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '../types/acpIntervention';
import type {
  McpAskInteraction,
  McpAskRespondPayload,
} from '../types/mcpAskIntervention';
import { useAgentInterventionHandlers } from './useAgentInterventionHandlers';

const mockApiAgentInterventionRespond = vi.fn();
vi.mock('@/services/agentConfig', () => ({
  apiAgentInterventionRespond: (...args: unknown[]) =>
    mockApiAgentInterventionRespond(...args),
}));

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string) => key,
}));

vi.mock('antd', () => ({
  message: { error: vi.fn() },
}));

/* ------------------------------------------------------------------ */
/*  helpers                                                            */
/* ------------------------------------------------------------------ */

function createAcpInteraction(
  overrides: Partial<AcpPermissionInteraction> = {},
): AcpPermissionInteraction {
  return {
    intervention: {
      id: 'itv-001',
      sessionId: 'sess-001',
      acp: {
        method: 'session/request_permission',
        request: {
          sessionId: 'sess-001',
          toolCall: { toolCallId: 'tc-001' },
          options: [],
        },
      },
    },
    responseStatus: 'pending',
    selectedOptionId: undefined,
    errorMessage: undefined,
    ...overrides,
  } as AcpPermissionInteraction;
}

function createMcpAskInteraction(
  overrides: Partial<McpAskInteraction> = {},
): McpAskInteraction {
  return {
    input: {
      toolName: 'nuwax_ask_question',
      schemaVersion: 'nuwax.mcp_ask.v2',
      requestId: 'req-001',
      revision: 1,
      sessionId: 'sess-001',
      title: '测试问题',
      ui: {
        version: 'nuwax.interaction.v2',
        presentation: 'inline',
        title: 'Q',
        fields: [],
      },
    },
    toolCallId: 'tc-001',
    responseStatus: 'pending',
    ...overrides,
  } as McpAskInteraction;
}

/** Simulate the setMessageList functional updater pattern. */
function createMockSetMessageList(existing: MessageInfo[] = []) {
  return vi.fn((fn: (list: MessageInfo[]) => MessageInfo[]) => fn(existing));
}

/* ------------------------------------------------------------------ */
/*  ACP respondAcpPermission tests                                     */
/* ------------------------------------------------------------------ */

describe('useAgentInterventionHandlers', () => {
  describe('respondAcpPermission', () => {
    it('sets responseStatus to submitted on SUCCESS_CODE', async () => {
      mockApiAgentInterventionRespond.mockResolvedValueOnce({
        code: '0000',
      });

      const existing = [
        {
          id: 'msg-1',
          acpPermissionInteractions: [createAcpInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createAcpInteraction();
      const acpResponse: AcpRequestPermissionResponse = {
        outcome: { outcome: 'selected', optionId: 'opt-1' },
      };

      await result.current.respondAcpPermission(interaction, acpResponse);

      // First call: submitting status
      expect(setMessageList).toHaveBeenCalledTimes(2);
      const firstUpdate = setMessageList.mock.calls[0][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const result1 = firstUpdate(existing);
      expect(result1[0].acpPermissionInteractions![0].responseStatus).toBe(
        'submitting',
      );

      // Second call: submitted status
      const secondUpdate = setMessageList.mock.calls[1][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const result2 = secondUpdate(existing);
      expect(result2[0].acpPermissionInteractions![0].responseStatus).toBe(
        'submitted',
      );
    });

    it('sets responseStatus to failed when API returns non-SUCCESS code', async () => {
      mockApiAgentInterventionRespond.mockResolvedValueOnce({
        code: '9999',
        message: '失败',
      });

      const existing = [
        {
          id: 'msg-1',
          acpPermissionInteractions: [createAcpInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createAcpInteraction();
      const acpResponse: AcpRequestPermissionResponse = {
        outcome: { outcome: 'selected', optionId: 'opt-1' },
      };

      await result.current.respondAcpPermission(interaction, acpResponse);

      expect(setMessageList).toHaveBeenCalledTimes(2);
      const failUpdate = setMessageList.mock.calls[1][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = failUpdate(existing);
      const updatedInteraction = updated[0].acpPermissionInteractions![0];
      expect(updatedInteraction.responseStatus).toBe('failed');
      expect(updatedInteraction.errorMessage).toBe('失败');
    });

    it('sets responseStatus to failed on network error and calls message.error', async () => {
      const { message } = await import('antd');
      mockApiAgentInterventionRespond.mockRejectedValueOnce(
        new Error('network timeout'),
      );

      const existing = [
        {
          id: 'msg-1',
          acpPermissionInteractions: [createAcpInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createAcpInteraction();
      const acpResponse: AcpRequestPermissionResponse = {
        outcome: { outcome: 'selected', optionId: 'opt-1' },
      };

      await result.current.respondAcpPermission(interaction, acpResponse);

      expect(setMessageList).toHaveBeenCalledTimes(2);
      const failUpdate = setMessageList.mock.calls[1][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = failUpdate(existing);
      expect(updated[0].acpPermissionInteractions![0].responseStatus).toBe(
        'failed',
      );
      expect(updated[0].acpPermissionInteractions![0].errorMessage).toBe(
        'network timeout',
      );
      // toast 始终是统一友好文案，不再透传原始 message
      expect(message.error).toHaveBeenCalledWith(
        'PC.Models.ConversationInfo.permissionResponseFailed',
      );
    });

    it('sets selectedOptionId when outcome is selected', async () => {
      mockApiAgentInterventionRespond.mockResolvedValueOnce({
        code: '0000',
      });

      const existing = [
        {
          id: 'msg-1',
          acpPermissionInteractions: [createAcpInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createAcpInteraction();
      const acpResponse: AcpRequestPermissionResponse = {
        outcome: { outcome: 'selected', optionId: 'opt-1' },
      };

      await result.current.respondAcpPermission(interaction, acpResponse);

      const firstUpdate = setMessageList.mock.calls[0][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = firstUpdate(existing);
      expect(updated[0].acpPermissionInteractions![0].selectedOptionId).toBe(
        'opt-1',
      );
    });

    it('leaves selectedOptionId undefined when outcome is cancelled', async () => {
      mockApiAgentInterventionRespond.mockResolvedValueOnce({
        code: '0000',
      });

      const existing = [
        {
          id: 'msg-1',
          acpPermissionInteractions: [createAcpInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createAcpInteraction();
      const acpResponse: AcpRequestPermissionResponse = {
        outcome: { outcome: 'cancelled' },
      };

      await result.current.respondAcpPermission(interaction, acpResponse);

      const firstUpdate = setMessageList.mock.calls[0][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = firstUpdate(existing);
      expect(
        updated[0].acpPermissionInteractions![0].selectedOptionId,
      ).toBeUndefined();
    });
  });

  /* ---------------------------------------------------------------- */
  /*  MCP respondMcpAsk tests                                          */
  /* ---------------------------------------------------------------- */

  describe('respondMcpAsk', () => {
    it('sets responseStatus to submitted for submit action', () => {
      const existing = [
        {
          id: 'msg-1',
          mcpAskInteractions: [createMcpAskInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createMcpAskInteraction();
      const payload: McpAskRespondPayload = {
        interventionId: 'itv-001',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: { name: 'test' },
      };

      result.current.respondMcpAsk(interaction, payload);

      const update = setMessageList.mock.calls[0][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = update(existing);
      expect(updated[0].mcpAskInteractions![0].responseStatus).toBe(
        'submitted',
      );
      expect(updated[0].mcpAskInteractions![0].formData).toEqual({
        name: 'test',
      });
    });

    it('sets responseStatus to cancelled for cancel action', () => {
      const existing = [
        {
          id: 'msg-1',
          mcpAskInteractions: [createMcpAskInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createMcpAskInteraction();
      const payload: McpAskRespondPayload = {
        interventionId: 'itv-001',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'cancel',
      };

      result.current.respondMcpAsk(interaction, payload);

      const update = setMessageList.mock.calls[0][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = update(existing);
      expect(updated[0].mcpAskInteractions![0].responseStatus).toBe(
        'cancelled',
      );
    });

    it('sets responseStatus to skipped for skip action', () => {
      const existing = [
        {
          id: 'msg-1',
          mcpAskInteractions: [createMcpAskInteraction()],
        },
      ] as MessageInfo[];
      const setMessageList = createMockSetMessageList(existing);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createMcpAskInteraction();
      const payload: McpAskRespondPayload = {
        interventionId: 'itv-001',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'skip',
      };

      result.current.respondMcpAsk(interaction, payload);

      const update = setMessageList.mock.calls[0][0] as (
        list: MessageInfo[],
      ) => MessageInfo[];
      const updated = update(existing);
      expect(updated[0].mcpAskInteractions![0].responseStatus).toBe('skipped');
    });

    it('returns the result of buildMcpAskResumeMessage', async () => {
      const setMessageList = createMockSetMessageList([]);

      const { result } = renderHook(() =>
        useAgentInterventionHandlers({ setMessageList, conversationId: 123 }),
      );

      const interaction = createMcpAskInteraction();
      const payload: McpAskRespondPayload = {
        interventionId: 'itv-001',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: { name: 'test' },
      };

      const message = await result.current.respondMcpAsk(interaction, payload);

      expect(typeof message).toBe('string');
      expect(message).toContain('测试问题');
    });
  });
});
