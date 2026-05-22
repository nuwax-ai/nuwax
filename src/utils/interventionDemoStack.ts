import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { injectAcpPermissionIntoMessageList } from '@/utils/acpPermissionMock';
import { isAgentMessage } from '@/utils/isAgentMessage';
import type { McpAskQuestionMockScenario } from '@/utils/mcpAskQuestionMock';
import { createMockMcpAskInteraction } from '@/utils/mcpAskQuestionMock';

export const DEMO_ASK_CONTENT_SCENARIOS: McpAskQuestionMockScenario[] = [
  'choice',
  'multi',
  'custom',
  'text',
  'wizard',
];

const DEMO_STACK_FLAG = 'itv_mock_demo_stack';

export function hasDemoInterventionStack(messageList: MessageInfo[]): boolean {
  const hasAcp = messageList?.some((m) =>
    m.acpPermissionInteractions?.some((x) =>
      x.intervention.id.startsWith(DEMO_STACK_FLAG),
    ),
  );
  const askIds = new Set(
    DEMO_ASK_CONTENT_SCENARIOS.map(
      (s) => createMockMcpAskInteraction(s).input.requestId,
    ),
  );
  const presentAsk = messageList?.some((m) =>
    m.mcpAskInteractions?.some((x) => askIds.has(x.input.requestId)),
  );
  return Boolean(hasAcp && presentAsk);
}

function findLastAgentIndex(messageList: MessageInfo[]): number {
  for (let i = messageList.length - 1; i >= 0; i -= 1) {
    if (isAgentMessage(messageList[i])) {
      return i;
    }
  }
  return -1;
}

export function injectAllInterventionMocks(
  messageList: MessageInfo[],
): MessageInfo[] {
  if (!messageList?.length) {
    return messageList;
  }

  const targetIndex = findLastAgentIndex(messageList);
  if (targetIndex < 0) {
    console.warn(
      '[agentInterventionDemo] 未找到 Agent 消息，请先打开含 Agent 回复的会话',
    );
    return messageList;
  }

  let list = injectAcpPermissionIntoMessageList(messageList, 'pending');

  const acpInteraction = list[targetIndex]?.acpPermissionInteractions?.find(
    (x) => x.intervention.id.startsWith('itv_mock'),
  );
  if (acpInteraction) {
    list = list.map((item, index) => {
      if (index !== targetIndex) {
        return item;
      }
      return {
        ...item,
        acpPermissionInteractions: item.acpPermissionInteractions?.map((x) =>
          x.intervention.id === acpInteraction.intervention.id
            ? {
                ...x,
                intervention: {
                  ...x.intervention,
                  id: `${DEMO_STACK_FLAG}_acp`,
                  acp: {
                    ...x.intervention.acp,
                    request: {
                      ...x.intervention.acp.request,
                      toolCall: {
                        ...x.intervention.acp.request.toolCall,
                        title: '[Mock·1] ACP 权限：执行 npm run test',
                      },
                    },
                  },
                },
              }
            : x,
        ),
      };
    });
  }

  DEMO_ASK_CONTENT_SCENARIOS.forEach((scenario, index) => {
    const mock = createMockMcpAskInteraction(scenario);
    const numberedTitle = `[Mock·${index + 2}] ${mock.input.title.replace(
      '[Mock] ',
      '',
    )}`;
    const interaction = {
      ...mock,
      input: { ...mock.input, title: numberedTitle },
    };

    list = list.map((item, idx) => {
      if (idx !== targetIndex) {
        return item;
      }
      const existing = item.mcpAskInteractions || [];
      if (
        existing.some((x) => x.input.requestId === interaction.input.requestId)
      ) {
        return item;
      }
      return {
        ...item,
        mcpAskInteractions: [...existing, interaction],
      };
    });
  });

  return list;
}
