import SubmitButton from '@/components/SubmitButton';
import { dict } from '@/services/i18nRuntime';
import { Button, Modal } from 'antd';
import React, { PropsWithChildren } from 'react';
import { FormModalSubmitContext, useGuardedFormSubmit } from './submitGuard';
import type { GuardedFormModalProps } from './types';

/**
 * 带提交防重的表单弹窗（新建场景专用，不影响 CustomFormModal）
 * - ref 锁 + loading 联动，防止 async onFinish 期间重复点击
 * - 子树内可通过 useFormModalSubmit 获取 abortSubmit
 */
const GuardedFormModal: React.FC<PropsWithChildren<GuardedFormModalProps>> = ({
  form,
  classNames,
  title,
  open,
  loading,
  okPrefixIcon,
  okText,
  centered = false,
  width,
  zIndex,
  onCancel,
  onConfirm,
  okDisabled,
  footerExtra,
  children,
}) => {
  const { submitForm, isSubmitting, abortSubmit, onFinishFailed } =
    useGuardedFormSubmit({
      form,
      loading,
      resetWhen: open,
      onSubmit: onConfirm,
    });

  return (
    <FormModalSubmitContext.Provider
      value={{ submitForm, isSubmitting, abortSubmit, onFinishFailed }}
    >
      <Modal
        title={title}
        open={open}
        centered={centered}
        classNames={classNames}
        width={width}
        zIndex={zIndex}
        destroyOnHidden
        footer={
          <>
            {footerExtra}
            <Button type="default" onClick={onCancel} disabled={isSubmitting}>
              {dict('PC.Components.CustomFormModal.cancel')}
            </Button>
            <SubmitButton
              okPrefixIcon={okPrefixIcon}
              loading={isSubmitting}
              onConfirm={submitForm}
              form={form}
              okText={okText}
              disabled={okDisabled}
            />
          </>
        }
        onCancel={isSubmitting ? undefined : onCancel}
      >
        {children}
      </Modal>
    </FormModalSubmitContext.Provider>
  );
};

export default GuardedFormModal;
export { default as GuardedFormModalForm } from './FormModalForm';
export {
  FormModalSubmitContext,
  useFormModalSubmit,
  useGuardedSubmit,
} from './submitGuard';
export type { FormModalSubmitContextValue } from './submitGuard';
export type { GuardedFormModalProps } from './types';
