/**
 * 专家·技能·连接器框架页类型定义
 * @description 各资源类型（专家/技能/连接器）与数据源（系统广场/团队空间）
 * 的列表接口形态不同，本页面通过适配层统一归一化为下列结构
 */

import type {
  AgentConfigInfo,
  AgentStatisticsInfo,
  CreatorInfo,
} from '@/types/interfaces/agent';
import type { SkillInfo } from '@/types/interfaces/library';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';

/** 资源类型：专家&专家团 / 技能 / 连接器 */
export type ResourceTypeEnum = 'expert' | 'skill' | 'connector';

/** 数据源：系统广场 / 团队空间 */
export type ResourceSourceEnum = 'system' | 'team';

/** 卡片统计项图标类型 */
export type ResourceStatType = 'user' | 'link' | 'star';

/** 卡片统计项 */
export interface ResourceStat {
  type: ResourceStatType;
  value: number | string;
}

/** 归一化后的资源卡片数据（纯展示） */
export interface ResourceItem {
  /** 唯一标识（资源类型 + 原始 ID，避免跨类型撞 key） */
  id: string;
  /**
   * 专家（团）对应的智能体 ID（召唤跳转用）：
   * 系统广场取发布项 targetId，团队空间取智能体 id；技能/连接器不填
   */
  agentId?: number;
  /**
   * 技能 ID（选择透传跳转用）：
   * 系统广场取发布项 targetId，团队空间取技能 id；专家/连接器不填
   */
  skillId?: number;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 图标（URL，为空时回退默认图） */
  icon?: string;
  /** 分类（用于团队空间接口的客户端筛选；连接器卡片标题下方展示） */
  category?: string;
  /** 发布者信息（系统广场已发布数据携带，卡片标题下方展示头像与昵称） */
  publishUser?: CreatorInfo;
  /** 标签 */
  tags?: string[];
  /** 连接器服务标识（连接器特有：断开连接按 service 匹配用户连接 id） */
  service?: string;
  /** 连接状态（连接器特有：卡片标题下方展示已连接/未连接） */
  connected?: boolean;
  /**
   * 常驻状态（技能特有：pin 按钮 hover 提示常驻/取消常驻）；
   * pin/取消 pin 接口未定，数据源暂缺，默认按未常驻展示
   */
  pinned?: boolean;
  /**
   * 认证方式（连接器特有：no_auth 免鉴权无连接概念，卡片状态恒展示已连接、
   * 不展示 连接/断开 按钮；oauth2/api_key/bearer/custom 按连接状态展示）
   */
  authType?: string;
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
