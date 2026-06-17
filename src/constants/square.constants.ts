import { dict } from '@/services/i18nRuntime';
import { SquareTemplateTargetTypeEnum } from '@/types/enums/square';

// 广场-模板分类列表
const SQUARE_TEMPLATE_SEGMENTED_LIST_ALL = [
  {
    value: SquareTemplateTargetTypeEnum.ChatBot,
    label: dict('PC.Common.Global.agent'),
  },
  {
    value: SquareTemplateTargetTypeEnum.PageApp,
    label: dict('PC.Constants.Ecosystem.webApp'),
  },
  {
    value: SquareTemplateTargetTypeEnum.Workflow,
    label: dict('PC.Common.Global.workflow'),
  },
  {
    value: SquareTemplateTargetTypeEnum.Skill,
    label: dict('PC.Common.Global.skill'),
  },
];

// 获取广场模板分类列表（根据enabledSandbox过滤）
export const getSquareTemplateSegmentedList = (enabledSandbox?: boolean) => {
  if (enabledSandbox === false) {
    return SQUARE_TEMPLATE_SEGMENTED_LIST_ALL.filter(
      (item) => item.value !== SquareTemplateTargetTypeEnum.Skill,
    );
  }
  return SQUARE_TEMPLATE_SEGMENTED_LIST_ALL;
};

// 兼容旧代码
export const SQUARE_TEMPLATE_SEGMENTED_LIST =
  SQUARE_TEMPLATE_SEGMENTED_LIST_ALL;
