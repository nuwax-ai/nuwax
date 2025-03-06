import TooltipIcon from '@/components/TooltipIcon';
import {
  InvokeTypeEnum,
  NoneRecallReplyTypeEnum,
  SearchStrategyEnum,
  TriggerTypeEnum,
} from '@/types/enums/agent';
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

// 触发器类型列表
export const TRIGGER_TYPE_LIST = [
  {
    value: TriggerTypeEnum.TIME,
    label: '定时触发',
    img: '',
  },
  {
    value: TriggerTypeEnum.EVENT,
    label: '事件触发',
    img: '',
  },
];
