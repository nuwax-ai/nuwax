import { modalConfirm } from '@/utils/ant-custom';
import { Button, Popconfirm, Tooltip } from 'antd';
import classNames from 'classnames';
import { useState } from 'react';
import styles from './index.less';
import type { OperationBtnProps } from './types';

/**
 * 通用操作按钮组件
 * @description 支持 Tooltip、Hover 背景变化、Modal/Popconfirm 确认、异步 Loading 态
 */
const OperationBtn = <T extends object>(props: OperationBtnProps<T>) => {
  const {
    record,
    label,
    icon,
    onClick,
    disabled = false,
    visible = true,
    confirm,
    popconfirm,
    loading: externalLoading,
    className,
    style,
    danger = false,
    children,
    type = 'text',
    variant,
  } = props;

  const [innerLoading, setInnerLoading] = useState(false);

  // 计算显示状态
  const isVisible = typeof visible === 'function' ? visible(record) : visible;
  if (!isVisible) return null;

  // 计算禁用状态
  const isDisabled =
    typeof disabled === 'function' ? disabled(record) : disabled;
  const isLoading = externalLoading ?? innerLoading;

  // 处理点击逻辑（核心流程：Modal 确认 -> 异步 onClick -> 完成）
  const handleClick = async () => {
    if (isDisabled || isLoading) return;

    // 执行业务逻辑的封装
    const executeAction = async () => {
      if (onClick) {
        try {
          const result = onClick(record);
          if (result instanceof Promise) {
            setInnerLoading(true);
            await result;
          }
        } finally {
          setInnerLoading(false);
        }
      }
    };

    // 如果配置了 Modal 型 confirm
    if (confirm) {
      const title =
        typeof confirm.title === 'function'
          ? confirm.title(record)
          : confirm.title;
      const content =
        typeof confirm.description === 'function'
          ? confirm.description(record)
          : confirm.description;

      modalConfirm(
        title || '确认操作',
        content || '确定执行该操作吗？',
        executeAction,
      );
      return;
    }

    // 普通点击或已被 Popconfirm 包裹的情形
    await executeAction();
  };

  // 基础按钮渲染
  const renderButton = () => (
    <Button
      className={classNames(styles['operation-btn'], className, {
        [styles['operation-btn-danger']]: danger,
        [styles['operation-btn-link']]: type === 'link',
      })}
      style={style}
      icon={icon}
      size="small"
      disabled={isDisabled}
      loading={isLoading}
      type={type}
      onClick={popconfirm ? undefined : handleClick} // 如果有 Popconfirm，则由 Popconfirm 控制触发
    >
      {children}
    </Button>
  );

  // 纯文本渲染（用于下拉菜单项，还原原始样式）
  const renderPlain = () => (
    <span
      className={classNames(styles['operation-btn-plain'], className, {
        [styles['operation-btn-danger']]: danger,
      })}
      style={{
        cursor: isDisabled || isLoading ? 'not-allowed' : 'pointer',
        color: danger ? undefined : 'inherit',
        opacity: isDisabled ? 0.5 : 1,
        ...style,
      }}
      onClick={popconfirm ? undefined : handleClick}
    >
      {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
      {children}
      {isLoading && <span style={{ marginLeft: 4 }}>...</span>}
    </span>
  );

  const btnWithPopconfirm = popconfirm ? (
    <Popconfirm
      title={
        typeof popconfirm.title === 'function'
          ? popconfirm.title(record)
          : popconfirm.title
      }
      description={
        typeof popconfirm.description === 'function'
          ? popconfirm.description(record)
          : popconfirm.description
      }
      onConfirm={handleClick}
      okText={popconfirm.okText}
      cancelText={popconfirm.cancelText}
      placement={popconfirm.placement || 'topRight'}
      disabled={isDisabled || isLoading}
    >
      {variant === 'plain' ? renderPlain() : renderButton()}
    </Popconfirm>
  ) : variant === 'plain' ? (
    renderPlain()
  ) : (
    renderButton()
  );

  // 包装 Tooltip (最外层)
  // 修正：如果是 type === 'link'，一般作为传统的文字操作链接，不需要外层容器和 Tooltip，保持原始样式
  if (type === 'link') {
    return btnWithPopconfirm;
  }

  return (
    <div className={styles['operation-btn-container']}>
      <Tooltip title={label} mouseEnterDelay={0.5}>
        {btnWithPopconfirm}
      </Tooltip>
    </div>
  );
};

export default OperationBtn;
