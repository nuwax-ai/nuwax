import { TableFieldTypeEnum, TableTabsEnum } from '@/types/enums/dataTable';

// 短文本
export const SHORT_TEXT_STRING = '短文本（0-255）';
// 长文本
export const MEDIUM_TEXT_STRING = '长文本（0-16M）';

// 数据表字段类型列表
export const TABLE_FIELD_TYPE_LIST = [
  { label: 'String', value: TableFieldTypeEnum.String },
  { label: 'Integer', value: TableFieldTypeEnum.Integer },
  { label: 'Number', value: TableFieldTypeEnum.Number },
  { label: 'Boolean', value: TableFieldTypeEnum.Boolean },
  // { label: 'Date', value: TableFieldTypeEnum.Date },
];

// 数据表字段类型是字符串时的选项列表
export const TABLE_FIELD_STRING_LIST = [
  { label: SHORT_TEXT_STRING, value: TableFieldTypeEnum.String },
  { label: MEDIUM_TEXT_STRING, value: TableFieldTypeEnum.MEDIUMTEXT },
];

// 布尔值列表
export const BOOLEAN_LIST = [
  { label: 'true', value: true },
  { label: 'false', value: false },
];

// 数据表tabs列表
export const TABLE_TABS_LIST = [
  { key: TableTabsEnum.Structure, label: '表结构' },
  { key: TableTabsEnum.Data, label: '表数据' },
];

/**
 * 通用 ProTable 配置
 */
export const COMMON_PRO_TABLE_PROPS = {
  debounceTime: 300,
  toolBarRender: false as const,
  options: false as const,
  cardProps: { bodyStyle: { padding: 0 } },
  pagination: {
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
    showTotal: (total: number) => `共 ${total} 条`,
    defaultPageSize: 10,
    locale: {
      items_per_page: '条/页',
    },
  },
  search: {
    span: {
      xs: 24,
      sm: 12,
      md: 12,
      lg: 12,
      xl: 8,
      xxl: 6,
    },
    labelWidth: 100,
    defaultCollapsed: false,
    searchText: '查询',
    resetText: '重置',
    collapseRender: (collapsed: boolean) => (collapsed ? '展开' : '收起'),
    style: {
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    },
  },
};
