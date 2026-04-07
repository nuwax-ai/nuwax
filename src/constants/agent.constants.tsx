import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
import {
  AgentComponentTypeEnum,
  AgentEngineEnum,
  DefaultSelectedEnum,
  EventBindResponseActionEnum,
  EventListEnum,
  GuidQuestionSetTypeEnum,
  HomeIndexEnum,
  InputTypeEnum,
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  OutputDirectlyEnum,
  SearchStrategyEnum,
  VisibleToLLMEnum,
} from '@/types/enums/agent';
import { UpdateModeComponentEnum } from '@/types/enums/library';
import {
  BindCardStyleEnum,
  PluginPublishScopeEnum,
} from '@/types/enums/plugin';
import { InfoCircleOutlined } from '@ant-design/icons';

// Agent引擎选项
export const AGENT_ENGINE_OPTIONS = [
  {
    value: AgentEngineEnum.Default,
    label: (
      <span className={'flex items-center'}>
        <span>{dict('PC.Constants.Agent.default')}</span>
        <TooltipIcon
          title={dict('PC.Constants.Agent.defaultEngineTooltip')}
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
  {
    value: AgentEngineEnum.NuwaxCli,
    label: (
      <span className={'flex items-center'}>
        <span>NuwaxCli</span>
        <TooltipIcon
          title={dict('PC.Constants.Agent.nuwaxCliEngineTooltip')}
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
];

// 调用方式
export const CALL_METHOD_OPTIONS = [
  {
    value: InvokeTypeEnum.AUTO,
    label: dict('PC.Constants.Agent.autoInvoke'),
  },
  {
    value: InvokeTypeEnum.ON_DEMAND,
    label: dict('PC.Constants.Agent.onDemand'),
  },
  {
    value: InvokeTypeEnum.MANUAL,
    label: dict('PC.Constants.Agent.manualSelect'),
  },
  {
    value: InvokeTypeEnum.MANUAL_ON_DEMAND,
    label: dict('PC.Constants.Agent.manualSelectOnDemand'),
  },
];

// 技能调用方式
export const SKILL_METHOD_OPTIONS = [
  {
    value: InvokeTypeEnum.ON_DEMAND,
    label: dict('PC.Constants.Agent.onDemand'),
  },
  {
    value: InvokeTypeEnum.MANUAL_ON_DEMAND, // 手动选择+按需调用 (技能时，代表手动选择)
    label: dict('PC.Constants.Agent.manualSelect'),
  },
];

// 调用方式 - 是否默认选中
export const CALL_DEFAULT_SELECTED = [
  {
    value: DefaultSelectedEnum.No,
    label: dict('PC.Common.Global.no'),
  },
  {
    value: DefaultSelectedEnum.Yes,
    label: dict('PC.Common.Global.yes'),
  },
];

// 输出方式
export const OUTPUT_WAY_OPTIONS = [
  {
    value: OutputDirectlyEnum.No,
    label: dict('PC.Common.Global.no'),
  },
  {
    value: OutputDirectlyEnum.Yes,
    label: dict('PC.Common.Global.yes'),
  },
];

// 搜索策略
export const SEARCH_STRATEGY_OPTIONS = [
  {
    value: SearchStrategyEnum.MIXED,
    label: (
      <span className={'flex items-center'}>
        <span>{dict('PC.Constants.Agent.mixed')}</span>
        <TooltipIcon
          title={dict('PC.Constants.Agent.mixedTooltip')}
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
  {
    value: SearchStrategyEnum.SEMANTIC,
    label: (
      <span className={'flex items-center'}>
        <span>{dict('PC.Constants.Agent.semantic')}</span>
        <TooltipIcon
          title={dict('PC.Constants.Agent.semanticTooltip')}
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
  {
    value: SearchStrategyEnum.FULL_TEXT,
    label: (
      <span className={'flex items-center'}>
        <span>{dict('PC.Constants.Agent.fullText')}</span>
        <TooltipIcon
          title={dict('PC.Constants.Agent.fullTextTooltip')}
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
];

// 无召回回复
export const NO_RECALL_RESPONSE = [
  {
    value: NoneRecallReplyTypeEnum.DEFAULT,
    label: dict('PC.Constants.Agent.defaultRecall'),
  },
  {
    value: NoneRecallReplyTypeEnum.CUSTOM,
    label: dict('PC.Common.Global.custom'),
  },
];

// 卡片绑定列表
export const BIND_CARD_STYLE_LIST = [
  {
    value: BindCardStyleEnum.SINGLE,
    label: dict('PC.Constants.Agent.singleCard'),
  },
  {
    value: BindCardStyleEnum.LIST,
    label: dict('PC.Constants.Agent.verticalList'),
  },
];

// 生成多样性选项
export const GENERATE_DIVERSITY_OPTIONS = [
  {
    label: dict('PC.Constants.Agent.precisionMode'),
    value: UpdateModeComponentEnum.Precision,
  },
  {
    label: dict('PC.Constants.Agent.balancedMode'),
    value: UpdateModeComponentEnum.Balanced,
  },
  {
    label: dict('PC.Constants.Agent.creativeMode'),
    value: UpdateModeComponentEnum.Creative,
  },
  {
    label: dict('PC.Common.Global.custom'),
    value: UpdateModeComponentEnum.Customization,
  },
];

// 生产多样性
export const GENERATE_DIVERSITY_OPTION_VALUE = {
  // 精确模式
  [UpdateModeComponentEnum.Precision]: {
    // 生成随机性;0-1
    temperature: 0.1,
    // 累计概率: 模型在生成输出时会从概率最高的词汇开始选择;0-1
    topP: 0.7,
  },
  // 平衡模式
  [UpdateModeComponentEnum.Balanced]: {
    temperature: 1.0,
    topP: 0.7,
  },
  // 创意模式
  [UpdateModeComponentEnum.Creative]: {
    temperature: 1.0,
    topP: 0.8,
  },
};

// 插件发布选项
export const PLUGIN_PUBLISH_OPTIONS = [
  {
    value: PluginPublishScopeEnum.Tenant,
    label: dict('PC.Constants.Agent.global'),
  },
  {
    value: PluginPublishScopeEnum.Space,
    label: dict('PC.Constants.Agent.workspace'),
  },
];

// 智能体变量输入方式选项
export const AGENT_VARIABLES_INPUT_OPTIONS = [
  {
    value: InputTypeEnum.Text,
    label: dict('PC.Constants.Agent.singleLineText'),
  },
  {
    value: InputTypeEnum.Paragraph,
    label: dict('PC.Constants.Agent.paragraph'),
  },
  {
    value: InputTypeEnum.Number,
    label: dict('PC.Constants.Agent.number'),
  },
  {
    value: InputTypeEnum.Select,
    label: dict('PC.Constants.Agent.singleSelect'),
  },
  {
    value: InputTypeEnum.MultipleSelect,
    label: dict('PC.Constants.Agent.multiSelect'),
  },
  {
    value: InputTypeEnum.AutoRecognition,
    label: dict('PC.Constants.Agent.smartRecognition'),
  },
];

// 变量插件绑定配置默认值
export const BINDING_DEFAULT_JSON_DATA = {
  options: [
    {
      value: 'zhejiang',
      label: 'Zhejiang',
      children: [
        {
          value: 'hangzhou',
          label: 'Hangzhou',
          children: [],
        },
      ],
    },
  ],
};

export const SIDEBAR_WIDTH = 368 + 32;

// 预置问题设置类型选项
export const GUID_QUESTION_SET_OPTIONS = [
  {
    value: GuidQuestionSetTypeEnum.Question,
    label: dict('PC.Constants.Agent.questionGuide'),
  },
  {
    value: GuidQuestionSetTypeEnum.Page,
    label: dict('PC.Constants.Agent.extPagePath'),
  },
  {
    value: GuidQuestionSetTypeEnum.Link,
    label: dict('PC.Constants.Agent.externalLink'),
  },
];

// 响应动作（扩展页面打开、外部链接跳转）选项
export const EVENT_BIND_RESPONSE_ACTION_OPTIONS = [
  {
    value: EventBindResponseActionEnum.Page,
    label: dict('PC.Constants.Agent.extPageOpen'),
  },
  {
    value: EventBindResponseActionEnum.Link,
    label: dict('PC.Constants.Agent.extLinkRedirect'),
  },
];

// 事件列表
export const EVENT_LIST = [
  {
    value: EventListEnum.Edit,
    label: dict('PC.Common.Global.edit'),
  },
  {
    value: EventListEnum.InsertSystemPrompt,
    label: dict('PC.Constants.Agent.insertToPrompt'),
  },
  {
    value: EventListEnum.Delete,
    label: dict('PC.Common.Global.delete'),
  },
];

// 页面是否模型可见选项
export const VISIBLE_TO_LLM_OPTIONS = [
  {
    value: VisibleToLLMEnum.No,
    label: dict('PC.Common.Global.no'),
  },
  {
    value: VisibleToLLMEnum.Yes,
    label: dict('PC.Common.Global.yes'),
  },
];

// 是否为智能体页面首页，1 为默认首页，0 不为首页
export const HOME_INDEX_OPTIONS = [
  {
    value: HomeIndexEnum.No,
    label: dict('PC.Common.Global.no'),
  },
  {
    value: HomeIndexEnum.Yes,
    label: dict('PC.Common.Global.yes'),
  },
];

// 智能体组件类型映射
export const AGENT_COMPONENT_TYPE_MAP = {
  [AgentComponentTypeEnum.Agent]: { text: dict('PC.Common.Global.agent') },
  [AgentComponentTypeEnum.Plugin]: { text: dict('PC.Common.Global.plugin') },
  [AgentComponentTypeEnum.Workflow]: {
    text: dict('PC.Common.Global.workflow'),
  },
  [AgentComponentTypeEnum.MCP]: { text: 'MCP' },
  [AgentComponentTypeEnum.Model]: { text: dict('PC.Common.Global.model') },
  [AgentComponentTypeEnum.ApiKey]: { text: 'ApiKey' },
};
