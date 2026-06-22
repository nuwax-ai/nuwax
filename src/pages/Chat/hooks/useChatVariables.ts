import { arraysContainSameItems } from '@/utils/common';
import { Form, FormInstance } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

interface UseChatVariablesProps {
  firstVariableParams: Record<string, string | number> | null;
  requiredNameList: string[];
  form: FormInstance;
}

export const useChatVariables = ({
  firstVariableParams,
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

  // 用户在智能体主页填写的变量信息
  useEffect(() => {
    if (!!firstVariableParams) {
      setVariableParams(firstVariableParams);
    }
  }, [firstVariableParams]);

  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    // 监听form表单值变化
    if (values && Object.keys(values).length === 0) {
      return;
    }
    form
      .validateFields({ validateOnly: true })
      .then(() => setVariableParams(values))
      .catch(() => setVariableParams(null));
  }, [form, values]);

  // 聊天会话框是否禁用，不能发送消息
  const isChatInputDisabled = useMemo(() => {
    // 强制传参逻辑: 校验当前是否要求必填参数
    if (requiredNameList?.length > 0) {
      // 至少还有一个必填参数未填充
      if (!variableParams) {
        return true;
      }
      return !arraysContainSameItems(
        Object.keys(variableParams),
        requiredNameList,
      );
    }
    return false;
  }, [requiredNameList, variableParams]);

  return {
    variableParams,
    setVariableParams,
    isSendMessageRef,
    isChatInputDisabled,
  };
};
