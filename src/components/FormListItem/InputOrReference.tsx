import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';
import { InputOrReferenceProps } from './type';
const InputOrReference: React.FC<InputOrReferenceProps> = ({
  placeholder,
  value,
  onChange,
  form, // Form 实例（从父组件传入）
  fieldName, // 当前字段路径（如 "inputItems[0].bindValue"）
  style,
  isDisabled = false,
  referenceType = 'Reference',
  isLoop,
}) => {
  const { referenceList, getValue, getLoopValue } = useModel('workflow');

  const [newValue, setNewValue] = useState('');

  const [inputValue, setInputValue] = useState('');

  const [noRefernece, setNoRefernece] = useState('');
  // InputOrReference.tsx
  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    if (fieldName && form) {
      // 获取父路径数组
      const basePath = fieldName.slice(0, -1);
      form.setFieldValue([...basePath, 'bindValueType'], valueType); // 使用数组路径
      //  新增 dataType 处理逻辑
      if (valueType === 'Reference') {
        const refDataType = referenceList?.argMap?.[newValue]?.dataType;
        form.setFieldValue([...basePath, 'dataType'], refDataType || 'String');
        // 获取当前的name
        const _name = form.getFieldValue([...basePath, 'name']);
        if (!_name) {
          form.setFieldValue(
            [...basePath, 'name'],
            referenceList.argMap[newValue].name,
          );
        }
      } else {
        form.setFieldValue([...basePath, 'dataType'], 'String');
      }
    }
    onChange?.(newValue, valueType);
  };
  // 输入处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    updateValues(newValue, 'Input');
  };

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input'); // 清空时重置为 Input 类型
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
            onClick: () => updateValues(arg.key!, 'Reference'),
            // style: { background: '#f5f5f5' }, // 添加父项背景色
          },
          // 子参数项（如果有）
          ...(arg.children || []).map((item: InputAndOutConfig) => ({
            key: item.key,
            label: (
              <div className="reference-item-child ml-20">
                <span>{item.name}</span>
                <Tag className="ml-20" color="#C9CDD4">
                  {item.dataType}
                </Tag>
              </div>
            ),
            onClick: () => updateValues(item.key!, 'Reference'),
          })),
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

  // 监听value和referenceList变化
  useEffect(() => {
    if (isLoop) {
      setNewValue(getLoopValue(value));
    } else {
      setNewValue(getValue(value));
    }
    setInputValue(value);
  }, [value, referenceList]);

  // // 初始化时设置值
  // useEffect(() => {
  //   setNewValue(getValue(value));
  // }, []);

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {referenceType === 'Reference' ? (
        newValue.length ? (
          <Tag
            closable
            onClose={handleTagClose}
            className="input-or-reference-tag text-ellipsis"
            color="#C9CDD4"
          >
            <span className="tag-text-style">{newValue}</span>
          </Tag>
        ) : (
          <Input
            value={noRefernece}
            placeholder={placeholder || '请输入或引用参数'}
            onChange={(e) => setNoRefernece(e.target.value)}
            onBlur={handleInputChange}
            style={{ marginRight: 8 }}
            size="small"
            disabled={isDisabled}
          />
        )
      ) : (
        <Input
          value={inputValue}
          placeholder={placeholder || '请输入或引用参数'}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleInputChange}
          style={{ marginRight: 8 }}
          size="small"
          disabled={isDisabled}
        />
      )}

      <Dropdown
        menu={{ items: getMenuItems() }}
        trigger={['click']}
        overlayStyle={{ width: 200 }}
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
