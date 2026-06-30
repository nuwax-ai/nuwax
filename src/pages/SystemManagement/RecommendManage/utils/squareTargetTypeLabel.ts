import { dict } from '@/services/i18nRuntime';
import { DisplayRecommendTargetTypeEnum } from '../types';

/**
 * 官方推荐目标类型 → 广场分类 title（与 Square 页 setTitle 一致）
 */
const SQUARE_TARGET_TYPE_TITLE_KEY: Record<
  DisplayRecommendTargetTypeEnum,
  string
> = {
  [DisplayRecommendTargetTypeEnum.Agent]: 'PC.Pages.Square.Square.agent',
  [DisplayRecommendTargetTypeEnum.PageApp]: 'PC.Pages.Square.Square.pageApp',
  [DisplayRecommendTargetTypeEnum.Skill]: 'PC.Pages.Square.Square.skill',
  [DisplayRecommendTargetTypeEnum.Plugin]: 'PC.Pages.Square.Square.plugin',
  [DisplayRecommendTargetTypeEnum.Workflow]: 'PC.Pages.Square.Square.workflow',
};

/**
 * 获取与广场页一致的分类标题
 */
export const getSquareTargetTypeTitle = (
  type: DisplayRecommendTargetTypeEnum,
): string => dict(SQUARE_TARGET_TYPE_TITLE_KEY[type]);
