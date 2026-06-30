import type { FormProps } from 'antd';
import { Form } from 'antd';
import { useCallback } from 'react';
import { useFormModalSubmit } from './submitGuard';

/**
 * GuardedFormModal 内专用 Form：自动绑定 onFinishFailed 释放提交锁
 */
function GuardedFormModalForm<Values = unknown>({
  onFinishFailed,
  ...rest
}: FormProps<Values>) {
  const modalSubmit = useFormModalSubmit();

  const handleFinishFailed = useCallback(
    (
      errorInfo: Parameters<
        NonNullable<FormProps<Values>['onFinishFailed']>
      >[0],
    ) => {
      modalSubmit?.onFinishFailed();
      onFinishFailed?.(errorInfo);
    },
    [modalSubmit, onFinishFailed],
  );

  return <Form<Values> {...rest} onFinishFailed={handleFinishFailed} />;
}

export default GuardedFormModalForm;
