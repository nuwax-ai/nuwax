import { SquareTemplateTargetTypeEnum } from '@/types/enums/square';

// 广场-模板分类列表
export const SQUARE_TEMPLATE_SEGMENTED_LIST = [
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
