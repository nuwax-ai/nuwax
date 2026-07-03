import { describe, expect, it } from 'vitest';
import {
  isWorkflowFormImeComposing,
  resetWorkflowFormImeGuard,
  runOrDeferWorkflowFormGraphSync,
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
});
