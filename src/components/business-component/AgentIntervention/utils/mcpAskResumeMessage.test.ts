import { describe, expect, it, vi } from 'vitest';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import {
  buildMcpAskResumeMessage,
  isMcpAskResumeMessageForInteraction,
} from './mcpAskResumeMessage';

/** 测试用中文 i18n 字典，与 zh-CN 本地包 resume 相关 key 对齐 */
const zhCnResumeDict: Record<string, string> = {
  'PC.Common.Global.yes': '是',
  'PC.Common.Global.no': '否',
  'PC.Components.McpAskQuestionCard.defaultTitle': '这次提问',
  'PC.Components.McpAskQuestionCard.notFilled': '未填写',
  'PC.Components.McpAskQuestionCard.unknownFile': '未知文件',
  'PC.Components.McpAskQuestionCard.file': '文件',
  'PC.Components.McpAskQuestionCard.emptyFormContent': '（无表单内容）',
  'PC.Components.McpAskQuestionCard.resumeCancelled': '我取消了「{0}」。',
  'PC.Components.McpAskQuestionCard.resumeSkipped': '我跳过了「{0}」。',
  'PC.Components.McpAskQuestionCard.resumeTimeout':
    '「{0}」已超时，没有收到表单答案。',
  'PC.Components.McpAskQuestionCard.resumeSubmitted':
    '我已填写「{0}」，表单内容如下：',
};

/** 测试用英文 i18n 字典 */
const enUsResumeDict: Record<string, string> = {
  'PC.Common.Global.yes': 'Yes',
  'PC.Common.Global.no': 'No',
  'PC.Components.McpAskQuestionCard.defaultTitle': 'This question',
  'PC.Components.McpAskQuestionCard.notFilled': 'Not provided',
  'PC.Components.McpAskQuestionCard.unknownFile': 'Unknown file',
  'PC.Components.McpAskQuestionCard.file': 'File',
  'PC.Components.McpAskQuestionCard.emptyFormContent': '(No form content)',
  'PC.Components.McpAskQuestionCard.resumeCancelled': 'I cancelled "{0}".',
  'PC.Components.McpAskQuestionCard.resumeSkipped': 'I skipped "{0}".',
  'PC.Components.McpAskQuestionCard.resumeTimeout':
    '"{0}" timed out. No form answer was received.',
  'PC.Components.McpAskQuestionCard.resumeSubmitted':
    'I answered "{0}". Form details:',
};

let activeDict = zhCnResumeDict;
let activeLang = 'zh-CN';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, ...args: (string | number)[]) => {
    const template = activeDict[key] ?? key;
    return args.reduce(
      (text, item, index) =>
        text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(item)),
      template,
    );
  },
  getCurrentLang: () => activeLang,
}));

const baseInteraction: McpAskInteraction = {
  toolCallId: 'tc-1',
  input: {
    toolName: 'nuwax_ask_question',
    schemaVersion: 'nuwax.mcp_ask.v2',
    requestId: 'ask-1',
    revision: 1,
    sessionId: 'session-1',
    title: '请选择继续方式',
    ui: {
      version: 'nuwax.interaction.v2',
      presentation: 'inline',
      title: '请选择继续方式',
      fields: [
        {
          name: 'choice',
          title: '选项',
          widget: 'radio',
          required: true,
          options: [
            { value: 'deploy', label: '直接部署' },
            { value: 'test', label: '先跑测试' },
            { value: 'cancel', label: '取消任务' },
          ],
        },
        { name: 'notes', title: '补充说明', widget: 'textarea' },
        {
          name: 'checks',
          title: '检查项',
          widget: 'checkboxes',
          type: 'array',
          options: [
            { value: 'lint', label: '代码检查' },
            { value: 'unit', label: '单元测试' },
          ],
        },
      ],
    },
  },
};

