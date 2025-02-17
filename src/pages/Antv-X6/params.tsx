import { InputOrReference } from '@/components/FormListItem/InputOrReference';
import {
  ICON_START,
  ICON_WORKFLOW_CODE,
  ICON_WORKFLOW_CONDITION,
  ICON_WORKFLOW_DATABASE,
  ICON_WORKFLOW_DOCUMENT_EXTRACTION,
  ICON_WORKFLOW_HTTP_REQUEST,
  ICON_WORKFLOW_INTENT_RECOGNITION,
  ICON_WORKFLOW_KNOWLEDGE_BASE,
  ICON_WORKFLOW_LLM,
  ICON_WORKFLOW_LONG_TERM_MEMORY,
  ICON_WORKFLOW_LOOP,
  ICON_WORKFLOW_OUTPUT,
  ICON_WORKFLOW_PLUGIN,
  ICON_WORKFLOW_QA,
  ICON_WORKFLOW_TEXT_PROCESSING,
  ICON_WORKFLOW_VARIABLE,
  ICON_WORKFLOW_WORKFLOW,
} from '@/constants/images.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { SwitcherFilled } from '@ant-design/icons';
import { Cascader, Checkbox, Input } from 'antd';
import { StencilList } from './type';
// 定义左侧栏目的数据
export const asideList: StencilList[] = [
  {
    name: '',
    key: 'group1',
    children: [
      {
        name: '大模型',
        icon: <ICON_WORKFLOW_LLM />,
        type: 'LLM',
        key: 'general-Node',
        description: '调用大语言模型，使用变量和提示词生成回复',
      },

      {
        name: '插件',
        icon: <ICON_WORKFLOW_PLUGIN />,
        type: 'Plugin',
        key: 'general-Node',
        description: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
      },
      {
        name: '工作流',
        icon: <ICON_WORKFLOW_WORKFLOW />,
        type: 'Workflow',
        key: 'general-Node',
        description: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
      },
      {
        name: '过程输出',
        icon: <ICON_WORKFLOW_OUTPUT />,
        type: 'Output',
        key: 'general-Node',
        description: '支持中间过程的消息输出，支持流式和非流式两种方式',
      },
    ],
  },
  {
    name: '业务逻辑',
    key: 'group2',
    children: [
      {
        name: '代码',
        icon: <ICON_WORKFLOW_CODE />,
        type: 'Code',
        key: 'general-Node',
        description: '编写代码，处理输入变量来生成返回值',
      },
      {
        name: '条件分支',
        icon: <ICON_WORKFLOW_CONDITION />,
        type: 'Condition',
        key: 'general-Node',
        description:
          '连接多个下游分支，若设定的条件成立则仅运行对应的分支，若 均不成立则只运行“否则”分支',
      },
      {
        name: '意图识别',
        icon: <ICON_WORKFLOW_INTENT_RECOGNITION />,
        type: 'IntentRecognition',
        key: 'general-Node',
        description: '用于用户输入的意图识别，并将其与预设意图选项进行匹配。',
      },
      {
        name: '循环',
        icon: <ICON_WORKFLOW_LOOP />,
        type: 'Loop',
        key: 'general-Node',
        description: '用于通过设定循环次数和逻辑，重复执行一系列任务。',
      },
    ],
  },
  {
    name: '知识&数据',
    key: 'group3',
    children: [
      {
        name: '知识库',
        icon: <ICON_WORKFLOW_KNOWLEDGE_BASE />,
        type: 'KnowledgeBase',
        key: 'general-Node',
        description: '在选定的知识中，根据输入变量召回最匹配的信息',
      },
      {
        name: '数据库',
        icon: <ICON_WORKFLOW_DATABASE />,
        type: 'Database',
        key: 'general-Node',
        description:
          '可支持对数据表放开读写控制，用户可读写其他用户提交的数据， 由开发者控制',
      },
      {
        name: '变量',
        icon: <ICON_WORKFLOW_VARIABLE />,
        type: 'Variable',
        key: 'general-Node',
        description:
          '用于读取和写入项目中的变量，变量名须与项目中的变量名相匹配',
      },
      {
        name: '长期记忆',
        icon: <ICON_WORKFLOW_LONG_TERM_MEMORY />,
        type: 'LongTermMemory',
        key: 'general-Node',
        description: '用于调用长期记忆，获取用户的个性化信息',
      },
    ],
  },
  {
    name: '组件&工具',
    key: 'group4',
    children: [
      {
        name: '问答',
        icon: <ICON_WORKFLOW_QA />,
        type: 'QA',
        key: 'general-Node',
        description: '支持中间向用户提问问题',
      },
      {
        name: '文本处理',
        icon: <ICON_WORKFLOW_TEXT_PROCESSING />,
        type: 'TextProcessing',
        key: 'general-Node',
        description: '用于处理多个字符串类型变量的格式',
      },
      {
        name: '文档提取',
        icon: <ICON_WORKFLOW_DOCUMENT_EXTRACTION />,
        type: 'DocumentExtraction',
        key: 'general-Node',
        description:
          '用于提取文档内容，支持的文件类型: txt、 markdown、pdf、 html、 xlsx、 xls、 docx、 csv、 md、 htm',
      },
      {
        name: 'http请求',
        icon: <ICON_WORKFLOW_HTTP_REQUEST />,
        type: 'HTTPRequest',
        key: 'general-Node',
        description: '用于配置http请求调用已有的服务',
      },
    ],
  },
];

