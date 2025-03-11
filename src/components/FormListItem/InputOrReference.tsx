import { InputAndOutConfig } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';
import React, { useEffect } from 'react';
import './index.less';
import { InputOrReferenceProps } from './type';

const InputOrReference: React.FC<InputOrReferenceProps> = ({
  referenceList,
  placeholder,
  value,
  onChange,
  // 新增必要参数
  form, // Form 实例（从父组件传入）
  fieldName, // 当前字段路径（如 "inputItems[0].bindValue"）
  style,
  isDisabled = false,
  referenceType = 'Reference',
}) => {
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

  // 获取父节点名称
  const getName = (value: string) => {
    let _id = value.split('.')[0];
    if (_id.includes('-')) {
      _id = _id.split('-')[0];
    }
    const parentNode = referenceList.previousNodes.find(
      (item) => item.id === Number(_id),
    );
    return parentNode?.name;
  };

  // 生成下拉菜单项
  const menuItems =
    referenceList.previousNodes.length > 0
      ? referenceList.previousNodes.map((node) => ({
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
                  <Tag className="ml-20" color="#65656687">
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
                  <Tag className="ml-20" color="#65656687">
                    {item.dataType}
                  </Tag>
                </div>
              ),
              onClick: () => updateValues(item.key!, 'Reference'),
            })),
          ]),
        }))
      : [
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

  useEffect(() => {
    // if (!value) return
    // 只有当referenceList发生变化时才处理
    if (referenceType === 'Reference') {
      const previousNodes = referenceList.previousNodes;
      if (value) {
        if (
          previousNodes.length &&
          previousNodes[0].id !== 1 &&
          previousNodes[0].name !== '测试'
        ) {
          if (referenceList.argMap && !referenceList.argMap[value]) {
            updateValues?.('', 'Input'); // 清除当前值并重置为Input类型
          }
        }
      }
    }
  }, [referenceList]);

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {value && referenceList.argMap[value] ? (
        <Tag
          closable
          onClose={handleTagClose}
          className="input-or-reference-tag text-ellipsis"
          color="#65656687"
        >
          <span className="tag-text-style">
            {' '}
            {`${getName(value)} - ${referenceList.argMap[value].name}`}
          </span>
        </Tag>
      ) : (
        <Input
          value={value}
          placeholder={placeholder || '请输入或引用参数'}
          onChange={handleInputChange}
          style={{ marginRight: 8 }}
          size="small"
          disabled={isDisabled}
        />
      )}

      <Dropdown
        menu={{ items: menuItems }}
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
