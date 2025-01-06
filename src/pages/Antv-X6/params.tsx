import {
  ICON_FOLD,
  ICON_HOME,
  ICON_LOGO,
  ICON_NEW_AGENT,
  ICON_START,
} from '@/constants/images.constants';
import { StencilList } from './type';

// 定义左侧栏目的数据
export const asideList: StencilList[] = [
  {
    name: '',
    key: 'group1',
    children: [
      {
        title: '大模型',
        icon: <ICON_NEW_AGENT />,
        key: 'modelNode',
        type: 'general-Node',
        content: [{ label: '模型', value: 'gpt-o1-mini' }],
        desc: '调用大语言模型，使用变量和提示词生成回复',
        backgroundColor: '#EEEEFF',
      },
      {
        title: '插件',
        icon: <ICON_NEW_AGENT />,
        key: 'bb',
        type: 'general-Node',
        content: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
        desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
        backgroundColor: '#EEEEFF',
      },
      {
        title: '工作流',
        icon: <ICON_NEW_AGENT />,
        key: 'cc',
        type: 'general-Node',
        content: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
        desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
      },
      {
        title: '过程输出',
        icon: <ICON_NEW_AGENT />,
        key: 'processNode',
        type: 'general-Node',
        content: '支持中间过程的消息输出，支持流式和非流式两种方式',
        desc: '支持中间过程的消息输出，支持流式和非流式两种方式',
      },
    ],
  },
  {
    name: '业务逻辑',
    key: 'group2',
    children: [
      {
        title: '代码',
        icon: <ICON_LOGO />,
        key: 'codeNode',
        type: 'general-Node',
        content: '代码处理xxxx',
        desc: '编写代码，处理输入变量来生成返回值',
      },
      {
        title: '条件分支',
        icon: <ICON_LOGO />,
        key: 'ff',
        type: 'general-Node',
        content: [
          { label: '如果', value: '判定条件' },
          { label: '否则如果', value: '判定条件' },
          { label: '否则', value: '判定条件' },
        ],
        desc: '连接多个下游分支，若设定的条件成立则仅运行对应的分支，若 均不成立则只运行“否则”分支',
        height: 120,
      },
      {
        title: '意图识别',
        icon: <ICON_LOGO />,
        key: 'gg',
        type: 'general-Node',
        content: [
          { label: '选项一', value: '选项' },
          { label: '选项二', value: '选项' },
          { label: '选项三', value: '选项' },
        ],
        height: 120,
        desc: '用于用户输入的意图识别，并将其与预设意图选项进行匹配。',
      },
      {
        title: '循环',
        icon: <ICON_LOGO />,
        key: 'hh',
        type: 'general-Node',
        content: '',
        width: 760,
        height: 200,
        isParent: true,
        desc: '用于通过设定循环次数和逻辑，重复执行一系列任务。',
      },
    ],
  },
  {
    name: '知识&数据',
    key: 'group3',
    children: [
      {
        title: '知识库',
        icon: <ICON_HOME />,
        key: 'ii',
        type: 'general-Node',
        content: [{ label: '知识库', value: '政策库' }],
        desc: '在选定的知识中，根据输入变量召回最匹配的信息',
      },
      {
        title: '数据库',
        icon: <ICON_HOME />,
        key: 'jj',
        type: 'general-Node',
        content: [{ label: '数据库', value: '数据库01' }],
        desc: '可支持对数据表放开读写控制，用户可读写其他用户提交的数据， 由开发者控制',
      },
      {
        title: '变量',
        icon: <ICON_HOME />,
        key: 'kk',
        type: 'general-Node',
        content: [{ label: '变量名', value: '变量值' }],
        desc: '用于读取和写入项目中的变量，变量名须与项目中的变量名相匹配',
      },
      {
        title: '长期记忆',
        icon: <ICON_HOME />,
        key: 'll',
        type: 'general-Node',
        content: [{ label: '记忆时长', value: '值' }],
        desc: '用于调用长期记忆，获取用户的个性化信息',
      },
    ],
  },
  {
    name: '组件&工具',
    key: 'group4',
    children: [
      {
        title: '问答',
        icon: <ICON_FOLD />,
        key: 'mm',
        type: 'general-Node',
        content: [{ label: '提问方式', value: '回答方式' }],
        desc: '支持中间向用户提问问题',
      },
      {
        title: '文本处理',
        icon: <ICON_FOLD />,
        key: 'nn',
        type: 'general-Node',
        content: '文本处理',
        desc: '用于处理多个字符串类型变量的格式',
      },
      {
        title: '文档提取',
        icon: <ICON_FOLD />,
        key: 'oo',
        type: 'general-Node',
        content: '文档提取',
        desc: '用于提取文档内容，支持的文件类型: txt、 markdown、pdf、 html、 xlsx、 xls、 docx、 csv、 md、 htm',
      },
      {
        title: 'http请求',
        icon: <ICON_FOLD />,
        key: 'pp',
        type: 'general-Node',
        content: 'http请求',
        desc: '用于配置http请求调用已有的服务',
      },
    ],
  },
];

