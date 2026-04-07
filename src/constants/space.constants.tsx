import {
  ICON_KNOWLEDGE,
  ICON_MODEL,
  ICON_PLUGIN,
  ICON_TABLE,
  ICON_WORKFLOW,
} from '@/components/base/AgentType/images.constants';
import SvgIcon from '@/components/base/SvgIcon';
import { dict } from '@/services/i18nRuntime';

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
    label: dict('PC.Common.Global.workflow'),
    icon: <ICON_WORKFLOW />,
  },
  {
    value: ComponentTypeEnum.Plugin,
    label: dict('PC.Common.Global.plugin'),
    icon: <ICON_PLUGIN />,
  },
  {
    value: ComponentTypeEnum.Knowledge,
    label: dict('PC.Common.Global.knowledge'),
    icon: <ICON_KNOWLEDGE />,
  },
  {
    value: ComponentTypeEnum.Table,
    label: dict('PC.Common.Global.dataTable'),
    icon: <ICON_TABLE />,
  },
  {
    value: ComponentTypeEnum.Model,
    label: dict('PC.Common.Global.model'),
    icon: <ICON_MODEL />,
  },
];

// 智能体类型列表
const AGENT_TYPE_LIST_ALL = [
  {
    value: AgentTypeEnum.ChatBot,
    label: dict('PC.Constants.Space.chatBotType'),
    // icon: <ICON_AGENT />,
    tooltip: dict('PC.Constants.Space.chatBotTypeTooltip'),
  },
  {
    value: AgentTypeEnum.TaskAgent,
    label: dict('PC.Constants.Space.taskAgentType'),
    // icon: <ICON_AGENT />,
    tooltip: dict('PC.Constants.Space.taskAgentTypeTooltip'),
  },
];

// 兼容旧代码
export const AGENT_TYPE_LIST = AGENT_TYPE_LIST_ALL;

// 技能库所有资源类型
export const SKILL_ALL_RESOURCE = [
  {
    value: CreateSkillWayEnum.Create,
    label: dict('PC.Constants.Space.createSkill'),
  },
  {
    value: CreateSkillWayEnum.Import,
    label: dict('PC.Constants.Space.importSkill'),
  },
];

// 组件库所有类型
export const LIBRARY_ALL_TYPE = [
  {
    value: ComponentTypeEnum.All_Type,
    label: dict('PC.Constants.Space.allTypes'),
    icon: null,
  },
  ...LIBRARY_ALL_RESOURCE,
];

// 任务库所有类型
export const TASK_ALL_TYPE = [
  {
    value: ComponentTypeEnum.All_Type,
    label: dict('PC.Constants.Space.allTypes'),
    icon: null,
  },
  // 智能体
  {
    value: AgentComponentTypeEnum.Agent,
    label: dict('PC.Common.Global.agent'),
    icon: null,
  },
  // 工作流
  {
    value: AgentComponentTypeEnum.Workflow,
    label: dict('PC.Common.Global.workflow'),
    icon: null,
  },
];

// 过滤状态
export const FILTER_STATUS = [
  { value: FilterStatusEnum.All, label: dict('PC.Common.Global.all') },
  {
    value: FilterStatusEnum.Published,
    label: dict('PC.Common.Global.published'),
  },
];

// 网页应用开发 - 过滤状态
export const FILTER_STATUS_DEV = [
  { value: FilterStatusEnum.All, label: dict('PC.Common.Global.all') },
  {
    value: FilterStatusEnum.Published,
    label: dict('PC.Common.Global.published'),
  },
  {
    value: FilterStatusEnum.Unpublished,
    label: dict('PC.Common.Global.unpublished'),
  },
];

// 智能体开发 - 智能体类型（全部/问答型/通用型）
export const AGENT_TYPE_LIST_DEV = [
  { value: AgentTypeEnum.All, label: dict('PC.Common.Global.all') },
  {
    value: AgentTypeEnum.ChatBot,
    label: dict('PC.Constants.Space.chatBotType'),
  },
  {
    value: AgentTypeEnum.TaskAgent,
    label: dict('PC.Constants.Space.taskAgentType'),
  },
];

// 过滤创建者
export const CREATE_LIST = [
  {
    value: CreateListEnum.All_Person,
    label: dict('PC.Constants.Space.everyone'),
  },
  { value: CreateListEnum.Me, label: dict('PC.Constants.Space.createdByMe') },
];

// 应用开发更多操作
export const APPLICATION_MORE_ACTION = [
  {
    type: ApplicationMoreActionEnum.Analyze,
    label: dict('PC.Constants.Space.analyze'),
  },
  {
    type: ApplicationMoreActionEnum.Copy_To_Space,
    label: dict('PC.Constants.Space.copyToSpace'),
  },
  {
    type: ApplicationMoreActionEnum.Move,
    label: dict('PC.Constants.Space.migrate'),
  },
  {
    type: ApplicationMoreActionEnum.Temporary_Session,
    label: dict('PC.Constants.Space.temporarySession'),
  },
  // 独立会话（已发布的智能体可独立会话）
  {
    type: ApplicationMoreActionEnum.Independent_Session,
    label: dict('PC.Constants.Space.independentSession', '独立会话'),
  },
  { type: ApplicationMoreActionEnum.API_Key, label: 'API Key' },
  {
    type: ApplicationMoreActionEnum.Export_Config,
    label: dict('PC.Constants.Space.exportConfig'),
  },
  { type: ApplicationMoreActionEnum.Log, label: dict('PC.Common.Global.log') },
  {
    type: ApplicationMoreActionEnum.Del,
    label: dict('PC.Common.Global.delete'),
    isDel: true,
  },
];

