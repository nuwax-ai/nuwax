import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { McpAskInteraction } from '../types/mcpAskIntervention';
import McpAskQuestionCard from './index';

vi.mock('@/services/i18nRuntime', () => ({
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
});
