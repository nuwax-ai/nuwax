import type { ReactNode } from 'react';

/**
 * OperationBtn 组件属性定义
 * @template T 记录的数据类型
 */
export interface OperationBtnProps<T> {
  /** 当前行记录数据 */
  record: T;

  /** 按钮名称，将以 Tooltip 形式展示 */
  label: string;

  /** 按钮图标（可选） */
  icon?: ReactNode;

  /** 自定义 Tooltip 内容（可选，未设置时默认使用 label） */
  tooltip?: string;

  /** 按钮点击事件 */
  onClick?: (record: T) => void | Promise<any>;

  /** 是否禁用 */
  disabled?: boolean | ((record: T) => boolean);

  /** 是否显示 */
  visible?: boolean | ((record: T) => boolean);

  /** 按钮类型 */
  type?: 'primary' | 'default' | 'link' | 'text';

  /** 展现模式：button (图标) | link (链接) | plain (纯净渲染，用于下拉菜单) */
  variant?: 'button' | 'link' | 'plain';

  /** 危险按钮样式 */
  danger?: boolean;

  /**
   * Modal 确认框配置
   * 如果配置了该项，点击时会先触发 Modal.confirm
   */
  confirm?: {
    title?: ReactNode | ((record: T) => ReactNode);
    description?: ReactNode | ((record: T) => ReactNode);
    okText?: string;
    cancelText?: string;
  };

  /**
   * Popconfirm 气泡确认框配置
   * 如果配置了该项，点击时会先触发 Popconfirm 气泡
   */
  popconfirm?: {
    title?: ReactNode | ((record: T) => ReactNode);
    description?: ReactNode | ((record: T) => ReactNode);
    okText?: string;
    cancelText?: string;
    placement?: any;
  };

  /** 强制开启加载状态 */
  loading?: boolean;

  /** 自定义样式类名 */
  className?: string;

  /** 自定义样式对象 */
  style?: React.CSSProperties;

  /** 按钮文字内容，用于非图标模式 */
  children?: ReactNode;
}
