import CollaborationIcon from './icon/collaboration.svg';
import DashboardIcon from './icon/dashboard.svg';
import HomeIcon from './icon/home.svg';
import GatheringIcon from './icon/setting.svg';
import { StencilList } from './type';

// 定义左侧栏目的数据
export const asideList: StencilList[] = [
  {
    name: '',
    key: 'group1',
    children: [
      {
        title: '大模型',
        image: CollaborationIcon,
        key: 'aiModel',
        type: 'general-Node',
        content: '大模型应用',
      },
      {
        title: '插件',
        image: CollaborationIcon,
        key: 'bb',
        type: 'general-Node',
      },
      {
        title: '工作流',
        image: CollaborationIcon,
        key: 'cc',
        type: 'general-Node',
      },
      {
        title: '过程输出',
        image: CollaborationIcon,
        key: 'dd',
        type: 'general-Node',
      },
    ],
  },
  {
    name: '业务逻辑',
    key: 'group2',
    children: [
      { title: '代码', image: DashboardIcon, key: 'ee', type: 'general-Node' },
      { title: '插件', image: DashboardIcon, key: 'ff', type: 'general-Node' },
      {
        title: '工作流',
        image: DashboardIcon,
        key: 'gg',
        type: 'general-Node',
      },
      {
        title: '过程输出',
        image: DashboardIcon,
        key: 'hh',
        type: 'general-Node',
      },
    ],
  },
  {
    name: '知识&数据',
    key: 'group3',
    children: [
      {
        title: '知识库',
        image: GatheringIcon,
        key: 'ii',
        type: 'general-Node',
      },
      {
        title: '数据库',
        image: GatheringIcon,
        key: 'jj',
        type: 'general-Node',
      },
      { title: '变量', image: GatheringIcon, key: 'kk', type: 'general-Node' },
      {
        title: '长期记忆',
        image: GatheringIcon,
        key: 'll',
        type: 'general-Node',
      },
    ],
  },
  {
    name: '组件&工具',
    key: 'group4',
    children: [
      { title: '问答', image: HomeIcon, key: 'mm', type: 'general-Node' },
      { title: '文本处理', image: HomeIcon, key: 'nn', type: 'general-Node' },
      { title: '文档提取', image: HomeIcon, key: 'oo', type: 'general-Node' },
      { title: 'http请求', image: HomeIcon, key: 'pp', type: 'general-Node' },
    ],
  },
];
