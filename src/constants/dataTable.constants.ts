import { TableFieldTypeEnum } from '@/types/enums/dataTable';

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
  { label: 'Date', value: TableFieldTypeEnum.Date },
];

// 数据表字段类型是字符串时的选项列表
export const TABLE_FIELD_STRING_LIST = [
  { label: SHORT_TEXT_STRING, value: TableFieldTypeEnum.String },
  { label: MEDIUM_TEXT_STRING, value: TableFieldTypeEnum.MEDIUMTEXT },
];
