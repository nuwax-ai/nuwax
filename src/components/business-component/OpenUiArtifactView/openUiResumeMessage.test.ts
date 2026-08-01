import type { OpenUiAction, OpenUiFile } from '@/types/interfaces/openUi';
import { describe, expect, it, vi } from 'vitest';
import { buildOpenUiResumeMessage } from './openUiResumeMessage';

vi.mock('@/services/i18nRuntime', () => ({
  dict: (_key: string, title: string) => `Submitted ${title}`,
}));

const artifact: OpenUiFile = {
  type: 'nuwax.openui-file',
  schemaVersion: 'nuwax.openui-file/v1',
  artifactId: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Order form',
  presentation: { mode: 'inline', autoOpen: false },
  document: {
    language: 'openui-lang',
    specVersion: '0.5',
    source: 'root = Stack([])',
    digest: `sha256:${'a'.repeat(64)}`,
  },
  bindings: { tools: [] },
  fallback: { markdown: '' },
  createdAt: '2026-07-22T00:00:00.000Z',
  updatedAt: '2026-07-22T00:00:00.000Z',
};

describe('buildOpenUiResumeMessage', () => {
  it('builds ask-question-style readable field lines without a JSON block', () => {
    const action: OpenUiAction = {
      type: 'nuwax.openui-action',
      schemaVersion: 'nuwax.openui-action/v1',
      actionId: 'action-1',
      artifactId: artifact.artifactId,
      artifactPath: `data/${artifact.artifactId}.openui.json`,
      actionName: 'Submit',
      values: {
        orderForm: {
          date: { value: new Date('2026-07-22T00:00:00Z') },
          role: { value: 'designer' },
        },
      },
      formName: 'orderForm',
      submittedAt: '2026-07-22T00:00:00.000Z',
    };
    const message = buildOpenUiResumeMessage(artifact, action);
    expect(message).toContain(
      'Submitted Order form\ndate：2026-07-22T00:00:00.000Z\nrole：designer',
    );
    expect(message).not.toContain('```json');
    expect(message).not.toContain('"schemaVersion"');
    // actionId 不再拼入用户消息正文（避免泄露到发送给 LLM 的提示词）。
    expect(message).not.toContain('<!--nuwax-openui-action-id');
  });

  it('uses the OpenUI action message as the visible user prompt', () => {
    const message = buildOpenUiResumeMessage(artifact, {
      type: 'nuwax.openui-action',
      schemaVersion: 'nuwax.openui-action/v1',
      actionId: 'action-2',
      artifactId: artifact.artifactId,
      artifactPath: `data/${artifact.artifactId}.openui.json`,
      actionName: 'ToAssistant',
      humanFriendlyMessage: '用户提交了 inline 表单',
      values: { name: '张三' },
      submittedAt: '2026-07-23T00:00:00.000Z',
    });

    expect(message.startsWith('我提交了 inline 表单\n')).toBe(true);
    expect(message).not.toContain('用户提交了');
    expect(message).toContain('name：张三');
    expect(message).not.toContain('```json');
  });
});
