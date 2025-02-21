import { DefaultRenderItem } from '@/components/FormListItem';
import { FieldConfig } from '@/components/FormListItem/type';
import type { DefaultObjectType } from '@/types/interfaces/common';
import {
  KeyValuePairs,
  MultiSelectWithCheckboxProps,
  NodeRenderProps,
  TreeNodeData,
  TreeOutputProps,
} from '@/types/interfaces/workflow';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Form, Select, Tag, Tree } from 'antd';
import React, { useEffect } from 'react';
import '../index.less';
import './commonNode.less';
// 定义通用的输入输出
export const InputAndOut: React.FC<NodeRenderProps> = ({
  title,
  fieldConfigs,
  handleChangeNodeConfig,
  referenceList,
  renderItem = DefaultRenderItem,
  inputItemName = 'inputItems',
  initialValues,
  showCheckbox = false,
  showCopy = false,
}) => {
  const [form] = Form.useForm();

  const getFieldPath = (fieldName: string, index: number) => [
    inputItemName,
    index,
    fieldName,
  ];

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

  // 提交form表单
  const submitForm = () => {
    const raw = form.getFieldsValue(true);

    handleChangeNodeConfig(raw);
    // handleChangeNodeConfig(values);
  };
  useEffect(() => {
    // 设置初始值，确保Form.List能正确展示已有条目
    form.setFieldsValue(initialValues);
  }, [form, inputItemName, initialValues]);

  return (
    <div className="start-node-style">
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">{title}</span>
        <Button
          icon={<PlusOutlined />}
          size={'small'}
          onClick={addInputItem}
        ></Button>
      </div>
      <Form form={form} initialValues={initialValues}>
        <Form.List name={inputItemName}>
          {(fields, { remove }) =>
            fields.map((field) => (
              <React.Fragment key={field.key}>
                <Form.Item noStyle key={field.key} name={[field.name]}>
                  {renderItem({
                    field,
                    // 生成字段路径
                    fieldName: getFieldPath('bindValue', field.name),
                    onRemove: () => remove(field.name),
                    fieldConfigs,
                    referenceList: referenceList || {
                      previousNodes: [],
                      innerPreviousNodes: [],
                      argMap: {},
                    },
                    form,
                    showCheckbox,
                    showCopy,
                    onChange: submitForm,
                  })}
                </Form.Item>
              </React.Fragment>
            ))
          }
        </Form.List>
      </Form>
    </div>
  );
};

// 定义树结构的输出
export const TreeOutput: React.FC<TreeOutputProps> = ({ treeData }) => {
  const { TreeNode } = Tree;
  // 定义一个函数来递归生成带有标签的树节点
  const renderTreeNode = (data: TreeNodeData[]) => {
    return data.map((item) => {
      if (item.subArgs) {
        return (
          <TreeNode
            title={
              <span>
                {item.name}{' '}
                <Tag style={{ marginLeft: '5px' }}>{item.dataType}</Tag>
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
              <Tag style={{ marginLeft: '5px' }}>{item.dataType}</Tag>
            </span>
          }
          key={item.name}
        />
      );
    });
  };

  return (
    <Tree showLine switcherIcon={<DownOutlined />}>
      {renderTreeNode(treeData)}
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
