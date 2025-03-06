import InputOrReference from '@/components/FormListItem/InputOrReference';
import { ConditionBranchConfigs } from '@/types/interfaces/node';
import {
  ConditionListProps,
  ConditionProps,
  NodeDisposeProps,
} from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, message, Select, Tag } from 'antd';
import React, { useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import './condition.less';
const options = [
  { label: '等于', value: 'EQUAL', displayValue: '=' },
  { label: '不等于', value: 'NOT_EQUAL', displayValue: '≠' },
  { label: '长度大于', value: 'GREATER_THAN', displayValue: '>' },
  {
    label: '长度大于等于',
    value: 'GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
  { label: '长度小于', value: 'LESS_THAN', displayValue: '<' },
  { label: '长度小于等于', value: 'LESS_THAN_OR_EQUAL', displayValue: '≤' },
  { label: '包含', value: 'CONTAINS', displayValue: '⊃' },
  { label: '不包含', value: 'NOT_CONTAINS', displayValue: '⊅' },
  { label: '匹配正则表达式', value: 'MATCH_REGEX', displayValue: '~' },
  { label: '为空', value: 'IS_NULL', displayValue: '∅' },
  { label: '不为空', value: 'NOT_NULL', displayValue: '!∅' },
];

export const Condition: React.FC<ConditionProps> = ({
  field,
  onChange,
  form,
  referenceList,
  inputItemName,
}) => {
  // 因为这里是数组嵌套数组
  const changeInputValue = (
    e: string | object,
    fieldName: 'firstArg' | 'secondArg',
    type?: 'Input' | 'Reference',
  ) => {
    // 修正路径构造方式，使用对象展开语法
    const newValue =
      type === 'Input'
        ? {
            bindValue: e,
            bindValueType: 'Input',
            dataType: 'String',
            name: '',
          }
        : {
            bindValue: referenceList.argMap[e as string].key,
            name: referenceList.argMap[e as string].name,
            bindValueType: 'Reference',
            dataType: referenceList.argMap[e as string].dataType || 'String',
          };
    // 使用深层对象赋值
    form.setFieldsValue({
      [inputItemName]: {
        [field.name]: {
          [fieldName]: newValue,
        },
      },
    });
    onChange?.();
  };

  return (
    <div className="condition-right-item" key={field.key}>
      <Form.Item
        style={{ marginRight: '8px' }}
        name={[field.name, 'compareType']}
      >
        <Select
          className="condition-type-select-style"
          popupMatchSelectWidth={false}
          options={options}
          optionLabelProp="displayValue"
          placeholder="请选择"
          style={{ width: 55 }}
        ></Select>
      </Form.Item>
      <Form.Item style={{ marginRight: '8px', flex: 1 }}>
        <Form.Item
          name={[field.name, 'firstArg', 'bindValue']}
          rules={[{ required: true }]}
        >
          <InputOrReference
            referenceList={referenceList}
            value={form.getFieldValue([field.name, 'firstArg', 'bindValue'])}
            onChange={(value, type) =>
              changeInputValue(value, 'firstArg', type)
            }
            form={form}
            isDisabled
          />
        </Form.Item>
        <Form.Item
          name={[field.name, 'secondArg', 'bindValue']}
          rules={[{ required: true }]}
        >
          <InputOrReference
            referenceList={referenceList}
            value={form.getFieldValue([field.name, 'secondArg', 'bindValue'])}
            onChange={(value, type) =>
              changeInputValue(value, 'secondArg', type)
            }
            form={form}
          />
        </Form.Item>
      </Form.Item>
    </div>
  );
};

// 修改 ConditionList 组件
export const ConditionList: React.FC<ConditionListProps> = ({
  title,
  index,
  inputItemName = 'conditionArgs',
  initialValues,
  removeItem,
  handleChangeNodeConfig,
  draggableId, // 新增一个 draggableId 属性
  referenceList,
}) => {
  const [form] = Form.useForm();

  // 提交form表单
  const submitForm = () => {
    const values = form.getFieldsValue(true);
    handleChangeNodeConfig(values, draggableId);
  };
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);
  return (
    <Draggable
      draggableId={draggableId}
      index={index}
      isDragDisabled={initialValues.branchType === 'ELSE'}
    >
      {(provided: any) => (
        <div
          className="dis-col condition-card-style"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          key={draggableId}
        >
          <div className="dis-sb condition-header-style">
            <div>
              <span className="margin-right-6">{title}</span>
              <Tag>优先级{index + 1}</Tag>
            </div>
            {initialValues.branchType !== 'ELSE' && (
              <MinusCircleOutlined onClick={() => removeItem(draggableId)} />
            )}
          </div>
          {initialValues.branchType !== 'ELSE' && (
            <Form
              form={form}
              onValuesChange={submitForm}
              // initialValues={initialValues}
              layout={'horizontal'}
            >
              <Form.List name={inputItemName}>
                {(fields, { add, remove }, { errors }) => (
                  <div className="relative">
                    <div
                      className={`dis-sb ${
                        fields.length > 1 ? 'select-condition-border' : ''
                      }`}
                    >
                      {fields.length > 1 && (
                        <div className="select-condition-type-style">
                          <Form.Item name={['conditionType']}>
                            <Select value={form.getFieldValue('conditionType')}>
                              <Select.Option value="AND">且</Select.Option>
                              <Select.Option value="OR">或</Select.Option>
                            </Select>
                          </Form.Item>
                        </div>
                      )}
                      <div className="flex-1">
                        {fields.map((field) => (
                          <div key={field.key} className="dis-sb">
                            {Condition({
                              field,
                              onRemove: () => {
                                remove(field.name);
                                submitForm();
                              },
                              form,
                              onChange: submitForm,
                              referenceList,
                              inputItemName: 'conditionArgs',
                            })}
                            <MinusCircleOutlined
                              onClick={() => {
                                remove(field.name);
                                submitForm();
                              }}
                            />
                          </div>
                        ))}
                        {errors.length > 0 && (
                          <div style={{ color: 'red' }}>
                            {errors.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      icon={<PlusOutlined />}
                      type="primary"
                      onClick={() => {
                        add({
                          firstArgs: [],
                          compareType: 'EQUAL',
                          secondArg: [],
                        });
                        submitForm();
                      }}
                    >
                      新增
                    </Button>
                  </div>
                )}
              </Form.List>
            </Form>
          )}
          {provided.placeholder}
        </div>
      )}
    </Draggable>
  );
};

// 修改 ConditionNode 组件
export const ConditionNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
  updateNode,
}) => {
  // 监听params.conditionBranchConfigs的变化，并在变化时更新节点
  // 使用深拷贝来确保每次 params.conditionBranchConfigs 变化时都能触发重新渲染

  const updateBranchType = (
    currentIndex: number,
  ): 'IF' | 'ELSE' | 'ELSE_IF' => {
    if (currentIndex === 0) {
      return 'IF';
    }
    return 'ELSE_IF';
  };

  const branchTypeMap = {
    IF: '如果',
    ELSE_IF: '否则如果',
    ELSE: '否则',
  };

  const addInputItem = () => {
    const newConditionBranchConfigs = [
      ...(params.conditionBranchConfigs || []),
    ];
    const insertIndex =
      newConditionBranchConfigs.length > 0
        ? newConditionBranchConfigs.length - 1
        : 0;

    newConditionBranchConfigs.splice(insertIndex, 0, {
      branchType: 'ELSE_IF',
      conditionType: null,
      nextNodeIds: [],
      uuid: uuidv4(),
      conditionArgs: [
        {
          firstArg: null,
          compareType: null,
          secondArg: null,
        },
      ],
    });

    if (updateNode) {
      updateNode({
        ...params,
        conditionBranchConfigs: newConditionBranchConfigs,
        extension: {
          ...params.extension,
          height: newConditionBranchConfigs.length * 32 + 48,
        },
      });
    }
  };

  const removeItem = (key: string) => {
    if (
      params.conditionBranchConfigs &&
      params.conditionBranchConfigs?.length <= 2
    ) {
      message.warning('至少需要两个分支');
      return;
    }
    const updatedConditionBranchConfigs = (
      params.conditionBranchConfigs || []
    ).filter((item) => item.uuid !== key);
    updatedConditionBranchConfigs.forEach((item, index) => {
      if (index !== updatedConditionBranchConfigs.length - 1) {
        item.branchType = updateBranchType(index);
      }
    });
    if (updateNode) {
      updateNode({
        ...params,
        conditionBranchConfigs: updatedConditionBranchConfigs,
        extension: {
          ...params.extension,
          height: updatedConditionBranchConfigs.length * 32 + 48,
        },
      });
    }
  };

  const handleChangeNodeConfig = (
    values: ConditionBranchConfigs,
    key: string,
  ) => {
    const newConditionBranchConfigs = (params.conditionBranchConfigs || []).map(
      (item) => (item.uuid === key ? { ...values } : { ...item }),
    );

    Modified({ ...params, conditionBranchConfigs: newConditionBranchConfigs });
  };

  // 修改 onDragEnd 方法
  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = params.conditionBranchConfigs || [];
    const lastIndex = items.length - 1;
    // 禁止拖拽到最后一个元素（ELSE）之后
    if (result.destination.index === lastIndex) {
      message.warning('不能拖拽到否则条件后');
      return;
    }

    // 当拖拽源是最后一个元素时直接返回
    if (result.source.index === lastIndex) return;

    const newItems = Array.from(items);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);

    // 重新编排branchType时保持最后一个为ELSE
    newItems.forEach((item, index) => {
      item.branchType =
        index === newItems.length - 1 ? 'ELSE' : updateBranchType(index);
    });

    if (updateNode) {
      updateNode({
        ...params,
        conditionBranchConfigs: newItems,
      });
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">条件分支</span>
        <Button
          icon={<PlusOutlined />}
          size={'small'}
          onClick={addInputItem}
        ></Button>
      </div>

      <Droppable droppableId="condition-list">
        {(provided: any) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {(params.conditionBranchConfigs || []).map((item, index) => {
              return (
                <ConditionList
                  key={item.uuid}
                  title={branchTypeMap[item.branchType]}
                  initialValues={item}
                  removeItem={removeItem}
                  handleChangeNodeConfig={handleChangeNodeConfig}
                  draggableId={item.uuid}
                  index={index}
                  referenceList={referenceList}
                />
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
