import { getCommercialEdition } from '@/utils/commercialEdition';
import { useModel } from 'umi';

/** 复用租户配置订阅，避免业务组件各自读取缓存和转换授权字段。 */
export default function useCommercialEdition() {
  const { tenantConfigInfo, loadEnd } = useModel('tenantConfigInfo');
  return {
    ...getCommercialEdition(tenantConfigInfo),
    pending: !tenantConfigInfo && loadEnd !== true,
  };
}
