import { CreateAgentEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FileBoxEnum,
  FilterStatusEnum,
  LongMemberEnum,
  SpaceApplicationListEnum,
  UserProblemSuggestEnum,
} from '@/types/enums/space';
import {
  BorderVerticleOutlined,
  HddOutlined,
  RadarChartOutlined,
} from '@ant-design/icons';

// 过滤状态
export const FILTER_STATUS = [
  { value: FilterStatusEnum.All, label: '全部' },
  { value: FilterStatusEnum.Published, label: '已发布' },
  { value: FilterStatusEnum.Recently_Open, label: '最近打开' },
];

// 过滤创建者
export const CREATE_LIST = [
  { value: CreateListEnum.All_Person, label: '所有人' },
  { value: CreateListEnum.Me, label: '由我创建' },
];

// 应用开发更多操作
export const APPLICATION_MORE_ACTION = [
  { type: ApplicationMoreActionEnum.Analyze, label: '分析' },
  { type: ApplicationMoreActionEnum.Create_Copy, label: '创建副本' },
  { type: ApplicationMoreActionEnum.Move, label: '迁移' },
  { type: ApplicationMoreActionEnum.Del, label: '删除' },
];

// 工作空间应用列表（layout二级菜单）
export const SPACE_APPLICATION_LIST = [
  {
    type: SpaceApplicationListEnum.Application_Develop,
    icon: <BorderVerticleOutlined />,
    text: '应用开发',
  },
  {
    type: SpaceApplicationListEnum.Component_Library,
    icon: <HddOutlined />,
    text: '组件库',
  },
  {
    type: SpaceApplicationListEnum.Team_Setting,
    icon: <RadarChartOutlined />,
    text: '团队设置',
  },
];

// 创建智能体列表
export const CREATE_AGENT_LIST = [
  {
    label: '标准创建',
    value: CreateAgentEnum.Standard,
  },
  {
    label: 'AI 创建',
    value: CreateAgentEnum.AI,
  },
];

// 长期记忆选择列表
export const LONG_MEMORY_LIST = [
  {
    label: '开启',
    value: LongMemberEnum.Start_Use,
  },
  {
    label: '关闭',
    value: LongMemberEnum.Close,
  },
];

// 文件盒子选择列表
export const FILE_BOX_LIST = [
  {
    label: '开启',
    value: FileBoxEnum.Start_Use,
  },
  {
    label: '关闭',
    value: FileBoxEnum.Close,
  },
];

// 用户问题建议选择列表
export const USER_PROBLEM_SUGGEST_LIST = [
  {
    label: '开启',
    value: UserProblemSuggestEnum.Start_Use,
  },
  {
    label: '关闭',
    value: UserProblemSuggestEnum.Close,
  },
];
