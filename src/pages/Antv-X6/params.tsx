import {
  ICON_FOLD,
  ICON_HOME,
  ICON_LOGO,
  ICON_NEW_AGENT,
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
        key: 'aiModel',
        type: 'general-Node',
        content: [{ label: '模型', value: 'gpt-o1-mini' }],
        backgroundColor: 'red',
      },
      {
        title: '插件',
        icon: <ICON_NEW_AGENT />,
        key: 'bb',
        type: 'general-Node',
        content: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
      },
      {
        title: '工作流',
        icon: <ICON_NEW_AGENT />,
        key: 'cc',
        type: 'general-Node',
        content: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
      },
      {
        title: '过程输出',
        icon: <ICON_NEW_AGENT />,
        key: 'dd',
        type: 'general-Node',
        content: '必应搜索引擎。当你需要搜索你不知道的信息，比如天气...',
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
        key: 'ee',
        type: 'general-Node',
        content: '代码处理xxxx',
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
      },
      {
        title: '数据库',
        icon: <ICON_HOME />,
        key: 'jj',
        type: 'general-Node',
        content: [{ label: '数据库', value: '数据库01' }],
      },
      {
        title: '变量',
        icon: <ICON_HOME />,
        key: 'kk',
        type: 'general-Node',
        content: [{ label: '变量名', value: '变量值' }],
      },
      {
        title: '长期记忆',
        icon: <ICON_HOME />,
        key: 'll',
        type: 'general-Node',
        content: [{ label: '记忆时长', value: '值' }],
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
      },
      {
        title: '文本处理',
        icon: <ICON_FOLD />,
        key: 'nn',
        type: 'general-Node',
        content: '文本处理',
      },
      {
        title: '文档提取',
        icon: <ICON_FOLD />,
        key: 'oo',
        type: 'general-Node',
        content: '文档提取',
      },
      {
        title: 'http请求',
        icon: <ICON_FOLD />,
        key: 'pp',
        type: 'general-Node',
        content: 'http请求',
      },
    ],
  },
];
