import type {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  OnlyTemplateEnum,
  OptionDataSourceEnum,
} from '@/types/enums/agent';
import type {
  BindValueType,
  CreateUpdateModeEnum,
  InputTypeEnum,
  NodeShapeEnum,
  UploadFileStatus,
} from '@/types/enums/common';
import { DataTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { ApplicationMoreActionEnum } from '@/types/enums/space';
import type {
  AgentBaseInfo,
  AgentConfigInfo,
  AgentManualComponentInfo,
  AgentSelectedComponentInfo,
  CreatorInfo,
} from '@/types/interfaces/agent';
import { CardDataInfo } from '@/types/interfaces/cardInfo';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import type {
  KnowledgeBaseInfo,
  KnowledgeInfo,
} from '@/types/interfaces/knowledge';
import type { InputAndOutConfig } from '@/types/interfaces/node';
import type { FormInstance, GetProp, UploadFile, UploadProps } from 'antd';
import React from 'react';

export type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
// 原代码中 large、middle、small 未定义，将其改为字符串字面量类型
export type SizeType = 'large' | 'middle' | 'small';

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
  condition?: React.Key | boolean;
}

// 折叠容器
export interface FoldWrapType {
  className?: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  title: string;
  description?: string;
  visible?: boolean;
  // 关闭按钮左侧操作区域，可选
  otherAction?: React.ReactNode;
  onClose: () => void;
  // 顶部线条是否有margin样式
  lineMargin?: boolean;
  key?: string;
  // 是否显示修改名称的input
  showNameInput?: boolean;
  changeFoldWrap?: ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => void;
}

// 容器组件
export interface ToggleWrapProps {
  className?: string;
  title: string;
  visible?: boolean;
  onClose: () => void;
}

export interface option {
  label: React.ReactNode;
  value: React.Key;
  // label文本前的图片
  [key: string]: React.Key | React.ReactNode;
}

