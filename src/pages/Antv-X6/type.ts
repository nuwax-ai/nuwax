// 引入 AntV X6 图形库中的 Graph 和 Node 类，用于创建图形和节点。
import { Graph, Node } from '@antv/x6';
import { FormInstance } from 'antd';
/**
 * 定义键值对接口，用于表示具有标签和值的对象。
 */
interface KeyValuePairs {
  // 键值对的标签
  label: string;
  // 键值对对应的值
  value: string;
}

/**
 * 定义 NodeProps 接口，用于定义传递给自定义节点组件的属性。
 */
export interface NodeProps {
  // 节点实例，类型为 AntV X6 的 Node 类型，泛型参数可以是任何类型
  node: Node<any>;
  // 图实例，类型为 AntV X6 的 Graph 类型
  graph: Graph;
  // 操作节点
  onChange?: (action: string, nodeData: Child) => void;
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
 * 定义 GraphProp 接口，用于描述图组件的属性。
 */
export interface GraphProp {
  // 包含图的 DOM 容器的 ID
  containerId: string;
  // 改变抽屉内容的回调函数，接收一个 Child 类型的参数
  changeDrawer: (item: Child) => void;
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
  type?: string;
}

// 定义输入或引用参数
export interface InputOrReferenceProps {
  referenceList: Array<{
    label: string;
    key: string;
    icon?: React.ReactNode;
    children?: Array<{ label: string; key: string; tag: string }>;
  }>;
  placeholder: string;
  value: string; // 新增：接受当前值
  onChange: (value: string) => void; // 新增：接受值变化的回调
}

// 定义输入项配置类型
export interface FieldConfig {
  name: string;
  placeholder?: string;
  rules?: any[];
  component: React.ComponentType<any>;
  style?: React.CSSProperties;
  props?: Record<string, any>; // 用于传递特定组件的属性
  label: string;
}

// 定义传递给 renderItem 的参数类型
export interface RenderItemProps {
  field: FormListFieldData;
  onRemove: () => void;
  fieldConfigs: FieldConfig[];
  rowIndex: number;
  form: FormInstance;
  showCheckbox?: boolean;
  showCopy?: boolean;
  showAssociation?: boolean;
}

// 定义通用节点渲染逻辑的props类型
export interface NodeRenderProps {
  title: string;
  fieldConfigs: FieldConfig[];
  renderItem?: (props: RenderItemProps) => JSX.Element; // 可选，允许自定义renderItem
  initialValues: object;
  showCheckbox?: boolean;
  showCopy?: boolean;
  showAssociation?: boolean;
}

// 定义技能
export interface SkillProps {
  title: string;
  icon: React.ReactNode;
  desc: string;
}

// 定义模型列表
export interface ModelListItemProps {
  // 模型的图标
  icon: React.ReactNode;
  // 模型的名称
  label: string;
  // 模型的大小
  size: string | number;
  // 模型的id
  modelName: string;
  // 模型的简介
  desc: string;
  // 模型的标签
  tagList?: string[];
}
