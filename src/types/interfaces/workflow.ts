import {
  InputAndOutConfig,
  NodePreviousAndArgMap,
} from '@/types/interfaces/node';
// 引入 AntV X6 图形库中的 Graph 和 Node 类，用于创建图形和节点。
import type { FieldConfig } from '@/components/FormListItem/type';
import { InputItemNameEnum } from '@/types/enums/node';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type {
  GroupModelItem,
  ModelListItemProps,
} from '@/types/interfaces/model';
import {
  HttpNodeConfig,
  IntentConfigs,
  NodeConfig,
  QANodeOption,
} from '@/types/interfaces/node';
import type { FormInstance } from 'antd';

/**
 * 定义键值对接口，用于表示具有标签和值的对象。
 */
export interface KeyValuePairs {
  // 键值对的标签
  label: string;
  // 键值对对应的值
  value: string;
}

/**
 * 定义 Child 接口，用于描述子节点的数据结构。
 */
export interface Child {
  // 子节点标题
  name: string;
  // 子节点显示的图像路径
  icon?: string | React.ReactNode; // 直接使用 SVGProps
  // 唯一标识符
  type: string;
  // 子节点的类型，可能用于区分不同种类的节点
  key: string;
  // 描述
  description: string;
  // 节点的id
  id?: number;
  // 如果涉及工作流、插件、数据库、知识库需要typeId
  typeId?: number;
  // 如果涉及循环，需要提供循环的节点id
  loopNodeId?: number;
}

/**
 * 定义 StencilList 接口，用于描述模板列表的数据结构。
 */
export interface StencilList {
  // 模板列表名称
  name: string;
  // 模板列表的唯一标识符
  key: string;
  // 模板列表中的子节点集合，遵循 Child 接口定义
  children: Child[];
}

/**
 * 定义 右侧节点数组设置。
 */
// 使用 antd 内置的 FormListFieldData 类型
export type FormListFieldData = {
  key: string | number;
  name: string | number;
  fieldKey?: string | number;
};

/**
 * 定义节点
 */
export interface NodeDisposeProps {
  // 上级传递下来的form
  form: FormInstance;
  // 当前节点的类型
  type?: string;
  // 直接修改modified
  setModified?: () => void;
  // 分组的模型列表
  groupedOptionsData?: GroupModelItem[];
  retrieveCurrentNodeConfig?: () => void;
}

/**
 * 定义Http节点
 */
export interface HttpNodeDisposeProps {
  // 当前节点的参数
  params: HttpNodeConfig;
  // 修改节点信息
  Modified: (params: NodeConfig) => void;
  // 当前节点的类型
  type?: string;
  // 选项列表
  options?: ModelListItemProps[];
  // 分组的模型列表
  groupedOptionsData?: GroupModelItem[];
}
/**
 * 定义带勾选框的select
 */
export interface MultiSelectWithCheckboxProps {
  options: KeyValuePairs[];
  onChange?: (selectedOptions: string[]) => void;
  placeholder?: string;
}

export interface ReferenceList {
  label: string;
  key: string;
  icon?: React.ReactNode;
  children?: Array<{ label: string; key: string; tag: string }>;
}

// 定义输入或引用参数
export interface InputOrReferenceProps {
  // 当前的引用列表
  referenceList: ReferenceList[];
  // 与输入
  placeholder?: string;
  // 新增：接受当前值
  value: string;
  // 父组件传递的方法，改变当前的值，渲染页面
  onChange: (value: string) => void;
}

// 定义传递给 renderItem 的参数类型
export interface RenderItemProps {
  // 当前字段的field
  field: FormListFieldData;
  // 删除当前行
  onRemove: () => void;
  // 当前渲染的详细信息
  fieldConfigs: FieldConfig[];
  // 父组件传递下来的form
  form: FormInstance;
  fieldName: (string | number)[];
  // 当前值改变的时候，通知父组件，重新获取值
  onChange: () => void;
  referenceList: NodePreviousAndArgMap;
  //   预显示的值，(通常用于二次编辑的时候)
  initialValues?: object;
  // 是否渲染复选框
  showCheckbox?: boolean;
  // 是否显示复制按钮
  showCopy?: boolean;
}

