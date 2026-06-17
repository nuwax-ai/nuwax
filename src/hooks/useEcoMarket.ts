import { apiEcoMarketClientConfigDelete } from '@/services/ecosystem';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { message } from 'antd';

const useEcoMarket = () => {
  // 我的分享 ~ 删除操作
  const onDeleteShare = (uid: string, name: string, onSuccess: () => void) => {
    modalConfirm(
      dict('PC.Hooks.UseEcoMarket.confirmDelete'),
      name || '',
      async () => {
        await apiEcoMarketClientConfigDelete(uid);
        message.success(dict('PC.Toast.Global.deletedSuccessfully'));
        onSuccess();
        return new Promise((resolve) => {
          setTimeout(resolve, 300);
        });
      },
    );
  };

  return {
    onDeleteShare,
  };
};

export default useEcoMarket;
