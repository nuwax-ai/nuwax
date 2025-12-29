/**
 * 导航拦截 Hook
 *
 * 功能：
 * 1. 拦截路由跳转，弹出确认弹窗
 * 2. 拦截浏览器刷新/关闭
 * 3. 支持"确认"、"放弃"、"取消"三种操作
 *
 * 使用示例：
 * ```tsx
 * useNavigationGuard({
 *   condition: () => changeFiles.length > 0,
 *   onConfirm: async () => await saveFiles(),
 *   message: '您有未保存的文件修改',
 * });
 * ```
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { history } from 'umi';

export interface UseNavigationGuardOptions {
  /** 判断是否需要拦截的函数 */
  condition: () => boolean;
  /** 确认操作的回调（返回 true 表示成功，可继续导航） */
  onConfirm?: () => Promise<boolean>;
  /** 自定义提示标题 */
  title?: string;
  /** 自定义提示内容 */
  message?: string;
  /** 是否启用拦截，默认为 true */
  enabled?: boolean;
  /** "确认"按钮文案 */
  confirmText?: string;
  /** "放弃"按钮文案 */
  discardText?: string;
  /** "取消"按钮文案 */
  cancelText?: string;
  /** 是否显示取消按钮，默认为 false */
  showCancelButton?: boolean;
}

export interface UseNavigationGuardReturn {
  /** 手动检查并确认离开（用于自定义跳转场景） */
  confirmLeave: (callback: () => void) => void;
}

/**
 * 导航拦截 Hook
 */
export function useNavigationGuard(
  options: UseNavigationGuardOptions,
): UseNavigationGuardReturn {
  const {
    condition,
    onConfirm,
    title = '确认离开',
    message = '您确定要离开当前页面吗？',
    enabled = true,
    confirmText = '确认',
    discardText = '放弃',
    cancelText = '取消',
    showCancelButton = false,
  } = options;

  // 存储各种状态的 refs
  const isShowingModalRef = useRef(false);
  const pendingPathRef = useRef<string | null>(null);
  const unblockRef = useRef<(() => void) | null>(null);
  const conditionRef = useRef(condition);

  // 保持 condition 函数最新
  conditionRef.current = condition;

  /**
   * 执行导航跳转（先 unblock 再 push）
   */
  const doNavigate = useCallback(() => {
    const targetPath = pendingPathRef.current;
    console.log('[useNavigationGuard] doNavigate, targetPath:', targetPath);

    if (targetPath) {
      pendingPathRef.current = null;

      // 先移除 blocker（如果存在）
      if (unblockRef.current) {
        console.log('[useNavigationGuard] 调用 unblock');
        unblockRef.current();
        unblockRef.current = null;
      }

      // 使用 setTimeout 确保在 Modal 完全关闭后再跳转
      setTimeout(() => {
        console.log('[useNavigationGuard] 执行 history.push:', targetPath);
        history.push(targetPath);
      }, 50);
    }
  }, []);

  /**
   * 显示确认弹窗
   */
  const showConfirmModal = useCallback(() => {
    if (isShowingModalRef.current) return;
    isShowingModalRef.current = true;

    console.log(
      '[useNavigationGuard] showConfirmModal, targetPath:',
      pendingPathRef.current,
    );

    const modal = Modal.confirm({
      title,
      icon: <ExclamationCircleFilled />,
      content: message,
      okText: confirmText,
      cancelText,
      maskClosable: false,
      closable: true,
      footer: (_, { OkBtn, CancelBtn }) => (
        <>
          <Button
            onClick={() => {
              console.log('[useNavigationGuard] 放弃');
              modal.destroy();
              isShowingModalRef.current = false;
              // 放弃确认操作，直接离开
              doNavigate();
            }}
          >
            {discardText}
          </Button>
          {showCancelButton && <CancelBtn />}
          {onConfirm && <OkBtn />}
        </>
      ),
      onOk: async () => {
        console.log('[useNavigationGuard] 确认');
        if (onConfirm) {
          const success = await onConfirm();
          console.log('[useNavigationGuard] 确认操作结果:', success);
          isShowingModalRef.current = false;
          if (success) {
            // 确认成功，继续导航
            doNavigate();
          } else {
            // 确认失败，清除待跳转路径
            pendingPathRef.current = null;
          }
        }
      },
      onCancel: () => {
        console.log('[useNavigationGuard] 取消');
        isShowingModalRef.current = false;
        // 取消，清除待跳转路径
        pendingPathRef.current = null;
      },
    });
  }, [
    title,
    message,
    onConfirm,
    confirmText,
    discardText,
    cancelText,
    showCancelButton,
    doNavigate,
  ]);

  /**
   * 手动确认离开（用于自定义跳转场景）
   */
  const confirmLeave = useCallback(
    (callback: () => void) => {
      if (!enabled || !conditionRef.current()) {
        callback();
        return;
      }

      if (isShowingModalRef.current) return;
      isShowingModalRef.current = true;

      Modal.confirm({
        title,
        icon: <ExclamationCircleFilled />,
        content: message,
        okText: confirmText,
        cancelText,
        maskClosable: false,
        closable: true,
        onOk: async () => {
          if (onConfirm) {
            const success = await onConfirm();
            isShowingModalRef.current = false;
            if (success) {
              // 先移除 blocker 再执行回调
              if (unblockRef.current) {
                unblockRef.current();
                unblockRef.current = null;
              }
              callback();
            }
          }
        },
        onCancel: () => {
          isShowingModalRef.current = false;
        },
      });
    },
    [enabled, title, message, onConfirm, confirmText, cancelText],
  );

  // 注册 blocker（始终注册，在回调中检查 when 条件）
  useEffect(() => {
    if (!enabled) return;

    console.log('[useNavigationGuard] 注册 blocker');

    // 注册 blocker
    const unblock = history.block(
      (tx: {
        action: string;
        location: { pathname: string; search?: string };
        retry: () => void;
      }) => {
        const pathname = tx.location?.pathname || '';
        const search = tx.location?.search || '';
        const targetPath = pathname + search;
        const shouldBlock = conditionRef.current();

        console.log('[useNavigationGuard] history.block triggered', {
          pathname,
          targetPath,
          shouldBlock,
          isShowingModal: isShowingModalRef.current,
        });

        // 如果需要拦截，显示确认弹窗
        if (shouldBlock && !isShowingModalRef.current) {
          // 存储目标路径
          pendingPathRef.current = targetPath;

          // 显示确认弹窗
          showConfirmModal();

          // 不调用 retry()，阻止导航
          // 导航将通过 doNavigate() 中的 unblock + history.push 完成
          return;
        }

        // 不需要拦截，先 unblock 再手动导航
        // 这样避免了 retry() 导致的无限循环
        if (unblockRef.current) {
          unblockRef.current();
          unblockRef.current = null;
        }
        history.push(targetPath);
      },
    );

    unblockRef.current = unblock;

    return () => {
      if (unblockRef.current) {
        unblockRef.current();
        unblockRef.current = null;
      }
    };
  }, [enabled, showConfirmModal]);

  // 监听浏览器刷新/关闭
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (conditionRef.current()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);

  return {
    confirmLeave,
  };
}

// 为了向后兼容，保留旧的导出名称
export const useUnsavedChangesGuard = useNavigationGuard;

export default useNavigationGuard;