// 应用开发更多操作（详情页）
export const APPLICATION_MORE_ACTION_DETAIL = [
  {
    type: ApplicationMoreActionEnum.Analyze,
    label: dict('PC.Constants.Space.analyze'),
  },
  {
    type: ApplicationMoreActionEnum.Temporary_Session,
    label: dict('PC.Constants.Space.temporarySession'),
  },
  {
    type: ApplicationMoreActionEnum.Export_Config,
    label: dict('PC.Constants.Space.exportConfig'),
  },
  { type: ApplicationMoreActionEnum.Log, label: dict('PC.Common.Global.log') },
];

// 工作空间应用列表（layout二级菜单）
const SPACE_APPLICATION_LIST_ALL: SpaceApplicationList[] = [
  {
    type: SpaceApplicationListEnum.Application_Develop,
    icon: <SvgIcon name="icons-nav-stars" />,
    text: dict('PC.Constants.Space.agentDev'),
  },
  {
    type: SpaceApplicationListEnum.Page_Develop,
    icon: <SvgIcon name="icons-common-console" />,
    text: dict('PC.Constants.Space.webAppDev'),
  },
  {
    type: SpaceApplicationListEnum.Component_Library,
    icon: <SvgIcon name="icons-nav-components" />,
    text: dict('PC.Constants.Space.componentLibrary'),
  },
  {
    type: SpaceApplicationListEnum.Skill_Manage,
    icon: <SvgIcon name="icons-nav-skill" />,
    text: dict('PC.Constants.Space.skillManage'),
  },
  {
    type: SpaceApplicationListEnum.MCP_Manage,
    icon: <SvgIcon name="icons-nav-mcp" />,
    text: dict('PC.Constants.Space.mcpManage'),
  },
  {
    type: SpaceApplicationListEnum.Task_Center,
    icon: <SvgIcon name="icons-nav-task-time" />,
    text: dict('PC.Constants.Space.taskCenter'),
  },
  {
    type: SpaceApplicationListEnum.Library_Log,
    icon: <SvgIcon name="icons-chat-history" />,
    text: dict('PC.Constants.Space.logQuery'),
  },
  {
    type: SpaceApplicationListEnum.Space_Square,
    icon: <SvgIcon name="icons-nav-space_square" />,
    text: dict('PC.Constants.Space.spaceSquare'),
  },
  {
    type: SpaceApplicationListEnum.Team_Setting,
    icon: <SvgIcon name="icons-nav-settings" />,
    text: dict('PC.Constants.Space.memberAndSettings'),
  },
];

// 兼容旧代码
export const SPACE_APPLICATION_LIST = SPACE_APPLICATION_LIST_ALL;

// 创建智能体列表
export const CREATE_AGENT_LIST = [
  {
    label: dict('PC.Constants.Space.standardCreate'),
    value: CreateAgentEnum.Standard,
  },
  {
    label: dict('PC.Constants.Space.aiCreate'),
    value: CreateAgentEnum.AI,
  },
];

// 是否开启列表,可用值:Open,Close
export const ENABLE_LIST = [
  {
    label: dict('PC.Common.Global.enable'),
    value: OpenCloseEnum.Open,
  },
  {
    label: dict('PC.Common.Global.disable'),
    value: OpenCloseEnum.Close,
  },
];

// 智能体编排-组件设置列表
export const COMPONENT_SETTING_ACTIONS = [
  {
    type: ComponentSettingEnum.Params,
    label: dict('PC.Constants.Space.params'),
  },
  {
    type: ComponentSettingEnum.Method_Call,
    label: dict('PC.Constants.Space.callMethod'),
  },
  {
    type: ComponentSettingEnum.Output_Way,
    label: dict('PC.Constants.Space.outputWay'),
  },
  {
    type: ComponentSettingEnum.Async_Run,
    label: dict('PC.Constants.Space.asyncRun'),
  },
  {
    type: ComponentSettingEnum.Exception_Handling,
    label: dict('PC.Constants.Space.exceptionHandling'),
  },
  {
    type: ComponentSettingEnum.Card_Bind,
    label: dict('PC.Constants.Space.cardBind'),
  },
  // {
  //   type: ComponentSettingEnum.SubAgent,
  //   label: '子智能体',
  // },
];

// 智能体编排-组件设置列表
export const PAGE_SETTING_ACTIONS = [
  {
    type: PageSettingEnum.Visible_To_LLM,
    label: dict('PC.Constants.Space.visibleToModel'),
  },
  {
    type: PageSettingEnum.Home_Index,
    label: dict('PC.Constants.Space.defaultHome'),
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
    label: dict('PC.Common.Global.agent'),
  },
  {
    key: SquareAgentTypeEnum.Plugin,
    label: dict('PC.Common.Global.plugin'),
  },
  {
    key: SquareAgentTypeEnum.Workflow,
    label: dict('PC.Common.Global.workflow'),
  },
  {
    key: SquareAgentTypeEnum.Skill,
    label: dict('PC.Common.Global.skill'),
  },
  {
    key: SquareAgentTypeEnum.Template,
    label: dict('PC.Common.Global.template'),
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
