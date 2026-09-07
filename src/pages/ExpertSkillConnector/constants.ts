/**
 * 专家·技能·连接器框架页常量
 */

import { dict } from '@/services/i18nRuntime';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { CategoryMenuItem, ResourceTypeEnum } from './types';

/** 框架页路由前缀 */
export const ESC_BASE_PATH = '/expert-skill-connector';

/** "更多"聚合列表页路由前缀 */
export const ESC_LIST_PATH = `${ESC_BASE_PATH}/list`;

/** 左侧菜单在菜单权限树中的父级菜单 code（后端配置该菜单后，左侧菜单自动切换为接口数据） */
export const ESC_MENU_PARENT_CODE = 'expert_skill_connector';

/** 全部资源类型 */
export const RESOURCE_TYPES: ResourceTypeEnum[] = [
  'expert',
  'skill',
  'connector',
];

/**
 * 资源类型 -> 已发布分类接口中根节点类型映射
 * 用于在系统广场维度按资源类型筛选对应的二级分类根节点
 */
export const RESOURCE_TYPE_TO_CATEGORY_TYPE: Record<
  ResourceTypeEnum,
  SquareAgentTypeEnum
> = {
  expert: SquareAgentTypeEnum.Agent,
  skill: SquareAgentTypeEnum.Skill,
  connector: SquareAgentTypeEnum.Plugin,
};

/** 资源类型对应的子路由路径 */
export const RESOURCE_ROUTE_PATH: Record<ResourceTypeEnum, string> = {
  expert: `${ESC_BASE_PATH}/expert`,
  skill: `${ESC_BASE_PATH}/skill`,
  connector: `${ESC_BASE_PATH}/connector`,
};

/** "更多"聚合列表页路径 */
export const getResourceListPath = (resourceType: ResourceTypeEnum) =>
  `${ESC_LIST_PATH}/${resourceType}`;

/**
 * 左侧分类菜单本地兜底配置
 * 菜单接口未配置 ESC_MENU_PARENT_CODE 子菜单前的默认渲染数据，
 * 与菜单接口返回结构保持同构，后端就绪后自动被接口数据覆盖
 */
export const DEFAULT_CATEGORY_MENUS: CategoryMenuItem[] = [
  {
    code: 'expert',
    label: dict('PC.Pages.ExpertSkillConnector.menuExpert'),
    path: RESOURCE_ROUTE_PATH.expert,
    icon: 'icons-nav-user',
  },
  {
    code: 'skill',
    label: dict('PC.Pages.ExpertSkillConnector.menuSkill'),
    path: RESOURCE_ROUTE_PATH.skill,
    icon: 'icons-nav-skill',
  },
  {
    code: 'connector',
    label: dict('PC.Pages.ExpertSkillConnector.menuConnector'),
    path: RESOURCE_ROUTE_PATH.connector,
    icon: 'icons-common-link',
  },
];

/**
 * 解析框架页路径
 * @param pathname 例如 /expert-skill-connector/expert、/expert-skill-connector/list/skill
 * @returns 资源类型与是否为"更多"聚合列表页
 */
export const parseEscPath = (
  pathname: string,
): { resourceType: ResourceTypeEnum; isList: boolean } => {
  const segments = pathname
    .replace(ESC_BASE_PATH, '')
    .split('/')
    .filter(Boolean);
  const isList = segments[0] === 'list';
  const typeSegment = isList ? segments[1] : segments[0];
  const resourceType = RESOURCE_TYPES.includes(typeSegment as ResourceTypeEnum)
    ? (typeSegment as ResourceTypeEnum)
    : 'expert';
  return { resourceType, isList };
};
