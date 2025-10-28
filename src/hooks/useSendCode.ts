import { apiSendCode } from '@/services/account';
import { message } from 'antd';
import { useRequest } from 'umi';

const useSendCode = () => {
  // 发送验证码
  const { run: runSendCode, loading: sendLoading } = useRequest(apiSendCode, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('验证码已发送');
    },
  });

  return {
    runSendCode,
    sendLoading,
  };
};

export default useSendCode;
