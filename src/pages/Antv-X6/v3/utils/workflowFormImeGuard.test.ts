import { describe, expect, it } from 'vitest';
import {
  isWorkflowFormImeComposing,
  resetWorkflowFormImeGuard,
  runOrDeferWorkflowFormFieldWrite,
  runOrDeferWorkflowFormGraphSync,
  workflowFormImeCompositionProps,
} from './workflowFormImeGuard';

describe('workflowFormImeGuard', () => {
  it('非组合输入时立即执行同步', () => {
    resetWorkflowFormImeGuard();
    const calls: string[] = [];
    runOrDeferWorkflowFormGraphSync(() => calls.push('sync'));
    expect(calls).toEqual(['sync']);
  });

  it('reset 清空 composing 状态', () => {
    resetWorkflowFormImeGuard();
    expect(isWorkflowFormImeComposing()).toBe(false);
  });

  it('IME 组合期间延迟表单写回', () => {
    resetWorkflowFormImeGuard();
    (workflowFormImeCompositionProps.onCompositionStartCapture as () => void)();
    const writes: string[] = [];
    runOrDeferWorkflowFormFieldWrite(() => writes.push('write'));
    expect(writes).toEqual([]);
    (workflowFormImeCompositionProps.onCompositionEndCapture as () => void)();
    expect(writes).toEqual(['write']);
  });
});
