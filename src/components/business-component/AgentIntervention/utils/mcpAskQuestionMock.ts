import { ConversationEventTypeEnum } from '@/types/enums/agent';
import type {
  ConversationChatResponse,
  MessageInfo,
} from '@/types/interfaces/conversationInfo';
import { isAgentMessage } from '@/utils/isAgentMessage';
import type {
  McpAskInteraction,
  McpAskUserToolInput,
} from '../types/mcpAskIntervention';
import {
  INTERACTION_UI_SCHEMA_VERSION,
  MCP_ASK_SCHEMA_VERSION,
} from '../types/mcpAskIntervention';
import { isMockMcpAskRequestId } from './interventionMockIds';
import { createInterventionTriggeredAt } from './interventionTrigger';

export const MCP_ASK_MOCK_RESPOND_LOCAL_KEY = 'mcpAskMockRespond';

export type McpAskQuestionMockScenario =
  | 'choice'
  | 'multi'
  | 'text'
  | 'custom'
  | 'wizard'
  | 'pending'
  | 'submitting'
  | 'submitted'
  | 'cancelled'
  | 'skipped'
  | 'failed';

const MOCK_SESSION_ID = 'mock-session-ask-dev-001';
const MOCK_TOOL_CALL_ID = 'tc_ask_mock_dev_001';
const MOCK_REQUEST_ID = 'ask_mock_ui_dev_001';

const CHOICE_MOCK_INPUT: McpAskUserToolInput = {
  toolName: 'nuwax_ask_user',
  schemaVersion: MCP_ASK_SCHEMA_VERSION,
  requestId: MOCK_REQUEST_ID,
  revision: 1,
  sessionId: MOCK_SESSION_ID,
  title: '[Mock] 请选择继续方式',
  description: '单选 · 支持跳过（nuwaclaw.mcp_ask.v1）',
  ui: {
    version: INTERACTION_UI_SCHEMA_VERSION,
    presentation: 'inline',
    title: 'Choose an option',
    schema: {
      type: 'object',
      properties: {
        choice: {
          type: 'string',
          enum: ['deploy', 'test', 'cancel_task'],
          title: '选项',
        },
      },
      required: ['choice'],
    },
    uiSchema: {
      choice: {
        'ui:widget': 'radio',
        'ui:options': {
          enumNames: ['直接部署', '先跑测试', '取消任务'],
        },
      },
      'ui:options': { allowSkip: true, skipLabel: '跳过' },
    },
    submitLabel: '提交',
    cancelLabel: '取消',
  },
  timeoutMs: 1_800_000,
};

const MULTI_MOCK_INPUT: McpAskUserToolInput = {
  ...CHOICE_MOCK_INPUT,
  requestId: `${MOCK_REQUEST_ID}_multi`,
  title: '[Mock] 请选择关注点（多选）',
  description: '多选 · Checkbox',
  ui: {
    version: INTERACTION_UI_SCHEMA_VERSION,
    presentation: 'inline',
    title: 'Multi select',
    schema: {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          title: '关注点',
          uniqueItems: true,
          minItems: 1,
          items: {
            type: 'string',
            enum: ['perf', 'security', 'ux', 'cost'],
          },
        },
      },
      required: ['tags'],
    },
    uiSchema: {
      tags: {
        'ui:widget': 'checkboxes',
        'ui:options': {
          enumNames: ['性能', '安全', '体验', '成本'],
        },
      },
      'ui:options': { allowSkip: true },
    },
    submitLabel: '提交',
    cancelLabel: '取消',
  },
};

const TEXT_MOCK_INPUT: McpAskUserToolInput = {
  ...CHOICE_MOCK_INPUT,
  requestId: `${MOCK_REQUEST_ID}_text`,
  title: '[Mock] 请补充说明',
  description: '自定义文本输入',
  ui: {
    version: INTERACTION_UI_SCHEMA_VERSION,
    presentation: 'inline',
    title: '补充说明',
    schema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          title: '说明',
          minLength: 1,
        },
      },
      required: ['note'],
    },
    uiSchema: {
      note: {
        'ui:widget': 'textarea',
        'ui:options': { placeholder: '请描述你的期望…' },
      },
      'ui:options': { allowSkip: true },
    },
    submitLabel: '提交',
    cancelLabel: '取消',
  },
};

