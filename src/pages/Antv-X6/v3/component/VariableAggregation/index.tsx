// Variable aggregation node.
import { t } from '@/services/i18nRuntime';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import React, { useMemo, useRef } from 'react';
import { TreeOutput } from '../commonNode';
import './index.less';
import { useVariableAggregation } from './useVariableAggregation';
import VariableGroupItem from './VariableGroupItem';

/**
 * Variable aggregation node component.
 */
const VariableAggregationNode: React.FC<NodeDisposeProps> = ({ form, id }) => {
  const strategyOptions = [
    {
      label: t('PC.Pages.AntvX6VariableAggregation.strategyFirstNonNull'),
      value: 'FIRST_NON_NULL',
    },
  ];

  // Persist counter across renders to build unique keys.
  const keyCounterRef = useRef(0);

  // Ensure output tree keys are unique to avoid Tree warnings.
  const ensureUniqueKeys = (
    items: InputAndOutConfig[] | undefined,
  ): InputAndOutConfig[] => {
    if (!items || items.length === 0) return [];
    return items.map((item) => ({
      ...item,
      key: `${item.key || item.name}_${keyCounterRef.current++}`,
      subArgs: ensureUniqueKeys(item.subArgs),
    }));
  };

  // Keep state and logic in a dedicated hook.
  const {
    variableGroups,
    referenceList,
    getValue,
    handleAddGroup,
    handleRemoveGroup,
    handleUpdateGroup,
    handleAddInput,
    handleRemoveInput,
    handleReferenceSelect,
    handleClearReference,
    getGroupAllowedType,
    getSelectedKeys,
    getGroupTypeDisplay,
  } = useVariableAggregation({ form, nodeId: id });

  // Watch outputArgs and normalize keys.
  const outputArgs =
    Form.useWatch('outputArgs', { form, preserve: true }) || [];
  const processedOutputArgs = useMemo(() => {
    keyCounterRef.current = 0;
    return ensureUniqueKeys(outputArgs);
  }, [outputArgs]);

  return (
    <>
      <div className="node-item-style">
        <div className="node-title-style margin-bottom">
          {t('PC.Pages.AntvX6VariableAggregation.strategyTitle')}
        </div>
        <Form.Item name="aggregationStrategy">
          <select className="ant-select ant-select-sm aggregation-strategy-select">
            {strategyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Form.Item>
      </div>

      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">
            {t('PC.Pages.AntvX6VariableAggregation.groupConfigTitle')}
          </span>
          <Button
            onClick={handleAddGroup}
            icon={<PlusOutlined />}
            size="small"
            type="text"
          />
        </div>

        {variableGroups.map((group, groupIndex) => (
          <VariableGroupItem
            key={group.id || groupIndex}
            group={group}
            groupIndex={groupIndex}
            previousNodes={referenceList.previousNodes || []}
            getValue={getValue}
            getGroupTypeDisplay={getGroupTypeDisplay}
            getGroupAllowedType={getGroupAllowedType}
            getSelectedKeys={getSelectedKeys}
            onUpdateGroup={handleUpdateGroup}
            onRemoveGroup={handleRemoveGroup}
            onAddInput={handleAddInput}
            onRemoveInput={handleRemoveInput}
            onReferenceSelect={handleReferenceSelect}
            onClearReference={handleClearReference}
          />
        ))}

        {variableGroups.length === 0 && (
          <div className="empty-state-tip">
            {t('PC.Pages.AntvX6VariableAggregation.emptyGroupHint')}
          </div>
        )}
      </div>

      {/* Output */}
      {processedOutputArgs.length > 0 && (
        <>
          <div className="node-title-style margin-bottom">
            {t('PC.Pages.AntvX6VariableAggregation.outputTitle')}
          </div>
          <TreeOutput treeData={processedOutputArgs} />
        </>
      )}
    </>
  );
};

export default VariableAggregationNode;
