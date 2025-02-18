import { DefaultRenderItem } from '@/components/FormListItem';
import { FieldConfig } from '@/components/FormListItem/type';
import type { DefaultObjectType } from '@/types/interfaces/common';
import {
  KeyValuePairs,
  MultiSelectWithCheckboxProps,
  NodeRenderProps,
  SkillProps,
  TreeNodeData,
  TreeOutputProps,
} from '@/types/interfaces/workflow';
import {
  DeleteOutlined,
  DownOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Modal,
  Popover,
  Select,
  Tag,
  Tree,
} from 'antd';
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
    for (let item of values[inputItemName]) {
      if (
        item.bindValue &&
        referenceList &&
        referenceList.argMap &&
        referenceList.argMap[item.bindValue]
      ) {
        item.bindValueType = 'Reference';
        item.dataType = referenceList.argMap[item.bindValue].dataType;
      } else {
        if (item.dataType && typeof item.dataType === 'object') {
          if (item.dataType.length === 1) {
            item.dataType = item.dataType[0];
          } else {
            item.dataType = item.dataType[1];
          }
        }
      }
      // if(item.compo)
    }
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
                      referenceList: referenceList || {
                        previousNodes: [],
                        innerPreviousNodes: [],
                        argMap: {},
                      },
                      // 新增传递索引信息
                      rowIndex: index,
                      form,
                      showCheckbox,
                      showCopy,
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
export const Skill: React.FC<SkillProps> = ({ params, handleChange }) => {
  return (
    <div className="skill-item-style dis-left">
      <img src={params.icon} alt="" className="skill-item-icon" />
      <div className="skill-item-content-style">
        <div className="skill-item-title-style">{params.name}</div>
        <div className="skill-item-desc-style">{params.description}</div>
      </div>
      <div className="skill-item-dispose-style">
        <Popover content={params.description} trigger="hover">
          <InfoCircleOutlined />
        </Popover>
        <Popover content={'编辑参数'} trigger="hover">
          <SettingOutlined />
        </Popover>
        <Popover content={'移除'} trigger="hover">
          <DeleteOutlined onClick={() => handleChange(params, 'delete')} />
        </Popover>
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
                {item.name}{' '}
                <Tag style={{ marginLeft: '5px' }}>{item.dataType}</Tag>
              </span>
            }
            key={item.name}
          >
            {renderTreeNode(item.children)}
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

// 定义技能列表的设置参数的弹窗
export const SkillDispose: React.FC<SkillDisposeProps> = ({
  open,
  onCancel,
}) => {
  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={open}
      footer={null}
      centered
      title={'设置'}
      onCancel={() => onCancel()}
      className="created-modal-style"
      width={800}
    >
      <div className="skill-dispose-container">
        {/* 左侧部分 */}
        <div className="skill-dispose-left">
          <p>配置输入参数</p>
          <p>配置输出参数</p>
        </div>
        {/* 右侧部分 */}
        <div className="skill-dispose-right"></div>
      </div>
    </Modal>
  );
};
