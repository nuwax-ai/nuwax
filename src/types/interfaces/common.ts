import type { CardStyleEnum, CreateEditAgentEnum } from '@/types/enums/common';
import type { KnowledgeModeEnum } from '@/types/enums/library';
import type {
  ConfigProviderProps,
  FormInstance,
  GetProp,
  UploadProps,
} from 'antd';
import React from 'react';

export type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
export type SizeType = ConfigProviderProps['componentSize'];

/**
 * 定义键值对接口，用于表示具有标签和值的对象。
 */
export interface KeyValuePairs {
  // 键值对的标签
  label: string;
  // 键值对对应的值
  value: string;
}

// 条件渲染组件
export interface ConditionRenderProps {
  condition: React.Key | boolean;
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

// 卡片模式设置样式类型
export interface CardStyleType {
  type: string;
  onClick: (type: CardStyleEnum) => void;
}

// 单张卡片
export interface CardProps {
  className?: string;
  id: string;
  img?: string;
  title: string;
  desc: string;
  onClick: () => void;
}

interface option {
  label: React.ReactNode;
  value: React.Key;
  // label文本前的图片
  [key: string]: React.Key | React.ReactNode;
}

// 下拉选择框组件
export interface SelectListType {
  className?: string;
  value?: React.Key;
  // 自定义前缀
  prefix?: React.ReactNode;
  // 自定义的选择框后缀图标
  suffixIcon?: React.ReactNode;
  // 自定义底部
  dropdownRenderComponent?: React.ReactNode;
  placeholder?: string;
  options: option[];
  onChange?: (value: React.Key) => void;
  size?: SizeType;
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

interface ModalClassNames {
  // 遮罩层元素
  mask?: string;
  // Modal 容器元素
  content?: string;
  // 包裹层元素，一般用于动画容器
  wrapper?: string;
  // 头部元素
  header?: string;
  // 内容元素
  body?: string;
  // 底部元素
  footer?: string;
}

// 封装带Form的Modal弹窗
export interface CustomFormModalProps {
  form: FormInstance;
  classNames?: ModalClassNames;
  title: string;
  open: boolean;
  loading?: boolean;
  // 确定按钮前缀icon
  okPrefixIcon?: React.ReactNode;
  // 确定按钮文本
  okText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// Form.Item 验证rule
export type Rule = {
  required: boolean;
  message: string | React.ReactElement;
};

// 重写TextArea
export interface OverrideTextAreaProps {
  placeholder?: string;
  name: string;
  label?: string;
  initialValue?: string;
  maxLength?: number;
  minRows?: number;
  maxRows?: number;
  rules?: Rule[];
}

// 级联选项类型
export interface CascaderOption {
  value: React.Key;
  label: string;
  children?: CascaderOption[];
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

interface Statistics {
  targetId: number;
  // 用户人数
  userCount: number;
  // 会话次数
  convCount: number;
  // 收藏次数
  collectCount: number;
  // 点赞次数
  likeCount: number;
  // 引用次数
  referenceCount: number;
  // 调用总次数
  callCount: number;
  // 失败调用次数
  failCallCount: number;
  // 调用总时长
  totalCallDuration: number;
}

export interface CreatedNodeItem {
  // 图片
  icon: string;
  // 名称
  name: string;
  // 简介
  description: string;
  // 创建时间
  created: string;
  // 修改时间
  modified: string;
  // 备注
  remark: string;
  // 统计信息
  statistics: Statistics | null;
  // 当前id
  spaceId: number;
  // 正在使用的
  targetId: number;
  // 发布人员信息
  publishUser: {
    userId: number;
    userName: string;
    nickName: string;
    avatar: string;
  };
  collect: boolean;
}

// 创建、编辑智能体
export interface CreateAgentProps {
  type?: CreateEditAgentEnum;
  name?: string;
  description?: string;
  icon?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: (agentId: string) => void;
}

// 创建、编辑知识库
export interface CreateKnowledgeProps {
  type?: KnowledgeModeEnum;
  knowledgeName?: string;
  intro?: string;
  img?: string;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// 自定义数字输入框，带加减按钮
export interface CustomInputNumberProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

// 分析统计单项
export interface AnalyzeStatisticsItem {
  label: string;
  value: string;
}

// 分析统计弹窗组件
export interface AnalyzeStatisticsProps {
  open: boolean;
  onCancel: () => void;
  title: string;
  list: AnalyzeStatisticsItem[];
}

// 自定义popover单项
export interface CustomPopoverItem {
  icon?: React.ReactNode;
  [key: string]: any;
  label: string;
  isDel?: boolean;
}

// 自定义popover弹窗组件
export interface CustomPopoverProps {
  list: CustomPopoverItem[];
  onClick: (item: CustomPopoverItem) => void;
}

// 上传头像
export interface UploadAvatarProps {
  className?: string;
  onUploadSuccess?: (url: string) => void;
  defaultImage: string;
  imageUrl?: string;
  beforeUpload?: (file: FileType) => void;
}

export interface SubmitButtonProps {
  form?: FormInstance;
  loading?: boolean;
  // 确定按钮前缀icon
  okPrefixIcon?: React.ReactNode;
  // 确定按钮文本
  okText?: string;
  onConfirm: () => void;
}

export interface UploadInfo {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
}

// 分页输入参数
export interface PageParams {
  page: number;
  size: number;
}

// 查询特定数量输入参数
export interface ListParams {
  size: number;
}
