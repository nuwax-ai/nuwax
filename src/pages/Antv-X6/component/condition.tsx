import { InputOrReference } from '@/components/FormListItem/InputOrReference';
import { ConditionBranchConfigs } from '@/types/interfaces/node';
import {
  ConditionListProps,
  ConditionProps,
  NodeDisposeProps,
} from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Select, Tag } from 'antd';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import './condition.less';

export const modelTypes = [
  {
    label: '标题生成',
    icon: <MinusCircleOutlined />,
    key: '标题生成',
    children: [
      {
        key: 'output',
        label: 'output',
        tag: 'String',
      },
      {
        key: 'setting',
        label: 'Setting',
        tag: 'Number',
      },
    ],
  },
];
export const Condition: React.FC<ConditionProps> = ({
  field,
  onChange,
  form,
  referenceList,
}) => {
  return (
    <div className="condition-right-item">
      <Form.Item
        style={{ marginRight: '8px' }}
        name={[field.name, 'compareType']}
      >
        <Select
          className="condition-type-select-style"
          popupMatchSelectWidth={false}
        >
          <Select.Option value="EQUAL">等于</Select.Option>
          <Select.Option value="NOT_EQUAL">不等于</Select.Option>
          <Select.Option value="GREATER_THAN">长度大于</Select.Option>
          <Select.Option value="GREATER_THAN_OR_EQUAL">
            长度大于等于
          </Select.Option>
          <Select.Option value="LESS_THAN">长度小于</Select.Option>
          <Select.Option value="LESS_THAN_OR_EQUAL">长度小于等于</Select.Option>
          <Select.Option value="CONTAINS">包含</Select.Option>
          <Select.Option value="NOT_CONTAINS">不包含</Select.Option>
          <Select.Option value="MATCH_REGEX">匹配正则表达式</Select.Option>
          <Select.Option value="IS_NULL">为空</Select.Option>
          <Select.Option value="NOT_NULL">不为空</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item style={{ marginRight: '8px' }}>
        <Form.Item name={[field.name, 'bindValueType']}>
          <Select
            onChange={onChange}
            value={form.getFieldValue([field.name, 'bindValueType'])}
          >
            <Select.Option value="Input">输入</Select.Option>
            <Select.Option value="Reference">引用</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name={[field.name, 'bindValue']}
          rules={[{ required: true }]}
        >
          <InputOrReference
            referenceList={referenceList}
            value={form.getFieldValue([field.name, 'bindValue'])}
            onChange={onChange}
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
    const values = form.getFieldsValue();
    const _params = {
      branchType: initialValues.branchType,
      conditionType: initialValues.conditionType,
      nextNodeIds: initialValues.nextNodeIds,
      conditionArgs: values.conditionArgs,
      uuid: initialValues.uuid,
    };

    handleChangeNodeConfig(_params, index);
  };
  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided: any) => (
        <div
          className="dis-col condition-card-style"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="dis-sb condition-header-style">
            <div>
              <span className="margin-right-6">{title}</span>
              <Tag>优先级{index + 1}</Tag>
            </div>
            <MinusCircleOutlined onClick={() => removeItem(index)} />
          </div>
          <Form form={form} initialValues={initialValues} layout={'horizontal'}>
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
                        <Form.Item name={[inputItemName, 'conditionType']}>
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
                        <div style={{ color: 'red' }}>{errors.join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={() => {
                      add({
                        bindArg: '',
                        compareType: '',
                        bindValueType: '',
                        bindValue: '',
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

  const updateBranchType = (currentIndex: number): string => {
    if (currentIndex === 0) return 'IF';
    if (currentIndex === (params.conditionBranchConfigs || []).length - 1)
      return 'ELSE';
    return 'ELSE_IF';
  };

  const addInputItem = () => {
    const newConditionBranchConfigs = [
      ...(params.conditionBranchConfigs || []),
      {
        branchType: null,
        conditionType: null,
        nextNodeIds: [],
        uuid: (params.conditionBranchConfigs?.length ?? 0) + 1,
        conditionArgs: [
          {
            bindArg: null,
            compareType: null,
            bindValueType: null,
            bindValue: null,
          },
        ],
      },
    ];
    newConditionBranchConfigs.forEach((item, index) => {
      item.branchType = updateBranchType(index);
    });
    if (updateNode) {
      updateNode({
        ...params,
        conditionBranchConfigs: newConditionBranchConfigs,
        extension: {
          ...params.extension,
          height:
            newConditionBranchConfigs.length >= 2
              ? newConditionBranchConfigs.length * 40 + 60
              : 140,
        },
      });
    }
  };

  const removeItem = (index: number) => {
    const updatedConditionBranchConfigs = (
      params.conditionBranchConfigs || []
    ).filter((_, i) => i !== index);
    updatedConditionBranchConfigs.forEach((item, index) => {
      item.branchType = updateBranchType(index);
    });
    if (updateNode) {
      updateNode({
        ...params,
        conditionBranchConfigs: updatedConditionBranchConfigs,
        extension: {
          ...params.extension,
          height:
            updatedConditionBranchConfigs.length >= 2
              ? updatedConditionBranchConfigs.length * 40 + 60
              : 140,
        },
      });
    }
  };

  const handleChangeNodeConfig = (
    values: ConditionBranchConfigs,
    index: number,
  ) => {
    const newConditionBranchConfigs = (params.conditionBranchConfigs || []).map(
      (item, i) =>
        i === index
          ? { ...values, branchType: updateBranchType(index) }
          : { ...item, branchType: updateBranchType(i) },
    );

    Modified({ ...params, conditionBranchConfigs: newConditionBranchConfigs });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    const newItems = Array.from(params.conditionBranchConfigs || []);
    const [removed] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, removed);
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
            {(params.conditionBranchConfigs || []).map((item, index) => (
              <ConditionList
                key={item.uuid}
                title={
                  index === 0
                    ? '如果'
                    : index === (params.conditionBranchConfigs || []).length - 1
                    ? '否则'
                    : '否则如果'
                }
                index={index}
                initialValues={item}
                removeItem={removeItem}
                handleChangeNodeConfig={handleChangeNodeConfig}
                draggableId={item.uuid.toString()}
                referenceList={referenceList}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