describe('buildMcpAskResumeMessage', () => {
  it('formats submitted answers as user-friendly label value lines', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const message = buildMcpAskResumeMessage(baseInteraction, {
      interventionId: 'ask-1',
      revision: 1,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'submit',
      formData: {
        choice: 'test',
        notes: '先跑关键链路',
        checks: ['lint', 'unit'],
      },
    });

    expect(message).toBe(
      [
        '我已填写「请选择继续方式」，表单内容如下：',
        '选项：先跑测试',
        '补充说明：先跑关键链路',
        '检查项：代码检查、单元测试',
      ].join('\n'),
    );
    expect(message).not.toContain('```json');
    expect(message).not.toContain('"choice"');
  });

  it('keeps unknown fields readable without JSON blocks', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const message = buildMcpAskResumeMessage(baseInteraction, {
      interventionId: 'ask-1',
      revision: 1,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'submit',
      formData: {
        confirmed: true,
        extra: { owner: 'alice', retry: 2 },
      },
    });

    expect(message).toContain('confirmed：是');
    expect(message).toContain('extra：owner：alice，retry：2');
    expect(message).not.toContain('```json');
  });

  it('uses custom radio input as the field value', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const message = buildMcpAskResumeMessage(
      {
        ...baseInteraction,
        input: {
          ...baseInteraction.input,
          ui: {
            ...baseInteraction.input.ui,
            fields: [
              {
                name: 'choice',
                title: '选项',
                widget: 'radio-with-custom',
                options: [
                  { value: 'deploy', label: '直接部署' },
                  { value: 'test', label: '先跑测试' },
                ],
                otherField: 'choiceOther',
              },
            ],
          },
        },
      },
      {
        interventionId: 'ask-1',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: {
          choice: '__custom__',
          choiceOther: '先发灰度环境',
        },
      },
    );

    expect(message).toContain('选项：先发灰度环境');
    expect(message).not.toContain('__custom__');
    expect(message).not.toContain('choiceOther');
  });

  it('formats cancel, skip, and timeout as normal chat messages', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const commonPayload = {
      interventionId: 'ask-1',
      revision: 1,
      source: 'mcp_ask' as const,
      protocol: 'mcp' as const,
    };

    expect(
      buildMcpAskResumeMessage(baseInteraction, {
        ...commonPayload,
        action: 'cancel',
      }),
    ).toBe('我取消了「请选择继续方式」。');
    expect(
      buildMcpAskResumeMessage(baseInteraction, {
        ...commonPayload,
        action: 'skip',
      }),
    ).toBe('我跳过了「请选择继续方式」。');
    expect(
      buildMcpAskResumeMessage(baseInteraction, {
        ...commonPayload,
        action: 'timeout',
      }),
    ).toBe('「请选择继续方式」已超时，没有收到表单答案。');
  });

  it('uses English templates when locale dict is English', () => {
    activeDict = enUsResumeDict;
    activeLang = 'en-US';
    const message = buildMcpAskResumeMessage(baseInteraction, {
      interventionId: 'ask-1',
      revision: 1,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'submit',
      formData: {
        confirmed: true,
      },
    });

    expect(message).toContain('I answered "请选择继续方式". Form details:');
    expect(message).toContain('confirmed: Yes');
  });

  it('formats normalized file field URLs in submitted resume message', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const message = buildMcpAskResumeMessage(
      {
        ...baseInteraction,
        input: {
          ...baseInteraction.input,
          title: '提交问题截图',
          ui: {
            ...baseInteraction.input.ui,
            title: '提交问题截图',
            fields: [
              { name: 'screenshot', title: '截图', widget: 'file' },
              {
                name: 'attachments',
                title: '相关附件',
                widget: 'file',
                multiple: true,
              },
            ],
          },
        },
      },
      {
        interventionId: 'ask-1',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: {
          screenshot: 'https://cdn.example.com/shot.png',
          attachments: [
            'https://cdn.example.com/a.pdf',
            'https://cdn.example.com/b.pdf',
          ],
        },
      },
    );

    expect(message).toContain('截图：https://cdn.example.com/shot.png');
    expect(message).toContain(
      '相关附件：https://cdn.example.com/a.pdf、https://cdn.example.com/b.pdf',
    );
  });

  it('prefers remote URL over file name for legacy UploadFileInfo objects', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const message = buildMcpAskResumeMessage(
      {
        ...baseInteraction,
        input: {
          ...baseInteraction.input,
          ui: {
            ...baseInteraction.input.ui,
            fields: [{ name: 'screenshot', title: '截图', widget: 'file' }],
          },
        },
      },
      {
        interventionId: 'ask-1',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: {
          screenshot: [
            {
              name: 'shot.png',
              url: 'https://cdn.example.com/shot.png',
            },
          ],
        },
      },
    );

    expect(message).toContain('截图：https://cdn.example.com/shot.png');
  });
});

describe('isMcpAskResumeMessageForInteraction', () => {
  it('matches resume messages across supported locales and legacy Chinese text', () => {
    activeDict = enUsResumeDict;
    activeLang = 'en-US';
    const title = '请选择继续方式';

    expect(
      isMcpAskResumeMessageForInteraction(
        '我已填写「请选择继续方式」，表单内容如下：\n选项：先跑测试',
        baseInteraction,
      ),
    ).toBe(true);

    expect(
      isMcpAskResumeMessageForInteraction(
        `I answered "${title}". Form details:\nchoice: test`,
        baseInteraction,
      ),
    ).toBe(true);

    expect(
      isMcpAskResumeMessageForInteraction(
        '我取消了「请选择继续方式」。',
        baseInteraction,
      ),
    ).toBe(true);

    expect(
      isMcpAskResumeMessageForInteraction(
        'unrelated user message',
        baseInteraction,
      ),
    ).toBe(false);
  });
});
