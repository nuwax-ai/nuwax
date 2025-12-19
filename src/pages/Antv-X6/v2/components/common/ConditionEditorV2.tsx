/**
 * V2 条件编辑器
 * 用于编辑条件分支的条件表达式
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Button, Input, Select, Space, Card, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

import VariableSelectorV2 from './VariableSelectorV2';
import type { NodePreviousAndArgMapV2 } from '../../types';

import './ConditionEditorV2.less';

const { Text } = Typography;

// ==================== 类型定义 ====================

/** 条件操作符 */
export type ConditionOperator =
  | 'eq' // 等于
  | 'ne' // 不等于
  | 'gt' // 大于
  | 'ge' // 大于等于
  | 'lt' // 小于
  | 'le' // 小于等于
  | 'contains' // 包含
  | 'not_contains' // 不包含
  | 'starts_with' // 开头是
  | 'ends_with' // 结尾是
  | 'is_empty' // 为空
  | 'is_not_empty' // 不为空
  | 'is_null' // 为 null
  | 'is_not_null'; // 不为 null

/** 条件逻辑运算符 */
export type ConditionLogic = 'and' | 'or';

/** 单个条件项 */
export interface ConditionItem {
  key: string;
  variable: string;
  variableType?: 'Input' | 'Reference';
  operator: ConditionOperator;
  value: string;
  valueType?: 'Input' | 'Reference';
}

/** 条件组 */
export interface ConditionGroup {
  key: string;
  logic: ConditionLogic;
  conditions: ConditionItem[];
}

export interface ConditionEditorV2Props {
  /** 条件组列表 */
  value?: ConditionGroup[];
  /** 变更回调 */
  onChange?: (value: ConditionGroup[]) => void;
  /** 变量引用数据 */
  referenceData?: NodePreviousAndArgMapV2;
  /** 是否只读 */
  readOnly?: boolean;
  /** 标题 */
  title?: string;
}

// 操作符选项
const OPERATOR_OPTIONS = [
  { label: '等于', value: 'eq' },
  { label: '不等于', value: 'ne' },
  { label: '大于', value: 'gt' },
  { label: '大于等于', value: 'ge' },
  { label: '小于', value: 'lt' },
  { label: '小于等于', value: 'le' },
  { label: '包含', value: 'contains' },
  { label: '不包含', value: 'not_contains' },
  { label: '开头是', value: 'starts_with' },
  { label: '结尾是', value: 'ends_with' },
  { label: '为空', value: 'is_empty' },
  { label: '不为空', value: 'is_not_empty' },
  { label: '为 null', value: 'is_null' },
  { label: '不为 null', value: 'is_not_null' },
];

// 不需要值的操作符
const NO_VALUE_OPERATORS = ['is_empty', 'is_not_empty', 'is_null', 'is_not_null'];

// ==================== 组件实现 ====================

