// 变量聚合节点
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import React, { useMemo, useRef } from 'react';
import { TreeOutput } from '../commonNode';
import { useVariableAggregation } from './useVariableAggregation';
import VariableGroupItem from './VariableGroupItem';

/**
 * 变量聚合节点组件
 * 重构版本 - 使用抽取的 Hook 和组件，更清晰的代码结构
 */
const VariableAggregationNode: React.FC<NodeDisposeProps> = ({ form, id }) => {
  const strategyOptions = [
    { label: '返回每个分组中第一个非空的值', value: 'FIRST_NON_NULL' },
  ];

  // 使用 useRef 持久化计数器，确保跨渲染唯一
  const keyCounterRef = useRef(0);

  // 确保 outputArgs 的 key 唯一，避免 Tree 组件警告
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

  // 使用自定义 Hook 管理状态和逻辑，传入 nodeId 用于检测节点切换
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

  // 监听 outputArgs 并确保 key 唯一
  const outputArgs =
    Form.useWatch('outputArgs', { form, preserve: true }) || [];
  const processedOutputArgs = useMemo(() => {
    keyCounterRef.current = 0; // 重置计数器
    return ensureUniqueKeys(outputArgs);
  }, [outputArgs]);

  return (
    <>
      <div className="node-item-style">
        <div className="node-title-style margin-bottom">聚合策略</div>
        <Form.Item name="aggregationStrategy" initialValue="FIRST_NON_NULL">
          <select
            className="ant-select ant-select-sm"
            style={{
              width: '100%',
              height: 24,
              borderRadius: 4,
              border: '1px solid #d9d9d9',
              padding: '0 8px',
            }}
          >
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
          <span className="node-title-style">分组配置</span>
          <Button
            icon={<PlusOutlined />}
            onClick={handleAddGroup}
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
          <div
            style={{
              color: '#bbb',
              fontSize: 12,
              textAlign: 'center',
              padding: 16,
            }}
          >
            点击 + 添加分组
          </div>
        )}
      </div>

      {/* 输出展示 - 使用处理后的数据确保 key 唯一 */}
      {processedOutputArgs.length > 0 && (
        <>
          <div className="node-title-style margin-bottom">输出</div>
          <TreeOutput treeData={processedOutputArgs} />
        </>
      )}
    </>
  );
};

export default VariableAggregationNode;
