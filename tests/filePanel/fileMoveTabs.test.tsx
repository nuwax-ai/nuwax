import { usePreviewTabs as useAppTabs } from '@/pages/AppDevPro/ConversationAgentFilePreview/hooks/usePreviewTabs';
import { usePreviewTabs as useAgentTabs } from '@/pages/ConversationAgent/ConversationAgentFilePreview/hooks/usePreviewTabs';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/services/i18nRuntime', () => ({ dict: (key: string) => key }));

describe.each([
  ['agent', useAgentTabs],
  ['app', useAppTabs],
] as const)('%s file moves', (_name, useTabs) => {
  it('updates descendant file/diff tabs and active identities while keeping sibling prefixes intact', () => {
    const { result } = renderHook(() => useTabs());
    act(() => {
      result.current.openFileTab('docs/a.md');
      result.current.openFileTab('docs2/keep.md');
      result.current.openFileTab('docs/sub/b.md', true);
    });
    act(() => result.current.renameFileTab('docs', 'archive/docs'));
    expect(
      result.current.tabs
        .filter((tab) => tab.type === 'file')
        .map((tab) => tab.fileId),
    ).toEqual(['archive/docs/a.md', 'docs2/keep.md', 'archive/docs/sub/b.md']);
    expect(result.current.activeTabId).toBe('diff:archive/docs/sub/b.md');
  });
});
