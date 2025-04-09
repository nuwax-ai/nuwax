import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';
import { InputOrReferenceProps } from './type';

interface Event {
  key: string;

  keyPath: string[];

  domEvent: React.MouseEvent;
}
// 定义 mapChildren 的返回值类型
type MenuItem = {
  key: string;
  label: React.ReactNode;
  onClick: (e: Event) => void; // 修改为接收事件参数
  children?: MenuItem[];
};

const InputOrReference: React.FC<InputOrReferenceProps> = ({
  placeholder,
  form,
  fieldName,
  style,
  isDisabled = false,
  referenceType = 'Reference',
  isLoop,
  value, // 接收注入的 value
  onChange, // 接收注入的 onChange
}) => {
  const { referenceList, getValue, getLoopValue, setIsModified } =
    useModel('workflow');
  const [displayValue, setDisplayValue] = useState('');

  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    if (fieldName && form) {
      const basePath = fieldName.slice(0, -1);
      form.setFieldValue([...basePath, 'bindValueType'], valueType);

      if (valueType === 'Reference') {
        const refDataType = referenceList?.argMap?.[newValue]?.dataType;
        form.setFieldValue([...basePath, 'dataType'], refDataType || 'String');
        form.setFieldValue(fieldName, newValue);
        const _name = form.getFieldValue([...basePath, 'name']);
        if (!_name) {
          form.setFieldValue(
            [...basePath, 'name'],
            referenceList.argMap[newValue].name,
          );
        }
      } else {
        form.setFieldValue([...basePath, 'dataType'], 'String');
        form.setFieldValue(fieldName, newValue);
      }
    }
  };

  // 监听表单值变化
  useEffect(() => {
    if (fieldName && form) {
      const value = form.getFieldValue(fieldName);
      const bindValueType = form.getFieldValue([
        ...fieldName.slice(0, -1),
        'bindValueType',
      ]);

      if (bindValueType === 'Reference') {
        const isReferenceKey = value && referenceList.argMap[value];
        setDisplayValue(
          isReferenceKey
            ? isLoop
              ? getLoopValue(value)
              : getValue(value)
            : '',
        );
      } else {
        setDisplayValue(''); // Input类型时不显示Tag
      }
    }
  }, [form?.getFieldsValue(), referenceList.argMap]);

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input');
    setDisplayValue('');
  };

  // 输入处理
  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   updateValues(e.target.value, 'Input');
  // };

  // 新增递归处理函数
  const mapChildren = (items: InputAndOutConfig[], level = 0): MenuItem[] => {
    return items.map((item) => ({
      key: item.key!,
      label: (
        <div
          className="reference-item-child"
          style={{ marginLeft: level * 10 }}
        >
          <span>{item.name}</span>
          <Tag className="ml-20" color="#C9CDD4">
            {item.dataType}
          </Tag>
        </div>
      ),
      onClick: (e: Event) => {
        e.domEvent.stopPropagation(); // 阻止事件冒泡
        onChange?.(e.key!); // 使用注入的 onChange
        updateValues(e.key!, 'Reference');
        setDisplayValue(getValue(e.key!));
      },
      children: item.children
        ? mapChildren(item.children, level + 1)
        : undefined,
    }));
  };

  const changeMenuItem = (arr: PreviousList[]) => {
    if (arr.length > 0) {
      return arr.map((node) => ({
        key: node.id,
        label: node.name,
        icon: returnImg(node.type),
        children: node.outputArgs?.flatMap((arg) => [
          // 父级参数项
          {
            key: arg.key,
            label: (
              <div className="reference-item-child">
                <span>{arg.name}</span>
                <Tag className="ml-20" color="#C9CDD4">
                  {arg.dataType}
                </Tag>
              </div>
            ),
            onClick: () => {
              onChange?.(arg.key!); // 使用注入的 onChange
              updateValues(arg.key!, 'Reference');
              setDisplayValue(getValue(arg.key!));
            },
          },
          // 子参数项（递归处理）
          ...(arg.children ? mapChildren(arg.children) : []),
        ]),
      }));
    } else {
      return [
        {
          key: 'no-data',
          label: (
            <div style={{ padding: 8, color: 'red' }}>
              未添加上级节点连线或上级节点无参数
            </div>
          ),
          disabled: true,
        },
      ];
    }
  };

  const getMenuItems = () => {
    if (isLoop) {
      return changeMenuItem(referenceList.innerPreviousNodes);
    } else {
      return changeMenuItem(referenceList.previousNodes);
    }
  };

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {referenceType === 'Reference' ? (
        displayValue ? (
          <Tag
            closable
            onClose={handleTagClose}
            className="input-or-reference-tag text-ellipsis"
            color="#C9CDD4"
          >
            <span className="tag-text-style">{displayValue}</span>
          </Tag>
        ) : (
          <Input
            placeholder={placeholder || '请输入或引用参数'}
            style={{ marginRight: 8 }}
            size="small"
            disabled={isDisabled}
            onChange={(e) => {
              onChange?.(e.target.value);
              updateValues(e.target.value, 'Input');
            }}
          />
        )
      ) : (
        <Input
          placeholder={placeholder || '请输入或引用参数'}
          style={{ marginRight: 8 }}
          size="small"
          disabled={isDisabled}
          value={value}
          onChange={(e) => {
            setIsModified(true);
            onChange?.(e.target.value);
            updateValues(e.target.value, 'Input');
          }}
        />
      )}

      <Dropdown
        menu={{
          items: getMenuItems(), // 强制子菜单向左对齐
        }}
        trigger={['click']}
        overlayStyle={{ width: 200 }}
        placement="bottomLeft" // 设置弹窗向左对齐
      >
        <SettingOutlined
          style={{ cursor: 'pointer' }}
          className="input-reference-icon-style"
        />
      </Dropdown>
    </div>
  );
};

export default InputOrReference;
