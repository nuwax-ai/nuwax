import TooltipIcon from '@/components/custom/TooltipIcon';
import {
  DefaultSelectedEnum,
  EventBindResponseActionEnum,
  GuidQuestionSetTypeEnum,
  InputTypeEnum,
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  OutputDirectlyEnum,
  SearchStrategyEnum,
} from '@/types/enums/agent';
import { UpdateModeComponentEnum } from '@/types/enums/library';
import {
  BindCardStyleEnum,
  PluginPublishScopeEnum,
} from '@/types/enums/plugin';
import { InfoCircleOutlined } from '@ant-design/icons';

// 调用方式
export const CALL_METHOD_OPTIONS = [
  {
    value: InvokeTypeEnum.AUTO,
    label: '自动调用',
  },
  {
    value: InvokeTypeEnum.ON_DEMAND,
    label: '按需调用',
  },
  {
    value: InvokeTypeEnum.MANUAL,
    label: '手动选择',
  },
  {
    value: InvokeTypeEnum.MANUAL_ON_DEMAND,
    label: '手动选择+按需调用',
  },
];

// 调用方式 - 是否默认选中
export const CALL_DEFAULT_SELECTED = [
  {
    value: DefaultSelectedEnum.No,
    label: '否',
  },
  {
    value: DefaultSelectedEnum.Yes,
    label: '是',
  },
];

// 输出方式
export const OUTPUT_WAY_OPTIONS = [
  {
    value: OutputDirectlyEnum.No,
    label: '否',
  },
  {
    value: OutputDirectlyEnum.Yes,
    label: '是',
  },
];

// 搜索策略
export const SEARCH_STRATEGY_OPTIONS = [
  {
    value: SearchStrategyEnum.MIXED,
    label: (
      <span className={'flex items-center'}>
        <span>混合</span>
        <TooltipIcon
          title="结合全文检索与语义检索的优势,并对结果进行综合排序"
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
  {
    value: SearchStrategyEnum.SEMANTIC,
    label: (
      <span className={'flex items-center'}>
        <span>语义</span>
        <TooltipIcon
          title="基于向量的文本相关性查询,推荐在需要理解语义关联度和跨语言查询的场景使用。"
          icon={<InfoCircleOutlined />}
        />
      </span>
    ),
  },
  {
    value: SearchStrategyEnum.FULL_TEXT,
    label: (
      <span className={'flex items-center'}>
        <span>全文</span>
        <TooltipIcon
          title="依赖于关键词的全文搜索,推荐在搜索具有特定名称、缩写词、短语或ID的场景使用。"
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
    label: '默认',
  },
  {
    value: NoneRecallReplyTypeEnum.CUSTOM,
    label: '自定义',
  },
];

// 卡片绑定列表
export const BIND_CARD_STYLE_LIST = [
  {
    value: BindCardStyleEnum.SINGLE,
    label: '单张卡片',
  },
  {
    value: BindCardStyleEnum.LIST,
    label: '竖向列表',
  },
];

// 生成多样性选项
export const GENERATE_DIVERSITY_OPTIONS = [
  { label: '精确模式', value: UpdateModeComponentEnum.Precision },
  { label: '平衡模式', value: UpdateModeComponentEnum.Balanced },
  { label: '创意模式', value: UpdateModeComponentEnum.Creative },
  { label: '自定义', value: UpdateModeComponentEnum.Customization },
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
    label: '全局',
  },
  {
    value: PluginPublishScopeEnum.Space,
    label: '工作空间',
  },
];

// 智能体变量输入方式选项
export const AGENT_VARIABLES_INPUT_OPTIONS = [
  {
    value: InputTypeEnum.Text,
    label: '单行文本',
  },
  {
    value: InputTypeEnum.Paragraph,
    label: '段落',
  },
  {
    value: InputTypeEnum.Number,
    label: '数字',
  },
  {
    value: InputTypeEnum.Select,
    label: '单选',
  },
  {
    value: InputTypeEnum.MultipleSelect,
    label: '多选',
  },
  {
    value: InputTypeEnum.AutoRecognition,
    label: '智能识别',
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
    label: '问题引导',
  },
  {
    value: GuidQuestionSetTypeEnum.Page_Path,
    label: '扩展页面路径',
  },
  {
    value: GuidQuestionSetTypeEnum.Link,
    label: '外链地址',
  },
];

// 响应动作（扩展页面打开、外部链接跳转）选项
export const EVENT_BIND_RESPONSE_ACTION_OPTIONS = [
  {
    value: EventBindResponseActionEnum.Page_Open,
    label: '扩展页面打开',
  },
  {
    value: EventBindResponseActionEnum.Link_Jump,
    label: '外部链接跳转',
  },
];
