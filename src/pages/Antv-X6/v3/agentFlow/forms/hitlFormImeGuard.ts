/**
 * 询问用户节点专用 IME 守卫（模块级 ref）
 *
 * 仅在 HumanInteractionAskForm 挂载并组合输入时置位；
 * WorkflowLayout 在 ref 为 true 时延迟画布同步，不影响其他节点。
 */

const hitlFormImeComposingRef = { current: false };
let pendingHitlFormSync: (() => void) | null = null;

/** 是否处于询问用户表单的中文组合输入中 */
export function isHitlFormImeComposing(): boolean {
  return hitlFormImeComposingRef.current;
}

/** 询问用户属性面板根节点 composition 监听（capture） */
export const hitlFormImeCompositionProps = {
  onCompositionStartCapture: () => {
    hitlFormImeComposingRef.current = true;
  },
  onCompositionEndCapture: () => {
    hitlFormImeComposingRef.current = false;
    const pending = pendingHitlFormSync;
    pendingHitlFormSync = null;
    pending?.();
  },
};

/** 卸载询问用户面板时重置，避免影响后续其他节点 */
export function resetHitlFormImeGuard(): void {
  hitlFormImeComposingRef.current = false;
  pendingHitlFormSync = null;
}

/**
 * IME 组合期间延迟执行；若 WorkflowLayout 在组合中收到 onValuesChange，应调用此函数
 */
export function runOrDeferHitlFormGraphSync(fn: () => void): void {
  if (hitlFormImeComposingRef.current) {
    pendingHitlFormSync = fn;
    return;
  }
  fn();
}
