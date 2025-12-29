/**
 * 导航拦截 Hook
 *
 * 用于在用户尝试离开当前页面时进行拦截，弹出确认弹窗。
 * 适用于表单编辑、文件修改等需要保护未保存数据的场景。
 *
 * @see 详细文档: docs/ch/useNavigationGuard.md
 *
 * 功能：
 * - 拦截应用内路由跳转
 * - 拦截浏览器刷新/关闭/前进后退
 * - 支持"确认"、"放弃"、"取消"三种操作
 * - 支持异步确认操作（如保存文件）
 *
 * @example 基础用法
 * ```tsx
 * useNavigationGuard({
 *   condition: () => isDirty,
 *   onConfirm: async () => await save(),
 *   message: '您有未保存的更改',
 * });
 * ```
 *
 * @example 自定义按钮文案
 * ```tsx
 * useNavigationGuard({
 *   condition: () => hasChanges,
 *   onConfirm: handleSave,
 *   confirmText: '保存并离开',
 *   discardText: '不保存离开',
 * });
 * ```
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useCallback, useEffect, useRef } from 'react';
import { history } from 'umi';

export interface UseNavigationGuardOptions {
  /** 判断是否需要拦截的函数，返回 true 时拦截导航 */
  condition: () => boolean;
  /** 确认操作的回调（返回 true 表示成功，可继续导航） */
  onConfirm?: () => Promise<boolean>;
  /** 自定义提示标题 */
  title?: string;
  /** 自定义提示内容 */
  message?: string;
  /** 是否启用拦截，默认为 true */
  enabled?: boolean;
  /** "确认"按钮文案，默认为"确认" */
  confirmText?: string;
  /** "放弃"按钮文案，默认为"放弃" */
  discardText?: string;
  /** "取消"按钮文案，默认为"取消" */
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

    if (targetPath) {
      pendingPathRef.current = null;

      // 先移除 blocker（如果存在）
      if (unblockRef.current) {
        unblockRef.current();
        unblockRef.current = null;
      }

      // 使用 setTimeout 确保在 Modal 完全关闭后再跳转
      setTimeout(() => {
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
        if (onConfirm) {
          const success = await onConfirm();
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

  // 注册 blocker（始终注册，在回调中检查条件）
  useEffect(() => {
    if (!enabled) return;

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