// 定义右侧变量类型

export const dataTypes = [
  {
    label: 'String',
    value: DataTypeEnum.String,
  },
  {
    label: 'Integer',
    value: DataTypeEnum.Integer,
  },
  {
    label: 'Number',
    value: DataTypeEnum.Number,
  },
  {
    label: 'File',
    value: DataTypeEnum.File_Default,
    children: [
      {
        label: 'Doc',
        value: DataTypeEnum.File_Doc,
      },
      {
        label: 'Excel',
        value: DataTypeEnum.File_Excel,
      },
      {
        label: 'PPT',
        value: DataTypeEnum.File_PPT,
      },
      {
        label: 'Txt',
        value: DataTypeEnum.File_Txt,
      },
      {
        label: 'Image',
        value: DataTypeEnum.File_Image,
      },
      {
        label: 'Audio',
        value: DataTypeEnum.File_Audio,
      },
      {
        label: 'Video',
        value: DataTypeEnum.File_Video,
      },
      {
        label: 'Svg',
        value: DataTypeEnum.File_Svg,
      },
      {
        label: 'Code',
        value: DataTypeEnum.File_Code,
      },
    ],
  },
  {
    label: 'Boolean',
    value: DataTypeEnum.Boolean,
  },
  {
    label: 'Object',
    value: DataTypeEnum.Object,
  },
  {
    label: 'Array<String>',
    value: DataTypeEnum.Array_String,
  },
  {
    label: 'Array<Integer>',
    value: DataTypeEnum.Array_Integer,
  },
  {
    label: 'Array<Number>',
    value: DataTypeEnum.Array_Number,
  },
  {
    label: 'Array<Boolean>',
    value: DataTypeEnum.Array_Boolean,
  },
  {
    label: 'Array<Object>',
    value: DataTypeEnum.Array_Object,
  },
  {
    label: 'Array<File>',
    value: DataTypeEnum.Array_File_Default,
    children: [
      {
        label: 'Default',
        value: DataTypeEnum.Array_File_Default,
      },
      {
        label: 'Array<Image>',
        value: DataTypeEnum.Array_File_Image,
      },
      {
        label: 'Array<Doc>',
        value: DataTypeEnum.Array_File_Doc,
      },
      {
        label: 'Array<Code>',
        value: DataTypeEnum.Array_File_Code, // 这里假设 "Array<Code>" 对应 "Array_File_Default"
      },
      {
        label: 'Array<PPT>',
        value: DataTypeEnum.Array_File_PPT,
      },
      {
        label: 'Array<Txt>',
        value: DataTypeEnum.Array_File_Txt,
      },
      {
        label: 'Array<Excel>',
        value: DataTypeEnum.Array_File_Excel,
      },
      {
        label: 'Array<Audio>',
        value: DataTypeEnum.Array_File_Audio,
      },
      {
        label: 'Array<Zip>',
        value: DataTypeEnum.Array_File_Zip,
      },
      {
        label: 'Array<Video>',
        value: DataTypeEnum.Array_File_Video,
      },
      {
        label: 'Array<Svg>',
        value: DataTypeEnum.Array_File_Svg, // 这里假设 "Array<Svg>" 对应 "Array_File_Default"
      },
    ],
  },
];

