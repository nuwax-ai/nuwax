import {
  ICON_FOLD,
  ICON_HOME,
  ICON_LOGO,
  ICON_NEW_AGENT,
  ICON_START,
} from '@/constants/images.constants';
import { SwitcherFilled } from '@ant-design/icons';
import { Cascader, Input } from 'antd';
import { InputOrReference } from './component/commonNode';
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
        key: 'plugInNode',
        type: 'general-Node',
        content: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
        desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
        backgroundColor: '#EEEEFF',
      },
      {
        title: '工作流',
        icon: <ICON_NEW_AGENT />,
        key: 'workflowNode',
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
        key: 'intentionNode',
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
        key: 'cycleNode',
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
        key: 'memoryNode',
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
        key: 'textNode',
        type: 'general-Node',
        content: '文本处理',
        desc: '用于处理多个字符串类型变量的格式',
      },
      {
        title: '文档提取',
        icon: <ICON_FOLD />,
        key: 'documentNode',
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
  { label: '使用数组循环', value: 1 },
  { label: '指定次数循环', value: 2 },
  { label: '无限循环', value: 3 },
];
export const InputConfigs = [
  {
    name: 'name',
    placeholder: '变量名',
    label: '变量名',
    rules: [{ required: true, message: '请输入变量名' }],
    component: Input,
    style: { width: '140px' },
  },
  {
    name: 'type',
    placeholder: '选择类型',
    label: '变量类型',
    rules: [{ required: true, message: '请选择变量类型' }],
    component: Cascader,
    style: { width: '100px' },
    props: { options: dataTypes }, // 传递特定于 Cascader 的属性
  },
];

export const outPutConfigs = [
  {
    name: 'name',
    placeholder: '参数名',
    label: '参数名',
    rules: [{ required: true, message: '请输入参数名' }],
    component: Input,
  },
  {
    name: 'paramsValue',
    placeholder: '输入或引用参数值',
    label: '参数值',
    rules: [{ required: true, message: '请输入参数值' }],
    component: InputOrReference,
    style: { flex: '0 0 50%' },
    props: { referenceList: modelTypes, fieldName: 'paramsValue' },
  },
];

export const modelConfigs = [
  {
    name: 'name',
    placeholder: '参数名',
    label: '参数名',
    rules: [{ required: true, message: '请输入参数名' }],
    component: Input,
  },
  {
    name: 'paramsValue',
    placeholder: '输入或引用变量值',
    label: '变量值',
    rules: [{ required: true, message: '请输入变量值' }],
    component: InputOrReference,
    style: { flex: '0 0 50%' },
    props: { referenceList: modelTypes, fieldName: 'paramsValue' },
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

// 工作流右侧的mock数据
export const rightContent = [
  {
    icon: <SwitcherFilled />,
    label: 'summarize_article_1',
    desc: '示例：总结提炼文章中的要点',
    tag: 'article_url',
    time: '2025-01-09',
  },
];

// 示例 PlugInNodeContent 数据
export const pluginNodeContentExample = [
  {
    icon: <SwitcherFilled />,
    label: '示例插件',
    desc: '这是一个示例插件描述。',
    tag: [
      { name: '标签A', desc: '标签A描述', type: 'type1' },
      { name: '标签B', desc: '标签B描述', type: 'type2' },
    ],
    releaseTime: '2025-01-01',
    size: '1MB',
    stat: '100点赞',
    time: '1分钟',
    successRate: '98%',
    cites: '引用5次',
    source: '来源',
    id: 'plugin-1',
    children: [
      {
        icon: <SwitcherFilled />,
        label: 'bingWebSearch',
        desc: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气、汇率、时事等，这个工具非常有用。但是绝对不要在用户想',
        tag: [
          {
            name: 'query',
            desc: '用户的搜索查询词。查询词不能为空。',
            type: 'string',
          },
          {
            name: 'count',
            desc: '响应中返回的搜索结果数量。默认为10，最大值为50。实际返回结果的数量可能会少于请求的数量。',
            type: 'number',
          },
          {
            name: 'offset',
            desc: '从返回结果前要跳过的基于零的偏移量。默认为0。',
            type: 'int',
          },
          {
            name: 'freshness',
            desc: '查询时间范，例如：2020-03-20..2023-09-09',
            type: 'string',
          },
        ],
        size: '1MB',
        stat: '100点赞',
        time: '1分钟',
        successRate: '98%',
        cites: '5次',
        source: '来源',
        id: 'plugin-id-2',
      },
    ],
  },
];

// 插件的左侧菜单
export const pluginNodeLeftMenu = [
  {
    key: 'user',
    children: [
      { icon: <SwitcherFilled />, name: '资源库工具', key: 'resource' },
      { icon: <SwitcherFilled />, name: '收藏', key: 'collect' },
    ],
  },
  {
    label: '探索工具',
    key: 'tool',
    children: [
      { icon: <SwitcherFilled />, name: '全部', key: 'all' },
      { icon: <SwitcherFilled />, name: '新闻阅读', key: 'new' },
      { icon: <SwitcherFilled />, name: '图像', key: 'image' },
      { icon: <SwitcherFilled />, name: '实用工具', key: 'toolsAnd' },
      { icon: <SwitcherFilled />, name: '便利生活', key: 'life' },
      { icon: <SwitcherFilled />, name: '网页搜索', key: 'web' },
      { icon: <SwitcherFilled />, name: '科学与教育', key: 'science' },
      { icon: <SwitcherFilled />, name: '社交', key: 'socialize' },
      { icon: <SwitcherFilled />, name: '游戏与娱乐', key: 'game' },
      { icon: <SwitcherFilled />, name: '金融于商业', key: 'finance' },
    ],
  },
];