// 下拉选择框组件
export interface SelectListType {
  className?: string;
  value?: React.Key | null;
  // 自定义前缀
  prefix?: React.ReactNode;
  // 自定义的选择框后缀图标
  suffixIcon?: React.ReactNode;
  // 自定义底部
  dropdownRenderComponent?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  options: option[];
  onChange?: (value: React.Key, option: any) => void;
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
  centered?: boolean;
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
  value?: string | number | null;
  label?: React.ReactNode;
  children?: CascaderOption[];
  disabled?: boolean;
  disableCheckbox?: boolean;
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
  // 名称
  label: string;
  desc: string;
  id: string;
  // 子选项
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

export interface Statistics {
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
  // 是否允许复制, 1 允许
  allowCopy: AllowCopyEnum;
  category: string;
  // 图片
  icon: string;
  id: number;
  // 仅展示模板, 0 否，1 是
  onlyTemplate: OnlyTemplateEnum;
  publishedSpaceIds: number[];
  // 名称
  name: string;
  // 简介
  description: string;
  // 创建时间
  created?: string;
  // 修改时间
  modified?: string;
  // 备注
  remark?: string;
  scope?: PluginPublishScopeEnum;
  // 统计信息
  statistics: Statistics | null;
  // 当前id
  spaceId?: number;
  // 正在使用的
  targetId: number | string;
  targetSubType: string;
  targetType: AgentComponentTypeEnum;
  // 发布人员信息
  publishUser?: CreatorInfo;
  collect?: boolean;
  type: NodeTypeEnum;
  shape?: NodeShapeEnum;
  typeId?: string | number;
  inputArgBindConfigs?: InputAndOutConfig[];
  outputArgBindConfigs?: InputAndOutConfig[];
  knowledgeBaseId?: number;
  config: any;
  toolName?: string;
  deployed?: string;
}

export interface MCPNodeItem {
  icon: string;
  targetId: number;
  targetType: AgentComponentTypeEnum.MCP;
  name: string;
  description: string;
  created: string;
  modified: string;
  status: string;
  deployedConfig: {
    prompts: any[];
    resources: any[];
    tools:
      | {
          name: string;
          inputArgs: InputAndOutConfig[];
          outputArgs: InputAndOutConfig[];
        }[]
      | null;
  };
  publishUser: CreatorInfo;
}

// 创建、编辑智能体
export interface CreateAgentProps {
  spaceId: number;
  mode?: CreateUpdateModeEnum;
  agentConfigInfo?: AgentConfigInfo;
  open: boolean;
  onCancel: () => void;
  onConfirmCreate?: (agentId: number) => void;
  onConfirmUpdate?: (info: AgentBaseInfo) => void;
}

// 创建、编辑知识库
export interface CreateKnowledgeProps {
  mode?: CreateUpdateModeEnum;
  type?:
    | AgentComponentTypeEnum.Table
    | AgentComponentTypeEnum.Knowledge
    | AgentComponentTypeEnum.Plugin
    | AgentComponentTypeEnum.Workflow;
  spaceId: number;
  knowledgeInfo?: KnowledgeInfo;
  open: boolean;
  onCancel: () => void;
  onConfirm?: (info: KnowledgeBaseInfo) => void;
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
  value: React.Key;
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
  [key: string]: React.Key | React.ReactNode;
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
  defaultImage?: string;
  imageUrl?: string;
  beforeUpload?: (file: FileType) => void;
  svgIconName?: string | null | undefined;
}

// 上传导入配置
export interface UploadImportConfigProps {
  spaceId: number;
  onUploadSuccess?: () => void;
  beforeUpload?: (file: FileType) => void;
}

export interface SubmitButtonProps {
  form: FormInstance;
  loading?: boolean;
  // 确定按钮前缀icon
  okPrefixIcon?: React.ReactNode;
  // 确定按钮文本
  okText?: string;
  onConfirm: () => void;
}

// 上传文件信息
export interface UploadFileInfo {
  url: string;
  name: string;
  type: string;
  key?: string;
  size: number;
  width?: number;
  height?: number;
  percent?: number;
  status?: UploadFileStatus;
  uid: string;
  response?: any;
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

// 插件发布弹窗组件
export interface PluginPublishProps {
  pluginId: number;
  scope?: PluginPublishScopeEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

// 插件入参、出参配置title组件
export interface PluginConfigTitleProps {
  className?: string;
  title: string;
  extra?: React.ReactNode;
  onClick: () => void;
}

// 手动选择组件属性
export interface ManualComponentItemProps {
  // 可手动选择的组件列表
  manualComponents?: AgentManualComponentInfo[];
  selectedComponentList?: AgentSelectedComponentInfo[];
  onSelectComponent?: (infos: AgentSelectedComponentInfo) => void;
}

// 聊天输入框组件
export interface ChatInputProps extends ManualComponentItemProps {
  className?: React.CSSProperties;
  // 所有组件禁用
  wholeDisabled?: boolean;
  // 清空按钮禁用
  clearDisabled?: boolean;
  visible?: boolean;
  // 发送消息后是否清空输入框, 默认true
  isClearInput?: boolean;
  onScrollBottom?: () => void;
  onClear?: () => void;
  onEnter: (message: string, files: UploadFileInfo[]) => void;
  showAnnouncement?: boolean;
  // 临时会话停止方法
  onTempChatStop?: (requestId: string) => void;
  loadingStopTempConversation?: boolean;
}

// 聊天框底部更多操作组件
export interface ChatBottomMoreProps {
  messageInfo: MessageInfo;
}

// 聊天框底部更多操作组件
export interface ChatBottomDebugProps {
  messageInfo: MessageInfo;
}

// 运行状态组件：进行中、运行完毕
export type RunOverProps = ChatBottomMoreProps;

// 'Tooltip省略号'组件
export interface EllipsisTooltipProps {
  className?: string;
  text: string | number;
  onClick?: () => void;
  // 气泡框位置，可选
  placement?:
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom';
}

// 参数名称label
export interface ParamsNameLabelProps {
  require?: boolean;
  paramName: string;
  paramType: DataTypeEnum;
}

// 展示台组件
export interface ShowStandProps {
  className?: string;
  cardList: CardDataInfo[];
  visible: boolean;
  onClose: () => void;
}

// 智能体、插件、工作流等发布范围属性
export interface PublishScope {
  key: string;
  name: string;
  spaceId?: number;
  scope: PluginPublishScopeEnum;
  children?: PublishScope[];
}

// 智能体、插件、工作流等迁移和复制组件
export interface MoveCopyComponentProps {
  spaceId: number;
  loading?: boolean;
  // 迁移、复制
  type?: ApplicationMoreActionEnum;
  // 组件类型: 智能体、插件、工作流， 默认智能体
  mode?: AgentComponentTypeEnum;
  // 是否是模板,如果是模板，”复制操作“展示所有空间列表，否则【空间创建者或空间管理员可复制到自己有权限的所有空间（这里涉及到会把关联的插件工作流一并发布到目标空间去），普通用户只能复制到本空间】
  isTemplate?: boolean;
  open: boolean;
  title?: string;
  onCancel: () => void;
  onConfirm: (spaceId: number) => void;
}

// 变量下拉参数配置
export interface VariableSelectConfig {
  // 数据源类型,可用值:MANUAL,PLUGIN
  dataSourceType: OptionDataSourceEnum;
  // 数据源类型,可用值:Agent,Plugin,Workflow,Knowledge,Table
  targetType: AgentComponentTypeEnum;
  // 插件或工作流ID，dataSource选择PLUGIN时有用
  targetId: number;
  // 插件或工作流名称
  targetName: string;
  // 插件或工作流描述
  targetDescription: string;
  // 插件或工作流图标
  targetIcon: string;
  // 下拉选项配置
  options: CascaderOption[];
}

export interface BindConfigWithSub {
  key: React.Key;
  // 参数名称，符合函数命名规则
  name: string;
  // 参数展示名称，供前端展示使用
  displayName: string;
  // 参数详细描述信息
  description: string;
  // 数据类型
  dataType?: DataTypeEnum;
  // 是否必须
  require?: boolean;
  // 是否为开启，如果不开启，插件使用者和大模型均看不见该参数；如果bindValueType为空且require为true时，该参数必须开启
  enable?: boolean;
  // 是否为系统内置变量参数，内置变量前端只可展示不可修改
  systemVariable?: boolean;
  // 值引用类型，Input 输入；Reference 变量引用,可用值:Input,Reference
  bindValueType?: BindValueType;
  // 参数值，当类型为引用时，示例 1.xxx 绑定节点ID为1的xxx字段；当类型为输入时，该字段为最终使用的值
  bindValue?: string;
  // 输入类型, Http插件有用,可用值:Query,Body,Header,Path
  inputType?: InputTypeEnum;
  subArgs?: BindConfigWithSub[];
  // 下拉参数配置
  selectConfig?: VariableSelectConfig;
  loopId?: number;
  children?: BindConfigWithSub[];
  [key: string]: any;
}

// 自定义disabled类型，继承BindConfigWithSub，添加disabled属性，用于控制组件是否禁用
export interface BindConfigWithSubDisabled extends BindConfigWithSub {
  disabled: boolean;
}

// 新对话设置组件属性
export interface NewConversationSetProps {
  className?: string;
  form: FormInstance;
  // 是否已填写表单
  isFilled?: boolean;
  disabled?: boolean;
  // 是否展示重置按钮
  showSubmitButton?: boolean;
  variables: BindConfigWithSub[];
  userFillVariables?: Record<string, string | number> | null;
  onConfirm?: (variableParams: Record<string, string | number>) => void;
}

// 无限滚动组件属性
export interface InfiniteScrollDivProps {
  // 滚动的目标元素,默认为 window
  scrollableTarget?: React.ReactNode;
  list: any[];
  hasMore: boolean;
  onScroll: () => void;
}

// 页脚props
export interface SiteFooterProps {
  text?: string;
}

// 直接继承antd的UploadFile，避免重复定义
export type NativeUploadFile = UploadFile;
