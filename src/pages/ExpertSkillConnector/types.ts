/**
 * 专家·技能·连接器框架页类型定义
 * @description 各资源类型（专家/技能/连接器）与数据源（系统广场/团队空间）
 * 的列表接口形态不同，本页面通过适配层统一归一化为下列结构
 */

import type {
  AgentConfigInfo,
  AgentStatisticsInfo,
} from '@/types/interfaces/agent';
import type { SkillInfo } from '@/types/interfaces/library';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';

/** 资源类型：专家&专家团 / 技能 / 连接器 */
export type ResourceTypeEnum = 'expert' | 'skill' | 'connector';

/** 数据源：系统广场 / 团队空间 */
export type ResourceSourceEnum = 'system' | 'team';

/** 卡片统计项图标类型 */
export type ResourceStatType = 'user' | 'link' | 'star' | 'tool';

/** 卡片统计项 */
export interface ResourceStat {
  type: ResourceStatType;
  value: number | string;
}

/** 归一化后的资源卡片数据（纯展示） */
export interface ResourceItem {
  /** 唯一标识（资源类型 + 原始 ID，避免跨类型撞 key） */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 图标（URL 或 SvgIcon 名称，为空时卡片渲染首字回退头像） */
  icon?: string;
  /** 分类（用于团队空间接口的客户端筛选，可能为空） */
  category?: string;
  /** 标签 */
  tags?: string[];
  /** 底部统计项 */
  stats?: ResourceStat[];
}

/** 二级分类 tab */
export interface ResourceCategoryInfo {
  /** 分类标识，空串表示"全部" */
  key: string;
  /** 分类名称 */
  label: string;
}

/** 左侧分类菜单项 */
export interface CategoryMenuItem {
  /** 菜单 code（与资源类型对应） */
  code: ResourceTypeEnum;
  /** 菜单名称 */
  label: string;
  /** 跳转路径 */
  path: string;
  /** 图标 */
  icon: string;
}

/** 归一化映射函数的原始数据类型映射 */
export interface ResourceRawTypeMap {
  /** 系统广场-专家（已发布智能体） */
  publishedAgent: SquarePublishedItemInfo;
  /** 团队空间-专家（空间内智能体配置） */
  spaceAgent: AgentConfigInfo;
  /** 系统广场-技能（已发布技能） */
  publishedSkill: SquarePublishedItemInfo;
  /** 团队空间-技能（空间内技能） */
  spaceSkill: SkillInfo;
  /** 连接器提供方（系统广场与团队空间结构一致） */
  connectorProvider: ConnectorProviderInfo;
}

/** 广场已发布条目的统计信息映射为卡片统计项 */
export const mapPublishedStats = (
  statistics?: AgentStatisticsInfo,
): ResourceStat[] => {
  if (!statistics) {
    return [];
  }
  return [
    // 用户人数
    { type: 'user', value: statistics.userCount ?? 0 },
    // 会话次数
    { type: 'link', value: statistics.convCount ?? 0 },
    // 收藏次数
    { type: 'star', value: statistics.collectCount ?? 0 },
  ];
};
