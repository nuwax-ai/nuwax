/**
 * V2 条件分支节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import {
  DeleteOutlined,
  HolderOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Select, Tag, Typography } from 'antd';
import React, { useCallback } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import type {
  ChildNodeV2,
  ConditionBranchConfigsV2,
  NodePreviousAndArgMapV2,
} from '../../../types';
import { ConditionBranchTypeEnumV2 } from '../../../types';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

import './ConditionNodePanelV2.less';

const { Text } = Typography;

// ==================== 常量定义 ====================

/** 条件比较类型选项 */
const CONDITION_OPTIONS = [
  { label: '等于', value: 'EQUAL', displayValue: '=' },
  { label: '不等于', value: 'NOT_EQUAL', displayValue: '≠' },
  { label: '大于', value: 'GREATER_THAN', displayValue: '>' },
  { label: '大于等于', value: 'GREATER_THAN_OR_EQUAL', displayValue: '≥' },
  { label: '小于', value: 'LESS_THAN', displayValue: '<' },
  { label: '小于等于', value: 'LESS_THAN_OR_EQUAL', displayValue: '≤' },
  { label: '长度大于', value: 'LENGTH_GREATER_THAN', displayValue: '>' },
  {
    label: '长度大于等于',
    value: 'LENGTH_GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  { label: '长度小于', value: 'LENGTH_LESS_THAN', displayValue: '<' },
  {
    label: '长度小于等于',
    value: 'LENGTH_LESS_THAN_OR_EQUAL',
    displayValue: '≤',
  },
  { label: '包含', value: 'CONTAINS', displayValue: '⊃' },
  { label: '不包含', value: 'NOT_CONTAINS', displayValue: '⊅' },
  { label: '匹配正则表达式', value: 'MATCH_REGEX', displayValue: '~' },
  { label: '为空', value: 'IS_NULL', displayValue: '∅' },
  { label: '不为空', value: 'NOT_NULL', displayValue: '!∅' },
];

/** 分支类型映射 */
const BRANCH_TYPE_MAP: Record<string, string> = {
  [ConditionBranchTypeEnumV2.IF]: '如果',
  [ConditionBranchTypeEnumV2.ELSE_IF]: '否则如果',
  [ConditionBranchTypeEnumV2.ELSE]: '否则',
};

/** 条件逻辑选项 */
const CONDITION_LOGIC_OPTIONS = [
  { label: '且', value: 'AND' },
  { label: '或', value: 'OR' },
];

// ==================== 类型定义 ====================

export interface ConditionNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

// ==================== 组件实现 ====================

const ConditionNodePanelV2: React.FC<ConditionNodePanelV2Props> = ({
  node: _node,
  referenceData,
}) => {
  // 使用 Form.useFormInstance 获取 form 实例
  const form = Form.useFormInstance();

  /**
   * 处理拖拽结束
   */
  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return;

      const items: ConditionBranchConfigsV2[] =
        form.getFieldValue('conditionBranchConfigs') || [];
      const lastIndex = items.length - 2; // ELSE 分支之前的最后一个位置

      // 禁止拖拽到最后一个元素（ELSE）之后
      if (result.destination.index > lastIndex) return;

      // 重新排序
      const newItems = [...items];
      const [reorderedItem] = newItems.splice(result.source.index, 1);
      newItems.splice(result.destination.index, 0, reorderedItem);

      // 更新 branchType
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        branchType:
          index === 0
            ? ConditionBranchTypeEnumV2.IF
            : index === newItems.length - 1
            ? ConditionBranchTypeEnumV2.ELSE
            : ConditionBranchTypeEnumV2.ELSE_IF,
      }));

      form.setFieldsValue({
        conditionBranchConfigs: updatedItems,
      });
    },
    [form],
  );

  /**
   * 添加分支
   */
  const handleAddBranch = useCallback(
    (add: (defaultValue?: any, insertIndex?: number) => void) => {
      const currentFields: ConditionBranchConfigsV2[] =
        form.getFieldValue('conditionBranchConfigs') || [];
      const insertIndex = Math.max(0, currentFields.length - 1); // 在 ELSE 之前插入

      add(
        {
          uuid: uuidv4(),
          conditionType: 'AND',
          conditionArgs: [
            {
              compareType: 'EQUAL',
              firstArg: { bindValue: '', bindValueType: 'Input' },
              secondArg: { bindValue: '', bindValueType: 'Input' },
            },
          ],
          nextNodeIds: [],
          branchType: ConditionBranchTypeEnumV2.ELSE_IF,
        },
        insertIndex,
      );
    },
    [form],
  );

  /**
   * 删除分支后更新 branchType
   */
  const handleRemoveBranch = useCallback(
    (remove: (index: number | number[]) => void, fieldName: number) => {
      remove(fieldName);

      // 重新设置 branchType
      setTimeout(() => {
        const currentFields: ConditionBranchConfigsV2[] =
          form.getFieldValue('conditionBranchConfigs') || [];
        const updatedFields = currentFields.map((field, index) => ({
          ...field,
          branchType:
            index === 0
              ? ConditionBranchTypeEnumV2.IF
              : index === currentFields.length - 1
              ? ConditionBranchTypeEnumV2.ELSE
              : ConditionBranchTypeEnumV2.ELSE_IF,
        }));
        form.setFieldsValue({
          conditionBranchConfigs: updatedFields,
        });
      }, 0);
    },
    [form],
  );

  return (
    <div className="condition-node-panel-v2">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Form.List name="conditionBranchConfigs">
          {(fields, { add, remove }) => (
            <Droppable droppableId="conditionBranches">
              {(provided: any) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {/* 标题 */}
                  <div className="condition-node-panel-v2-header">
                    <Text strong>条件分支</Text>
                    <Button
                      icon={<PlusOutlined />}
                      type="text"
                      onClick={() => handleAddBranch(add)}
                    >
                      添加分支
                    </Button>
                  </div>

                  {fields.map((field, index) => {
                    const isLast = index === fields.length - 1;
                    const itemData: ConditionBranchConfigsV2 =
                      form.getFieldValue([
                        'conditionBranchConfigs',
                        field.name,
                      ]);

                    // ELSE 分支
                    if (isLast) {
                      return (
                        <Card
                          key={field.key}
                          size="small"
                          className="condition-node-panel-v2-card condition-node-panel-v2-else"
                        >
                          <Text type="secondary">
                            否则（当以上条件都不满足时执行）
                          </Text>
                        </Card>
                      );
                    }

                    // IF / ELSE_IF 分支
                    return (
                      <Draggable
                        key={itemData?.uuid || field.key}
                        draggableId={itemData?.uuid || String(field.key)}
                        index={index}
                      >
                        {(dragProvided: any) => (
                          <Card
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            size="small"
                            className="condition-node-panel-v2-card"
                          >
                            {/* 分支头部 */}
                            <div className="condition-node-panel-v2-card-header">
                              <div
                                className="condition-node-panel-v2-drag-handle"
                                {...dragProvided.dragHandleProps}
                              >
                                <HolderOutlined />
                                <span className="condition-node-panel-v2-branch-type">
                                  {BRANCH_TYPE_MAP[itemData?.branchType] ||
                                    '如果'}
                                </span>
                                <Tag color="#C9CDD4">优先级 {index + 1}</Tag>
                              </div>
                              {fields.length > 2 && (
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleRemoveBranch(remove, field.name)
                                  }
                                />
                              )}
                            </div>

                            {/* 条件列表 */}
                            <Form.List name={[field.name, 'conditionArgs']}>
                              {(condFields, condOpt) => (
                                <div className="condition-node-panel-v2-conditions">
                                  {/* 条件逻辑选择器 */}
                                  {condFields.length > 1 && (
                                    <Form.Item
                                      name={[field.name, 'conditionType']}
                                      className="condition-node-panel-v2-logic"
                                    >
                                      <Select
                                        options={CONDITION_LOGIC_OPTIONS}
                                        style={{ width: 60 }}
                                        size="small"
                                      />
                                    </Form.Item>
                                  )}

                                  {condFields.map((condField, _condIndex) => (
                                    <div
                                      key={condField.key}
                                      className="condition-node-panel-v2-condition-row"
                                    >
                                      {/* 比较类型 */}
                                      <Form.Item
                                        name={[condField.name, 'compareType']}
                                        noStyle
                                      >
                                        <Select
                                          options={CONDITION_OPTIONS}
                                          optionLabelProp="displayValue"
                                          popupMatchSelectWidth={false}
                                          style={{ width: 54 }}
                                          size="small"
                                        />
                                      </Form.Item>

                                      {/* 第一个参数（变量引用） */}
                                      <Form.Item
                                        name={[
                                          condField.name,
                                          'firstArg',
                                          'bindValue',
                                        ]}
                                        noStyle
                                      >
                                        <VariableSelectorV2
                                          referenceData={referenceData}
                                          placeholder="引用参数"
                                          style={{ width: 120 }}
                                          disabled={false}
                                        />
                                      </Form.Item>

                                      {/* 第二个参数（值或引用） */}
                                      <Form.Item
                                        noStyle
                                        shouldUpdate={(prev, cur) =>
                                          prev?.conditionBranchConfigs?.[
                                            field.name
                                          ]?.conditionArgs?.[condField.name]
                                            ?.compareType !==
                                          cur?.conditionBranchConfigs?.[
                                            field.name
                                          ]?.conditionArgs?.[condField.name]
                                            ?.compareType
                                        }
                                      >
                                        {({ getFieldValue }) => {
                                          const compareType = getFieldValue([
                                            'conditionBranchConfigs',
                                            field.name,
                                            'conditionArgs',
                                            condField.name,
                                            'compareType',
                                          ]);
                                          // 为空/不为空 不需要第二个参数
                                          if (
                                            compareType === 'IS_NULL' ||
                                            compareType === 'NOT_NULL'
                                          ) {
                                            return null;
                                          }
                                          return (
                                            <Form.Item
                                              noStyle
                                              shouldUpdate={(
                                                prevValues,
                                                currentValues,
                                              ) => {
                                                const prevPath =
                                                  prevValues
                                                    ?.conditionBranchConfigs?.[
                                                    field.name
                                                  ]?.conditionArgs?.[
                                                    condField.name
                                                  ]?.secondArg?.bindValueType;
                                                const currentPath =
                                                  currentValues
                                                    ?.conditionBranchConfigs?.[
                                                    field.name
                                                  ]?.conditionArgs?.[
                                                    condField.name
                                                  ]?.secondArg?.bindValueType;
                                                return prevPath !== currentPath;
                                              }}
                                            >
                                              {() => {
                                                const form =
                                                  Form.useFormInstance();
                                                const bindValueType =
                                                  form.getFieldValue([
                                                    'conditionBranchConfigs',
                                                    field.name,
                                                    'conditionArgs',
                                                    condField.name,
                                                    'secondArg',
                                                    'bindValueType',
                                                  ]);
                                                return (
                                                  <Form.Item
                                                    name={[
                                                      condField.name,
                                                      'secondArg',
                                                      'bindValue',
                                                    ]}
                                                    noStyle
                                                  >
                                                    <VariableSelectorV2
                                                      referenceData={
                                                        referenceData
                                                      }
                                                      placeholder="输入值或引用"
                                                      style={{ width: 120 }}
                                                      form={form}
                                                      fieldName={[
                                                        'conditionBranchConfigs',
                                                        field.name,
                                                        'conditionArgs',
                                                        condField.name,
                                                        'secondArg',
                                                        'bindValue',
                                                      ]}
                                                      valueType={bindValueType}
                                                    />
                                                  </Form.Item>
                                                );
                                              }}
                                            </Form.Item>
                                          );
                                        }}
                                      </Form.Item>

                                      {/* 删除条件 */}
                                      {condFields.length > 1 && (
                                        <Button
                                          type="text"
                                          danger
                                          size="small"
                                          icon={<DeleteOutlined />}
                                          onClick={() =>
                                            condOpt.remove(condField.name)
                                          }
                                        />
                                      )}
                                    </div>
                                  ))}

                                  {/* 添加条件 */}
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={() =>
                                      condOpt.add({
                                        compareType: 'EQUAL',
                                        firstArg: {
                                          bindValue: '',
                                          bindValueType: 'Input',
                                        },
                                        secondArg: {
                                          bindValue: '',
                                          bindValueType: 'Input',
                                        },
                                      })
                                    }
                                  >
                                    添加条件
                                  </Button>
                                </div>
                              )}
                            </Form.List>
                          </Card>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </Form.List>
      </DragDropContext>
    </div>
  );
};

export default ConditionNodePanelV2;
