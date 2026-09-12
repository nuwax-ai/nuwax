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

/**
 * 数据源：系统广场 / 团队空间 / 已连接的（连接器页专属，当前用户已连接的连接器）/
 * 我启用的（技能页专属，当前用户启用的技能）
 */
export type ResourceSourceEnum = 'system' | 'team' | 'connected' | 'enabled';

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
   * 连接器主键 id（连接器特有：切换连接启用状态接口以连接器 id 寻址，
   * POST /api/connector/connections/{连接器id}/status）
   */
  connectorId?: number;
  /**
   * 所属空间 ID（连接器特有：团队空间维度列表响应每条自带——含"全部"
   * 页签聚合口径，免鉴权直连建连时透传；系统广场响应无该字段）
   */
  spaceId?: number;
  /**
   * 连接启用状态（连接器特有：已连接卡片右上角常驻开关的选中态；
   * 已开启 connectionEnabled: true 展示打开的开关，切换成功后就地更新）
   */
  connectionEnabled?: boolean;
  /**
   * 技能启用状态（技能特有：卡片右上角常驻启用开关的选中态；
   * 开启 POST /api/published/skill/enable/{skillId}、关闭
   * POST /api/published/skill/unEnable/{skillId}，成功后就地更新；
   * 未付费开启时与「立即使用」同口径——先弹订阅套餐弹窗，开关回弹）
   */
  skillEnabled?: boolean;
  /**
   * 当前用户是否已收藏（专家特有：hover 右下角收藏图标按钮的选中态，
   * 数据源取列表接口返回的 collect；收藏/取消收藏成功后就地更新）
   */
  collected?: boolean;
  /**
   * 是否需要付费（专家/技能卡片：列表接口返回 paymentRequired；订阅功能
   * 开启时专家卡片右下角展示「付费/已订阅」角标——未订阅点「召唤」或角标
   * 先弹统一专家卡（与添加能力弹窗「聘请」同口径）；技能卡片左上角悬挂
   * 「付费」Ribbon，未订阅点「选择」弹订阅套餐弹窗）
   */
  paymentRequired?: boolean;
  /**
   * 是否已订阅（专家/技能卡片：专家付费角标展示「已订阅」召唤不再拦截；
   * 技能「选择」不再拦截）
   */
  subscribed?: boolean;
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
