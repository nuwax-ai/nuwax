interface TagProps {
  name: string;
  desc: string;
  type: string;
}
// 插件的单个内容
export interface PlugInItem {
  // 图标
  icon?: JSX.Element;
  //   名称
  label: string;
  //   简介
  desc: string;
  //   标签列表
  tag: TagProps[];
  //   发布时间
  releaseTime: string;
  //   大小
  size: string;
  //   点赞数量
  stat: string;
  //   耗时
  time: string;
  //   成功率
  successRate: string;
  //  引用量
  cites: string;
  //   来源
  source: string;
  // id
  id: string;
  //   子选项
  children: PlugInItem[];
}
// 工作流的单个内容
export interface WorkFlowItem {
  icon: JSX.Element;
  label: string;
  desc: string;
  tag: string;
  time: string;
}

// 工作流的右侧内容
export interface WorkFlowContent {
  props: WorkFlowItem;
  onAdd: (item: WorkFlowItem) => void;
}
// 插件的右侧内容
export interface PlugInNodeContent {
  props: PlugInItem;
  onAdd: (item: PlugInItem) => void;
}

export type RightContent = WorkFlowContent | PlugInItem;

export interface ContentProps {
  rightContent: RightContent[];
  onAdd: (item: RightContent) => void;
}
