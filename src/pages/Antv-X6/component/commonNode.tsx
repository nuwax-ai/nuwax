import { ICON_ASSOCIATION } from '@/constants/images.constants';
import type { DefaultObjectType } from '@/types/interfaces/common';
import {
  DeleteOutlined,
  DownOutlined,
  FileDoneOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Dropdown,
  Form,
  Input,
  Select,
  Space,
  Tag,
  Tree,
  Typography,
} from 'antd';
import React from 'react';
import '../index.less';
import {
  FieldConfig,
  InputOrReferenceProps,
  KeyValuePairs,
  MultiSelectWithCheckboxProps,
  NodeRenderProps,
  RenderItemProps,
  SkillProps,
  TreeNodeData,
  TreeOutputProps,
} from '../type';
import './commonNode.less';

// 输入或引用参数
export const InputOrReference: React.FC<InputOrReferenceProps> = ({
  referenceList,
  placeholder,
  value, // 使用新增的 value 属性
  onChange, // 使用新增的 onChange 回调
}) => {
  const handleSelect = (parentKey: string, childKey: string) => {
    // 将选中的父选项和子选项作为字符串集合添加到 selected 数组中
    const selectedItem = `${parentKey}-${childKey}`;
    // 调用 onChange 更新值
    onChange(selectedItem);
  };
  // 更新表单值为输入框内容
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Input
      value={value && !value.includes('-') ? value : ''} // 如果有选中项，则清空输入框文本
      placeholder={placeholder ? placeholder : '请输入或引用参数'}
      onChange={handleInputChange}
      addonBefore={
        value &&
        value.includes('-') && (
          <Tag closable onClose={() => onChange('')} style={{ marginRight: 8 }}>
            {value}
          </Tag>
        )
      }
      suffix={
        <Dropdown
          overlayStyle={{ width: '200px' }}
          menu={{
            items: referenceList.map((item) => ({
              key: item.key,
              label: item.label,
              icon: item.icon,
              children: item.children?.map((subItem) => ({
                key: subItem.key,
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '300px',
                    }}
                  >
                    {subItem.label}
                    <Tag style={{ marginLeft: 20 }}>{subItem.tag}</Tag>
                  </div>
                ),
                onClick: () => handleSelect(item.key, subItem.key),
              })),
            })),
          }}
          trigger={['click']}
        >
          <SettingOutlined style={{ cursor: 'pointer' }} />
        </Dropdown>
      }
    />
  );
};

// 默认的变量输入输出方法
const defaultRenderItem: React.FC<RenderItemProps> = ({
  field,
  onRemove,
  fieldConfigs,
  rowIndex,
  showCheckbox,
  showCopy,
  showAssociation,
  form,
}) => {
  console.log(fieldConfigs);
  return (
    <Space className="dis-sb" style={{ width: '100%' }}>
      {fieldConfigs.map((config, index) => {
        const fieldValue = form.getFieldValue([field.name, config.name]);
        return (
          <div key={index}>
            {rowIndex === 0 && (
              <Typography.Text>{config.label}</Typography.Text>
            )}
            <Form.Item
              name={[field.name, config.name]}
              rules={config.rules}
              style={config.style}
            >
              {/* 使用 ...config.props 来传递特定组件的属性 */}
              <config.component
                {...config.props}
                placeholder={config.placeholder}
                form={form} // 将 form 传递给 CommonInput
                index={rowIndex} // 传递索引
                value={fieldValue} // 传递当前字段的值
                onBlur={
                  config.component === Input
                    ? (event: React.FocusEvent<HTMLInputElement>) => {
                        const value = event.target.value;
                        form.setFieldsValue({
                          [`${field.name}.${config.name}`]: value,
                        });
                      }
                    : undefined
                }
                onChange={
                  config.component !== Input
                    ? (value: string) => {
                        console.log(value);
                        form.setFieldsValue({
                          [`${field.name}.${config.name}`]: value,
                        });
                      }
                    : undefined
                }
              />
            </Form.Item>
          </div>
        );
      })}
      <Form.Item
        name={[field.name, 'isSelect']}
        valuePropName="checked"
        initialValue={true}
      >
        {/* 根据节点的需求，动态赋予右侧图标 */}
        <div className={`dis-sa  ${rowIndex === 0 ? 'margin-bottom-20' : ''}`}>
          {showCopy && <FileDoneOutlined className="margin-right" />}
          {showCheckbox && <Checkbox className="margin-right"></Checkbox>}
          {showAssociation && <ICON_ASSOCIATION className="margin-right" />}
          <DeleteOutlined onClick={onRemove} />
        </div>
      </Form.Item>
    </Space>
  );
};

// 定义通用的输入输出
export const InputAndOut: React.FC<NodeRenderProps> = ({
  title,
  fieldConfigs,
  renderItem = defaultRenderItem,
  initialValues,
  inputItemName = 'inputItems',
  showCheckbox = false,
  showCopy = false,
  showAssociation = false,
}) => {
  const [form] = Form.useForm();

  console.log(inputItemName);

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
  const submitForm = (values: any) => {
    // form.getFieldsValue()
    console.log('Received values of form:', values);
  };

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
      <Form form={form} onFinish={submitForm} initialValues={initialValues}>
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