export interface InitialValues {
  inputArgs?: InputAndOutConfig[];
  outputArgs?: InputAndOutConfig[];
  variableArgs?: InputAndOutConfig[];
  conditionBranchConfigs?: InputAndOutConfig[];
  headers?: InputAndOutConfig[];
  body?: InputAndOutConfig[];
  queries?: InputAndOutConfig[];
  options?: QANodeOption[];
  intentConfigs?: IntentConfigs[];
}

// 定义通用节点渲染逻辑的props类型
export interface NodeRenderProps {
  // 标题
  title: string;
  // 遍历渲染的字段配置
  fieldConfigs: FieldConfig[];
  form: FormInstance;
  // 如果有多个相同组件时，传递不同的inputListName区分
  inputItemName?: InputItemNameEnum;
  // 是否显示复制按钮
  showCopy?: boolean;
  style?: any;
  //   不显示新增按钮
  disabledAdd?: boolean;
  // 不显示删除按钮
  disabledDelete?: boolean;
  // 禁止输入参数名
  disabledInput?: boolean;
  // 当前是循环节点
  isLoop?: boolean;
  isVariable?: boolean;
}

// 定义通用的formList的props类型
export interface FormListProps {
  // 标题
  title: string;
  form: FormInstance;
  updateNode?: (params: NodeConfig) => void;
  // 当前input的field
  field: string;
  // 如果有多个相同组件时，传递不同的inputListName区分
  inputItemName?: InputItemNameEnum;
  // 是否要写入uuid
  hasUuid?: boolean;
  showIndex?: boolean;
}

// 定义技能
export interface SkillProps {
  form: FormInstance;
  params: CreatedNodeItem[];
  // 当前技能的参数名称
  skillName: 'knowledgeBaseConfigs' | 'skillComponentConfigs';
  // 移出技能
  removeItem: (id: CreatedNodeItem) => void;
  // 修改技能参数
  modifyItem: (id: CreatedNodeItem) => void;
}

export interface SkillDisposeProps {
  open: boolean;
  onCancel: () => void;
  params: CreatedNodeItem;
  onConfirm: (val: CreatedNodeItem) => void;
}

// 定义分组的模型列表
export interface GroupModelListItemProps {
  groupedOptionsData?: GroupModelItem[];
  onChange: (value: string) => void;
  value?: string;
}

export interface ModelSettingProp {
  value: {
    top: number;
    reply: number;
    random: number;
  };
  onChange: (newSettings: {
    top: number;
    reply: number;
    random: number;
  }) => void;
}

export interface ModelSelectProp {
  settings: ModelSettingProp;
  groupModelList: GroupModelListItemProps;
}

// 定义树结构的输出
export interface TreeOutputProps {
  treeData: InputAndOutConfig[];
}

// 定义可以展开的inputTextarea
export interface ExpandableInputTextareaProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  onExpand?: () => void;
}

export interface ConditionListProps {
  index: number;
  title: string;
  // 改变节点的入参和出参
  form: FormInstance;
  // 删除当前的
  removeItem: (val: string) => void;
  // 如果有多个相同组件时，传递不同的inputListName区分
  inputItemName?: string;
}

// 先封装一个组件
export interface ConditionProps {
  // 当前字段的field
  field: FormListFieldData;
  // 删除当前行
  onRemove: () => void;
  // 父组件传递下来的form
  form: FormInstance;
  // 当前值改变的时候，通知父组件，重新获取值
  onChange: () => void;
  inputItemName: string;
}

// 定义错误列表
export interface ErrorListItem {
  nodeId: number;
}
export interface ErrorItem {
  nodeId?: number;
  error: string;
}
export interface ErrorParams {
  errorList: ErrorItem[];
  show: boolean;
}

export interface InputListProps {
  form: FormInstance;
  title: string;
  inputItemName: string;
}

export interface TreeFormProps {
  params?: InputAndOutConfig[];
  // 外部传递进来的form
  form: FormInstance;
  // 标题
  title?: string;
  inputItemName?:
    | 'inputArgs'
    | 'outputArgs'
    | 'variableArgs'
    | 'conditionBranchConfigs'
    | 'skillComponentConfigs'
    | 'body';
}
