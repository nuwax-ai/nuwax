import {
  PluginParamsSettingDefaultEnum,
  VariableTypeEnum,
} from '@/types/enums/common';

export const BASE_URL = `${process.env.BASE_URL}/api`;

export const UPLOAD_FILE_ACTION =
  'https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload';

// 验证码长度
export const VERIFICATION_CODE_LEN = 6;

// 倒计时
export const COUNT_DOWN_LEN = 60;

// 变量类型
export const VARIABLE_TYPE_LIST = [
  {
    value: VariableTypeEnum.String,
    label: 'String',
  },
  {
    value: VariableTypeEnum.Integer,
    label: 'Integer',
  },
  {
    value: VariableTypeEnum.Boolean,
    label: 'Boolean',
  },
  {
    value: VariableTypeEnum.Number,
    label: 'Number',
  },
  {
    value: VariableTypeEnum.Object,
    label: 'Object',
  },
  {
    value: VariableTypeEnum.Array_String,
    label: 'Array<String>',
  },
  {
    value: VariableTypeEnum.Array_Integer,
    label: 'Array<Integer>',
  },
  {
    value: VariableTypeEnum.Array_Boolean,
    label: 'Array<Boolean>',
  },
  {
    value: VariableTypeEnum.Array_Number,
    label: 'Array<Number>',
  },
  {
    value: VariableTypeEnum.Array_Object,
    label: 'Array<Object>',
  },
];

// 插件参数值设置默认下拉选项
export const ParamsSettingDefaultOptions = [
  {
    value: PluginParamsSettingDefaultEnum.Input,
    label: '输入',
  },
  {
    value: PluginParamsSettingDefaultEnum.Quote,
    label: '引用',
  },
];
