import { Button } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ButtonToggleOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface ButtonToggleProps {
  /** 选项数据 */
  options: ButtonToggleOption[];
  /** 当前选中的值 */
  value?: string | number | (string | number)[];
  /** 默认选中的值 */
  defaultValue?: string | number | (string | number)[];
  /** 是否多选模式 */
  multiple?: boolean;
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 值变化回调 */
  onChange?: (value: string | number | (string | number)[]) => void;
}

const ButtonToggle: React.FC<ButtonToggleProps> = ({
  options = [],
  value,
  defaultValue,
  multiple = false,
  size = 'middle',
  disabled = false,
  className,
  style,
  onChange,
}) => {
  // 内部状态管理
  const [internalValue, setInternalValue] = useState<
    string | number | (string | number)[]
  >(() => {
    if (value !== undefined) return value;
    if (defaultValue !== undefined) return defaultValue;
    return multiple ? [] : '';
  });

  // 获取当前值
  const currentValue = value !== undefined ? value : internalValue;

  // 判断选项是否被选中
  const isSelected = useCallback(
    (optionValue: string | number) => {
      if (multiple) {
        return (
          Array.isArray(currentValue) && currentValue.includes(optionValue)
        );
      }
      return currentValue === optionValue;
    },
    [currentValue, multiple],
  );

  // 处理点击事件
  const handleClick = useCallback(
    (optionValue: string | number) => {
      if (disabled) return;

      let newValue: string | number | (string | number)[];

      if (multiple) {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        if (currentArray.includes(optionValue)) {
          // 取消选中
          newValue = currentArray.filter((v) => v !== optionValue);
        } else {
          // 添加选中
          newValue = [...currentArray, optionValue];
        }
      } else {
        // 单选模式
        newValue = optionValue;
      }

      // 更新内部状态
      if (value === undefined) {
        setInternalValue(newValue);
      }

      // 触发回调
      onChange?.(newValue);
    },
    [currentValue, multiple, disabled, value, onChange],
  );

  return (
    <div className={cx(styles.buttonToggle, className)} style={style}>
      {options.map((option) => {
        const selected = isSelected(option.value);
        const buttonDisabled = disabled || option.disabled;

        return (
          <Button
            key={option.value}
            size={size}
            type={selected ? 'primary' : 'default'}
            disabled={buttonDisabled}
            className={cx(styles.toggleButton, {
              [styles.selected]: selected,
              [styles.disabled]: buttonDisabled,
            })}
            onClick={() => handleClick(option.value)}
          >
            {option.label}
          </Button>
        );
      })}
    </div>
  );
};

export default ButtonToggle;
