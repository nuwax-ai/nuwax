import {
  clearTaskRecords,
  conversationTaskKey,
} from '@/utils/conversationTaskStorage';
import { act, renderHook } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useTaskFileTreeState } from './useTaskFileTreeState';

it('复用本机状态重建同一任务，隔离其他任务和账号，删除后恢复默认值', () => {
  const taskA = conversationTaskKey(91801, 1, 2, 3);
  const taskB = conversationTaskKey(91802, 1, 2, 3);
  const otherAccount = conversationTaskKey(91801, 2, 2, 3);
  const first = renderHook(() => useTaskFileTreeState(taskA));
  act(() =>
    first.result.current.update(() => ({
      view: 'closed',
      visible: false,
      tab: 'sourceControl',
      source: 'workspace-a',
      directories: ['docs', 'docs/design'],
    })),
  );
  first.unmount();
  const restored = renderHook(({ scope }) => useTaskFileTreeState(scope), {
    initialProps: { scope: taskA },
  });
  expect(restored.result.current.state).toEqual({
    view: 'closed',
    visible: false,
    tab: 'sourceControl',
    source: 'workspace-a',
    directories: ['docs', 'docs/design'],
  });
  restored.rerender({ scope: taskB });
  expect(restored.result.current.state).toEqual({});
  restored.rerender({ scope: otherAccount });
  expect(restored.result.current.state).toEqual({});
  clearTaskRecords(91801);
  restored.rerender({ scope: taskA });
  expect(restored.result.current.state).toEqual({});
});
