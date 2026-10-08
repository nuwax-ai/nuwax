import { isWorkCommercialRoute } from '@/utils/commercialEdition';
import { useLocation, useModel } from 'umi';
import useCommercialEdition from './useCommercialEdition';

export default function useWorkCommercialRoute() {
  const { pathname } = useLocation();
  const { menuTree } = useModel('menuModel');
  const { workCommercialEdition, pending } = useCommercialEdition();
  const controlled = isWorkCommercialRoute(pathname, menuTree || []);
  return { blocked: controlled && !workCommercialEdition, pending };
}
