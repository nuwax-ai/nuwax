import { SquareTemplateTargetTypeEnum } from '@/types/enums/square';

// 广场-模板分类列表
const SQUARE_TEMPLATE_SEGMENTED_LIST_ALL = [
  {
    value: SquareTemplateTargetTypeEnum.All,
    label: '全部',
  },
  {
    value: SquareTemplateTargetTypeEnum.Agent,
    label: '智能体',
  },
  {
    value: SquareTemplateTargetTypeEnum.Workflow,
    label: '工作流',
  },
  {
    value: SquareTemplateTargetTypeEnum.Page,
    label: '应用页面',
  },
  {
    value: SquareTemplateTargetTypeEnum.Skill,
    label: '技能',
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
