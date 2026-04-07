import { apiSendCode } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';
import { useRequest } from 'umi';

const useSendCode = () => {
  // 发送验证码
  const { run: runSendCode, loading: sendLoading } = useRequest(apiSendCode, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(dict('PC.Hooks.UseSendCode.codeSent'));
    },
  });

  return {
    runSendCode,
    sendLoading,
  };
};

export default useSendCode;
