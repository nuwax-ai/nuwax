import { hasRequiredConversationVariables } from '@/utils/conversationVariables';
import { Form, FormInstance } from 'antd';
import { useEffect, useRef, useState } from 'react';

interface UseChatVariablesProps {
  conversationId: number;
  savedVariableParams?: Record<string, string | number> | null;
  requiredNameList: string[];
  form: FormInstance;
}

export const useChatVariables = ({
  conversationId,
  savedVariableParams,
  requiredNameList,
  form,
}: UseChatVariablesProps) => {
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);

  // 是否发送过消息,如果是,则禁用变量参数
  const isSendMessageRef = useRef<boolean>(false);

  // 接口有时返回空对象 {}，不能当成用户已经填写过变量
  const hasUserFillVariables =
    !!savedVariableParams &&
    Object.keys(savedVariableParams).length > 0 &&
    hasRequiredConversationVariables(requiredNameList, savedVariableParams);

  useEffect(() => {
    setVariableParams(null);
    isSendMessageRef.current = false;
  }, [conversationId]);

  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    // 监听form表单值变化
    if (hasUserFillVariables || !values || Object.keys(values).length === 0)
      return;
    let current = true;
    form
      .validateFields({ validateOnly: true })
      .then((validatedValues) => {
        if (current) setVariableParams(validatedValues);
      })
      .catch(() => {
        if (current) setVariableParams(null);
      });
    return () => {
      current = false;
    };
  }, [conversationId, form, hasUserFillVariables, values]);

  const currentVariableParams = hasUserFillVariables
    ? savedVariableParams
    : variableParams;

  return {
    variableParams: currentVariableParams,
    setVariableParams,
    isSendMessageRef,
    isChatInputDisabled: !hasRequiredConversationVariables(
      requiredNameList,
      currentVariableParams,
    ),
    hasUserFillVariables,
  };
};