const CUSTOM_MOCK_INPUT: McpAskUserToolInput = {
  ...CHOICE_MOCK_INPUT,
  requestId: `${MOCK_REQUEST_ID}_custom`,
  title: '[Mock] 选择或自定义',
  description: '点选 + 自定义输入',
  ui: {
    version: INTERACTION_UI_SCHEMA_VERSION,
    presentation: 'inline',
    title: 'Custom choice',
    schema: {
      type: 'object',
      properties: {
        mode: {
          type: 'string',
          enum: ['quick', 'standard'],
          title: '模式',
        },
        modeCustom: { type: 'string', title: '自定义模式' },
      },
      required: ['mode'],
    },
    uiSchema: {
      mode: {
        'ui:widget': 'radio-with-custom',
        'ui:options': {
          enumNames: ['快速', '标准'],
          allowCustom: true,
          otherValue: '__custom__',
          otherField: 'modeCustom',
        },
      },
      'ui:options': { allowSkip: true },
    },
    submitLabel: '提交',
    cancelLabel: '取消',
  },
};

const WIZARD_MOCK_INPUT: McpAskUserToolInput = {
  ...CHOICE_MOCK_INPUT,
  requestId: `${MOCK_REQUEST_ID}_wizard`,
  title: '[Mock] 多步骤确认',
  description: 'Wizard 三步 · 可跳过',
  ui: {
    version: INTERACTION_UI_SCHEMA_VERSION,
    presentation: 'wizard',
    title: 'Wizard',
    steps: [
      {
        id: 'step1',
        title: '选择目标',
        description: '第一步：选择要继续的操作',
        fields: ['goal'],
      },
      {
        id: 'step2',
        title: '选择范围',
        description: '第二步：可多选影响范围',
        fields: ['scopes'],
      },
      {
        id: 'step3',
        title: '补充说明',
        description: '第三步：可选文字说明',
        fields: ['note'],
      },
    ],
    schema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          enum: ['build', 'fix', 'review'],
          title: '目标',
        },
        scopes: {
          type: 'array',
          title: '范围',
          minItems: 1,
          uniqueItems: true,
          items: { type: 'string', enum: ['frontend', 'backend', 'infra'] },
        },
        note: { type: 'string', title: '备注' },
      },
      required: ['goal', 'scopes'],
    },
    uiSchema: {
      goal: {
        'ui:widget': 'radio',
        'ui:options': { enumNames: ['构建', '修复', '审查'] },
      },
      scopes: {
        'ui:widget': 'checkboxes',
        'ui:options': { enumNames: ['前端', '后端', '基础设施'] },
      },
      note: { 'ui:widget': 'textarea' },
      'ui:options': { allowSkip: true, skipLabel: '跳过全部' },
    },
    submitLabel: '完成',
    cancelLabel: '取消',
  },
};

function getMockInputByScenario(
  scenario: McpAskQuestionMockScenario,
): McpAskUserToolInput {
  switch (scenario) {
    case 'multi':
      return { ...MULTI_MOCK_INPUT };
    case 'text':
      return { ...TEXT_MOCK_INPUT };
    case 'custom':
      return { ...CUSTOM_MOCK_INPUT };
    case 'wizard':
      return { ...WIZARD_MOCK_INPUT };
    default:
      return { ...CHOICE_MOCK_INPUT };
  }
}

export function parseMcpAskToolInput(raw: unknown): McpAskUserToolInput | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const record = raw as Record<string, unknown>;
  if (record.schemaVersion !== MCP_ASK_SCHEMA_VERSION) {
    return null;
  }
  const toolName = record.toolName ?? 'nuwax_ask_question';
  if (
    toolName !== 'nuwax_ask_question' &&
    toolName !== 'nuwax_ask_user' &&
    toolName !== 'nuwaclaw_ask_user'
  ) {
    return null;
  }
  if (typeof record.requestId !== 'string' || !record.ui) {
    return null;
  }
  return { ...record, toolName } as unknown as McpAskUserToolInput;
}

