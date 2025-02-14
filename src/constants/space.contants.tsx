import {
  ICON_APPLICATION_DEV,
  ICON_COMPONENT_LIBRARY,
  ICON_DATABASE,
  ICON_GROUP_SET,
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import { CreateAgentEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FileBoxEnum,
  FilterStatusEnum,
  LibraryAllTypeEnum,
  LongMemberEnum,
  PluginSettingEnum,
  SpaceApplicationListEnum,
  UserProblemSuggestEnum,
} from '@/types/enums/space';
import { TriggerComponentType } from '@/types/enums/agent';

// 组件库所有资源类型
export const LIBRARY_ALL_RESOURCE = [
  {
    value: LibraryAllTypeEnum.Workflow,
    label: '工作流',
    icon: <ICON_WORKFLOW />,
  },
  {
    value: LibraryAllTypeEnum.Plugin,
    label: '插件',
    icon: <ICON_PLUGIN />,
  },
  {
    value: LibraryAllTypeEnum.Knowledge,
    label: '知识库',
    icon: <ICON_KNOWLEDGE />,
  },
  {
    value: LibraryAllTypeEnum.Database,
    label: '数据库',
    icon: <ICON_DATABASE />,
  },
  {
    value: LibraryAllTypeEnum.Model,
    label: '模型',
    icon: <ICON_MODEL />,
  },
];

// 组件库所有类型
export const LIBRARY_ALL_TYPE = [
  {
    value: LibraryAllTypeEnum.All_Type,
    label: '所有类型',
    icon: null,
  },
  ...LIBRARY_ALL_RESOURCE,
];

// 过滤状态
export const FILTER_STATUS = [
  { value: FilterStatusEnum.All, label: '全部' },
  { value: FilterStatusEnum.Published, label: '已发布' },
  // { value: FilterStatusEnum.Recently_Open, label: '最近打开' },
];

// 过滤创建者
export const CREATE_LIST = [
  { value: CreateListEnum.All_Person, label: '所有人' },
  { value: CreateListEnum.Me, label: '由我创建' },
];

// 应用开发更多操作
export const APPLICATION_MORE_ACTION = [
  { type: ApplicationMoreActionEnum.Analyze, label: '分析' },
  { type: ApplicationMoreActionEnum.Create_Copy, label: '创建副本' },
  { type: ApplicationMoreActionEnum.Move, label: '迁移' },
  { type: ApplicationMoreActionEnum.Del, label: '删除', isDel: true },
];

// 工作空间应用列表（layout二级菜单）
export const SPACE_APPLICATION_LIST = [
  {
    type: SpaceApplicationListEnum.Application_Develop,
    icon: <ICON_APPLICATION_DEV />,
    text: '应用开发',
  },
  {
    type: SpaceApplicationListEnum.Component_Library,
    icon: <ICON_COMPONENT_LIBRARY />,
    text: '组件库',
  },
  {
    type: SpaceApplicationListEnum.Team_Setting,
    icon: <ICON_GROUP_SET />,
    text: '团队设置',
  },
];

// 创建智能体列表
export const CREATE_AGENT_LIST = [
  {
    label: '标准创建',
    value: CreateAgentEnum.Standard,
  },
  {
    label: 'AI 创建',
    value: CreateAgentEnum.AI,
  },
];

// 长期记忆选择列表
export const LONG_MEMORY_LIST = [
  {
    label: '开启',
    value: LongMemberEnum.Start_Use,
  },
  {
    label: '关闭',
    value: LongMemberEnum.Close,
  },
];

// 文件盒子选择列表
export const FILE_BOX_LIST = [
  {
    label: '开启',
    value: FileBoxEnum.Start_Use,
  },
  {
    label: '关闭',
    value: FileBoxEnum.Close,
  },
];

// 用户问题建议选择列表
export const USER_PROBLEM_SUGGEST_LIST = [
  {
    label: '开启',
    value: UserProblemSuggestEnum.Start_Use,
  },
  {
    label: '关闭',
    value: UserProblemSuggestEnum.Close,
  },
];

// 任务执行
export const TASK_EXECUTION = [
  // {
  //   value: 0,
  //   label: '机器人提示',
  // },
  {
    value: TriggerComponentType.PLUGIN,
    label: '插件',
  },
  {
    value: TriggerComponentType.WORKFLOW,
    label: '工作流',
  },
];

// 智能体编排-插件设置列表
export const PLUGIN_SETTING_ACTIONS = [
  {
    type: PluginSettingEnum.Params,
    label: '参数',
  },
  {
    type: PluginSettingEnum.Card_Bind,
    label: '卡片绑定',
  },
];
