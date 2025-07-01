import { Input } from 'antd';
import classnames from 'classnames';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';
const cx = classnames.bind(styles);
interface IEditableTitleProps {
  value: any;
  dataId: string;
  disabled?: boolean;
  onChange?: (value: any) => void;
  onSave?: (value: any) => boolean | Promise<boolean>;
  onEditingStatusChange?: (value: boolean) => void; // 编辑状态改变
}
const EditableTitle = memo(
  ({
    value,
    disabled,
    onChange,
    onSave,
    onEditingStatusChange,
    dataId,
  }: IEditableTitleProps) => {
    const editableTitleRef = useRef<HTMLDivElement>(null);
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

    const updateEditingStatus = useCallback(() => {
      setIsEditing(true);
    }, []);
    useEffect(() => {
      if (disabled) return;
      // 监听节点双击事件
      if (editableTitleRef.current) {
        editableTitleRef.current.addEventListener(
          'onEditTitle',
          updateEditingStatus,
        );
      }
      return () => {
        if (editableTitleRef.current) {
          editableTitleRef.current.removeEventListener(
            'onEditTitle',
            updateEditingStatus,
          );
        }
      };
    }, [editableTitleRef.current]);

    return (
      <div
        className="node-editable-title-text"
        data-id={dataId}
        ref={editableTitleRef}
      >
        {isEditing ? (
          <Input
            size="small"
            className={cx(styles.editableTitleInput)}
            autoFocus={isEditing}
            value={editValue}
            onChange={handleChange}
            onBlur={handleSave}
            onPressEnter={handleSave}
            onKeyDown={handleKeyDown}
          />
        ) : (
          <div className={cx(styles.clickableElement)}>{editValue}</div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.value === nextProps.value &&
      prevProps.disabled === nextProps.disabled &&
      prevProps.dataId === nextProps.dataId
    );
  },
);

export default EditableTitle;
