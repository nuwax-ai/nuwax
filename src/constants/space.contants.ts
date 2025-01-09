import {
  ApplicationMoreActionEnum,
  CreateListEnum,
  FilterStatusEnum,
} from '@/types/enums/space';

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
