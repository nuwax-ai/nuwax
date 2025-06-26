import { DataTypeEnum } from '@/types/enums/common';
import {
  InputAndOutConfig,
  NodePreviousAndArgMap,
  PreviousList,
} from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { Dropdown, Input, Popover, Tag, Tree } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';

interface InputOrReferenceProps {
  data: NodePreviousAndArgMap;
  placeholder?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
  referenceType?: 'Input' | 'Reference';
  isLoop?: boolean;
  value?: string;
  onChange?: (
    value: string,
    type: 'Input' | 'Reference',
    dataType: DataTypeEnum,
  ) => void;
}

const InputOrReference: React.FC<InputOrReferenceProps> = ({
  placeholder,
  data,
  style,
  isDisabled = false,
  referenceType = 'Reference',
  value,
  onChange,
}) => {
  const { getValue, setIsModified } = useModel('workflow');
  const [displayValue, setDisplayValue] = useState('');
  const updateValues = (
    newValue: string,
    valueType: 'Input' | 'Reference',
    dataType: DataTypeEnum,
  ) => {
    onChange?.(newValue, valueType, dataType);
    setDisplayValue(newValue);
    setIsModified(true); // 标记为已修改
  };

  // 监听值变化
  useEffect(() => {
    if (referenceType === 'Reference' && value) {
      const isReferenceKey = value && data.argMap[value];
      setDisplayValue(isReferenceKey ? getValue(value) : '');
    } else {
      setDisplayValue(value || '');
    }
  }, [value, data.argMap, referenceType]);

  //初始化

  // 清除引用值
  const handleTagClose = () => {
    updateValues('', 'Input', DataTypeEnum.String);
    setDisplayValue('');
  };
  const renderTitle = (nodeData: InputAndOutConfig) => {
    return (
      <div className="tree-custom-title-style">
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
    if (!key[0]) return;
    const value = key[0].toString(); // 获取选中的节点的 key 值
    // 获取当前选中的节点类型
    const dataType = data?.argMap?.[value]?.dataType; // 获取当前选中节点的dataType

    updateValues(value, 'Reference', dataType as DataTypeEnum);
    setDisplayValue(getValue(value));
  };
  // 动态生成 Dropdown 的 items
  const getMenu = (nodes: PreviousList[]) => {
    if (nodes && nodes.length) {
      let isHitSelect = false;
      return nodes.map((node) => ({
        key: node.id,
        label: node.name.length > 8 ? node.name.slice(0, 8) + '...' : node.name,
        icon: returnImg(node.type),
        popupClassName: 'inputOrReferencePopup',
        children: node.outputArgs
          ? [
              {
                key: `${node.id}-tree-select`,
                label: (
                  <div
                    onClick={(e) => {
                      // 阻止所有点击事件的冒泡，除了 onSelect
                      if (!isHitSelect) {
                        e.stopPropagation();
                        e.preventDefault();
                      }
                    }}
                  >
                    <Tree
                      onSelect={(keys) => {
                        handleTreeSelectChange(keys);
                        isHitSelect = true;
                      }}
                      defaultExpandAll
                      treeData={node.outputArgs}
                      fieldNames={{
                        title: 'name',
                        key: 'key',
                        children: 'children',
                      }}
                      blockNode
                      showIcon
                      titleRender={renderTitle}
                      className="custom-tree-style" // 添加自定义样式类
                    />
                  </div>
                ),
              },
            ]
          : undefined,
      }));
    } else {
      return [
        {
          key: 'no-data',
          popupClassName: 'inputOrReferencePopup',
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
    return getMenu(data.previousNodes);
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
          {displayValue.length > 10 ? (
            <Popover content={displayValue} placement="topRight">
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
          value={displayValue}
          onChange={(e) => {
            updateValues(e.target.value, 'Input', DataTypeEnum.String);
          }}
        />
      )}

      <Dropdown
        menu={{
          items: getMenuItems(), // 强制子菜单向左对齐
        }}
        trigger={['click']}
        overlayStyle={{ minWidth: 200 }}
        placement="bottomRight" // 设置弹窗向左对齐
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
