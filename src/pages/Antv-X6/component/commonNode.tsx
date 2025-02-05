import { DefaultRenderItem } from '@/components/FormListItem';
import type { DefaultObjectType } from '@/types/interfaces/common';
import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Checkbox, Form, Select, Tag, Tree } from 'antd';
import React, { useEffect } from 'react';
import '../index.less';
import {
  FieldConfig,
  KeyValuePairs,
  MultiSelectWithCheckboxProps,
  NodeRenderProps,
  SkillProps,
  TreeNodeData,
  TreeOutputProps,
} from '../type';
import './commonNode.less';

// 定义通用的输入输出
export const InputAndOut: React.FC<NodeRenderProps> = ({
  title,
  fieldConfigs,
  handleChangeNodeConfig,
  renderItem = DefaultRenderItem,
  inputItemName = 'inputItems',
  initialValues,
  showCheckbox = false,
  showCopy = false,
  showAssociation = false,
}) => {
  const [form] = Form.useForm();

  // 根据传递的fieldConfigs生成表单项
  const formItem = fieldConfigs.reduce(
    (acc: DefaultObjectType, field: FieldConfig) => {
      acc[field.name] = '';
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
    const values = form.getFieldsValue();
    handleChangeNodeConfig(values);
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
          {(fields, { remove }, { errors }) => (
            <>
              {fields.map((field, index) => {
                return (
                  <Form.Item key={field.key} noStyle>
                    {renderItem({
                      field,
                      onRemove: () => remove(field.name),
                      fieldConfigs,
                      // 新增传递索引信息
                      rowIndex: index,
                      form,
                      showCheckbox,
                      showCopy,
                      showAssociation,
                      onChange: submitForm,
                    })}
                  </Form.Item>
                );
              })}
              {errors.length > 0 && (
                <div style={{ color: 'red' }}>{errors.join(', ')}</div>
              )}
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
};

// 定义通用的技能显示
export const Skill: React.FC<SkillProps> = ({ title, icon, desc }) => {
  return (
    <div className="skill-item-style">
      {icon}
      <div className="skill-item-content-style">
        <div className="dis-sb">
          <div className="skill-item-title-style">{title}</div>
          <div>
            <SettingOutlined />
            <DeleteOutlined />
          </div>
        </div>
        <div className="skill-item-desc-style">{desc}</div>
      </div>
    </div>
  );
};

// 定义树结构的输出
export const TreeOutput: React.FC<TreeOutputProps> = ({ treeData }) => {
  const { TreeNode } = Tree;
  // 定义一个函数来递归生成带有标签的树节点
  const renderTreeNode = (data: TreeNodeData[]) => {
    return data.map((item) => {
      if (item.children) {
        return (
          <TreeNode
            title={
              <span>
                {item.title} <Tag style={{ marginLeft: '5px' }}>{item.tag}</Tag>
              </span>
            }
            key={item.key}
          >
            {renderTreeNode(item.children)}
          </TreeNode>
        );
      }
      return (
        <TreeNode
          title={
            <span>
              {item.title} <Tag style={{ marginLeft: '5px' }}>{item.tag}</Tag>
            </span>
          }
          key={item.key}
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
