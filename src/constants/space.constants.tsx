import {
  ICON_APPLICATION_DEV,
  ICON_COMPONENT_LIBRARY,
  ICON_GROUP_SET,
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import { InputTypeEnum, TriggerComponentType } from '@/types/enums/agent';
import { CreateAgentEnum, DataTypeEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  ComponentTypeEnum,
  CreateListEnum,
  FilterStatusEnum,
  OpenCloseEnum,
  PluginSettingEnum,
  SpaceApplicationListEnum,
} from '@/types/enums/space';

// 组件库所有资源类型
export const LIBRARY_ALL_RESOURCE = [
  {
    value: ComponentTypeEnum.Workflow,
    label: '工作流',
    icon: <ICON_WORKFLOW />,
  },
  {
    value: ComponentTypeEnum.Plugin,
    label: '插件',
    icon: <ICON_PLUGIN />,
  },
  {
    value: ComponentTypeEnum.Knowledge,
    label: '知识库',
    icon: <ICON_KNOWLEDGE />,
  },
  // {
  //   value: ComponentTypeEnum.Database,
  //   label: '数据库',
  //   icon: <ICON_DATABASE />,
  // },
  {
    value: ComponentTypeEnum.Model,
    label: '模型',
    icon: <ICON_MODEL />,
  },
];

// 组件库所有类型
export const LIBRARY_ALL_TYPE = [
  {
    value: ComponentTypeEnum.All_Type,
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
    text: '智能体开发',
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

// 是否开启列表,可用值:Open,Close
export const ENABLE_LIST = [
  {
    label: '开启',
    value: OpenCloseEnum.Open,
  },
  {
    label: '关闭',
    value: OpenCloseEnum.Close,
  },
];

// 任务执行
export const TASK_EXECUTION = [
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

// 插件配置 - 入参配置, 默认列值
export const PLUGIN_INPUT_CONFIG = {
  name: '',
  description: '',
  dataType: DataTypeEnum.String,
  inputType: InputTypeEnum.Query,
  require: true,
  bindValue: '',
  enable: true,
};

// 插件配置 - 出参配置, 默认列值
export const PLUGIN_OUTPUT_CONFIG = {
  name: '',
  description: '',
  dataType: DataTypeEnum.String,
  enable: true,
};
