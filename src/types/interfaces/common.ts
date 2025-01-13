import type { CardStyleEnum } from '@/types/enums/common';
import type { FormInstance, GetProp, UploadProps } from 'antd';
import React from 'react';

export type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

/**
 * 定义键值对接口，用于表示具有标签和值的对象。
 */
export interface KeyValuePairs {
  // 键值对的标签
  label: string;
  // 键值对对应的值
  value: string;
}

// 折叠容器
export interface FoldWrapType {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  visible?: boolean;
  // 关闭按钮左侧操作区域，可选
  otherAction?: React.ReactNode;
  onClose: () => void;
  // 顶部线条是否有margin样式
  lineMargin?: boolean;
  key?: string;
}

// 卡片样式类型
export interface CardStyleType {
  type: string;
  onClick: (type: CardStyleEnum) => void;
}

// 下拉选择框组件
export interface SelectListType {
  className?: string;
  value: string | number;
  // 自定义前缀
  prefix?: React.ReactNode;
  // 自定义的选择框后缀图标
  suffixIcon?: React.ReactNode;
  dropdownRenderComponent?: React.ReactNode;
  placeholder?: string;
  options: { label; value }[];
  // 是否选中的图标或者图片
  selectIcon?: React.ReactNode;
  // label文本前的图片
  img?: string;
  onChange: (value: React.Key) => void;
}

// 默认的object
export interface DefaultObjectType {
  [key: string]: any;
}

export interface LeftMenu {
  // 图标
  icon: React.ReactNode;
  // 名称
  name: string;
  // key
  key: string;
}

export interface LeftGroup {
  key: string;
  children: LeftMenu[];
  label?: string;
}

// 定义没有 searchBar 和 onSearch 的基础属性
export interface ModelBoxProps {
  // 标题
  title: string;
  // 左侧展示的列表
  leftMenuList: LeftMenu[] | LeftGroup[];
  // 右侧主体内容
  Content: React.ComponentType<any>;
  // 切换左侧菜单
  changeMenu: (key: string) => void;
  // 创建的按钮或下拉菜单
  createNode?: React.ReactNode;
  // 宽度
  width?: number;
  // 是否显示搜索的input
  searchBar?: boolean;
  // 点击搜索
  onSearch?: (value: string) => void;
}

// 封装带Form的Modal弹窗
export interface CustomFormModalProps {
  form: FormInstance;
  title: string;
  open: boolean;
  loading: boolean;
  // 确定按钮前缀icon
  okPrefixIcon?: React.ReactNode;
  // 确定按钮文本
  okText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// 重写TextArea
export interface OverrideTextAreaProps {
  placeholder?: string;
  name: string;
  label?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
}

/**
 * 定义 Child 接口，用于描述子节点的数据结构。
 */
export interface Child {
  // 子节点标题
  title: string;
  // 子节点显示的图像路径
  icon: string | React.ReactNode; // 直接使用 SVGProps
  // 唯一标识符
  key: string;
  // 子节点的类型，可能用于区分不同种类的节点
  type: string;
  // 节点的内容，可能是纯文本或键值对数组
  content: string | KeyValuePairs[];
  // 描述
  desc?: string;
  // 节点宽度，可选
  width?: number;
  // 节点高度，可选
  height?: number;
  // 标记该节点是否可以作为父节点嵌套其他节点，可选
  isParent?: boolean;
  // 节点背景颜色，可选
  backgroundColor?: string;
  // 没有操作栏
  noPopover?: boolean;
}

// 使用Model的子组件
export interface UseModelBoxProps {
  // 标题
  title: string;
  // 新增的方法
  onAdd: (item: Child) => void;
}

// 插件的单个内容
export interface PlugInItem {
  // 图标
  icon?: React.ReactNode;
  //   名称
  label: string;
  desc: string;
  id: string;
  //   子选项
  children: PlugInItem[];
}
// 工作流的单个内容
export interface WorkFlowItem {
  icon: React.ReactNode;
  label: string;
  desc: string;
  tag: string;
  time: string;
  image: React.ReactNode;
}
