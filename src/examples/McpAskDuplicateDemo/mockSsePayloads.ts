/**
 * MCP Ask 重复询问场景 — 真实后端 ASK_QUESTION SSE 载荷
 * 两次 title 均为「补充回复」，但 requestId / executeId 不同。
 */
import { ConversationEventTypeEnum } from '@/types/enums/agent';
import type { ConversationChatResponse } from '@/types/interfaces/conversationInfo';

export const FIRST_REQUEST_ID = '13f030d0c07547fe83fd6d43b624f0e0';
export const SECOND_REQUEST_ID = 'ed325c9eec724bce95ca6a05974b42d6';
export const FIRST_EXECUTE_ID = '733e52ee48a8406b8f148de386092f47';
export const SECOND_EXECUTE_ID = '449db35f985747bf8cd1645627bc2d8c';

const sharedFields = [
  {
    widget: 'file',
    name: 'file',
    type: 'string',
    title: '补充内容',
    required: false,
  },
  {
    widget: 'text',
    name: 'name',
    type: 'string',
    title: '你的名字',
    required: false,
  },
  {
    widget: 'select',
    name: 'hh',
    options: [
      { label: '说晚安', value: '说晚安', children: null },
      { label: 'sds', value: 'sds', children: null },
    ],
    type: 'string',
    title: '调度',
    required: false,
  },
  {
    widget: 'radio',
    name: 'ddw',
    options: [
      { label: '1', value: '1', children: null },
      { label: '2', value: '2', children: null },
      { label: '3', value: '3', children: null },
    ],
    type: 'string',
    title: '单选',
    required: false,
  },
  {
    widget: 'checkboxes',
    name: 'dx',
    options: [
      { label: '1', value: '1', children: null },
      { label: '2', value: '2', children: null },
      { label: '3', value: '3', children: null },
    ],
    type: 'string',
    title: '多选',
    required: false,
  },
  {
    widget: 'number',
    name: 'sz',
    type: 'integer',
    title: 's z',
    required: false,
  },
] as const;

function buildAskQuestionSsePayload(
  requestId: string,
  executeId: string,
): ConversationChatResponse {
  return {
    requestId,
    eventType: ConversationEventTypeEnum.PROCESSING,
    error: null,
    data: {
      targetId: null,
      name: 'AskQuestion',
      originalTitle: null,
      type: 'Event',
      status: 'EXECUTING',
      executingMessage: null,
      result: {
        id: null,
        name: '补充回复',
        icon: null,
        type: 'Event',
        success: true,
        error: null,
        data: {
          schemaVersion: 'nuwax.mcp_ask.v1',
          ui: {
            presentation: 'inline',
            title: '请选择\n\n',
            fields: [...sharedFields],
          },
          requestId,
          description: '请选择\n\n',
          title: '补充回复',
          revision: 1,
        },
        innerExecuteInfo: null,
        startTime: null,
        endTime: null,
        input: null,
        executeId,
        kind: null,
        locations: null,
      },
      cardBindConfig: null,
      cardData: null,
      pageArgConfig: null,
      subEventType: 'ASK_QUESTION',
    },
    completed: false,
  } as ConversationChatResponse;
}

/** 第 1 次 AskQuestion SSE（用户原始数据） */
export const MCP_ASK_FIRST_SSE = buildAskQuestionSsePayload(
  FIRST_REQUEST_ID,
  FIRST_EXECUTE_ID,
);

/** 第 2 次 AskQuestion SSE（用户原始数据，executeId 不同） */
export const MCP_ASK_SECOND_SSE = buildAskQuestionSsePayload(
  SECOND_REQUEST_ID,
  SECOND_EXECUTE_ID,
);