// 定义右侧变量类型
export const dataTypes = [
  {
    label: 'String',
    value: 'String',
  },
  {
    label: 'Integer',
    value: 'Integer',
  },
  {
    label: 'Number',
    value: 'Number',
  },
  {
    label: 'File',
    value: 'File',
    children: [
      {
        label: 'Doc',
        value: 'Doc',
      },
      {
        label: 'Excel',
        value: 'Excel',
      },
      {
        label: 'PPT',
        value: 'PPT',
      },
      {
        label: 'Txt',
        value: 'Txt',
      },
      {
        label: 'Image',
        value: 'Image',
      },
      {
        label: 'Audio',
        value: 'Audio',
      },
      {
        label: 'Video',
        value: 'Video',
      },
      {
        label: 'Other',
        value: 'Other',
      },
    ],
  },
  {
    label: 'Boolean',
    value: 'Boolean',
  },
  {
    label: 'Object',
    value: 'Object',
  },
  {
    label: 'Array<String>',
    value: 'Array<String>',
  },
  {
    label: 'Array<Integer>',
    value: 'Array<Integer>',
  },
  {
    label: 'Array<Number>',
    value: 'Array<Number>',
  },
  {
    label: 'Array<Boolean>',
    value: 'Array<Boolean>',
  },
  {
    label: 'Array<Object>',
    value: 'Array<Object>',
  },
  {
    label: 'Array<File>',
    value: 'Array<File>',
    children: [
      {
        label: 'Default',
        value: 'Default',
      },
      {
        label: 'Array<Image>',
        value: 'Array<Image>',
      },
      {
        label: 'Array<Doc>',
        value: 'Array<Doc>',
      },
      {
        label: 'Array<Code>',
        value: 'Array<Code>',
      },
      {
        label: 'Array<PPT>',
        value: 'Array<PPT>',
      },
      {
        label: 'Array<Txt>',
        value: 'Array<Txt>',
      },
      {
        label: 'Array<Excel>',
        value: 'Array<Excel>',
      },
      {
        label: 'Array<Audio>',
        value: 'Array<Audio>',
      },
      {
        label: 'Array<Zip>',
        value: 'Array<Zip>',
      },
      {
        label: 'Array<Video>',
        value: 'Array<Video>',
      },
      {
        label: 'Array<Svg>',
        value: 'Array<Svg>',
      },
    ],
  },
];

// 模拟模型的输入参数
export const modelTypes = [
  {
    label: '输入',
    icon: <ICON_START />,
    value: 'start',
    children: [
      {
        label: 'input',
        key: 'String-input',
      },
      {
        label: 'd',
        key: 'String-d',
      },
    ],
  },
];
