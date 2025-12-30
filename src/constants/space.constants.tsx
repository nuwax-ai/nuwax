import {
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_TABLE,
  ICON_WORKFLOW,
} from '@/components/base/AgentType/images.constants';
import SvgIcon from '@/components/base/SvgIcon';

import { AgentComponentTypeEnum, InputTypeEnum } from '@/types/enums/agent';
import { CreateAgentEnum, DataTypeEnum } from '@/types/enums/common';
import {
  AgentTypeEnum,
  ApplicationMoreActionEnum,
  ComponentSettingEnum,
  ComponentTypeEnum,
  CreateListEnum,
  CreateSkillWayEnum,
  FilterStatusEnum,
  OpenCloseEnum,
  PageSettingEnum,
  SpaceApplicationList,
  SpaceApplicationListEnum,
} from '@/types/enums/space';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { TabsProps } from 'antd';

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
  {
    value: ComponentTypeEnum.Table,
    label: '数据表',
    icon: <ICON_TABLE />,
  },
  {
    value: ComponentTypeEnum.Model,
    label: '模型',
    icon: <ICON_MODEL />,
  },
];

// 智能体类型列表
const AGENT_TYPE_LIST_ALL = [
  {
    value: AgentTypeEnum.ChatBot,
    label: '问答型',
    // icon: <ICON_AGENT />,
    tooltip: '适合知识问答、智能客服等快问快答的场景。',
  },
  {
    value: AgentTypeEnum.TaskAgent,
    label: '任务型',
    // icon: <ICON_AGENT />,
    tooltip:
      '为智能体分配独立的执行电脑，适合应用开发、深度调研、数据分析、演示文稿制作等复杂任务场景，比较消耗内存资源且输出结果较慢。',
  },
];

// 获取智能体类型列表（根据enabledSandbox过滤）
export const getAgentTypeList = (enabledSandbox?: boolean) => {
  if (enabledSandbox === false) {
    return AGENT_TYPE_LIST_ALL.filter(
      (item) => item.value !== AgentTypeEnum.TaskAgent,
    );
  }
  return AGENT_TYPE_LIST_ALL;
};

// 兼容旧代码
export const AGENT_TYPE_LIST = AGENT_TYPE_LIST_ALL;

