import ConditionItem from '@/components/FormListItem/Condition';
import { ConditionBranchConfigs } from '@/types/interfaces/node';
import {
  ConditionListProps,
  NodeDisposeProps,
} from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, message, Select, Tag } from 'antd';
import React, { useEffect } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import './condition.less';

// 修改 ConditionList 组件
export const ConditionList: React.FC<ConditionListProps> = ({
  title,
  index,
  inputItemName = 'conditionArgs',
  initialValues,
  removeItem,
  handleChangeNodeConfig,
  draggableId, // 新增一个 draggableId 属性
}) => {
  const [form] = Form.useForm();

  // 提交form表单
  const submitForm = () => {
    const values = form.getFieldsValue(true);
    handleChangeNodeConfig(values, draggableId);
  };
  useEffect(() => {
    if (!form.getFieldsValue(true)[inputItemName]) {
      form.setFieldsValue(initialValues);
    }
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
              <Tag color="#C9CDD4">优先级{index + 1}</Tag>
            </div>
            {initialValues.branchType !== 'ELSE' && (
              <MinusCircleOutlined onClick={() => removeItem(draggableId)} />
            )}
          </div>
          {initialValues.branchType !== 'ELSE' && (
            <Form form={form} layout={'horizontal'}>
              <Form.List name={inputItemName}>
                {(fields, { add, remove }, { errors }) => {
                  return (
                    <div className="relative">
                      <div
                        className={`dis-sb ${
                          fields.length > 1 ? 'select-condition-border' : ''
                        }`}
                      >
                        {fields.length > 1 && (
                          <div className="select-condition-type-style">
                            <Form.Item>
                              <Select
                                value={initialValues.conditionType}
                                onChange={(e) => {
                                  handleChangeNodeConfig(
                                    { conditionType: e, uuid: draggableId },
                                    draggableId,
                                  );
                                }}
                                style={{ width: 60 }}
                              >
                                <Select.Option value="AND">且</Select.Option>
                                <Select.Option value="OR">或</Select.Option>
                              </Select>
                            </Form.Item>
                          </div>
                        )}
                        <div className="flex-1">
                          {fields.map((field) => (
                            <div key={field.key} className="dis-sb">
                              <ConditionItem
                                field={field}
                                onRemove={() => {
                                  remove(field.name);
                                  submitForm();
                                }}
                                form={form}
                                onChange={submitForm}
                                inputItemName={'conditionArgs'}
                              />

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
                            firstArg: null,
                            compareType: 'EQUAL',
                            secondArg: null,
                          });
                          submitForm();
                        }}
                      >
                        新增
                      </Button>
                    </div>
                  );
                }}
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
  // form,
  params,
  // Modified,
  updateNode,
}) => {
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
      (item) => {
        if (!values.conditionArgs) {
          return item.uuid === key ? { ...item, ...values } : { ...item };
        } else {
          return item.uuid === key ? { ...item, ...values } : { ...item };
        }
      },
    );
    // conditionParams.conditionBranchConfigs=newConditionBranchConfigs
    // setConditionParams({...conditionParams,conditionBranchConfigs:newConditionBranchConfigs})
    if (updateNode) {
      updateNode({
        ...params,
        conditionBranchConfigs: newConditionBranchConfigs,
      });
    }
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

  // useEffect(() => {
  //   // console.log(params)

  //   // setConditionParams(params);
  // }, [params]);

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
                  title={
                    branchTypeMap[item.branchType as 'IF' | 'ELSE_IF' | 'ELSE']
                  }
                  initialValues={item}
                  removeItem={removeItem}
                  handleChangeNodeConfig={handleChangeNodeConfig}
                  draggableId={item.uuid}
                  index={index}
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
