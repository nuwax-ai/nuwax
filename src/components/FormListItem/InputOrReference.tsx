import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag } from 'antd';

import { InputAndOutConfig } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { useEffect } from 'react';
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
  returnObj = false,
}) => {
  useEffect(() => {
    if (
      referenceList.previousNodes &&
      !referenceList.previousNodes.length &&
      value
    ) {
      if (fieldName && form) {
        const basePath = fieldName.slice(0, -1);
        // 获取当前的bindValueType
        const _bindValueType = form?.getFieldValue([
          ...basePath,
          'bindValueType',
        ]);
        if (_bindValueType === 'Reference') {
          form.setFieldValue([...basePath, 'bindValue'], '');
        }
      }
    }
  }, [referenceList.previousNodes]);
  // InputOrReference.tsx
  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    if (fieldName && form) {
      // 获取父路径数组
      const basePath = fieldName.slice(0, -1);
      form.setFieldValue([...basePath, 'bindValueType'], valueType); // 使用数组路径
      // 顺便修改参数名

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
    if (returnObj) {
      const _values = referenceList.argMap[newValue];
      onChange?.(JSON.stringify(_values));
      return;
    }
    onChange?.(newValue);
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
    const _id = value.split('.')[0];
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
          children: node.outputArgs?.map((arg) => ({
            key: arg.key,
            label: (
              <div
                style={{ display: 'flex', alignItems: 'center', width: 300 }}
              >
                {arg.name}
                <Tag style={{ marginLeft: 20 }}>{arg.dataType}</Tag>
              </div>
            ),
            onClick: () => updateValues(arg.key!, 'Reference'), // 选择时标记为引用类型
          })),
        }))
      : [
          {
            key: 'no-data',
            label: (
              <div style={{ padding: 8, color: 'red' }}>
                需要上级节点添加连线
              </div>
            ),
            disabled: true,
          },
        ];

  // 生成名称
  const getObjName = (value: InputAndOutConfig) => {
    const key = value.key?.split('.')[0];
    const parent = referenceList.previousNodes.find(
      (item) => item.id === Number(key),
    );

    if (parent) {
      return `${parent.name} - ${value.name}`;
    }
  };

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {(() => {
        // 预计算通用条件
        const hasValue = !!value;
        const isReturnObjMode = returnObj;
        let parsedValue = null;
        let isValidObject = false;

        if (isReturnObjMode) {
          try {
            // 增加 null/undefined 校验
            if (value === '') {
              return (
                <Input
                  value={value}
                  placeholder={placeholder}
                  style={{ marginRight: 8, color: 'red' }}
                  size="small"
                />
              );
            }

            parsedValue = JSON.parse(value);
            isValidObject =
              parsedValue &&
              typeof parsedValue === 'object' &&
              !Array.isArray(parsedValue);
          } catch (e) {
            return (
              <Input
                value={value ?? ''}
                placeholder={placeholder}
                onChange={handleInputChange}
                style={{ marginRight: 8, color: 'red' }}
                size="small"
              />
            );
          }
        }

        // 处理引用模式
        const isReference = hasValue && referenceList.argMap[value];

        // 统一渲染逻辑
        if (isReturnObjMode) {
          return isValidObject ? (
            <Tag
              closable
              onClose={handleTagClose}
              className="input-or-reference-tag text-ellipsis"
              color="#65656687"
            >
              {getObjName(parsedValue)}
            </Tag>
          ) : (
            <Input
              value={value || ''}
              placeholder={placeholder || '请输入或引用参数'}
              onChange={handleInputChange}
              style={{ marginRight: 8 }}
              size="small"
            />
          );
        }

        // 非对象模式
        return isReference ? (
          <Tag
            closable
            onClose={handleTagClose}
            className="input-or-reference-tag text-ellipsis"
            color="#65656687"
          >
            {`${getName(value)} - ${
              referenceList.argMap[value]?.name || '未知参数'
            }`}
          </Tag>
        ) : (
          <Input
            value={value || ''}
            placeholder={placeholder || '请输入或引用参数'}
            onChange={handleInputChange}
            style={{ marginRight: 8 }}
            size="small"
          />
        );
      })()}
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
