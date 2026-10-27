import { apiSendCode } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { SendCode } from '@/types/interfaces/login';
import { useRequest } from 'ahooks';
import { message } from 'antd';

const useSendCode = () => {
  // 发送验证码
  // ahooks 的 runAsync 会透传防抖请求的拒绝，交由页面处理失败与重试。
  const { runAsync: runSendCode, loading: sendLoading } = useRequest(
    async (params: SendCode) => (await apiSendCode(params)).data,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: () => {
        message.success(dict('PC.Hooks.UseSendCode.codeSent'));
      },
    },
  );

  return {
    runSendCode,
    sendLoading,
  };
};

export default useSendCode;
