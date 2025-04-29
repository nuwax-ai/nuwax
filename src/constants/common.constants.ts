import { BindValueType } from '@/types/enums/agent';
import { DataTypeEnum } from '@/types/enums/common';

// 文件上传地址
export const UPLOAD_FILE_ACTION = `${process.env.BASE_URL}/api/file/upload`;

// 会话 Connection地址
export const CONVERSATION_CONNECTION_URL = `${process.env.BASE_URL}/api/agent/conversation/chat`;
// 临时会话 Connection地址
export const TEMP_CONVERSATION_CONNECTION_URL = `${process.env.BASE_URL}/api/temp/chat/completions`;

// 提示词优化地址
export const PROMPT_OPTIMIZE_URL = `${process.env.BASE_URL}/api/assistant/prompt/optimize`;

// 代码优化地址
export const CODE_OPTIMIZE_URL = `${process.env.BASE_URL}/api/assistant/code/optimize`;

// Sql优化地址
export const SQL_OPTIMIZE_URL = `${process.env.BASE_URL}/api/assistant/sql/optimize`;
// 文档地址
export const DOCUMENT_URL = 'https://nlp-book.swufenlp.group';

// 平台文档地址
export const SITE_DOCUMENT_URL =
  'https://ucn1y31fvbx4.feishu.cn/docx/SUhtdYsyboh9xrxr5EZcX9jqnxg';

// 可上传文件后缀类型：doc docx pdf md json txt
export const UPLOAD_FILE_SUFFIX = ['doc', 'docx', 'pdf', 'md', 'json', 'txt'];

// 验证码长度
export const VERIFICATION_CODE_LEN = 6;

// 倒计时
export const COUNT_DOWN_LEN = 60;

// 插件处理时，新增的字段默认名称
export const ARRAY_ITEM = '[Array_Item]';

// 临时会话的uid, 用于区分临时会话和普通会话, 缓存在sessionStorage中，key为TEMP_CONVERSATION_UID, value为uid
export const TEMP_CONVERSATION_UID = 'TEMP_CONVERSATION_UID';

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
  [DataTypeEnum.Array_Integer]: 'Array<Integer>',
  [DataTypeEnum.Array_Number]: 'Array<Number>',
  [DataTypeEnum.Array_Boolean]: 'Array<Boolean>',
  [DataTypeEnum.Array_File_Default]: 'Array<File<Default>>',
  [DataTypeEnum.Array_File]: 'Array<File>',
  [DataTypeEnum.Array_File_Image]: 'Array<File<Image>>',
  [DataTypeEnum.Array_File_PPT]: 'Array<File<PPT>>',
  [DataTypeEnum.Array_File_Doc]: 'Array<File<Doc>',
  [DataTypeEnum.Array_File_PDF]: 'Array<File<Pdf>>',
  [DataTypeEnum.Array_File_Txt]: 'Array<File<Txt>>',
  [DataTypeEnum.Array_File_Zip]: 'Array<File<Zip>>',
  [DataTypeEnum.Array_File_Excel]: 'Array<File<Excel>>',
  [DataTypeEnum.Array_File_Video]: 'Array<File<Video>>',
  [DataTypeEnum.Array_File_Audio]: 'Array<File<Audio>>',
  [DataTypeEnum.Array_File_Voice]: 'Array<File<Voice>>',
  [DataTypeEnum.Array_File_Svg]: 'Array<File<Svg>>',
  [DataTypeEnum.Array_File_Code]: 'Array<File<Code>>',
  [DataTypeEnum.Array_Object]: 'Array<Object>',
  [DataTypeEnum.Array_String]: 'Array<String>',
};

// 插件参数值设置默认下拉选项
export const ParamsSettingDefaultOptions = [
  {
    value: BindValueType.Input,
    label: '输入',
  },
  {
    value: BindValueType.Reference,
    label: '引用',
  },
];
