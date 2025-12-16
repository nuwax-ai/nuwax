// 变量分组项组件
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, VariableGroup } from '@/types/interfaces/node';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Tag } from 'antd';
import React from 'react';
import VariableSelector from './VariableSelector';

interface VariableGroupItemProps {
  group: VariableGroup;
  groupIndex: number;
  previousNodes: any[];
  getValue: (key: string) => string;
  getGroupTypeDisplay: (group: VariableGroup) => string;
  getGroupAllowedType: (group: VariableGroup) => DataTypeEnum | undefined;
  getSelectedKeys: (group: VariableGroup) => Set<string>;
  onUpdateGroup: (groupIndex: number, updates: Partial<VariableGroup>) => void;
  onRemoveGroup: (groupIndex: number) => void;
  onAddInput: (groupIndex: number) => void;
  onRemoveInput: (groupIndex: number, inputIndex: number) => void;
  onReferenceSelect: (
    groupIndex: number,
    inputIndex: number,
    selectedKey: string,
  ) => void;
  onClearReference: (groupIndex: number, inputIndex: number) => void;
}

/**
 * 变量分组项组件
 * 渲染单个分组的 UI，包括分组头部、变量引用列表等
 */
const VariableGroupItem: React.FC<VariableGroupItemProps> = ({
  group,
  groupIndex,
  previousNodes,
  getValue,
  getGroupTypeDisplay,
  getGroupAllowedType,
  getSelectedKeys,
  onUpdateGroup,
  onRemoveGroup,
  onAddInput,
  onRemoveInput,
  onReferenceSelect,
  onClearReference,
}) => {
  return (
    <div className="form-list-style" style={{ marginBottom: 8, padding: 8 }}>
      {/* 分组头部 - 紧凑布局 */}
      <div className="dis-sb" style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Input
            size="small"
            placeholder="分组名称"
            value={group.name}
            onChange={(e) =>
              onUpdateGroup(groupIndex, { name: e.target.value })
            }
            style={{ width: 100, marginRight: 8 }}
          />
          <Tag color="#E8E8E8" style={{ fontSize: 10 }}>
            {getGroupTypeDisplay(group)}
          </Tag>
        </div>
        <div>
          <Button
            icon={<PlusOutlined />}
            onClick={() => onAddInput(groupIndex)}
            size="small"
            type="text"
            style={{ padding: '0 4px' }}
          />
          <Button
            icon={<DeleteOutlined />}
            onClick={() => onRemoveGroup(groupIndex)}
            size="small"
            type="text"
            danger
            style={{ padding: '0 4px' }}
          />
        </div>
      </div>

      {/* 变量引用列表 - 紧凑，无参数名 */}
      {(group.inputs || []).map((input: InputAndOutConfig, inputIndex) => (
        <div
          key={input.key || inputIndex}
          className="dis-sb"
          style={{ marginTop: 4 }}
        >
          <VariableSelector
            displayValue={input.bindValue ? getValue(input.bindValue) : ''}
            allowedType={getGroupAllowedType(group)}
            selectedKeys={getSelectedKeys(group)}
            previousNodes={previousNodes}
            onSelect={(selectedKey) =>
              onReferenceSelect(groupIndex, inputIndex, selectedKey)
            }
            onClear={() => onClearReference(groupIndex, inputIndex)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            type="text"
            onClick={() => onRemoveInput(groupIndex, inputIndex)}
            style={{ marginLeft: 4, padding: '0 4px' }}
          />
        </div>
      ))}

      {/* 空状态提示 */}
      {(!group.inputs || group.inputs.length === 0) && (
        <div
          style={{
            color: '#bbb',
            fontSize: 12,
            textAlign: 'center',
            padding: '8px 0',
          }}
        >
          点击 + 添加变量引用
        </div>
      )}
    </div>
  );
};

export default VariableGroupItem;
