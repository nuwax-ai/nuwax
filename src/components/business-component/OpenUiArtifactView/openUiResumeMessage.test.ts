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
  it('builds the same readable + structured + idempotency shape as ask-question', () => {
    const action: OpenUiAction = {
      type: 'nuwax.openui-action',
      schemaVersion: 'nuwax.openui-action/v1',
      actionId: 'action-1',
      artifactId: artifact.artifactId,
      artifactPath: `data/${artifact.artifactId}.openui.json`,
      actionName: 'Submit',
      values: { date: new Date('2026-07-22T00:00:00Z') },
      submittedAt: '2026-07-22T00:00:00.000Z',
    };
    const message = buildOpenUiResumeMessage(artifact, action);
    expect(message).toContain('Submitted Order form');
    expect(message).toContain('2026-07-22T00:00:00.000Z');
    expect(message).toContain('<!--nuwax-openui-action-id:action-1-->');
  });
});
