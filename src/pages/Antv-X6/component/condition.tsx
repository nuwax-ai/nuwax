import InputOrReference from '@/components/FormListItem/InputOrReference';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Select, Space } from 'antd';
import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import './condition.less';
const options = [
  { label: '等于', value: 'EQUAL', displayValue: '=' },
  { label: '不等于', value: 'NOT_EQUAL', displayValue: '≠' },
  { label: '大于', value: 'GREATER_THAN', displayValue: '>' },
  {
    label: '大于等于',
    value: 'GREATER_THAN_OR_EQUAL',
    displayValue: '≥',
  },
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

const ConditionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <Form.List name={'conditionBranchConfigs'}>
      {(fields, { add, remove }) => (
        <>
          {/* 标题 */}
          <div className="dis-sb ">
            <span>条件分支</span>
            <Button
              icon={<PlusOutlined />}
              onClick={() =>
                add({
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
                })
              }
            ></Button>
          </div>
          {fields.map((item, index) => {
            return (
              <div key={item.name} className="condition-card-style">
                {/* 顶部优先级及删除 */}
                <div className="dis-sb">
                  <div className="dis-left">
                    <span>
                      {index === 0
                        ? '如果'
                        : index === fields.length - 1
                        ? '否则'
                        : '否则如果'}
                    </span>
                    <span>{'优先级 ' + (index + 1)}</span>
                  </div>
                  {/* 当总分支数>2且不是最后一个分支时才显示删除按钮 */}
                  {fields.length > 2 && index !== fields.length - 1 && (
                    <Button
                      icon={<MinusCircleOutlined />}
                      type="text"
                      onClick={() => remove(item.name)}
                    ></Button>
                  )}
                </div>
                <Space>
                  {index !== fields.length - 1 && (
                    <Form.List name={[item.name, 'conditionArgs']}>
                      {(subFields, subOpt) => (
                        <div className="position-relative">
                          <div className="dis-left">
                            {subFields.length > 1 && (
                              <div className="select-condition-border">
                                <Form.Item
                                  name={[item.name, 'conditionType']}
                                  noStyle
                                >
                                  <Select
                                    style={{ marginRight: '10px', width: 55 }}
                                  >
                                    <Select.Option value="AND">
                                      且
                                    </Select.Option>
                                    <Select.Option value="OR">或</Select.Option>
                                  </Select>
                                </Form.Item>
                              </div>
                            )}
                            <div className="dis-col">
                              {subFields.map((subField) => {
                                return (
                                  <div key={subField.name} className="dis-sb">
                                    <Form.Item
                                      name={[subField.name, 'compareType']}
                                      noStyle
                                    >
                                      <Select
                                        popupMatchSelectWidth={false}
                                        options={options}
                                        optionLabelProp="displayValue"
                                        style={{
                                          marginRight: '10px',
                                          width: 55,
                                        }}
                                      ></Select>
                                    </Form.Item>
                                    <div>
                                      <Form.Item
                                        name={[subField.name, 'firstArg']}
                                      >
                                        <InputOrReference
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
                                        />
                                      </Form.Item>
                                      <Form.Item
                                        name={[subField.name, 'secondArg']}
                                      >
                                        <InputOrReference
                                          form={form}
                                          fieldName={[
                                            'conditionBranchConfigs',
                                            item.name,
                                            'conditionArgs',
                                            subField.name,
                                            'secondArg',
                                            'bindValue',
                                          ]}
                                        />
                                      </Form.Item>
                                    </div>
                                    {subFields.length > 1 && (
                                      <Button
                                        type="text"
                                        icon={<MinusCircleOutlined />}
                                        onClick={() => {
                                          subOpt.remove(subField.name);
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
                      )}
                    </Form.List>
                  )}
                </Space>
              </div>
            );
          })}
        </>
      )}
    </Form.List>
  );
};

export default ConditionNode;
