// Variable group item component.
import { t } from '@/services/i18nRuntime';
import { DataTypeEnum } from '@/types/enums/common';
import { InputAndOutConfig, VariableGroup } from '@/types/interfaces/node';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Tag } from 'antd';
import React from 'react';
import VariableSelector from './VariableSelector';
import './index.less';

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
 * Render a single variable group section.
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
    <div className="form-list-style group-item-container">
      {/* Group header */}
      <div className="dis-sb group-header">
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Input
            size="small"
            placeholder={t(
              'PC.Pages.AntvX6VariableAggregation.groupNamePlaceholder',
            )}
            value={group.name}
            onChange={(e) =>
              onUpdateGroup(groupIndex, { name: e.target.value })
            }
            className="group-name-input"
          />
          <Tag color="#C9CDD4" className="group-type-tag">
            {getGroupTypeDisplay(group)}
          </Tag>
        </div>
        <div>
          <Button
            icon={<PlusOutlined />}
            onClick={() => onAddInput(groupIndex)}
            size="small"
            type="text"
            className="action-button"
          />
          <Button
            icon={<MinusOutlined />}
            onClick={() => onRemoveGroup(groupIndex)}
            size="small"
            type="text"
            className="action-button"
          />
        </div>
      </div>

      {/* Variable reference list */}
      {(group.inputs || []).map((input: InputAndOutConfig, inputIndex) => (
        <div
          key={input.key || inputIndex}
          className="dis-sb variable-reference-item"
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
            icon={<MinusOutlined />}
            size="small"
            type="text"
            onClick={() => onRemoveInput(groupIndex, inputIndex)}
            className="remove-input-button"
          />
        </div>
      ))}

      {/* Empty-state hint */}
      {(!group.inputs || group.inputs.length === 0) && (
        <div className="group-empty-tip">
          {t('PC.Pages.AntvX6VariableAggregation.emptyGroupInputHint')}
        </div>
      )}
    </div>
  );
};

export default VariableGroupItem;
