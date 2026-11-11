import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { conversationPageCacheManager } from '../runtime/conversationPageCacheManager';
import { useConversationFilePreviewState } from './useConversationFilePreviewState';

afterEach(() => {
  cleanup();
  conversationPageCacheManager.invalidateAll('test-cleanup');
});

it('文件树默认收起，手动展开与收起均跨卸载恢复，阅读状态按会话隔离', () => {
  const first = renderHook(() => useConversationFilePreviewState('chat:383'));
  expect(first.result.current.treeVisible).toBe(false);
  act(() => {
    first.result.current.onTreeVisibleChange(true);
    first.result.current.onSelectedFileChange('workspace:docs/readme.md');
    first.result.current.onReadingPositionChange(
      'workspace:docs/readme.md',
      'preview',
      { 'root:0': { top: 480, left: 0 } },
    );
  });
  first.unmount();
  const restored = renderHook(() =>
    useConversationFilePreviewState('chat:383'),
  );
  expect(restored.result.current.treeVisible).toBe(true);
  expect(restored.result.current.initial.selectedFileId).toBe(
    'workspace:docs/readme.md',
  );
  expect(
    restored.result.current.getReadingPosition(
      'workspace:docs/readme.md',
      'preview',
    ),
  ).toEqual({ 'root:0': { top: 480, left: 0 } });
  act(() => {
    restored.result.current.onTreeVisibleChange(false);
    restored.result.current.onSelectedFileChange('');
  });
  restored.unmount();
  const collapsed = renderHook(() =>
    useConversationFilePreviewState('chat:383'),
  );
  expect(collapsed.result.current.treeVisible).toBe(false);
  expect(collapsed.result.current.initial.selectedFileId).toBe(
    'workspace:docs/readme.md',
  );
  const other = renderHook(() => useConversationFilePreviewState('chat:384'));
  expect(other.result.current.initial).toEqual({});
});
