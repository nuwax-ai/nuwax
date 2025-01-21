import TooltipIcon from '@/components/TooltipIcon';
import {
  CallMethodEnum,
  NoRecallResponseEnum,
  SearchStrategyEnum,
} from '@/types/enums/agent';
import { InfoCircleOutlined } from '@ant-design/icons';

// 调用方式
export const CALL_METHOD_OPTIONS = [
  {
    value: CallMethodEnum.Auto_Call,
    label: '自动调用',
  },
  {
    value: CallMethodEnum.On_Demand_Call,
    label: '按需调用',
  },
];

// 搜索策略
export const SEARCH_STRATEGY_OPTIONS = [
  {
    value: SearchStrategyEnum.Mixed,
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
    value: SearchStrategyEnum.Semantic,
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
    value: SearchStrategyEnum.Full_Text,
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
    value: NoRecallResponseEnum.Default,
    label: '默认',
  },
  {
    value: NoRecallResponseEnum.Custom,
    label: '自定义',
  },
];