const ConditionEditorV2: React.FC<ConditionEditorV2Props> = ({
  value = [],
  onChange,
  referenceData,
  readOnly = false,
  title = '条件设置',
}) => {
  // 添加条件组
  const handleAddGroup = () => {
    if (readOnly) return;
    const newGroup: ConditionGroup = {
      key: uuidv4(),
      logic: 'and',
      conditions: [
        {
          key: uuidv4(),
          variable: '',
          variableType: 'Input',
          operator: 'eq',
          value: '',
          valueType: 'Input',
        },
      ],
    };
    onChange?.([...value, newGroup]);
  };

  // 删除条件组
  const handleRemoveGroup = (groupKey: string) => {
    if (readOnly) return;
    onChange?.(value.filter((g) => g.key !== groupKey));
  };

  // 更新条件组逻辑
  const handleGroupLogicChange = (groupKey: string, logic: ConditionLogic) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) => (g.key === groupKey ? { ...g, logic } : g))
    );
  };

  // 添加条件项
  const handleAddCondition = (groupKey: string) => {
    if (readOnly) return;
    const newCondition: ConditionItem = {
      key: uuidv4(),
      variable: '',
      variableType: 'Input',
      operator: 'eq',
      value: '',
      valueType: 'Input',
    };
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? { ...g, conditions: [...g.conditions, newCondition] }
          : g
      )
    );
  };

  // 删除条件项
  const handleRemoveCondition = (groupKey: string, conditionKey: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? { ...g, conditions: g.conditions.filter((c) => c.key !== conditionKey) }
          : g
      )
    );
  };

  // 更新条件项
  const handleConditionChange = (
    groupKey: string,
    conditionKey: string,
    field: keyof ConditionItem,
    fieldValue: any
  ) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.key === conditionKey ? { ...c, [field]: fieldValue } : c
              ),
            }
          : g
      )
    );
  };

  // 处理变量引用
  const handleVariableReference = (
    groupKey: string,
    conditionKey: string,
    refKey: string
  ) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.key === conditionKey
                  ? { ...c, variable: refKey, variableType: 'Reference' as const }
                  : c
              ),
            }
          : g
      )
    );
  };

  // 清除变量引用
  const handleClearVariable = (groupKey: string, conditionKey: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.key === conditionKey
                  ? { ...c, variable: '', variableType: 'Input' as const }
                  : c
              ),
            }
          : g
      )
    );
  };

  // 处理值引用
  const handleValueReference = (
    groupKey: string,
    conditionKey: string,
    refKey: string
  ) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.key === conditionKey
                  ? { ...c, value: refKey, valueType: 'Reference' as const }
                  : c
              ),
            }
          : g
      )
    );
  };

  // 清除值引用
  const handleClearValue = (groupKey: string, conditionKey: string) => {
    if (readOnly) return;
    onChange?.(
      value.map((g) =>
        g.key === groupKey
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.key === conditionKey
                  ? { ...c, value: '', valueType: 'Input' as const }
                  : c
              ),
            }
          : g
      )
    );
  };

  return (
    <div className="condition-editor-v2">
      {/* 头部 */}
      <div className="condition-editor-v2-header">
        <span className="condition-editor-v2-title">{title}</span>
        {!readOnly && (
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAddGroup}
          >
            添加条件组
          </Button>
        )}
      </div>

      {/* 条件组列表 */}
      <div className="condition-editor-v2-groups">
        {value.map((group, groupIndex) => (
          <Card
            key={group.key}
            size="small"
            className="condition-editor-v2-group"
            title={
              <Space>
                <Text strong>条件组 {groupIndex + 1}</Text>
                <Select
                  size="small"
                  value={group.logic}
                  onChange={(val) => handleGroupLogicChange(group.key, val)}
                  disabled={readOnly}
                  style={{ width: 80 }}
                >
                  <Select.Option value="and">且</Select.Option>
                  <Select.Option value="or">或</Select.Option>
                </Select>
              </Space>
            }
            extra={
              !readOnly && value.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveGroup(group.key)}
                />
              )
            }
          >
            {/* 条件项列表 */}
            {group.conditions.map((condition, conditionIndex) => (
              <div key={condition.key} className="condition-editor-v2-item">
                {conditionIndex > 0 && (
                  <div className="condition-editor-v2-logic">
                    {group.logic === 'and' ? '且' : '或'}
                  </div>
                )}
                <div className="condition-editor-v2-row">
                  {/* 变量 */}
                  <div className="condition-editor-v2-variable">
                    <VariableSelectorV2
                      value={condition.variable}
                      valueType={condition.variableType}
                      referenceData={referenceData}
                      disabled={readOnly}
                      placeholder="选择变量"
                      onChange={(val) =>
                        handleConditionChange(group.key, condition.key, 'variable', val)
                      }
                      onReferenceSelect={(refKey) =>
                        handleVariableReference(group.key, condition.key, refKey)
                      }
                      onClearReference={() =>
                        handleClearVariable(group.key, condition.key)
                      }
                    />
                  </div>

                  {/* 操作符 */}
                  <div className="condition-editor-v2-operator">
                    <Select
                      size="small"
                      value={condition.operator}
                      options={OPERATOR_OPTIONS}
                      onChange={(val) =>
                        handleConditionChange(group.key, condition.key, 'operator', val)
                      }
                      disabled={readOnly}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* 值 */}
                  {!NO_VALUE_OPERATORS.includes(condition.operator) && (
                    <div className="condition-editor-v2-value">
                      <VariableSelectorV2
                        value={condition.value}
                        valueType={condition.valueType}
                        referenceData={referenceData}
                        disabled={readOnly}
                        placeholder="输入值"
                        onChange={(val) =>
                          handleConditionChange(group.key, condition.key, 'value', val)
                        }
                        onReferenceSelect={(refKey) =>
                          handleValueReference(group.key, condition.key, refKey)
                        }
                        onClearReference={() =>
                          handleClearValue(group.key, condition.key)
                        }
                      />
                    </div>
                  )}

                  {/* 删除按钮 */}
                  {!readOnly && group.conditions.length > 1 && (
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        handleRemoveCondition(group.key, condition.key)
                      }
                    />
                  )}
                </div>
              </div>
            ))}

            {/* 添加条件 */}
            {!readOnly && (
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleAddCondition(group.key)}
                className="condition-editor-v2-add-condition"
              >
                添加条件
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* 空状态 */}
      {value.length === 0 && (
        <div className="condition-editor-v2-empty">
          暂无条件，点击上方按钮添加条件组
        </div>
      )}
    </div>
  );
};

export default ConditionEditorV2;
