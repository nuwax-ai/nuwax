/**
 * MentionPopup 和 MentionEditor 组件类型定义
 */

import type { CapabilityTypeEnum } from '@/components/ChatInputHome/CapabilityModal/types';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CoverImgSourceTypeEnum } from '@/types/enums/pageDev';
import { PluginTypeEnum } from '@/types/enums/plugin';
import { AgentTypeEnum } from '@/types/enums/space';
import { AgentStatisticsInfo, CreatorInfo } from '@/types/interfaces/agent';
import type { SelectedDocInfo } from '@/types/interfaces/repo';

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

  /*可用值:PageApp,TaskAgent */
  usageScenarios?: AgentTypeEnum[];
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
  // 是否需要付费
  paymentRequired: boolean;
  // 价格
  price: number;
  // 是否已订阅，对智能体和技能有效
  subscribed: boolean;
  // 是否超出调用限制
  overCallLimit: boolean;
  // 收藏状态
  collect: boolean;
  /**可用值:PageApp,TaskAgent */
  usageScenarios?: AgentTypeEnum[];
}

interface MentionBase {
  /** 唯一标识符 */
  id?: string | number;
  // 技能ID
  /** 显示名称 */
  name: string;
  /** 图标（emoji 或图标类名） */
  icon?: string;
  /** 描述文本，用于搜索匹配和提示 */
  description?: string;
  /** 是否需要付费 */
  paymentRequired?: boolean;
  /** 是否已订阅 */
  subscribed?: boolean;
}

export interface SkillMentionItem extends MentionBase {
  /** 缺省仅兼容存量 defaultMentions；新选择统一写入 skill。 */
  kind?: 'skill';
  targetId: number;
}

export interface FileMentionItem extends MentionBase {
  kind: 'file';
  relativePath: string;
  targetId?: never;
}

/** 资料库文档 chip：随消息以 selectedDocs({slugId,name}) 发送 */
export interface DocMentionItem extends MentionBase {
  kind: 'doc';
  slugId: string;
  /** 文档类型（随 selectedDocs 的 pageType 透传给 chat 请求） */
  pageType?: string;
  targetId?: never;
}

/** 专家选中通知（onExpertSelect 单选，工具栏 pill 回填，随消息合并进 selectedComponents） */
export interface ExpertMentionInfo {
  targetId: number;
  name: string;
  icon?: string;
  description?: string;
}

export type MentionItem = SkillMentionItem | FileMentionItem | DocMentionItem;
export type FetchMentionFiles = () => Promise<FileMentionItem[]>;

export interface PluginCommandItem extends MentionBase {
  kind: 'plugin';
  targetId: number;
  /**
   * 组件类型：默认 Plugin。能力面板（/ 唤起）选中的连接器/专家/资料库
   * 复用该通道并入 selectedComponents，分别映射为 Mcp / Agent / Knowledge。
   */
  componentType?: AgentComponentTypeEnum;
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
  onFetchMentionFiles?: FetchMentionFiles;
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
  /** 是否开启订阅功能（租户配置） */
  enableSubscription?: boolean;
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
  /**可用值:PageApp,TaskAgent */
  usageScenarios?: AgentTypeEnum[];
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
  onFetchMentionFiles?: FetchMentionFiles;
  onPluginSelect?: (item: PluginCommandItem) => void;
  /** 专家选中（单选，工具栏 pill 回填；再选其他专家由消费方整体替换） */
  onExpertSelect?: (expert: ExpertMentionInfo) => void;
  /** 资料库文档 chip 列表变化（从编辑器内容派生，增删/清空自动同步） */
  onDocsChange?: (docs: SelectedDocInfo[]) => void;
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
  /** Width reserved before the first line of text. */
  inlinePrefixWidth?: number;
  /**
   * 是否启用技能 chip 能力（编程化插入与 defaultMentions 回显守卫），默认 true。
   * 不影响 / 能力弹窗——能力弹窗随时可唤起，仅按 capabilityResourceTypes 收敛可选类型
   */
  enableMention?: boolean;
  /**
   * / 能力弹窗开放的能力类型，缺省 DEFAULT_CAPABILITY_RESOURCE_TYPES
   * （不含专家——产品策略：选择专家仅首页开放，其余入口仅隐藏入口，
   * 专家选中链路 onExpertSelect/expertComponents 保持可用）
   */
  capabilityResourceTypes?: CapabilityTypeEnum[];
  /** MentionPopup 弹窗的展示方向：auto | up | down，默认 auto */
  mentionPlacement?: 'auto' | 'up' | 'down';
  /** 用于回显的默认提及项列表（需同时传入 value 文本） */
  defaultMentions?: MentionItem[];
  /** 选择提及项时的回调 */
  onMentionSelect?: (item: MentionItem) => void;
  /** 是否开启订阅功能（租户配置） */
  enableSubscription?: boolean;
  /** 选中未订阅的付费技能时的回调（插入 mention 后触发） */
  onUnsubscribedSkillSelect?: (item: MentionItem) => void;
  /** 当前已选技能 ID 列表变化时的回调 */
  onSkillIdsChange?: (skillIds: Array<number>) => void;
  /** 最小行数（影响最小高度） */
  minRows?: number;
  /** 最大行数（影响最大高度） */
  maxRows?: number;
  /** 可用值:PageApp,TaskAgent */
  usageScenarios?: AgentTypeEnum[];
  /** 能力弹窗关闭回调（连接/断开等弹窗内操作完成后触发，供消费方刷新派生数据） */
  onCapabilityModalClose?: () => void;
}

/**
 * MentionEditor 组件 Ref Handle 类型
 *
 * @description
 * 通过 useImperativeHandle 暴露给父组件的方法
 * 用于父组件控制编辑器
 */
export interface MentionEditorHandle {
  /** 清空编辑器内容 */
  clear: () => void;
  /** 以编程方式插入提及项（追加到编辑器末尾） */
  handleAtIconMentionSelect: (item: MentionItem) => void;
  /** 获取焦点 */
  focus?: () => void;
  /**
   * 在光标处插入 @ / 触发字符并唤起对应弹窗（+ 号菜单入口）。
   * 光标前非空白时自动补空格以满足触发白名单
   */
  insertTriggerText: (text: string) => void;
  /**
   * 编程唤起能力弹窗并定位到指定类型页签（工具栏已连接连接器头像组入口）。
   * 指定类型不在 capabilityResourceTypes 开放范围时回落首个可用类型
   */
  openCapabilityWithType?: (resourceType: CapabilityTypeEnum) => void;
}
