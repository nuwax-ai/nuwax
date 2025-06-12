import useClickPreventionOnDoubleClick from '@/hooks/useClickPreventionOnDoubleClick';
import { Input } from 'antd';
import classnames from 'classnames';
import { memo, useEffect, useState } from 'react';
import styles from './index.less';
const cx = classnames.bind(styles);
const ClickableElement = ({
  children,
  onClick,
  onDoubleClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
  onDoubleClick: () => void;
}) => {
  const [handleClick, handleDoubleClick] = useClickPreventionOnDoubleClick(
    onClick,
    onDoubleClick,
  );
  return (
    <span
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cx(styles.clickableElement)}
    >
      {children}
    </span>
  );
};
interface IEditableTitleProps {
  value: string | number;
  disabled?: boolean;
  onChange?: (value: string | number) => void;
  onSave?: (value: string | number) => Promise<boolean> | boolean;
  onEditingStatusChange?: (value: boolean) => void; // 编辑状态改变
}
const EditableTitle = memo(
  ({
    value,
    disabled,
    onChange,
    onSave,
    onEditingStatusChange,
  }: IEditableTitleProps) => {
    const [editValue, setEditValue] = useState(value);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
      setEditValue(value);
    }, [value]);

    useEffect(() => {
      onEditingStatusChange?.(isEditing);
    }, [isEditing]);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const _value = e.target.value;
      setEditValue(_value);
      onChange?.(value);
    };
    /**
     * 保存 在用户完成编辑后调用 如果内容与原内容不一致 则调用onSave
     */
    const handleSave = async () => {
      if (editValue === value) {
        // 如果内容与原内容一致 则不调用onSave
        setIsEditing(false);
        return false;
      }
      const _res = (await onSave?.(editValue)) || true;
      if (_res) {
        setIsEditing(false);
      }
      return _res;
    };
    const handleCancel = () => {
      //如果内容与原内容不一致 则还原为原内容
      if (editValue !== value) {
        setEditValue(value);
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        // 按下esc键 取消编辑
        handleCancel();
      }
    };
    console.log('EditableTitle render', editValue);
    return (
      <div>
        {isEditing ? (
          <Input
            className={cx(styles.editableTitleInput)}
            autoFocus={isEditing}
            value={editValue}
            onChange={handleChange}
            onBlur={handleSave}
            onPressEnter={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <ClickableElement
            onClick={() => {}}
            onDoubleClick={() => {
              if (disabled) return; // 如果节点不可编辑，则不进行编辑
              setIsEditing(true);
            }}
          >
            {editValue}
          </ClickableElement>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled
    );
  },
);

export default EditableTitle;
