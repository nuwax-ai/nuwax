import { AssistantRoleEnum, MessageModeEnum } from '@/types/enums/agent';
import { MessageStatusEnum } from '@/types/enums/common';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { describe, expect, it, vi } from 'vitest';
import type { McpAskUserToolInput } from '../types/mcpAskIntervention';
import { hydrateMcpAskInteractionsInMessageList } from './mcpAskHydrateMessage';
import { buildMcpAskResumeMessage } from './mcpAskResumeMessage';
import { extractSkillAskQuestion } from './skillAskQuestion';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (key: string, title?: string) =>
    key.endsWith('.resumeSubmitted')
      ? `我已填写「${title}」，表单内容如下：`
      : key,
  t: (key: string) => key,
  getCurrentLang: () => 'zh-CN',
}));

const skillInput: McpAskUserToolInput = {
  toolName: 'nuwax_ask_question',
  schemaVersion: 'nuwax.mcp_ask.v2',
  requestId: 'ask-skill-1',
  revision: 1,
  sessionId: 'session-1',
  title: '发布演练确认',
  ui: {
    version: 'nuwax.interaction.v2',
    presentation: 'inline',
    title: '发布演练确认',
    fields: [
      {
        name: 'environment',
        title: '环境',
        widget: 'radio',
        required: true,
        options: [
          { value: 'test', label: '测试' },
          { value: 'staging', label: '预发' },
        ],
      },
      {
        name: 'channels',
        title: '通知渠道',
        widget: 'checkboxes',
        type: 'array',
        required: true,
        options: [
          { value: 'inbox', label: '站内' },
          { value: 'email', label: '邮件' },
        ],
      },
      { name: 'note', title: '备注', widget: 'textarea', required: true },
    ],
    submitLabel: '提交',
  },
};

const fence = (input: unknown = skillInput, language = 'nuwax-ask-question') =>
  `\n\n\`\`\`${language}\n${JSON.stringify(input)}\n\`\`\`\n`;

const assistant = (overrides: Partial<MessageInfo> = {}): MessageInfo =>
  ({
    id: 'assistant-1',
    index: 1,
    role: AssistantRoleEnum.ASSISTANT,
    type: MessageModeEnum.ANSWER,
    status: MessageStatusEnum.Complete,
    text: `请确认发布演练。${fence()}`,
    ...overrides,
  } as MessageInfo);

