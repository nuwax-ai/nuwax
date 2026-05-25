import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { hasAgentMessage } from '@/utils/isAgentMessage';
import { useEffect } from 'react';
import type { AcpPermissionMockScenario } from '../utils/acpPermissionMock';
import { enableAcpMockLocalRespond } from '../utils/acpPermissionMock';
import { hasDemoInterventionStack } from '../utils/interventionDemoStack';
import type { McpAskQuestionMockScenario } from '../utils/mcpAskQuestionMock';
import {
  enableMcpAskMockLocalRespond,
  hasMockMcpAskInMessageList,
} from '../utils/mcpAskQuestionMock';

interface UseAgentInterventionDevMockOptions {
  conversationId?: number | string | null;
  messageList: MessageInfo[];
  injectMockAcpPermission: (
    scenario?: AcpPermissionMockScenario,
    targetMessageId?: string,
  ) => void;
  injectMockMcpAsk: (
    scenario?: McpAskQuestionMockScenario,
    targetMessageId?: string,
  ) => void;
  injectAllInterventionMocks?: () => void;
}

export function useAgentInterventionDevMock({
  conversationId,
  messageList,
  injectMockAcpPermission,
  injectMockMcpAsk,
  injectAllInterventionMocks: injectAllMocks,
}: UseAgentInterventionDevMockOptions): void {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    const search = new URLSearchParams(window.location.search);
    if (search.get('mockAll') !== '1' || !injectAllMocks) {
      return;
    }
    enableAcpMockLocalRespond();
    enableMcpAskMockLocalRespond();
    if (!messageList?.length || !hasAgentMessage(messageList)) {
      return;
    }
    if (hasDemoInterventionStack(messageList)) {
      return;
    }
    injectAllMocks();
    if (typeof window !== 'undefined') {
      (
        window as Window & {
          __nuwaxInjectAllInterventionMocks?: typeof injectAllMocks;
        }
      ).__nuwaxInjectAllInterventionMocks = injectAllMocks;
    }
  }, [conversationId, messageList, injectAllMocks]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    const search = new URLSearchParams(window.location.search);
    if (search.get('mockAll') === '1' || search.get('mockAcp') !== '1') {
      return;
    }
    enableAcpMockLocalRespond();
    if (!messageList?.length || !hasAgentMessage(messageList)) {
      return;
    }
    const hasAcpMock = messageList.some((m) =>
      m.acpPermissionInteractions?.some((x) =>
        x.intervention.id.startsWith('itv_mock'),
      ),
    );
    if (hasAcpMock) {
      return;
    }
    injectMockAcpPermission('pending');
    if (typeof window !== 'undefined') {
      (
        window as Window & {
          __nuwaxInjectAcpMock?: typeof injectMockAcpPermission;
        }
      ).__nuwaxInjectAcpMock = injectMockAcpPermission;
    }
  }, [conversationId, messageList, injectMockAcpPermission]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    const search = new URLSearchParams(window.location.search);
    if (search.get('mockAll') === '1' || search.get('mockAsk') !== '1') {
      return;
    }
    enableMcpAskMockLocalRespond();
    if (!messageList?.length || !hasAgentMessage(messageList)) {
      return;
    }
    if (hasMockMcpAskInMessageList(messageList)) {
      return;
    }
    const scenario =
      (search.get('mockAskScenario') as McpAskQuestionMockScenario | null) ||
      'choice';
    injectMockMcpAsk(scenario);
    if (typeof window !== 'undefined') {
      (
        window as Window & {
          __nuwaxInjectMcpAskMock?: typeof injectMockMcpAsk;
        }
      ).__nuwaxInjectMcpAskMock = injectMockMcpAsk;
    }
  }, [conversationId, messageList, injectMockMcpAsk]);
}
