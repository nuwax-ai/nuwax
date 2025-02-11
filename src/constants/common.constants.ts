import {
  FileTypeEnum,
  ParamsTypeEnum,
  PluginParamsSettingDefaultEnum,
  VariableTypeEnum,
} from '@/types/enums/common';

export const BASE_URL = `${process.env.BASE_URL}/api`;

export const UPLOAD_FILE_ACTION =
  'https://test-nvwa-api.xspaceagi.com/api/file/upload';

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

// 参数类型
export const PARAMS_TYPE_LIST = [
  {
    value: ParamsTypeEnum.String,
    label: 'String',
  },
  {
    value: ParamsTypeEnum.Integer,
    label: 'Integer',
  },
  {
    value: ParamsTypeEnum.Number,
    label: 'Number',
  },
  {
    value: ParamsTypeEnum.File,
    label: 'File',
    children: [
      {
        value: FileTypeEnum.Doc,
        label: 'Doc',
      },
      {
        value: FileTypeEnum.Excel,
        label: 'Excel',
      },
      {
        value: FileTypeEnum.PPT,
        label: 'PPT',
      },
      {
        value: FileTypeEnum.Txt,
        label: 'Txt',
      },
      {
        value: FileTypeEnum.Image,
        label: 'Image',
      },
      {
        value: FileTypeEnum.Audio,
        label: 'Audio',
      },
      {
        value: FileTypeEnum.Video,
        label: 'Video',
      },
      {
        value: FileTypeEnum.Other,
        label: 'Other',
      },
    ],
  },
  {
    value: ParamsTypeEnum.Boolean,
    label: 'Boolean',
  },
  {
    value: ParamsTypeEnum.Object,
    label: 'Object',
  },
  {
    value: ParamsTypeEnum.Array_String,
    label: 'Array<String>',
  },
  {
    value: ParamsTypeEnum.Array_Integer,
    label: 'Array<Integer>',
  },
  {
    value: ParamsTypeEnum.Array_Number,
    label: 'Array<Number>',
  },
  {
    value: ParamsTypeEnum.Array_Boolean,
    label: 'Array<Boolean>',
  },
  {
    value: ParamsTypeEnum.Array_Object,
    label: 'Array<Object>',
  },
  {
    value: ParamsTypeEnum.Array_File,
    label: 'Array<File>',
    children: [
      {
        value: FileTypeEnum.Array_Doc,
        label: 'Array<Doc>',
      },
      {
        value: FileTypeEnum.Array_Excel,
        label: 'Array<Excel>',
      },
      {
        value: FileTypeEnum.Array_PPT,
        label: 'Array<PPT>',
      },
      {
        value: FileTypeEnum.Array_Txt,
        label: 'Array<Txt>',
      },
      {
        value: FileTypeEnum.Array_Image,
        label: 'Array<Image>',
      },
      {
        value: FileTypeEnum.Array_Audio,
        label: 'Array<Audio>',
      },
      {
        value: FileTypeEnum.Array_Video,
        label: 'Array<Video>',
      },
      // {
      //   label: 'Array<Code>',
      //   value: 'Array<Code>',
      // },
      // {
      //   label: 'Array<Zip>',
      //   value: 'Array<Zip>',
      // },
      // {
      //   label: 'Array<Svg>',
      //   value: 'Array<Svg>',
      // },
    ],
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
