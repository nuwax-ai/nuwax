import { renderHook } from '@testing-library/react';
import { Form } from 'antd';
import { describe, expect, it } from 'vitest';
import { useChatVariables } from './useChatVariables';

describe('会话变量恢复', () => {
  it('重开会话时允许带选填项的已保存变量继续发送，缺值时保持可编辑', () => {
    const { result, rerender } = renderHook(
      ({ conversationId, savedVariableParams }) => {
        const [form] = Form.useForm();
        return useChatVariables({
          conversationId,
          savedVariableParams,
          requiredNameList: ['age'],
          form,
        });
      },
      {
        initialProps: {
          conversationId: 100,
          savedVariableParams: { age: 0, name: '小明' } as Record<
            string,
            string | number
          >,
        },
      },
    );
    expect(result.current.variableParams).toEqual({ age: 0, name: '小明' });
    expect(result.current.isChatInputDisabled).toBe(false);

    rerender({ conversationId: 101, savedVariableParams: { name: '小明' } });
    expect(result.current.hasUserFillVariables).toBe(false);
    expect(result.current.isChatInputDisabled).toBe(true);
  });
});
