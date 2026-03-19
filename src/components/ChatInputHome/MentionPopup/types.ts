/**
 * MentionPopup 和 MentionEditor 组件类型定义
 */

import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CoverImgSourceTypeEnum } from '@/types/enums/pageDev';
import { PluginTypeEnum } from '@/types/enums/plugin';
import { AgentStatisticsInfo, CreatorInfo } from '@/types/interfaces/agent';

// 已收藏的技能列表接口 - 参数接口
export interface SkillListForAtParams {
  /*目标类型，Agent,Plugin,Workflow,可用值:Agent,Plugin,Workflow,Knowledge,Table,Skill */
  targetType?: string;

  /*子类型,可用值:Multi,Single,WorkflowChat,ChatBot,TaskAgent,Agent,PageApp */
  targetSubType?: string;

  /*页码 */
  page?: number;

  /*每页数量 */
  pageSize?: number;

  /*分类名称 */
  category?: string;

  /*关键字搜索 */
  kw?: string;

  /*空间ID（可选）需要通过空间过滤时有用 */
  spaceId?: number;

  /*只返回空间的组件 */
  justReturnSpaceData?: boolean;

  /*访问控制过滤，0 无需过滤，1 过滤出需要权限管控的内容 */
  accessControl?: number;

  /*是否只返回官方标识的内容 */
  official?: boolean;
}

// @技能信息
export interface SkillInfoForAt {
  // 	发布ID
  id: number;
  tenantId: number;
  // 空间ID
  spaceId: number;
  // 目标对象（智能体、工作流、插件）ID,可用值:Agent,Plugin,Workflow,Knowledge,Table,Skill
  targetType: AgentComponentTypeEnum;
  // 目标对象（智能体、工作流、插件）ID
  targetId: number;
  // 发布名称
  name: string;
  // 技能描述
  description: string;
  // 技能图标
  icon: string;
  // 备注
  remark: string;
  // 智能体发布修改时间
  modified: string;
  // 智能体发布创建时间
  created: string;
  // 统计信息(智能体、插件、工作流相关的统计都在该结构里，根据实际情况取值)
  statistics: AgentStatisticsInfo;
  // 发布者信息
  publishUser: CreatorInfo;
  // 技能分类
  category: string;
  // 是否允许复制, 1 允许
  allowCopy: number;
  // 访问控制, 0 不走权限管控；1 走权限管控
  accessControl: number;
  // 可用值:HTTP,CODE
  pluginType: PluginTypeEnum;
  // 智能体类型
  agentType: string;
  // 封面图
  coverImg: string;
  // 封面图片来源,可用值:SYSTEM,USER
  coverImgSourceType: CoverImgSourceTypeEnum;
  // 收藏状态
  collect: boolean;
}

export interface MentionItem {
  /** 唯一标识符 */
  id: string | number;
  // 技能ID
  targetId: number;
  /** 显示名称 */
  name: string;
  /** 图标（emoji 或图标类名） */
  icon?: string;
  /** 描述文本，用于搜索匹配和提示 */
  description?: string;
}

/**
 * Tab 类型枚举
 * 定义弹窗中可切换的标签页
 */
export type TabType = 'all' | 'recent' | 'favorite';

/**
 * Tab 配置类型
 * 用于配置弹窗顶部的标签页
 */
export interface TabConfig {
  /** Tab 唯一标识 */
  key: TabType;
  /** Tab 显示文本 */
  label: string;
}

/**
 * MentionPopup 组件 Props 类型
 *
 * @description
 * 弹窗选择器组件的属性定义
 * 支持受控和非受控两种模式
 */
export interface MentionPopupProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 弹窗位置（相对于视口） */
  position: {
    /** 向下展开时使用 top 定位 */
    top?: number;
    left: number;
    /** 向上展开时使用 bottom 定位 */
    bottom?: number;
  };
  /** 选择项时的回调 */
  onSelect: (item: MentionItem) => void;
  /** 关闭弹窗时的回调 */
  onClose: () => void;
  /** 搜索文本（受控模式） */
  searchText?: string;
  /** 弹窗最大高度（由外部根据视口可用空间传入，避免撑出页面滚动条导致左右闪动） */
  maxHeight?: number;
  /** 弹窗内容高度变化时的回调（用于外部重新定位弹窗） */
  onHeightChange?: (height: number) => void;
  /** 是否在 Tab 标签栏下方显示搜索输入框；为 true 时使用输入框关键字搜索列表，打开弹窗时自动聚焦 */
  showSearchInput?: boolean;
}

/**
 * MentionPopup 组件 Ref Handle 类型
 *
 * @description
 * 通过 ref 暴露给父组件的方法
 * 用于父组件控制弹窗的选择行为
 */
export interface MentionPopupHandle {
  /** 选择当前选中的项 */
  handleSelectCurrentItem: () => void;
  /** 向上移动选中项，到第一项时停止 */
  handleArrowUp: () => void;
  /** 向下移动选中项，在 Tab 栏时切换到列表 */
  handleArrowDown: () => void;
  /** 向左切换 Tab */
  handleArrowLeft: () => void;
  /** 向右切换 Tab */
  handleArrowRight: () => void;
  /** 重置选中索引为 0 */
  resetSelectedIndex: () => void;
}

/**
 * MentionEditor 组件 Props 类型
 *
 * @description
 * 编辑器组件的属性定义
 * 支持受控模式（通过 value 和 onChange）
 */
export interface MentionEditorProps {
  /** 编辑器内容值（受控模式） */
  value?: string;
  /** 内容变化时的回调 */
  onChange?: (value: string) => void;
  /** 按下回车键时的回调（用于发送消息） */
  onPressEnter?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  /** 粘贴时的回调（用于处理图片粘贴） */
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  /** 占位符文本 */
  placeholder?: string;
  /** 是否在渲染后自动获取焦点，默认 true */
  autoFocus?: boolean;
  /** 是否禁用编辑 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 @ 提及功能，默认 true */
  enableMention?: boolean;
  /** MentionPopup 弹窗的展示方向：auto | up | down，默认 auto */
  mentionPlacement?: 'auto' | 'up' | 'down';
  /** 用于回显的默认提及项列表（需同时传入 value 文本） */
  defaultMentions?: MentionItem[];
  /** 选择提及项时的回调 */
  onMentionSelect?: (item: MentionItem) => void;
  /** 当前已选技能 ID 列表变化时的回调 */
  onSkillIdsChange?: (skillIds: Array<number>) => void;
  /** 最小行数（影响最小高度） */
  minRows?: number;
  /** 最大行数（影响最大高度） */
  maxRows?: number;
}

/**
 * MentionEditor 组件 Ref Handle 类型
 *
 * @description
 * 通过 ref 暴露给父组件的方法
 * 用于父组件控制编辑器
 */
export interface MentionEditorHandle {
  /** 清空编辑器内容 */
  clear: () => void;
  /** 处理从弹窗中选择提及项 */
  handleAtIconMentionSelect: (item: MentionItem) => void;
}
