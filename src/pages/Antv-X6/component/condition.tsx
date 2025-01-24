import { InputOrReference } from '@/components/FormListItem/InputOrReference';
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

interface InputArgs {
  dataType: string;
  input: string;
  type: string;
}

interface ConditionListProps {
  title: string;
  index: number;
  item: InputArgs;
  // 改变节点的入参和出参
  handleChangeNodeConfig: (params: any) => void;
  // 删除当前的
  removeItem: (val: number) => void;
  draggableId: string;
  // 初始值（适用于已经编辑过的内容）
  initialValues?: object;
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
  form,
  onChange,
}) => {
  console.log('field', field);
  console.log('field', form);
  return (
    <div className="condition-right-item">
      <Form.Item style={{ marginRight: '8px' }} name={[field.name, 'type']}>
        <Select className="condition-type-select-style">
          <Select.Option value="1">且</Select.Option>
          <Select.Option value="2">或</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item style={{ marginRight: '8px' }} name={[field.name, 'type']}>
        <Form.Item name={[field.name, 'input']}>
          <Select defaultValue="输入 - input">
            <Select.Option value="输入 - input">输入 - input</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name={[field.name, 'dataType']} rules={[{ required: true }]}>
          <InputOrReference
            referenceList={modelTypes}
            value={'dataType'}
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
  inputItemName = 'inputArgs',
  initialValues,
  removeItem,
  handleChangeNodeConfig,
  draggableId, // 新增一个 draggableId 属性
}) => {
  const [form] = Form.useForm();

  // 提交form表单
  const submitForm = () => {
    const values = form.getFieldsValue();
    handleChangeNodeConfig(values);
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
                <>
                  <div className="dis-sb">
                    {fields.length > 1 && (
                      <div className="select-condition-type-style">
                        <Select defaultValue={'1'}>
                          <Select.Option value="1">且</Select.Option>
                          <Select.Option value="2">或</Select.Option>
                        </Select>
                      </div>
                    )}
                    <div className="flex-1">
                      {fields.map((field) => (
                        <div key={field.key} className="dis-sb">
                          {Condition({
                            field,
                            onRemove: () => remove(field.name),
                            form,
                            onChange: submitForm,
                          })}
                          <MinusCircleOutlined
                            onClick={() => remove(field.name)}
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
                    onClick={() => add({ dataType: '', input: '', type: '' })}
                  >
                    新增
                  </Button>
                </>
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
  console.log('params', params);
  console.log('Modified', Modified);

  const [arr, setArr] = useState<InputArgs[]>([
    { dataType: '', input: '', type: '' },
  ]);

  const addInputItem = () => {
    setArr([...arr, { dataType: '', input: '', type: '' }]);
  };

  const removeItem = (index: number) => {
    setArr(arr.filter((_, i) => i !== index));
  };

  const handleChangeNodeConfig = () => {
    console.log('handleChangeNodeConfig');
  };

  // 拖拽逻辑
  const onDragEnd = (result: any) => {
    if (!result.destination) return; // 如果没有目标位置，直接返回

    const newItems = Array.from(arr); // 复制当前数组
    const [removed] = newItems.splice(result.source.index, 1); // 移除拖拽的项
    newItems.splice(result.destination.index, 0, removed); // 插入到目标位置

    setArr(newItems); // 更新状态
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
                handleChangeNodeConfig={handleChangeNodeConfig}
                removeItem={removeItem}
                item={item}
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
