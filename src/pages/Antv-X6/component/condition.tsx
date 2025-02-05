import { InputOrReference } from '@/components/FormListItem/InputOrReference';
import { ConditionBranchConfigs } from '@/types/interfaces/node';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Select, Tag } from 'antd';
import React, { useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { NodeDisposeProps } from '../type';
import './condition.less';
export type FormListFieldData = {
  key: string | number;
  name: string | number;
  fieldKey?: string | number;
};

interface ConditionListProps {
  title: string;
  index: number;
  // 改变节点的入参和出参
  handleChangeNodeConfig: (
    params: ConditionBranchConfigs,
    index: number,
  ) => void;
  // 删除当前的
  removeItem: (val: number) => void;
  draggableId: string;
  // 初始值（适用于已经编辑过的内容）
  initialValues: ConditionBranchConfigs;
  // 如果有多个相同组件时，传递不同的inputListName区分
  inputItemName?: string;
}

// 先封装一个组件
interface ConditionProps {
  // 当前字段的field
  field: FormListFieldData;
  // 删除当前行
  onRemove: () => void;
  // 父组件传递下来的form
  form: FormInstance;
  // 当前值改变的时候，通知父组件，重新获取值
  onChange: () => void;
}

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
            referenceList={modelTypes}
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
}) => {
  const [arr, setArr] = useState<ConditionBranchConfigs[]>(
    params.conditionBranchConfigs || [],
  );

  const addInputItem = () => {
    setArr([
      ...arr,
      {
        branchType: '',
        conditionType: '',
        nextNodeIds: [],
        conditionArgs: [
          {
            bindArg: '',
            compareType: '',
            bindValueType: '',
            bindValue: '',
          },
        ],
      },
    ]);
    Modified({
      ...params,
      conditionBranchConfigs: arr,
    });
  };

  const removeItem = (index: number) => {
    setArr(arr.filter((_, i) => i !== index));
  };
  // 提交数据
  const handleChangeNodeConfig = (
    values: ConditionBranchConfigs,
    index: number,
  ) => {
    // 将values替换掉conditionBranchConfigs对应索引的值
    const updateBranchType = (currentIndex: number): string => {
      if (currentIndex === 0) return 'IF';
      if (currentIndex === arr.length - 1) return 'ELSE';
      return 'ELSE_IF';
    };

    // 使用 map 更新数组中的元素
    const newArr = arr.map(
      (item, i) =>
        i === index
          ? { ...values, branchType: updateBranchType(index) } // 更新指定索引的 item
          : { ...item, branchType: updateBranchType(i) }, // 确保其他 items 的 branchType 正确
    );
    setArr(newArr);
    Modified({ ...params, conditionBranchConfigs: newArr });
  };

  // 拖拽逻辑
  const onDragEnd = (result: any) => {
    if (!result.destination) return; // 如果没有目标位置，直接返回
    const newItems = Array.from(arr); // 复制当前数组
    const [removed] = newItems.splice(result.source.index, 1); // 移除拖拽的项
    newItems.splice(result.destination.index, 0, removed); // 插入到目标位置
    setArr(newItems); // 更新状态
    Modified({
      ...params,
      conditionBranchConfigs: newItems, // 同步到外部状态
    });
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
            {arr.map((item, index) => (
              <ConditionList
                key={index}
                title={
                  index === 0
                    ? '如果'
                    : index === arr.length - 1
                    ? '否则'
                    : '否则如果'
                }
                index={index}
                initialValues={item}
                removeItem={removeItem}
                handleChangeNodeConfig={handleChangeNodeConfig}
                draggableId={`condition-${index}`} // 为每个条件设置唯一的 draggableId
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
