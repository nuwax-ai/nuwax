import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import McpAskQuestionCard from './index';

vi.mock('@/services/i18nRuntime', () => ({
  // 依赖链（合并 pc-client-bridge 后）另有模块取 dict，兜底返回 key
  dict: (key: string) => key,
  t: (key: string, ...args: string[]) => {
    const dict: Record<string, string> = {
      'PC.Common.Global.confirm': '确认',
      'PC.Common.Global.cancel': '取消',
      'PC.Components.McpAskQuestionCard.cancelShortcutHint': '取消（Esc）',
      'PC.Components.McpAskQuestionCard.eyebrow': '补充回复',
      'PC.Components.McpAskQuestionCard.fieldRequired': '请填写此项',
      'PC.Components.McpAskQuestionCard.multiSelectMin': '请至少选择一项',
      'PC.Components.McpAskQuestionCard.skip': '跳过',
    };
    const template = dict[key] ?? key;
    return args.reduce(
      (text, item, index) => text.replace(`{${index}}`, item),
      template,
    );
  },
}));

vi.mock('./index.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

vi.mock('./McpAskFormField.less', () => ({
  default: new Proxy({}, { get: (_, key) => String(key) }),
}));

const interaction: McpAskInteraction = {
  toolCallId: 'tc-ask-1',
  responseStatus: 'pending',
  input: {
    toolName: 'nuwax_ask_question',
    schemaVersion: 'nuwax.mcp_ask.v2',
    requestId: 'ask-1',
    revision: 1,
    sessionId: 'session-1',
    title: '请选择继续方式',
    description: 'Agent 需要你确认下一步。',
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
      submitLabel: '提交',
      cancelLabel: '取消',
    },
  },
};

describe('McpAskQuestionCard', () => {
  it('keeps an unsubmitted choice when the same ask is refreshed', () => {
    const defaultedInteraction: McpAskInteraction = {
      ...interaction,
      input: {
        ...interaction.input,
        ui: {
          ...interaction.input.ui,
          fields: interaction.input.ui.fields.map((field) =>
            field.name === 'choice'
              ? { ...field, initialValue: 'deploy' }
              : { ...field },
          ),
        },
      },
    };
    const { rerender } = render(
      <McpAskQuestionCard
        interaction={defaultedInteraction}
        keyboardShortcutsEnabled={false}
      />,
    );

    const deploy = screen.getByRole('radio', { name: '鐩存帴閮ㄧ讲' });
    const test = screen.getByRole('radio', { name: '鍏堣窇娴嬭瘯' });
    expect(deploy).toBeChecked();

    fireEvent.click(test);
    expect(test).toBeChecked();

    rerender(
      <McpAskQuestionCard
        interaction={{
          ...defaultedInteraction,
          input: {
            ...defaultedInteraction.input,
            ui: {
              ...defaultedInteraction.input.ui,
              fields: defaultedInteraction.input.ui.fields.map((field) => ({
                ...field,
              })),
            },
          },
        }}
        keyboardShortcutsEnabled={false}
      />,
    );

    expect(test).toBeChecked();
  });

  it('renders MCP Ask fields and submits form data as a normal response payload', async () => {
    const onRespond = vi.fn();
    render(
      <McpAskQuestionCard
        interaction={interaction}
        keyboardShortcutsEnabled={false}
        onRespond={onRespond}
      />,
    );

    expect(screen.getByRole('region', { name: '请选择继续方式' })).toBeTruthy();
    expect(screen.getByText('Agent 需要你确认下一步。')).toBeTruthy();
    expect(screen.getByText('选项')).toBeTruthy();
    expect(screen.getByText('先跑测试')).toBeTruthy();
    expect(screen.getByText('补充说明')).toBeTruthy();
    expect(screen.getByText('检查项')).toBeTruthy();
    expect(screen.getByText('代码检查')).toBeTruthy();

    fireEvent.click(screen.getByText('先跑测试'));
    fireEvent.change(screen.getByPlaceholderText('补充说明'), {
      target: { value: '先跑关键链路' },
    });
    fireEvent.click(screen.getByText('代码检查'));
    fireEvent.click(screen.getByRole('button', { name: '提 交' }));

    await waitFor(() => expect(onRespond).toHaveBeenCalledTimes(1));
    expect(onRespond).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: 'ask-1',
        toolCallId: 'tc-ask-1',
        revision: 1,
        source: 'mcp_ask',
        protocol: 'mcp',
        action: 'submit',
        formData: {
          choice: 'test',
          notes: '先跑关键链路',
          checks: ['lint'],
        },
        answeredBy: { kind: 'web' },
      }),
    );
  });

  it('renders a long subTitle in full inside the expandable Paragraph host', () => {
    // subTitle 由 antd Paragraph ellipsis 托管（超 1 行展开/收起），
    // jsdom 无法测 CSS 溢出，这里锁「全文进 DOM、不再被 nowrap 硬剪丢内容」
    const longSubTitle =
      '第 3 轮画布填充确认：矩形 143 户型封窗报价单会挡在填满后的画布左侧，原文件在 S3 可重新取回，需要先核对报价再继续生成。';
    render(
      <McpAskQuestionCard
        interaction={{
          ...interaction,
          input: { ...interaction.input, subTitle: longSubTitle },
        }}
        keyboardShortcutsEnabled={false}
      />,
    );

    const subTitleNode = document.querySelector('.subTitle');
    expect(subTitleNode).toBeTruthy();
    expect(subTitleNode?.textContent).toContain(
      '矩形 143 户型封窗报价单会挡在填满后的画布左侧',
    );
    expect(subTitleNode?.textContent).toContain('需要先核对报价再继续生成。');
  });
});
