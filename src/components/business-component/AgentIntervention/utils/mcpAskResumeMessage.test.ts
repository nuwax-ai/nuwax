import { AssistantRoleEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import {
  buildMcpAskResumeMessage,
  buildMcpAskResumeTextDisplay,
  extractMcpAskResumeDocumentAttachments,
  extractMcpAskResumeImageAttachments,
  fileUrlToAttachmentFile,
  getRemoteUrlPathExtension,
  hasMcpAskResumeMessage,
  isExtensionlessRemoteUrl,
  isMcpAskResumeMessageForInteraction,
  isRemoteImageUrl,
  parseMcpAskResumeDisplayContent,
  stripMcpAskResumeDisplayArtifacts,
} from './mcpAskResumeMessage';

import { describe, expect, it, vi } from 'vitest';
import type { McpAskInteraction } from '../types/mcpAskIntervention';

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
    expect(message).not.toContain('nuwax-mcp-ask-request-id');
    expect(message).not.toContain('"choice"');
    expect(message).not.toContain('```json');
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
    expect(message).not.toContain('nuwax-mcp-ask-request-id');
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
    ).toContain('我取消了「请选择继续方式」。');
    expect(
      buildMcpAskResumeMessage(baseInteraction, {
        ...commonPayload,
        action: 'skip',
      }),
    ).toContain('我跳过了「请选择继续方式」。');
    expect(
      buildMcpAskResumeMessage(baseInteraction, {
        ...commonPayload,
        action: 'timeout',
      }),
    ).toContain('「请选择继续方式」已超时，没有收到表单答案。');
    expect(
      buildMcpAskResumeMessage(baseInteraction, {
        ...commonPayload,
        action: 'cancel',
      }),
    ).not.toContain('nuwax-mcp-ask-request-id');
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

describe('stripMcpAskResumeDisplayArtifacts', () => {
  it('removes HTML requestId marker from display text', () => {
    const raw =
      '我已填写「补充回复」，表单内容如下：\n文件上传：https://cdn.example.com/shot.png\n<!--nuwax-mcp-ask-request-id:ask-1-->';
    expect(stripMcpAskResumeDisplayArtifacts(raw)).toBe(
      '我已填写「补充回复」，表单内容如下：\n文件上传：https://cdn.example.com/shot.png',
    );
  });
});

describe('parseMcpAskResumeDisplayContent', () => {
  it('parses single and multiple image fields for structured user display', () => {
    const raw = [
      '我已填写「补充回复」，表单内容如下：',
      '文件上传：https://cdn.example.com/a.png',
      '相关附件：https://cdn.example.com/1.png、https://cdn.example.com/2.png',
      '补充说明：先跑关键链路',
      '<!--nuwax-mcp-ask-request-id:ask-1-->',
    ].join('\n');

    const parsed = parseMcpAskResumeDisplayContent(raw);
    expect(parsed.kind).toBe('resume');
    expect(parsed.preamble).toBe('我已填写「补充回复」，表单内容如下：');
    expect(parsed.fields).toEqual([
      {
        label: '文件上传',
        imageUrls: ['https://cdn.example.com/a.png'],
      },
      {
        label: '相关附件',
        imageUrls: [
          'https://cdn.example.com/1.png',
          'https://cdn.example.com/2.png',
        ],
      },
      {
        label: '补充说明',
        textValue: '先跑关键链路',
      },
    ]);
  });

  it('falls back to plain text for non-resume user messages', () => {
    expect(parseMcpAskResumeDisplayContent('普通用户消息')).toEqual({
      kind: 'plain',
      plainText: '普通用户消息',
    });
  });

  it('detects remote image urls by extension', () => {
    expect(isRemoteImageUrl('https://cdn.example.com/a.PNG')).toBe(true);
    expect(isRemoteImageUrl('https://cdn.example.com/doc.pdf')).toBe(false);
  });

  it('detects extensionless remote urls', () => {
    expect(
      isExtensionlessRemoteUrl(
        'https://testagent.xspaceagi.com/api/f/s3/default/20260703/abc123',
      ),
    ).toBe(true);
    expect(getRemoteUrlPathExtension('https://cdn.example.com/a.png')).toBe(
      'png',
    );
    expect(
      getRemoteUrlPathExtension(
        'https://testagent.xspaceagi.com/api/f/s3/default/20260703/abc123',
      ),
    ).toBe('');
    expect(isExtensionlessRemoteUrl('https://cdn.example.com/a.png')).toBe(
      false,
    );
    expect(isExtensionlessRemoteUrl('not-a-url')).toBe(false);
  });

  it('parses extensionless remote urls into fileUrls for fallback document display', () => {
    const raw = [
      '我已填写「上传附件」，表单内容如下：',
      '无后缀文件：https://testagent.xspaceagi.com/api/f/s3/default/20260703/abc123',
    ].join('\n');

    const parsed = parseMcpAskResumeDisplayContent(raw);
    expect(parsed.kind).toBe('resume');
    expect(parsed.fields).toEqual([
      {
        label: '无后缀文件',
        fileUrls: [
          'https://testagent.xspaceagi.com/api/f/s3/default/20260703/abc123',
        ],
      },
    ]);
  });

  it('maps extensionless remote urls to unknown attachment fallback', () => {
    const url =
      'https://testagent.xspaceagi.com/api/f/s3/default/20260703/abc123';
    expect(fileUrlToAttachmentFile(url)).toEqual({
      fileKey: url,
      fileUrl: url,
      fileName: 'abc123',
      mimeType: 'application/octet-stream',
    });
  });

  it('parses document file urls separately from images and text', () => {
    const raw = [
      '我已填写「补充回复」，表单内容如下：',
      'PDF 文档：https://cdn.example.com/report.pdf',
      '混合附件：https://cdn.example.com/a.png、https://cdn.example.com/b.pdf、备注说明',
      '<!--nuwax-mcp-ask-request-id:ask-1-->',
    ].join('\n');

    const parsed = parseMcpAskResumeDisplayContent(raw);
    expect(parsed.fields).toEqual([
      {
        label: 'PDF 文档',
        fileUrls: ['https://cdn.example.com/report.pdf'],
      },
      {
        label: '混合附件',
        imageUrls: ['https://cdn.example.com/a.png'],
        fileUrls: ['https://cdn.example.com/b.pdf'],
        textValue: '备注说明',
      },
    ]);
  });
});

