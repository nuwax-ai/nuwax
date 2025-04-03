import InputOrReference from '@/components/FormListItem/InputOrReference';
import { FieldConfig } from '@/components/FormListItem/type';
import { DataTypeMap } from '@/constants/common.constants';
import { DataTypeEnum } from '@/types/enums/common';
import type { DefaultObjectType } from '@/types/interfaces/common';

import {
  FormListProps,
  KeyValuePairs,
  MultiSelectWithCheckboxProps,
  NodeRenderProps,
  TreeNodeData,
  TreeOutputProps,
} from '@/types/interfaces/workflow';
import {
  DeleteOutlined,
  DownOutlined,
  FileDoneOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Popover,
  Select,
  Tag,
  Tree,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import '../index.less';
import './commonNode.less';

// 定义通用的输入输出
export const InputAndOut: React.FC<NodeRenderProps> = ({
  title,
  fieldConfigs,
  form,
  inputItemName = 'inputArgs',
  showCopy = false,
  disabledAdd,
  disabledDelete,
  disabledInput,
  isLoop,
}) => {
  const { volid } = useModel('workflow');
  // 根据传递的fieldConfigs生成表单项
  const formItem = fieldConfigs.reduce(
    (acc: DefaultObjectType, field: FieldConfig) => {
      acc[field.name] = null;
      return acc;
    },
    {},
  );

  const addInputItem = () => {
    const nextItems = [...(form.getFieldValue(inputItemName) || []), formItem];
    form.setFieldsValue({ [inputItemName]: nextItems });
  };

  const removeItem = (index: number) => {
    const formValue = form.getFieldsValue()[inputItemName];
    const _newValue = formValue.filter((_: unknown, i: number) => i !== index);
    form.setFieldsValue({ [inputItemName]: _newValue });
  };

  useEffect(() => {
    if (volid) {
      form.validateFields();
    }
  }, [volid]);

  return (
    <div className={'form-list-style'}>
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">{title}</span>
        {!disabledAdd && (
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={addInputItem}
          ></Button>
        )}
      </div>
      <Form.List name={inputItemName}>
        {(fields) => (
          <>
            {fields.map((item, index) => {
              const fieldValue = form.getFieldValue([
                inputItemName,
                item.name,
                'bindValueType',
              ]);
              return (
                <div key={item.name}>
                  {/* 只在第一个输入框组旁边显示标签 */}
                  {index === 0 && (
                    <div className="font-color-gray07">
                      <span>参数名</span>
                      <span style={{ marginLeft: '20%' }}>变量值</span>
                    </div>
                  )}
                  <Form.Item key={item.key}>
                    <div className="dis-left">
                      <Form.Item
                        label="参数名"
                        name={[item.name, 'name']}
                        noStyle
                        rules={[{ required: true, message: '请输入变量名' }]}
                      >
                        <Input
                          size="small"
                          style={{ width: '30%', marginRight: '10px' }}
                          placeholder="请输入参数名"
                          disabled={disabledInput}
                        />
                      </Form.Item>
                      <Form.Item
                        label="参数值"
                        name={[item.name, 'bindValue']}
                        noStyle
                        rules={[
                          { required: true, message: '请选择或输入变量值' },
                        ]}
                      >
                        <InputOrReference
                          onChange={(value) => {
                            form.setFieldValue(
                              [inputItemName, item.name, 'bindValue'],
                              value,
                            );
                          }}
                          value={form.getFieldValue([
                            inputItemName,
                            item.name,
                            'bindValue',
                          ])}
                          form={form}
                          fieldName={[inputItemName, item.name, 'bindValue']}
                          style={{ flex: 1, marginRight: '10px' }}
                          referenceType={fieldValue}
                          isLoop={isLoop}
                        />
                      </Form.Item>
                      <Form.Item name={[item.name, 'bindType']} noStyle hidden>
                        <Input type="hidden" />
                      </Form.Item>
                      {showCopy && (
                        <Popover
                          content={
                            <Form.Item
                              name={[item.name, 'description']}
                              noStyle // 添加description的initialValue
                            >
                              <Input.TextArea
                                autoSize={{ minRows: 3, maxRows: 5 }}
                              />
                            </Form.Item>
                          }
                          trigger="click"
                        >
                          <FileDoneOutlined className="margin-right cursor-pointer" />
                        </Popover>
                      )}
                      {!disabledDelete && (
                        <Form.Item name={[item.name, 'require']} noStyle>
                          <DeleteOutlined
                            onClick={() => removeItem(item.name)}
                          />
                        </Form.Item>
                      )}
                    </div>
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </div>
  );
};

// 定义其他的输出
export const OtherFormList: React.FC<NodeRenderProps> = ({
  title,
  inputItemName = 'conditionArgs',
}) => {
  return (
    <>
      <Form.List name={inputItemName}>
        {(fields, { add, remove }) => (
          <>
            <div className="dis-sb margin-bottom">
              <span className="node-title-style">{title}</span>
              <Button
                icon={<PlusOutlined />}
                size={'small'}
                onClick={() =>
                  add({
                    key: uuidv4(),
                    name: '',
                    bindValue: '',
                    dataType: DataTypeEnum.String,
                  })
                }
              ></Button>
            </div>
            {fields.map((item, index) => {
              return (
                <div key={item.key}>
                  {index === 0 && (
                    <div className="font-color-gray07">
                      <span>参数名</span>
                      <span style={{ marginLeft: '20%' }}>变量值</span>
                    </div>
                  )}
                  <Form.Item key={item.key}>
                    <div className="dis-left">
                      <Form.Item
                        label="参数名"
                        name={[item.name, 'name']}
                        noStyle
                        rules={[{ required: true, message: '请输入变量名' }]}
                      >
                        <Input
                          size="small"
                          style={{ width: '30%', marginRight: '10px' }}
                          placeholder="请输入参数名"
                        />
                      </Form.Item>
                      <Form.Item
                        label="变量名"
                        name={[item.name, 'bindValue']}
                        noStyle
                        rules={[
                          { required: true, message: '请选择或输入变量值' },
                        ]}
                      >
                        <Input
                          placeholder="请输入参数值"
                          size="small"
                          style={{ width: '55%', marginRight: '10px' }}
                        />
                      </Form.Item>
                      <Form.Item noStyle>
                        <DeleteOutlined onClick={() => remove(item.name)} />
                      </Form.Item>
                    </div>
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </>
  );
};

// 定义树结构的输出
export const TreeOutput: React.FC<TreeOutputProps> = ({ treeData }) => {
  const { TreeNode } = Tree;
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  useEffect(() => {
    console.log(treeData, 'treeData');
    // 当 treeData 更新时，重新计算 expandedKeys
    const getAllParentKeys = (data: TreeNodeData[]): React.Key[] => {
      const keys: React.Key[] = [];
      data.forEach((node) => {
        if (node.subArgs && node.subArgs.length > 0) {
          keys.push(node.name);
          keys.push(...getAllParentKeys(node.subArgs));
        }
      });
      return keys;
    };

    setExpandedKeys(getAllParentKeys(treeData));
  }, [treeData]);
  // 定义一个函数来递归生成带有标签的树节点
  const renderTreeNode = (data: TreeNodeData[]) => {
    console.log(data, 'data');
    return data.map((item) => {
      if (item.subArgs) {
        return (
          <TreeNode
            title={
              <span>
                {item.name}{' '}
                <Tag color="#C9CDD4" style={{ marginLeft: '5px' }}>
                  {DataTypeMap[item.dataType as DataTypeEnum]}
                </Tag>
              </span>
            }
            key={item.name}
          >
            {renderTreeNode(item.subArgs)}
          </TreeNode>
        );
      }
      return (
        <TreeNode
          title={
            <span>
              {item.name}{' '}
              <Tag color="#C9CDD4" style={{ marginLeft: '5px' }}>
                {DataTypeMap[item.dataType as DataTypeEnum]}
              </Tag>
            </span>
          }
          key={item.name}
        />
      );
    });
  };

  return (
    <Tree
      showLine
      expandedKeys={expandedKeys} // 使用 expandedKeys 控制展开
      onExpand={(keys) => setExpandedKeys(keys)} // 更新 expandedKeys
      switcherIcon={<DownOutlined />}
    >
      {treeData && renderTreeNode(treeData)}
    </Tree>
  );
};

// 带勾选的多选select
export const MultiSelectWithCheckbox: React.FC<
  MultiSelectWithCheckboxProps
> = ({ options, placeholder, onChange }) => {
  const handleChange = (value: string[]) => {
    if (onChange) {
      onChange(value);
    }
  };

  const renderOption = (option: KeyValuePairs) => (
    <Select.Option key={option.value} value={option.value}>
      <span className="option-container">
        <Checkbox />
        <span>{option.label}</span>
      </span>
    </Select.Option>
  );

  return (
    <Select
      mode="multiple"
      showSearch
      placeholder={placeholder}
      optionLabelProp="label"
      onChange={handleChange}
      filterOption={(input, option) =>
        option?.props.children
          ?.toString()
          .toLowerCase()
          .includes(input.toLowerCase())
      }
      dropdownRender={(menu) => (
        <div className="custom-dropdown">
          {React.cloneElement(menu as any, {
            className: `${(menu as any).props.className} custom-menu`,
          })}
        </div>
      )}
      tokenSeparators={[',']}
      style={{ width: '100%' }}
    >
      {options.map(renderOption)}
    </Select>
  );
};

// 封装一个formList
export const FormList: React.FC<FormListProps> = ({
  form,
  title,
  field,
  inputItemName = 'inputArgs',
  showIndex,
}) => {
  const arr = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <Form.List name={inputItemName}>
      {(fields, { add, remove }) => (
        <>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style">{title}</span>
            <Button
              icon={<PlusOutlined />}
              size={'small'}
              onClick={() => {
                const currentFields = form.getFieldValue(inputItemName) || [];
                // 计算插入位置（倒数第二个位置）
                const insertIndex = Math.max(0, currentFields.length - 1);
                add({}, insertIndex);
              }}
            ></Button>
          </div>
          {fields.map((item, index) => {
            let fieldData = false;
            if (
              form.getFieldValue([inputItemName, item.name, 'intentType']) ===
              'OTHER'
            ) {
              fieldData = true;
            }
            if (
              form.getFieldValue([inputItemName, item.name, 'content']) ===
              '此选项用户不可见，用户回复无关内容时走此分支'
            ) {
              fieldData = true;
            }

            return (
              <Form.Item key={index}>
                <div className="dis-sb">
                  {showIndex && (
                    <Form.Item noStyle name={[item.name, 'index']}>
                      <span className="mr-16">{arr[index]}</span>
                    </Form.Item>
                  )}
                  <Form.Item name={[item.name, field]} noStyle>
                    <Input disabled={fieldData}></Input>
                  </Form.Item>
                  {!fieldData && (
                    <Form.Item noStyle>
                      <DeleteOutlined
                        className={'ml-10'}
                        onClick={() => {
                          remove(item.name);
                        }}
                      />
                    </Form.Item>
                  )}
                </div>
              </Form.Item>
            );
          })}
        </>
      )}
    </Form.List>
  );
};
