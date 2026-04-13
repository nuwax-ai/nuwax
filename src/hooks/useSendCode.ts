import useRequestPromiseBridge from '@/hooks/useRequestPromiseBridge';
import { apiSendCode } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import { message } from 'antd';

const useSendCode = () => {
  // 发送验证码
  const { runWithPromise: runSendCode, loading: sendLoading } =
    useRequestPromiseBridge(apiSendCode, {
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
