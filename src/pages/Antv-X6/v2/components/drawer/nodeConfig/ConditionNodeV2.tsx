/**
 * V2 条件分支节点配置组件
 *
 * 支持多条件分支配置、拖拽排序
 * 完全独立，不依赖 V1
 */

import { branchTypeMap } from '@/constants/node.constants';
import { ConditionBranchConfigs } from '@/types/interfaces/node';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, FormInstance, Select, Space, Tag } from 'antd';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';

import type { NodeConfigV2 } from '../../../types';
import InputOrReferenceV2 from '../../common/InputOrReferenceV2';

import './ConditionNodeV2.less';

// ==================== 类型定义 ====================

export interface ConditionNodeV2Props {
  form: FormInstance;
  nodeConfig?: NodeConfigV2;
  id: number;
  type: string;
  referenceData?: any;
}

// ==================== 常量配置 ====================

// 条件比较选项
const conditionOptions = [
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

// ==================== 组件实现 ====================

const ConditionNodeV2: React.FC<ConditionNodeV2Props> = ({
  form,
  referenceData,
}) => {
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = form.getFieldValue('conditionBranchConfigs');
    const lastIndex = items.length - 2;

    // 禁止拖拽到最后一个元素之后
    if (result.destination.index > lastIndex) return;

    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // 更新 branchType
    const updatedItems = items.map((item: any, index: number) => ({
      ...item,
      branchType:
        index === 0 ? 'IF' : index === items.length - 1 ? 'ELSE' : 'ELSE_IF',
    }));

    // 强制更新表单值
    form.setFieldsValue({
      conditionBranchConfigs: updatedItems,
    });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Form.List name={'conditionBranchConfigs'}>
        {(fields, { add, remove }) => (
          <Droppable droppableId="conditionBranches">
            {(provided: any) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {/* 标题 */}
                <div className="dis-sb margin-bottom">
                  <span className="node-title-style-v2">条件分支</span>
                  <Button
                    icon={<PlusOutlined />}
                    type={'text'}
                    onClick={() => {
                      const currentFields =
                        form.getFieldValue('conditionBranchConfigs') || [];
                      const insertIndex = Math.max(0, currentFields.length - 1);
                      add(
                        {
                          uuid: uuidv4(),
                          conditionType: 'AND',
                          conditionArgs: [
                            {
                              compareType: 'EQUAL',
                              firstArg: { bindValue: '' },
                              secondArg: { bindValue: '' },
                            },
                          ],
                          nextNodeIds: [],
                          branchType: 'ELSE_IF',
                        },
                        insertIndex,
                      );
                    }}
                  />
                </div>

                {fields.map((item, index) => {
                  const isLast = index === fields.length - 1;
                  if (!isLast) {
                    const itemData: ConditionBranchConfigs = form.getFieldValue(
                      ['conditionBranchConfigs', item.name],
                    );
                    return (
                      <Draggable
                        key={itemData.uuid}
                        draggableId={itemData.uuid}
                        index={index}
                      >
                        {(provided: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="condition-card-style-v2"
                          >
                            {/* 拖拽手柄 */}
                            <div className="dis-sb">
                              <div
                                className="dis-left"
                                {...provided.dragHandleProps}
                                style={{ cursor: 'grab', width: '100%' }}
                              >
                                <span className="margin-right">
                                  {
                                    branchTypeMap[
                                      itemData.branchType as keyof typeof branchTypeMap
                                    ]
                                  }
                                </span>
                                <Tag color="#C9CDD4">优先级{index + 1}</Tag>
                              </div>
                              {fields.length > 2 && (
                                <Button
                                  icon={<MinusCircleOutlined />}
                                  type="text"
                                  onClick={() => {
                                    remove(item.name);
                                    // 重新计算 branchType
                                    if (item.name === 0) {
                                      const currentFields =
                                        form.getFieldValue(
                                          'conditionBranchConfigs',
                                        ) || [];
                                      const updatedFields = currentFields.map(
                                        (
                                          field: ConditionBranchConfigs,
                                          idx: number,
                                        ) => ({
                                          ...field,
                                          branchType:
                                            idx === 0
                                              ? 'IF'
                                              : idx === currentFields.length - 1
                                              ? 'ELSE'
                                              : 'ELSE_IF',
                                        }),
                                      );
                                      form.setFieldsValue({
                                        conditionBranchConfigs: updatedFields,
                                      });
                                    }
                                  }}
                                />
                              )}
                            </div>
                            <Space>
                              {itemData.conditionArgs.length > 1 && (
                                <Form.Item
                                  noStyle
                                  shouldUpdate={(prev, curr) =>
                                    prev.conditionBranchConfigs?.[item.name]
                                      ?.conditionArgs !==
                                    curr.conditionBranchConfigs?.[item.name]
                                      ?.conditionArgs
                                  }
                                >
                                  {({ getFieldValue }) => {
                                    const conditionArgs = getFieldValue([
                                      'conditionBranchConfigs',
                                      item.name,
                                      'conditionArgs',
                                    ]);
                                    return (
                                      conditionArgs?.length > 1 && (
                                        <Form.Item
                                          name={[item.name, 'conditionType']}
                                          style={{ marginTop: '-26px' }}
                                        >
                                          <Select
                                            style={{
                                              marginRight: '4px',
                                              width: 54,
                                            }}
                                            options={[
                                              { label: '且', value: 'AND' },
                                              { label: '或', value: 'OR' },
                                            ]}
                                          />
                                        </Form.Item>
                                      )
                                    );
                                  }}
                                </Form.Item>
                              )}

                              {index !== fields.length - 1 && (
                                <Form.List name={[item.name, 'conditionArgs']}>
                                  {(subFields, subOpt) => {
                                    return (
                                      <div className="position-relative">
                                        <div className="dis-left">
                                          <div className="dis-col">
                                            {subFields.map((subField) => {
                                              const bindValueType =
                                                form.getFieldValue([
                                                  'conditionBranchConfigs',
                                                  item.name,
                                                  'conditionArgs',
                                                  subField.name,
                                                  'secondArg',
                                                  'bindValueType',
                                                ]);
                                              return (
                                                <div
                                                  key={subField.name}
                                                  className="dis-sb"
                                                >
                                                  <Form.Item
                                                    name={[
                                                      subField.name,
                                                      'compareType',
                                                    ]}
                                                    noStyle
                                                    rules={[
                                                      {
                                                        required: true,
                                                        message: '请选择比较符',
                                                      },
                                                    ]}
                                                  >
                                                    <Select
                                                      popupMatchSelectWidth={
                                                        false
                                                      }
                                                      options={conditionOptions}
                                                      optionLabelProp="displayValue"
                                                      style={{
                                                        marginRight: '10px',
                                                        width: 54,
                                                      }}
                                                    />
                                                  </Form.Item>
                                                  <div>
                                                    <Form.Item
                                                      name={[
                                                        subField.name,
                                                        'firstArg',
                                                        'bindValue',
                                                      ]}
                                                      rules={[
                                                        {
                                                          required: true,
                                                          message: '请引用参数',
                                                        },
                                                      ]}
                                                    >
                                                      <InputOrReferenceV2
                                                        isDisabled
                                                        form={form}
                                                        fieldName={[
                                                          'conditionBranchConfigs',
                                                          item.name,
                                                          'conditionArgs',
                                                          subField.name,
                                                          'firstArg',
                                                          'bindValue',
                                                        ]}
                                                        placeholder="请引用参数"
                                                        style={{
                                                          width:
                                                            subFields.length > 1
                                                              ? 150
                                                              : 180,
                                                        }}
                                                        referenceType="Reference"
                                                        referenceData={
                                                          referenceData
                                                        }
                                                      />
                                                    </Form.Item>
                                                    <Form.Item
                                                      name={[
                                                        subField.name,
                                                        'secondArg',
                                                        'bindValue',
                                                      ]}
                                                      rules={[
                                                        {
                                                          validator: (
                                                            _,
                                                            value,
                                                          ) => {
                                                            const compareType =
                                                              form.getFieldValue(
                                                                [
                                                                  'conditionBranchConfigs',
                                                                  item.name,
                                                                  'conditionArgs',
                                                                  subField.name,
                                                                  'compareType',
                                                                ],
                                                              );
                                                            const noSecondArgTypes =
                                                              [
                                                                'IS_NULL',
                                                                'NOT_NULL',
                                                              ];
                                                            if (
                                                              noSecondArgTypes.includes(
                                                                compareType,
                                                              )
                                                            ) {
                                                              return Promise.resolve();
                                                            }
                                                            if (
                                                              value === null ||
                                                              value ===
                                                                undefined ||
                                                              value === ''
                                                            ) {
                                                              return Promise.reject(
                                                                new Error(
                                                                  '请输入或引用值',
                                                                ),
                                                              );
                                                            }
                                                            return Promise.resolve();
                                                          },
                                                        },
                                                      ]}
                                                    >
                                                      <InputOrReferenceV2
                                                        form={form}
                                                        referenceType={
                                                          bindValueType
                                                        }
                                                        style={{
                                                          width:
                                                            subFields.length > 1
                                                              ? 150
                                                              : 180,
                                                        }}
                                                        fieldName={[
                                                          'conditionBranchConfigs',
                                                          item.name,
                                                          'conditionArgs',
                                                          subField.name,
                                                          'secondArg',
                                                          'bindValue',
                                                        ]}
                                                        referenceData={
                                                          referenceData
                                                        }
                                                      />
                                                    </Form.Item>
                                                  </div>
                                                  {subFields.length > 1 && (
                                                    <Button
                                                      type="text"
                                                      icon={
                                                        <MinusCircleOutlined />
                                                      }
                                                      onClick={() => {
                                                        subOpt.remove(
                                                          subField.name,
                                                        );
                                                      }}
                                                    />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                        <Button
                                          type="primary"
                                          onClick={() => {
                                            subOpt.add({
                                              compareType: 'EQUAL',
                                              firstArg: null,
                                              secondArg: null,
                                            });
                                          }}
                                          icon={<PlusOutlined />}
                                        >
                                          新增
                                        </Button>
                                      </div>
                                    );
                                  }}
                                </Form.List>
                              )}
                            </Space>
                          </div>
                        )}
                      </Draggable>
                    );
                  }
                  return (
                    <div key={item.name} className="condition-card-style-v2">
                      否则
                    </div>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </Form.List>
    </DragDropContext>
  );
};

export default ConditionNodeV2;