// 模拟模型的输入参数
export const modelTypes = [
  {
    label: '标题生成',
    icon: <ICON_START />,
    key: '标题生成',
    children: [
      {
        key: 'output',
        label: 'output',
        tag: 'String',
      },
      {
        key: 'setting',
        label: 'Setting',
        tag: 'Number',
      },
    ],
  },
];

// 循环的option
export const cycleOption = [
  { label: '使用数组循环', value: 'ARRAY_LOOP' },
  { label: '指定次数循环', value: 'SPECIFY_TIMES_LOOP' },
  { label: '无限循环', value: 'INFINITE_LOOP' },
];
export const InputConfigs = [
  {
    name: 'name',
    placeholder: '变量名',
    label: '变量名',
    rules: [{ required: true, message: '请输入变量名' }],
    component: Input,
    width: 140,
  },
  {
    name: 'dataType',
    placeholder: '选择类型',
    label: '变量类型',
    rules: [{ required: true, message: '请选择变量类型' }],
    component: Cascader,
    width: 110,
    options: dataTypes,
  },
  {
    name: 'description',
    placeholder: '描述',
    label: '',
    rules: [{ required: true, message: '请输入描述' }],
    component: Checkbox,
    width: 0,
  },
  {
    name: 'require',
    placeholder: '变量名',
    label: '',
    rules: [{ required: true, message: '请输入变量名' }],
    component: Checkbox,
    width: 0,
  },
];

export const outPutConfigs = [
  {
    name: 'name',
    placeholder: '参数名',
    label: '参数名',
    rules: [{ required: true, message: '请输入参数名' }],
    component: Input,
    width: 100,
  },
  {
    name: 'bindValue',
    placeholder: '输入或引用参数值',
    label: '参数值',
    rules: [{ required: true, message: '请输入参数值' }],
    component: InputOrReference,
    width: 180,
  },
  {
    name: 'description',
    placeholder: '描述',
    label: '',
    rules: [{ required: true, message: '请输入描述' }],
    component: Checkbox,
    width: 0,
  },
];

// 意图识别的参数配置
export const intentionConfigs = [
  {
    name: 'paramsValue',
    placeholder: '输入或引用参数值',
    label: '',
    rules: [{ required: true, message: '请输入用户的意图描述' }],
    component: Input,
    width: 140,
  },
];

export const modelConfigs = [
  {
    name: 'name',
    placeholder: '参数名',
    label: '参数名',
    rules: [{ required: true, message: '请输入参数名' }],
    component: Input,
    width: 140,
  },
  {
    name: 'paramsValue',
    placeholder: '输入或引用变量值',
    label: '变量值',
    rules: [{ required: true, message: '请输入变量值' }],
    component: InputOrReference,
    width: 120,
  },
];

// 工作流的左侧菜单
export const leftMenuList = [
  {
    icon: <SwitcherFilled />,
    name: '资源库工作流',
    key: 'resources',
  },
  {
    icon: <SwitcherFilled />,
    name: '官方示例',
    key: 'example',
  },
];