describe('MCP Ask resume display-only helpers', () => {
  it('does not append internal requestId marker to chat payload', () => {
    activeDict = zhCnResumeDict;
    activeLang = 'zh-CN';
    const sent = buildMcpAskResumeMessage(
      {
        ...baseInteraction,
        input: {
          ...baseInteraction.input,
          ui: {
            ...baseInteraction.input.ui,
            fields: [{ name: 'screenshot', title: '文件上传', widget: 'file' }],
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
          screenshot: 'https://cdn.example.com/a.png',
        },
      },
    );

    expect(sent).toContain('文件上传：https://cdn.example.com/a.png');
    expect(sent).not.toContain('nuwax-mcp-ask-request-id');
  });

  it('buildMcpAskResumeTextDisplay hides image urls in bubble text only', () => {
    const raw = [
      '我已填写「补充回复」，表单内容如下：',
      '文件上传：https://cdn.example.com/a.png',
      '相关附件：https://cdn.example.com/1.png、https://cdn.example.com/2.png',
    ].join('\n');

    expect(buildMcpAskResumeTextDisplay(raw)).toBe(
      ['我已填写「补充回复」，表单内容如下：', '文件上传：', '相关附件：'].join(
        '\n',
      ),
    );
    expect(raw).toContain('https://cdn.example.com/a.png');
  });

  it('buildMcpAskResumeTextDisplay hides document urls in bubble text only', () => {
    const raw = [
      '我已填写「补充回复」，表单内容如下：',
      'PDF 文档：https://cdn.example.com/report.pdf',
    ].join('\n');

    expect(buildMcpAskResumeTextDisplay(raw)).toBe(
      ['我已填写「补充回复」，表单内容如下：', 'PDF 文档：'].join('\n'),
    );
  });

  it('extractMcpAskResumeDocumentAttachments maps file urls to attachment shape', () => {
    const raw = [
      '我已填写「补充回复」，表单内容如下：',
      'PDF 文档：https://cdn.example.com/report.pdf',
      '表格：https://cdn.example.com/data.xlsx',
    ].join('\n');

    const files = extractMcpAskResumeDocumentAttachments(raw);
    expect(files).toHaveLength(2);
    expect(files[0].fileName).toBe('report.pdf');
    expect(files[0].mimeType).toBe('application/pdf');
    expect(files[1].fileName).toBe('data.xlsx');
  });

  it('extractMcpAskResumeImageAttachments is display-only virtual attachments', () => {
    const raw = [
      '我已填写「补充回复」，表单内容如下：',
      '相关附件：https://cdn.example.com/1.png、https://cdn.example.com/2.png',
    ].join('\n');

    const files = extractMcpAskResumeImageAttachments(raw);
    expect(files).toHaveLength(2);
    expect(files[0].fileUrl).toBe('https://cdn.example.com/1.png');
    expect(files[0].mimeType).toBe('image/png');
    expect(files[1].fileUrl).toBe('https://cdn.example.com/2.png');
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

  it('matches resume by ordinal pairing when multiple asks share the same title', () => {
    const sharedTitle = '补充回复';
    const firstInteraction: McpAskInteraction = {
      ...baseInteraction,
      input: {
        ...baseInteraction.input,
        requestId: 'ask-first',
        title: sharedTitle,
        ui: {
          ...baseInteraction.input.ui,
          title: sharedTitle,
        },
      },
    };
    const secondInteraction: McpAskInteraction = {
      ...firstInteraction,
      input: {
        ...firstInteraction.input,
        requestId: 'ask-second',
      },
      toolCallId: 'tc-2',
    };

    const firstResume = buildMcpAskResumeMessage(firstInteraction, {
      interventionId: 'ask-first',
      revision: 1,
      source: 'mcp_ask',
      protocol: 'mcp',
      action: 'submit',
      formData: { choice: 'test' },
    });

    const messageList = [
      {
        id: 'assistant-ask-1',
        index: 0,
        mcpAskInteractions: [firstInteraction],
      } as MessageInfo,
      {
        id: 'user-resume',
        index: 1,
        role: AssistantRoleEnum.USER,
        text: firstResume,
      } as MessageInfo,
      {
        id: 'assistant-ask-2',
        index: 2,
        mcpAskInteractions: [secondInteraction],
      } as MessageInfo,
    ];

    expect(
      isMcpAskResumeMessageForInteraction(firstResume, firstInteraction),
    ).toBe(true);
    expect(
      hasMcpAskResumeMessage(messageList, secondInteraction, {
        containingMessageIndex: 2,
      }),
    ).toBe(false);
    expect(
      hasMcpAskResumeMessage(messageList, firstInteraction, {
        containingMessageIndex: 0,
      }),
    ).toBe(true);
  });

  it('matches legacy resume before ask when message indexes are out of storage order', () => {
    const messageList = [
      {
        id: 'user-resume',
        index: 1,
        text: '我已填写「请选择继续方式」，表单内容如下：\n选项：先跑测试',
      },
      {
        id: 'assistant-ask',
        index: 2,
        mcpAskInteractions: [baseInteraction],
      },
    ] as MessageInfo[];

    expect(
      hasMcpAskResumeMessage(messageList, baseInteraction, {
        containingMessageIndex: 1,
      }),
    ).toBe(true);
  });

  it('still recognizes legacy fenced JSON requestId markers', () => {
    const legacyResume =
      '我已填写「请选择继续方式」，表单内容如下：\n\n```json\n{"nuwaxMcpAskRequestId":"ask-1"}\n```';
    expect(
      isMcpAskResumeMessageForInteraction(legacyResume, baseInteraction),
    ).toBe(true);
  });

  it('does not legacy-match a later ask when an earlier assistant message had the same title', () => {
    const sharedTitle = '补充回复';
    const firstInteraction: McpAskInteraction = {
      ...baseInteraction,
      input: {
        ...baseInteraction.input,
        requestId: 'ask-first',
        title: sharedTitle,
        ui: { ...baseInteraction.input.ui, title: sharedTitle },
      },
    };
    const secondInteraction: McpAskInteraction = {
      ...firstInteraction,
      input: { ...firstInteraction.input, requestId: 'ask-second' },
      toolCallId: 'tc-2',
    };
    const messageList = [
      {
        id: 'assistant-ask-1',
        index: 2,
        mcpAskInteractions: [
          { ...firstInteraction, responseStatus: 'submitted' as const },
        ],
      },
      {
        id: 'user-resume',
        index: 3,
        text: `我已填写「${sharedTitle}」，表单内容如下：\n选项：test`,
      },
      {
        id: 'assistant-ask-2',
        index: 4,
        mcpAskInteractions: [
          { ...secondInteraction, responseStatus: 'pending' as const },
        ],
      },
    ] as MessageInfo[];

    expect(
      hasMcpAskResumeMessage(messageList, secondInteraction, {
        containingMessageIndex: 2,
      }),
    ).toBe(false);
    expect(
      hasMcpAskResumeMessage(messageList, firstInteraction, {
        containingMessageIndex: 0,
      }),
    ).toBe(true);
  });
});
