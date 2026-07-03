/**
 * 工作流属性面板 IME 守卫（模块级 ref）
 *
 * WorkflowLayout / 旧版 Antv-X6 在 Form 根节点挂载 composition 监听；
 * 组合输入期间延迟画布同步，compositionend 后 flush。
 */

const workflowFormImeComposingRef = { current: false };
let pendingWorkflowFormSync: (() => void) | null = null;

/** 是否处于工作流属性面板的中文组合输入中 */
export function isWorkflowFormImeComposing(): boolean {
  return workflowFormImeComposingRef.current;
}

/** 工作流 Form 根节点 composition 监听（capture） */
export const workflowFormImeCompositionProps = {
  onCompositionStartCapture: () => {
    workflowFormImeComposingRef.current = true;
  },
  onCompositionEndCapture: () => {
    workflowFormImeComposingRef.current = false;
    const pending = pendingWorkflowFormSync;
    pendingWorkflowFormSync = null;
    pending?.();
  },
};

/** 关闭/切换节点面板时重置，避免影响后续输入 */
export function resetWorkflowFormImeGuard(): void {
  workflowFormImeComposingRef.current = false;
  pendingWorkflowFormSync = null;
}

/**
 * IME 组合期间延迟执行画布同步；属性面板 onValuesChange 应经此函数调用
 */
export function runOrDeferWorkflowFormGraphSync(fn: () => void): void {
  if (workflowFormImeComposingRef.current) {
    pendingWorkflowFormSync = fn;
    return;
  }
  fn();
}