// 技能库所有资源类型
export const SKILL_ALL_RESOURCE = [
  {
    value: CreateSkillWayEnum.Create,
    label: '创建技能',
    // icon: <PlusOutlined />,
  },
  {
    value: CreateSkillWayEnum.Import,
    label: '导入技能',
    // icon: <ImportOutlined />,
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

// 任务库所有类型
export const TASK_ALL_TYPE = [
  {
    value: ComponentTypeEnum.All_Type,
    label: '所有类型',
    icon: null,
  },
  // 智能体
  {
    value: AgentComponentTypeEnum.Agent,
    label: '智能体',
    icon: null,
  },
  // 工作流
  {
    value: AgentComponentTypeEnum.Workflow,
    label: '工作流',
    icon: null,
  },
];

// 过滤状态
export const FILTER_STATUS = [
  { value: FilterStatusEnum.All, label: '全部' },
  { value: FilterStatusEnum.Published, label: '已发布' },
];

// 过滤创建者
export const CREATE_LIST = [
  { value: CreateListEnum.All_Person, label: '所有人' },
  { value: CreateListEnum.Me, label: '由我创建' },
];

// 应用开发更多操作
export const APPLICATION_MORE_ACTION = [
  { type: ApplicationMoreActionEnum.Analyze, label: '分析' },
  { type: ApplicationMoreActionEnum.Copy_To_Space, label: '复制到空间' },
  { type: ApplicationMoreActionEnum.Move, label: '迁移' },
  { type: ApplicationMoreActionEnum.Temporary_Session, label: '临时会话' },
  { type: ApplicationMoreActionEnum.API_Key, label: 'API Key' },
  { type: ApplicationMoreActionEnum.Export_Config, label: '导出配置' },
  { type: ApplicationMoreActionEnum.Log, label: '日志' },
  { type: ApplicationMoreActionEnum.Del, label: '删除', isDel: true },
];

// 应用开发更多操作（详情页）
export const APPLICATION_MORE_ACTION_DETAIL = [
  { type: ApplicationMoreActionEnum.Analyze, label: '分析' },
  { type: ApplicationMoreActionEnum.Temporary_Session, label: '临时会话' },
  { type: ApplicationMoreActionEnum.Export_Config, label: '导出配置' },
  { type: ApplicationMoreActionEnum.Log, label: '日志' },
];

// 工作空间应用列表（layout二级菜单）
const SPACE_APPLICATION_LIST_ALL: SpaceApplicationList[] = [
  {
    type: SpaceApplicationListEnum.Application_Develop,
    icon: <SvgIcon name="icons-nav-stars" />,
    text: '智能体开发',
  },
  {
    type: SpaceApplicationListEnum.Page_Develop,
    icon: <SvgIcon name="icons-common-console" />,
    text: '应用页面开发',
  },
  {
    type: SpaceApplicationListEnum.Component_Library,
    icon: <SvgIcon name="icons-nav-components" />,
    text: '组件库',
  },
  {
    type: SpaceApplicationListEnum.Skill_Manage,
    icon: <SvgIcon name="icons-nav-skill" />,
    text: '技能管理',
  },
  {
    type: SpaceApplicationListEnum.MCP_Manage,
    icon: <SvgIcon name="icons-nav-mcp" />,
    text: 'MCP管理',
  },
  {
    type: SpaceApplicationListEnum.Task_Center,
    icon: <SvgIcon name="icons-nav-task_time" />,
    text: '任务中心',
  },
  {
    type: SpaceApplicationListEnum.Library_Log,
    icon: <SvgIcon name="icons-chat-history" />,
    text: '日志查询',
  },
  {
    type: SpaceApplicationListEnum.Space_Square,
    icon: <SvgIcon name="icons-nav-space_square" />,
    text: '空间广场',
  },
  {
    type: SpaceApplicationListEnum.Team_Setting,
    icon: <SvgIcon name="icons-nav-settings" />,
    text: '成员与设置',
  },
];

// 获取工作空间应用列表（根据enabledSandbox过滤）
export const getSpaceApplicationList = (
  enabledSandbox?: boolean,
): SpaceApplicationList[] => {
  if (enabledSandbox === false) {
    return SPACE_APPLICATION_LIST_ALL.filter(
      (item) => item.type !== SpaceApplicationListEnum.Skill_Manage,
    );
  }
  return SPACE_APPLICATION_LIST_ALL;
};

// 兼容旧代码
export const SPACE_APPLICATION_LIST = SPACE_APPLICATION_LIST_ALL;

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

// 智能体编排-组件设置列表
export const COMPONENT_SETTING_ACTIONS = [
  {
    type: ComponentSettingEnum.Params,
    label: '参数',
  },
  {
    type: ComponentSettingEnum.Method_Call,
    label: '调用方式',
  },
  {
    type: ComponentSettingEnum.Output_Way,
    label: '输出方式',
  },
  {
    type: ComponentSettingEnum.Async_Run,
    label: '异步运行',
  },
  {
    type: ComponentSettingEnum.Exception_Handling,
    label: '异常处理',
  },
  {
    type: ComponentSettingEnum.Card_Bind,
    label: '卡片绑定',
  },
];

// 智能体编排-组件设置列表
export const PAGE_SETTING_ACTIONS = [
  {
    type: PageSettingEnum.Visible_To_LLM,
    label: '模型可见',
  },
  {
    type: PageSettingEnum.Home_Index,
    label: '默认首页',
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

// 空间广场-分类列表
const SPACE_SQUARE_TABS_ALL: TabsProps['items'] = [
  {
    key: SquareAgentTypeEnum.Agent,
    label: '智能体',
  },
  {
    key: SquareAgentTypeEnum.Plugin,
    label: '插件',
  },
  {
    key: SquareAgentTypeEnum.Workflow,
    label: '工作流',
  },
  {
    key: SquareAgentTypeEnum.Skill,
    label: '技能',
  },
  {
    key: SquareAgentTypeEnum.Template,
    label: '模板',
  },
];

// 获取空间广场分类列表（根据enabledSandbox过滤）
export const getSpaceSquareTabs = (
  enabledSandbox?: boolean,
): TabsProps['items'] => {
  if (enabledSandbox === false) {
    return SPACE_SQUARE_TABS_ALL?.filter(
      (item) => item?.key !== SquareAgentTypeEnum.Skill,
    );
  }
  return SPACE_SQUARE_TABS_ALL;
};

// 兼容旧代码
export const SPACE_SQUARE_TABS = SPACE_SQUARE_TABS_ALL;
