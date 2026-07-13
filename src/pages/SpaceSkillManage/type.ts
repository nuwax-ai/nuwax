import { dict } from '@/services/i18nRuntime';
import { ComponentTypeEnum } from '@/types/enums/space';
import { CustomPopoverItem } from '@/types/interfaces/common';

export enum SkillMoreActionEnum {
  // 复制到空间
  Copy_To_Space = 'Copy_To_Space',
  // 导出项目
  Export_Project = 'Export_Project',
  // 转为对话式开发
  Convert_To_Conversation = 'Convert_To_Conversation',
  // 删除
  Delete = 'Delete',
}

/**
 * 技能库更多操作
 * 技能：复制到空间、导出项目、转为对话式开发、删除
 */
export const SKILL_MORE_ACTION: CustomPopoverItem[] = [
  {
    action: SkillMoreActionEnum.Copy_To_Space,
    label: dict('PC.Pages.SpaceSkillManage.type.copyToSpace'),
    type: ComponentTypeEnum.Skill,
  },
  {
    action: SkillMoreActionEnum.Export_Project,
    label: dict('PC.Pages.SpaceSkillManage.type.exportSkill'),
    type: ComponentTypeEnum.Skill,
  },
  {
    action: SkillMoreActionEnum.Convert_To_Conversation,
    label: dict('PC.Pages.SpaceSkillManage.type.convertToConversation'),
    type: ComponentTypeEnum.Skill,
  },
  {
    action: SkillMoreActionEnum.Delete,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
    type: ComponentTypeEnum.Skill,
  },
];
