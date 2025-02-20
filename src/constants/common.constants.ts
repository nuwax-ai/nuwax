import {
  DataTypeEnum,
  FileTypeEnum,
  ParamsTypeEnum,
  PluginParamsSettingDefaultEnum,
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
    value: DataTypeEnum.String,
    label: 'String',
  },
  {
    value: DataTypeEnum.Integer,
    label: 'Integer',
  },
  {
    value: DataTypeEnum.Number,
    label: 'Number',
  },
  {
    value: DataTypeEnum.Boolean,
    label: 'Boolean',
  },
  {
    value: DataTypeEnum.File_Default,
    label: 'File_Default',
  },
  {
    value: DataTypeEnum.File_Image,
    label: 'File_Image',
  },
  {
    value: DataTypeEnum.File_PPT,
    label: 'File_PPT',
  },
  {
    value: DataTypeEnum.File_Doc,
    label: 'File_Doc',
  },
  {
    value: DataTypeEnum.File_PDF,
    label: 'File_PDF',
  },
  {
    value: DataTypeEnum.File_Txt,
    label: 'File_Txt',
  },
  {
    value: DataTypeEnum.File_Zip,
    label: 'File_Zip',
  },
  {
    value: DataTypeEnum.File_Excel,
    label: 'File_Excel',
  },
  {
    value: DataTypeEnum.File_Video,
    label: 'File_Video',
  },
  {
    value: DataTypeEnum.File_Audio,
    label: 'File_Audio',
  },
  {
    value: DataTypeEnum.File_Voice,
    label: 'File_Voice',
  },
  {
    value: DataTypeEnum.File_Code,
    label: 'File_Code',
  },
  {
    value: DataTypeEnum.File_Svg,
    label: 'File_Svg',
  },
  {
    value: DataTypeEnum.Object,
    label: 'Object',
  },
  {
    value: DataTypeEnum.Array_String,
    label: 'Array_String',
  },
  {
    value: DataTypeEnum.Array_Integer,
    label: 'Array_Integer',
  },
  {
    value: DataTypeEnum.Array_Number,
    label: 'Array_Number',
  },
  {
    value: DataTypeEnum.Array_Boolean,
    label: 'Array_Boolean',
  },
  {
    value: DataTypeEnum.Array_File_Default,
    label: 'Array_File_Default',
  },
  {
    value: DataTypeEnum.Array_File_Image,
    label: 'Array_File_Image',
  },
  {
    value: DataTypeEnum.Array_File_PPT,
    label: 'Array_File_PPT',
  },
  {
    value: DataTypeEnum.Array_File_Doc,
    label: 'Array_File_Doc',
  },
  {
    value: DataTypeEnum.Array_File_PDF,
    label: 'Array_File_PDF',
  },
  {
    value: DataTypeEnum.Array_File_Txt,
    label: 'Array_File_Txt',
  },
  {
    value: DataTypeEnum.Array_File_Zip,
    label: 'Array_File_Zip',
  },
  {
    value: DataTypeEnum.Array_File_Excel,
    label: 'Array_File_Excel',
  },
  {
    value: DataTypeEnum.Array_File_Video,
    label: 'Array_File_Video',
  },
  {
    value: DataTypeEnum.Array_File_Audio,
    label: 'Array_File_Audio',
  },
  {
    value: DataTypeEnum.Array_File_Voice,
    label: 'Array_File_Voice',
  },
  {
    value: DataTypeEnum.Array_File_Svg,
    label: 'Array_File_Svg',
  },
  {
    value: DataTypeEnum.Array_File_Code,
    label: 'Array_File_Code',
  },
  {
    value: DataTypeEnum.Array_Object,
    label: 'Array_Object',
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
    value: PluginParamsSettingDefaultEnum.Reference,
    label: '引用',
  },
];