describe('skill ask-question 的宿主协议适配', () => {
  it('将终态声明挂入原生交互，正文与 finalResult 不重复显示协议或创建两个 Dock', () => {
    const source = assistant();
    source.finalResult = {
      success: true,
      outputText: source.text,
    } as MessageInfo['finalResult'];
    const [rendered] = hydrateMcpAskInteractionsInMessageList([source]);
    expect(rendered.mcpAskInteractions).toHaveLength(1);
    expect(rendered.mcpAskInteractions?.[0]).toMatchObject({
      input: skillInput,
      responseStatus: 'pending',
      toolCallId: 'skill-ask:ask-skill-1:1',
    });
    expect(rendered.text).toBe('请确认发布演练。\n\n');
    expect(rendered.finalResult?.outputText).toBe(rendered.text);
    expect(source.text).toContain('nuwax-ask-question');
    expect(
      hydrateMcpAskInteractionsInMessageList([rendered])[0].mcpAskInteractions,
    ).toHaveLength(1);
  });

  it('普通 JSON、嵌套文档示例和未闭合围栏均不挂载', () => {
    for (const text of [
      fence(skillInput, 'json'),
      `\`\`\`\`markdown\n${fence()}\`\`\`\``,
      fence().slice(0, -4),
    ]) {
      expect(extractSkillAskQuestion(text)).toEqual({ text, inputs: [] });
    }
  });

  it('用户、系统、工具、思考、流式和失败内容不会变成可提交表单', () => {
    const variants: Partial<MessageInfo>[] = [
      { role: AssistantRoleEnum.USER },
      { role: AssistantRoleEnum.SYSTEM },
      { role: AssistantRoleEnum.FUNCTION },
      { type: MessageModeEnum.QUESTION },
      { status: MessageStatusEnum.Loading },
      { status: MessageStatusEnum.Error },
      { status: MessageStatusEnum.Stopped },
      {
        finalResult: {
          success: false,
          outputText: fence(),
        } as MessageInfo['finalResult'],
      },
    ];
    variants.forEach((variant) => {
      const source = assistant(variant);
      const [rendered] = hydrateMcpAskInteractionsInMessageList([source]);
      expect(rendered.mcpAskInteractions).toBeUndefined();
      expect(rendered.text).toBe(source.text);
    });
  });

  it('拒绝版本缺失、空字段、坏选项、重复字段与无效 wizard 引用，保留原文供排查', () => {
    const invalid: unknown[] = [
      { ...skillInput, toolName: 'nuwax_render_openui' },
      { ...skillInput, schemaVersion: undefined },
      { ...skillInput, revision: 0 },
      { ...skillInput, ui: { ...skillInput.ui, fields: [] } },
      { ...skillInput, ui: { ...skillInput.ui, fields: [null] } },
      {
        ...skillInput,
        ui: {
          ...skillInput.ui,
          fields: [
            {
              name: 'a',
              title: 'A',
              widget: 'radio',
              options: [{ value: 'x' }],
            },
          ],
        },
      },
      {
        ...skillInput,
        ui: {
          ...skillInput.ui,
          fields: [skillInput.ui.fields![0], skillInput.ui.fields![0]],
        },
      },
      {
        ...skillInput,
        ui: {
          ...skillInput.ui,
          presentation: 'wizard',
          steps: [{ id: 's', title: '步骤', fields: ['missing'] }],
        },
      },
    ];
    invalid.forEach((input) => {
      const text = fence(input);
      expect(extractSkillAskQuestion(text)).toEqual({ text, inputs: [] });
    });
  });

  it('有效 wizard 保留定义与字段顺序，由同一 Dock 处理', () => {
    const input = {
      ...skillInput,
      ui: {
        ...skillInput.ui,
        presentation: 'wizard',
        steps: [
          { id: 's1', title: '选项', fields: ['environment', 'channels'] },
          { id: 's2', title: '备注', fields: ['note'] },
        ],
      },
    };
    expect(extractSkillAskQuestion(fence(input)).inputs).toEqual([input]);
    const implicitSteps = {
      ...skillInput,
      ui: { ...skillInput.ui, presentation: 'wizard' },
    };
    expect(extractSkillAskQuestion(fence(implicitSteps)).inputs).toEqual([
      implicitSteps,
    ]);
  });

  it('同 requestId/revision 的 MCP 事件与 skill 正文共存时保留原工具调用和已提交状态', () => {
    const [rendered] = hydrateMcpAskInteractionsInMessageList([
      assistant({
        mcpAskInteractions: [
          {
            input: skillInput,
            toolCallId: 'actual-tool-call',
            responseStatus: 'submitted',
            formData: { environment: 'staging' },
          },
        ],
      }),
    ]);
    expect(rendered.mcpAskInteractions).toHaveLength(1);
    expect(rendered.mcpAskInteractions?.[0]).toMatchObject({
      toolCallId: 'actual-tool-call',
      responseStatus: 'submitted',
      formData: { environment: 'staging' },
    });
  });

  it('通过原生回复文案与消息顺序恢复状态；旧 revision 的提交不会关闭新版本', () => {
    const first = assistant();
    const [hydrated] = hydrateMcpAskInteractionsInMessageList([first]);
    const interaction = hydrated.mcpAskInteractions![0];
    const reply = {
      id: 'user-reply',
      index: 2,
      role: AssistantRoleEnum.USER,
      text: buildMcpAskResumeMessage(interaction, {
        interventionId: skillInput.requestId,
        toolCallId: interaction.toolCallId,
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: {
          environment: 'staging',
          channels: ['inbox', 'email'],
          note: '仅验收',
        },
      }),
    } as MessageInfo;
    const next = assistant({
      id: 'assistant-2',
      index: 3,
      text: fence({ ...skillInput, revision: 2 }),
    });
    const result = hydrateMcpAskInteractionsInMessageList([first, reply, next]);
    expect(result[0].mcpAskInteractions?.[0].responseStatus).toBe('submitted');
    expect(result[2].mcpAskInteractions?.[0].responseStatus).toBe('pending');
    expect(result[2].mcpAskInteractions?.[0].input.revision).toBe(2);
  });
});
