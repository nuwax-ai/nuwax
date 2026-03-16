import { ModalForm, ModalFormProps } from '@ant-design/pro-components';
import React from 'react';

function XModalForm<T = Record<string, any>>({
  children,
  requiredMark,
  ...restProps
}: ModalFormProps<T>) {
  // 默认 requiredMark 渲染函数，将必填标识放在后方
  const defaultRequiredMark = (
    label: React.ReactNode,
    { required }: { required: boolean },
  ) => (
    <>
      {label}
      {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
    </>
  );

  return (
    <ModalForm<T>
      requiredMark={requiredMark ?? defaultRequiredMark}
      {...restProps}
    >
      {children}
    </ModalForm>
  );
}

export default XModalForm;
