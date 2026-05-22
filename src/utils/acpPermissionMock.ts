import type {
  AcpPermissionInteraction,
  AcpPermissionInterventionRequest,
} from '@/types/interfaces/acpIntervention';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { createInterventionTriggeredAt } from '@/utils/interventionTrigger';
import { isAgentMessage } from '@/utils/isAgentMessage';

export const ACP_MOCK_RESPOND_LOCAL_KEY = 'acpMockRespond';

export type AcpPermissionMockScenario =
  | 'pending'
  | 'submitting'
  | 'submitted'
  | 'failed';

const MOCK_INTERVENTION_ID = 'itv_mock_ui_dev_001';
const MOCK_SESSION_ID = 'mock-session-dev-001';
const MOCK_TOOL_CALL_ID = 'tc_mock_dev_001';

export function createMockAcpPermissionInteraction(
  scenario: AcpPermissionMockScenario = 'pending',
): AcpPermissionInteraction {
  const intervention: AcpPermissionInterventionRequest = {
    id: MOCK_INTERVENTION_ID,
    revision: 1,
    kind: 'approval',
    status: 'pending',
    sessionId: MOCK_SESSION_ID,
    source: 'acp_permission',
    engine: 'codex',
    protocol: 'acp',
    callbackTarget: { kind: 'electron', targetId: 'mock-target-dev' },
    schemaRef: 'mock/dev',
    acp: {
      method: 'session/request_permission',
      request: {
        sessionId: MOCK_SESSION_ID,
        toolCall: {
          toolCallId: MOCK_TOOL_CALL_ID,
          kind: 'execute',
          title: '[Mock] 执行命令: npm run test',
          rawInput: { command: 'npm run test', cwd: '/workspace/nuwax' },
          status: 'pending',
        },
        options: [
          { optionId: 'allow_once', kind: 'allow_once', name: '允许一次' },
          { optionId: 'allow_always', kind: 'allow_always', name: '始终允许' },
          { optionId: 'reject_once', kind: 'reject_once', name: '拒绝' },
        ],
      },
    },
    createdAt: Date.now(),
  };

  const base: AcpPermissionInteraction = {
    intervention,
    responseStatus: 'pending',
    triggeredAt: createInterventionTriggeredAt(),
  };

  switch (scenario) {
    case 'submitting':
      return {
        ...base,
        responseStatus: 'submitting',
        selectedOptionId: 'allow_once',
      };
    case 'submitted':
      return {
        ...base,
        responseStatus: 'submitted',
        selectedOptionId: 'allow_once',
      };
    case 'failed':
      return {
        ...base,
        responseStatus: 'failed',
        errorMessage: '[Mock] 权限响应失败，请重试',
      };
    default:
      return base;
  }
}

export function injectAcpPermissionIntoMessageList(
  messageList: MessageInfo[],
  scenario: AcpPermissionMockScenario = 'pending',
  targetMessageId?: string,
): MessageInfo[] {
  if (!messageList?.length) {
    return messageList;
  }

  const mockInteraction = createMockAcpPermissionInteraction(scenario);
  const interventionId = mockInteraction.intervention.id;

  let targetIndex = -1;
  if (targetMessageId) {
    targetIndex = messageList.findIndex((m) => m.id === targetMessageId);
  } else {
    for (let i = messageList.length - 1; i >= 0; i -= 1) {
      if (isAgentMessage(messageList[i])) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex < 0) {
    console.warn(
      '[acpPermissionMock] 未找到 Agent 消息，请先发送一条消息或打开含 Agent 回复的会话',
    );
    return messageList;
  }

  return messageList.map((item, index) => {
    if (index !== targetIndex) {
      return item;
    }
    const existing = item.acpPermissionInteractions || [];
    if (existing.some((x) => x.intervention.id === interventionId)) {
      return {
        ...item,
        acpPermissionInteractions: existing.map((x) =>
          x.intervention.id === interventionId ? mockInteraction : x,
        ),
      };
    }
    return {
      ...item,
      acpPermissionInteractions: [...existing, mockInteraction],
    };
  });
}

export function enableAcpMockLocalRespond(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ACP_MOCK_RESPOND_LOCAL_KEY, 'local');
  }
}

export function isAcpMockLocalRespondEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(ACP_MOCK_RESPOND_LOCAL_KEY) === 'local'
  );
}
