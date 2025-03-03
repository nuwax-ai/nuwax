import InputOrReference from '@/components/FormListItem/InputOrReference';
import { ConditionBranchConfigs } from '@/types/interfaces/node';
import {
  ConditionListProps,
  ConditionProps,
  NodeDisposeProps,
} from '@/types/interfaces/workflow';
import { returnImg } from '@/utils/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Select, Tag } from 'antd';
import React from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
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
}) => {
  // const changeReference = (value: string) => {
  //   const _dataType = referenceList?.argMap?.[value];
  //   form.setFieldValue([field.name, 'dataType'], _dataType || 'String');
  // }

  return (
    <div className="condition-right-item">
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
        ></Select>
      </Form.Item>
      <Form.Item style={{ marginRight: '8px', flex: 1 }}>
        <Form.Item name={[field.name, 'firstArg']}>
          <Select
            placeholder="请选择"
            optionLabelProp="displayValue"
            options={referenceList.previousNodes.map((item) => {
              return {
                label: (
                  <div className="dis-left font-12">
                    {returnImg(item.type)}
                    <span className="select-groud-label-style">
                      {item.name}
                    </span>
                  </div>
                ),
                options: item.outputArgs.map((arg) => {
                  return {
                    arg,
                    label: (
                      <div className="dis-left  font-12">
                        <span className=" font-12">{arg.name}</span>
                        <Tag className="select-groud-label-style">
                          {arg.dataType}
                        </Tag>
                      </div>
                    ),
                    value: JSON.stringify(arg),
                    displayValue: `${item.name}-${arg.name}`,
                  };
                }),
              };
            })}
          />
        </Form.Item>
        <Form.Item
          name={[field.name, 'secondArg']}
          rules={[{ required: true }]}
        >
          <InputOrReference
            referenceList={referenceList}
            value={form.getFieldValue([field.name, 'bindValue'])}
            onChange={onChange}
            returnObj
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
    const values = form.getFieldsValue();
    const _params = {
      ...initialValues,
      conditionArgs: values.conditionArgs.map((item: any) => {
        return {
          ...item,
          firstArg: item.firstArg ? JSON.parse(item.firstArg) : null,
          secondArg: item.secondArg ? JSON.parse(item.secondArg) : null,
        };
      }),
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
          <Form
            form={form}
            onValuesChange={submitForm}
            initialValues={{
              ...initialValues,
              conditionArgs: initialValues.conditionArgs.map((item) => ({
                ...item,
                firstArg: item.firstArg ? JSON.stringify(item.firstArg) : null,
                secondArg: item.secondArg
                  ? JSON.stringify(item.secondArg)
                  : null,
              })),
            }}
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
                        <Form.Item name={[inputItemName, 'conditionType']}>
                          <Select
                            value={form.getFieldValue('conditionType')}
                            defaultValue={'AND'}
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
            firstArg: null,
            compareType: null,
            secondArg: null,
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
            {(params.conditionBranchConfigs || []).map((item, index) => {
              return (
                <ConditionList
                  key={item.uuid}
                  title={index === 0 ? '如果' : '否则如果'}
                  index={index}
                  initialValues={item}
                  removeItem={removeItem}
                  handleChangeNodeConfig={handleChangeNodeConfig}
                  draggableId={item.uuid.toString()}
                  referenceList={referenceList}
                />
              );
            })}
            {provided.placeholder}
            <div className="condition-card-style">否则</div>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