const STATUS_ONLY_SCENARIOS = new Set<McpAskQuestionMockScenario>([
  'pending',
  'submitting',
  'submitted',
  'cancelled',
  'skipped',
  'failed',
]);

export function createMockMcpAskInteraction(
  scenario: McpAskQuestionMockScenario = 'choice',
): McpAskInteraction {
  const contentScenario = STATUS_ONLY_SCENARIOS.has(scenario)
    ? 'choice'
    : scenario;
  const input = getMockInputByScenario(contentScenario);

  const base: McpAskInteraction = {
    input,
    toolCallId: MOCK_TOOL_CALL_ID,
    responseStatus: 'pending',
    triggeredAt: createInterventionTriggeredAt(),
  };

  switch (scenario) {
    case 'submitting':
      return {
        ...base,
        responseStatus: 'submitting',
        formData: { choice: 'deploy' },
      };
    case 'submitted':
      return {
        ...base,
        responseStatus: 'submitted',
        formData: { choice: 'deploy' },
      };
    case 'cancelled':
      return { ...base, responseStatus: 'cancelled' };
    case 'skipped':
      return { ...base, responseStatus: 'skipped' };
    case 'failed':
      return {
        ...base,
        responseStatus: 'failed',
        errorMessage: '[Mock] 问题提交失败，请重试',
      };
    default:
      return base;
  }
}

export function createMockMcpAskToolCallSseEvent(
  scenario: McpAskQuestionMockScenario = 'choice',
): ConversationChatResponse & {
  messageType?: string;
  subType?: string;
} {
  const interaction = createMockMcpAskInteraction(scenario);
  return {
    completed: false,
    error: '',
    requestId: `mock-req-${Date.now()}`,
    eventType: ConversationEventTypeEnum.MESSAGE,
    messageType: 'tool_call',
    subType: 'tool_call',
    data: {
      tool_call_id: interaction.toolCallId,
      toolCallId: interaction.toolCallId,
      title: interaction.input.title,
      kind: 'other',
      status: 'pending',
      rawInput: interaction.input,
      raw_input: interaction.input,
    },
  };
}

export function hasMockMcpAskInMessageList(
  messageList: MessageInfo[],
): boolean {
  return (
    messageList?.some((message) =>
      message.mcpAskInteractions?.some((item) =>
        isMockMcpAskRequestId(item.input.requestId),
      ),
    ) ?? false
  );
}

export function injectMcpAskIntoMessageList(
  messageList: MessageInfo[],
  scenario: McpAskQuestionMockScenario = 'choice',
  targetMessageId?: string,
): { list: MessageInfo[]; injected: boolean } {
  if (!messageList?.length) {
    return { list: messageList, injected: false };
  }

  const mockInteraction = createMockMcpAskInteraction(scenario);
  const requestId = mockInteraction.input.requestId;

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
      '[mcpAskQuestionMock] 未找到 Agent 消息，请先发送一条消息或打开含 Agent 回复的会话',
    );
    return { list: messageList, injected: false };
  }

  const list = messageList.map((item, index) => {
    if (index !== targetIndex) {
      return item;
    }
    const existing = item.mcpAskInteractions || [];
    if (existing.some((x) => x.input.requestId === requestId)) {
      return {
        ...item,
        mcpAskInteractions: existing.map((x) =>
          x.input.requestId === requestId ? mockInteraction : x,
        ),
      };
    }
    return {
      ...item,
      mcpAskInteractions: [...existing, mockInteraction],
    };
  });

  return { list, injected: true };
}

export function enableMcpAskMockLocalRespond(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MCP_ASK_MOCK_RESPOND_LOCAL_KEY, 'local');
  }
}

export function isMcpAskMockLocalRespondEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem(MCP_ASK_MOCK_RESPOND_LOCAL_KEY) === 'local'
  );
}
