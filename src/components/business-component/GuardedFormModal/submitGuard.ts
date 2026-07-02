import type { FormInstance } from 'antd';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

/** ref 同步锁：弥补 React loading 更新前的重复提交窗口 */
function useSubmitLock() {
  const lockedRef = useRef(false);

  const tryAcquire = useCallback((): boolean => {
    if (lockedRef.current) {
      return false;
    }
    lockedRef.current = true;
    return true;
  }, []);

  const release = useCallback(() => {
    lockedRef.current = false;
  }, []);

  const isLocked = useCallback(() => lockedRef.current, []);

  return { tryAcquire, release, isLocked };
}

/**
 * 提交防重：ref 锁 + pending，loading 结束或 resetWhen 变化时释放
 * 非弹窗场景（如 MCP 页头）可单独使用
 */
export function useGuardedSubmit(loading?: boolean, resetWhen?: unknown) {
  const { tryAcquire, release, isLocked } = useSubmitLock();
  const [pending, setPending] = useState(false);
  const prevLoadingRef = useRef(loading);

  const isSubmitting = Boolean(loading) || pending || isLocked();

  const abortSubmit = useCallback(() => {
    release();
    setPending(false);
  }, [release]);

  const beginSubmit = useCallback(() => {
    if (Boolean(loading) || pending || isLocked()) {
      return false;
    }
    if (!tryAcquire()) {
      return false;
    }
    setPending(true);
    return true;
  }, [loading, pending, isLocked, tryAcquire]);

  useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      abortSubmit();
    }
    prevLoadingRef.current = loading ?? false;
  }, [loading, abortSubmit]);

  useEffect(() => {
    if (resetWhen === false) {
      abortSubmit();
    }
  }, [resetWhen, abortSubmit]);

  return { beginSubmit, abortSubmit, isSubmitting };
}

interface UseGuardedFormSubmitOptions {
  form: FormInstance;
  loading?: boolean;
  resetWhen?: unknown;
  onSubmit?: () => void;
}

/** GuardedFormModal 内部：校验通过后触发 onSubmit */
export function useGuardedFormSubmit({
  form,
  loading,
  resetWhen,
  onSubmit,
}: UseGuardedFormSubmitOptions) {
  const { beginSubmit, abortSubmit, isSubmitting } = useGuardedSubmit(
    loading,
    resetWhen,
  );

  const submitForm = useCallback(async () => {
    if (!beginSubmit()) {
      return;
    }
    try {
      await form.validateFields();
      (onSubmit ?? (() => form.submit()))();
    } catch {
      abortSubmit();
    }
  }, [form, onSubmit, beginSubmit, abortSubmit]);

  const onFinishFailed = useCallback(() => {
    abortSubmit();
  }, [abortSubmit]);

  return { submitForm, isSubmitting, abortSubmit, onFinishFailed };
}

export interface FormModalSubmitContextValue {
  submitForm: () => Promise<void>;
  isSubmitting: boolean;
  abortSubmit: () => void;
  onFinishFailed: () => void;
}

export const FormModalSubmitContext =
  createContext<FormModalSubmitContextValue | null>(null);

/** 在 GuardedFormModal 子树内获取提交能力（onFinish 失败/早退时 abortSubmit） */
export function useFormModalSubmit(): FormModalSubmitContextValue | null {
  return useContext(FormModalSubmitContext);
}
