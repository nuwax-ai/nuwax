import { dict } from '@/services/i18nRuntime';
import { ModalForm, ModalFormProps } from '@ant-design/pro-components';
import React from 'react';

/**
 * XModalForm - 预配置 ModalForm
 *
 * 默认 Input 回车等同点击底部「确认」（isKeyPressSubmit）。
 * 含 TextArea 的表单可传 isKeyPressSubmit={false}，避免回车误提交。
 */
function XModalForm<T = Record<string, any>>({
  children,
  requiredMark,
  submitter,
  isKeyPressSubmit,
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
      isKeyPressSubmit={isKeyPressSubmit ?? true}
      requiredMark={requiredMark ?? defaultRequiredMark}
      submitter={
        submitter === false
          ? false
          : {
              searchConfig: {
                submitText: dict('PC.Common.Global.confirm'),
                resetText: dict('PC.Common.Global.cancel'),
              },
              ...submitter,
            }
      }
      {...restProps}
    >
      {children}
    </ModalForm>
  );
}

export default XModalForm;
