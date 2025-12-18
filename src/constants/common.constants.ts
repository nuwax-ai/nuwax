import { AgentComponentTypeEnum, BindValueType } from '@/types/enums/agent';
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
export const SITE_DOCUMENT_URL = 'https://nuwax.com/user-manual.html';

// 图片后缀
export const IMAGES = ['jpg', 'png', 'gif', 'webp', 'svg', 'heic'];

// 可上传视频后缀类型
export const VIDEOS = ['mp4', 'mkv', 'mov', 'webm'];

// 可上传音频后缀类型
export const AUDIOS = ['mp3', 'aac', 'wav', 'flac', 'ogg', 'opus'];

// 可上传文件后缀类型：doc docx pdf md json txt AND 图片后缀/可上传图片后缀类型
export const UPLOAD_FILE_SUFFIX = [
  'doc',
  'docx',
  'pdf',
  'md',
  'json',
  'txt',
  ...IMAGES,
  ...VIDEOS,
  ...AUDIOS,
];

// 验证码长度
export const VERIFICATION_CODE_LEN = 6;

// 倒计时
export const COUNT_DOWN_LEN = 60;

// 图片最大上传数量
export const MAX_IMAGE_COUNT = 9;

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

// 创建工作流 插件 知识库 数据表 MCP 弹窗的标签页
export const CREATED_TABS: {
  label: string;
  key: AgentComponentTypeEnum;
}[] = [
  { label: '插件', key: AgentComponentTypeEnum.Plugin },
  { label: '工作流', key: AgentComponentTypeEnum.Workflow },
  { label: '知识库', key: AgentComponentTypeEnum.Knowledge },
  { label: '数据表', key: AgentComponentTypeEnum.Table },
  { label: '智能体', key: AgentComponentTypeEnum.Agent },
  { label: 'MCP服务', key: AgentComponentTypeEnum.MCP },
  { label: '页面', key: AgentComponentTypeEnum.Page },
  { label: '技能', key: AgentComponentTypeEnum.Skill },
];

// 组件类型名称
export const COMPONENT_TYPE_NAME_MAP = {
  [AgentComponentTypeEnum.Agent]: '智能体',
  [AgentComponentTypeEnum.Plugin]: '插件',
  [AgentComponentTypeEnum.Workflow]: '工作流',
  [AgentComponentTypeEnum.Knowledge]: '知识库',
  [AgentComponentTypeEnum.Variable]: '变量',
  [AgentComponentTypeEnum.Table]: '数据表',
  [AgentComponentTypeEnum.Model]: '模型',
  [AgentComponentTypeEnum.MCP]: 'MCP服务',
};

/**
 * iframe 配置
 * allow-downloads	允许通过带有 download 属性的 <a> 或 <area> 元素或者通过导航来下载文件，无论是用户通过点击链接触发，还是在用户没有交互的情况下通过 JS 代码触发。
 * allow-scripts	允许执行JavaScript脚本
 * allow-same-origin	允许与父页面同源访问
 * allow-forms	允许提交表单
 * allow-top-navigation	允许导航到父页面
 * allow-popups	允许弹出窗口
 * allow-modals	允许模态对话框
 * allow-popups-to-escape-sandbox	允许弹出窗口逃逸沙盒
 */
export const SANDBOX =
  'allow-downloads allow-scripts allow-same-origin allow-forms allow-top-navigation allow-popups allow-modals allow-popups-to-escape-sandbox';
