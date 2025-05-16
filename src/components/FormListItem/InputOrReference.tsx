import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Popover, Tag, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';
import { InputOrReferenceProps } from './type';

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

  const [selectKey, setSelectKey] = useState<React.Key[]>([value || '']);

  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    if (fieldName && form) {
      const basePath = fieldName.slice(0, -1);
      form.setFieldValue([...basePath, 'bindValueType'], valueType);

      if (valueType === 'Reference') {
        const refDataType = referenceList?.argMap?.[newValue]?.dataType;
        form.setFieldValue([...basePath, 'dataType'], refDataType || 'String');
        form.setFieldValue(fieldName, newValue);
        const _name = form.getFieldValue([...basePath, 'name']);
        if (!_name || isDisabled) {
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
    setIsModified(true); // 标记为已修改
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

  const renderTitle = (nodeData: InputAndOutConfig) => {
    return (
      <div>
        <span title="">{nodeData.name}</span>
        <Popover content={nodeData.description || '暂无描述'}>
          <InfoCircleOutlined title="" style={{ marginLeft: '4px' }} />
        </Popover>
        <Tag className="ml-20" color="#C9CDD4">
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };

  // 处理 TreeSelect 的选中事件
  const handleTreeSelectChange = (key: React.Key[]) => {
    console.log(key, 'key'); // 打印选中的节点 key 以进行调试
    if (!key || !key.length) return;
    updateValues(key[0] as string, 'Reference');
    setDisplayValue(getValue(key[0]));
    setSelectKey(key); // 更新 selectKey 状态
  };
  // 动态生成 Dropdown 的 items
  // 动态生成 Dropdown 的 items
  const getMenu = (nodes: PreviousList[]) => {
    if (nodes && nodes.length) {
      return nodes.map((node) => ({
        key: node.id,
        label: node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name,
        icon: returnImg(node.type),
        children: node.outputArgs
          ? [
              {
                key: `${node.id}-tree-select`,
                label: (
                  <Tree
                    onSelect={(keys) => {
                      handleTreeSelectChange(keys);
                    }}
                    defaultExpandAll
                    treeData={node.outputArgs}
                    fieldNames={{
                      title: 'name',
                      key: 'key',
                      children: 'children',
                    }}
                    titleRender={renderTitle}
                    defaultSelectedKeys={selectKey}
                    blockNode
                    className="custom-tree-style" // 添加自定义样式类
                  />
                ),
              },
            ]
          : undefined,
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
      return getMenu(referenceList.innerPreviousNodes);
    } else {
      return getMenu(referenceList.previousNodes);
    }
  };

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {referenceType === 'Reference' || referenceType === null ? (
        displayValue ? (
          <Tag
            closable
            onClose={handleTagClose}
            className="input-or-reference-tag text-ellipsis"
            color="#C9CDD4"
          >
            {displayValue.length > 10 ? (
              <Popover content={displayValue}>
                <span className="tag-text-style">{displayValue}</span>
              </Popover>
            ) : (
              <span className="tag-text-style">{displayValue}</span>
            )}
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
        className="input-reference-dropdown-style"
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
