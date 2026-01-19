import { ComponentTypeEnum } from '@/types/enums/space';
import { CustomPopoverItem } from '@/types/interfaces/common';

export enum SkillMoreActionEnum {
  // 复制到空间
  Copy_To_Space = 'Copy_To_Space',
  // 导出项目
  Export_Project = 'Export_Project',
  // 删除
  Delete = 'Delete',
}

/**
 * 技能库更多操作
 * 技能：复制到空间、导出项目、删除
 */
export const SKILL_MORE_ACTION: CustomPopoverItem[] = [
  {
    action: SkillMoreActionEnum.Copy_To_Space,
    label: '复制到空间',
    type: ComponentTypeEnum.Skill,
  },
  {
    action: SkillMoreActionEnum.Export_Project,
    label: '导出项目',
    type: ComponentTypeEnum.Skill,
  },
  {
    action: SkillMoreActionEnum.Delete,
    label: '删除',
    isDel: true,
    type: ComponentTypeEnum.Skill,
  },
];
