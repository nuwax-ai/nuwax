import { InputAndOutConfig, PreviousList } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Tag, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';

interface InputOrReferenceProps {
  placeholder?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
  referenceType?: 'Input' | 'Reference';
  isLoop?: boolean;
  value?: string;
  onChange?: (value: string, type: 'Input' | 'Reference') => void;
}

const InputOrReference: React.FC<InputOrReferenceProps> = ({
  placeholder,
  style,
  isDisabled = false,
  referenceType = 'Reference',
  value,
  onChange,
}) => {
  const { referenceList, getValue, setIsModified } = useModel('workflow');
  const [displayValue, setDisplayValue] = useState('');
  const [inputValue, setInputValue] = useState(''); // 新增状态用于存储输入框的值
  const updateValues = (newValue: string, valueType: 'Input' | 'Reference') => {
    onChange?.(newValue, valueType);
    if (valueType === 'Reference') {
      setDisplayValue(newValue);
    }
    setIsModified(true); // 标记为已修改
  };

  // 监听值变化
  useEffect(() => {
    if (referenceType === 'Reference' && value) {
      const isReferenceKey = value && referenceList.argMap[value];
      setDisplayValue(isReferenceKey ? getValue(value) : '');
    } else {
      setDisplayValue('');
      if (referenceType === 'Input') {
        setInputValue(value || '');
      }
    }
  }, [value, referenceList.argMap, referenceType]);

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input');
    setDisplayValue('');
  };
  const renderTitle = (nodeData: InputAndOutConfig) => {
    return (
      <div>
        <span>{nodeData.name}</span>
        <Tag className="ml-20" color="#C9CDD4">
          {nodeData.dataType}
        </Tag>
      </div>
    );
  };
  // 处理 TreeSelect 的选中事件
  const handleTreeSelectChange = (key: React.Key[]) => {
    updateValues(key[0] as string, 'Reference');
    setDisplayValue(getValue(key[0]));
  };
  // 动态生成 Dropdown 的 items
  const getMenu = (nodes: PreviousList[]) => {
    if (nodes && nodes.length) {
      return nodes.map((node) => ({
        key: node.id,
        label: node.name,
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
    return getMenu(referenceList.previousNodes);
  };

  return (
    <div className="input-or-reference dis-sb" style={style}>
      {referenceType === 'Reference' && displayValue !== '' ? (
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
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
          }}
          onBlur={() => {
            updateValues(inputValue, 'Input');
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
