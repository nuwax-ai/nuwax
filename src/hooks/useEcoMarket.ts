import { apiEcoMarketClientConfigDelete } from '@/services/ecosystem';
import { modalConfirm } from '@/utils/ant-custom';
import { message } from 'antd';

const useEcoMarket = () => {
  // 我的分享 ~ 删除操作
  const onDeleteShare = (uid: string, name: string, onSuccess: () => void) => {
    modalConfirm('您确定要删除此分享吗?', name || '', async () => {
      await apiEcoMarketClientConfigDelete(uid);
      message.success('删除成功');
      onSuccess();
      return new Promise((resolve) => {
        setTimeout(resolve, 300);
      });
    });
  };

  return {
    onDeleteShare,
  };
};

export default useEcoMarket;
