import {
  isExactTextAggregation,
  selectFinalResultAnswerText,
} from '@/features/conversation/presentation-v2/finalAnswerSelection';
import { AssistantRoleEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it } from 'vitest';

describe('最终回答汇总文本匹配', () => {
  it('允许段间空白和换行符差异', () => {
    expect(
      isExactTextAggregation('先核对。\r\n\r\n## 结论\r\n完成。', [
        '先核对。',
        '## 结论\n完成。',
      ]),
    ).toBe(true);
  });

  it('段内文字、空格或格式有差异时不裁剪', () => {
    expect(
      isExactTextAggregation('先核对。\n结论。', ['先核对。', '结 论。']),
    ).toBe(false);
    expect(
      isExactTextAggregation('先核对。\n新提醒。\n结论。', [
        '先核对。',
        '结论。',
      ]),
    ).toBe(false);
    expect(
      isExactTextAggregation('先核对。\n结论。', ['先核对。', '结论。补充']),
    ).toBe(false);
  });

  it('终态结果与末段不属于同一消息时保留原文', () => {
    const outputText = '过程说明。\n\n正式回答。';
    expect(
      selectFinalResultAnswerText({
        outputText,
        outputMessageIndex: 0,
        running: false,
        messages: [
          {
            role: AssistantRoleEnum.ASSISTANT,
            finalResult: { success: true },
          },
          {
            role: AssistantRoleEnum.ASSISTANT,
            finalResult: { success: true },
          },
        ] as MessageInfo[],
        parsedSegments: [
          [
            { type: 'text', content: '过程说明。' },
            { type: 'process', executeId: 'read-1' },
          ],
          [{ type: 'text', content: '正式回答。' }],
        ],
      }),
    ).toBe(outputText);
  });

  it('存在无法解析的标签片段时保留原文', () => {
    const outputText = '过程说明。\n\n正式回答。';
    expect(
      selectFinalResultAnswerText({
        outputText,
        outputMessageIndex: 0,
        running: false,
        messages: [
          {
            role: AssistantRoleEnum.ASSISTANT,
            finalResult: { success: true },
          },
        ] as MessageInfo[],
        parsedSegments: [
          [
            { type: 'text', content: '过程说明。' },
            { type: 'process', executeId: 'read-1' },
            { type: 'unknown', content: '<markdown-custom-process broken' },
            { type: 'text', content: '正式回答。' },
          ],
        ],
      }),
    ).toBe(outputText);
  });

  it('有多段连续正文时不把前一段回答误收进轨迹', () => {
    const outputText = '过程说明。\n\n回答第一段。\n\n回答第二段。';
    expect(
      selectFinalResultAnswerText({
        outputText,
        outputMessageIndex: 0,
        running: false,
        messages: [
          {
            role: AssistantRoleEnum.ASSISTANT,
            finalResult: { success: true },
          },
        ] as MessageInfo[],
        parsedSegments: [
          [
            { type: 'text', content: '过程说明。' },
            { type: 'process', executeId: 'read-1' },
            { type: 'text', content: '回答第一段。' },
            { type: 'text', content: '回答第二段。' },
          ],
        ],
      }),
    ).toBe(outputText);
  });

  it('失败或停止的终态结果保留完整原文', () => {
    const outputText = '过程说明。\n\n失败原因。';
    const parsedSegments = [
      [
        { type: 'text' as const, content: '过程说明。' },
        { type: 'process' as const, executeId: 'read-1' },
        { type: 'text' as const, content: '失败原因。' },
      ],
    ];
    for (const message of [
      {
        role: AssistantRoleEnum.ASSISTANT,
        finalResult: { success: false },
      },
      {
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Stopped,
        finalResult: { success: true },
      },
      {
        role: AssistantRoleEnum.ASSISTANT,
        status: MessageStatusEnum.Error,
        finalResult: { success: true },
      },
    ] as MessageInfo[]) {
      expect(
        selectFinalResultAnswerText({
          outputText,
          outputMessageIndex: 0,
          running: false,
          messages: [message],
          parsedSegments,
        }),
      ).toBe(outputText);
    }
  });
});
