import {
  DataTypeEnum,
  FileTypeEnum,
  ParamsTypeEnum,
  PluginParamsSettingDefaultEnum,
} from '@/types/enums/common';

// 文件上传地址
export const UPLOAD_FILE_ACTION =
  'https://test-nvwa-api.xspaceagi.com/api/file/upload';

// 上传PDF、TXT、DOC、DOCX file
export const UPLOAD_FILE_TYPE = [
  'text/plain',
  'application/msword',
  'application/*',
  'application/pdf',
];

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

export const DataTypeMap = {
  [DataTypeEnum.String]: 'String',
  [DataTypeEnum.Integer]: 'Integer',
  [DataTypeEnum.Number]: 'Number',
  [DataTypeEnum.Boolean]: 'Boolean',
  [DataTypeEnum.Object]: 'Object',
  [DataTypeEnum.File_Default]: 'File<Default>',
  [DataTypeEnum.File_Image]: 'File<Image>',
  [DataTypeEnum.File_PPT]: 'File<PPT>',
  [DataTypeEnum.File_Doc]: 'File<Doc>',
  [DataTypeEnum.File_PDF]: 'File<Pdf>',
  [DataTypeEnum.File_Txt]: 'File<Txt>',
  [DataTypeEnum.File_Zip]: 'File<Zip>',
  [DataTypeEnum.File]: 'File',
  [DataTypeEnum.File_Excel]: 'File<Excel>',
  [DataTypeEnum.File_Video]: 'File<Video>',
  [DataTypeEnum.File_Audio]: 'File<Audio>',
  [DataTypeEnum.File_Voice]: 'File<Voice>',
  [DataTypeEnum.File_Code]: 'File<Code>',
  [DataTypeEnum.File_Svg]: 'File<SVG>',
  [DataTypeEnum.Array_Integer]: 'ARRAY<Integer>',
  [DataTypeEnum.Array_Number]: 'ARRAY<Number>',
  [DataTypeEnum.Array_Boolean]: 'ARRAY<Boolean>',
  [DataTypeEnum.Array_File_Default]: 'ARRAY<File<Default>>',
  [DataTypeEnum.Array_File]: 'ARRAY<File>',
  [DataTypeEnum.Array_File_Image]: 'ARRAY<File<Image>>',
  [DataTypeEnum.Array_File_PPT]: 'ARRAY<File<PPT>>',
  [DataTypeEnum.Array_File_Doc]: 'ARRAY<File<Doc>',
  [DataTypeEnum.Array_File_PDF]: 'ARRAY<File<Pdf>>',
  [DataTypeEnum.Array_File_Txt]: 'ARRAY<File<Txt>>',
  [DataTypeEnum.Array_File_Zip]: 'ARRAY<File<Zip>>',
  [DataTypeEnum.Array_File_Excel]: 'ARRAY<File<Excel>>',
  [DataTypeEnum.Array_File_Video]: 'ARRAY<File<Video>>',
  [DataTypeEnum.Array_File_Audio]: 'ARRAY<File<Audio>>',
  [DataTypeEnum.Array_File_Voice]: 'ARRAY<File<Voice>>',
  [DataTypeEnum.Array_File_Svg]: 'ARRAY<File<Svg>>',
  [DataTypeEnum.Array_File_Code]: 'ARRAY<File<Code>>',
  [DataTypeEnum.Array_Object]: 'ARRAY<Object>',
  [DataTypeEnum.Array_String]: 'ARRAY<File<String>>',
};

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
