import { PageInfo } from '../pageDev';
import { CustomPopoverItem } from './common';

// 单个页面开发组件
export interface CardItemProps {
  componentInfo: PageInfo | any;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}
