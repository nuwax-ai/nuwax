import { ICON_ASSOCIATION } from '@/constants/images.constants';
import type { DefaultObjectType } from '@/types/interfaces/common';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  DeleteOutlined,
  FileDoneOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Slider,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import '../index.less';
import {
  FieldConfig,
  GroupModelListItemProps,
  InputOrReferenceProps,
  KeyValuePairs,
  ModelListItemProps,
  ModelSelectProp,
  ModelSettingProp,
  MultiSelectWithCheckboxProps,
  NodeRenderProps,
  RenderItemProps,
  SkillProps,
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
      placeholder={placeholder}
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
                onChange={(value: string) =>
                  form.setFieldsValue({
                    [`${field.name}.${config.name}`]: value,
                  })
                } // 设置变更时更新表单值
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
    const nextItems = [...(form.getFieldValue('inputItems') || []), formItem];
    form.setFieldsValue({ inputItems: nextItems });
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
        <Form.List name="inputItems">
          {(fields, { remove }, { errors }) => (
            <>
              {fields.map((field, index) => {
                return (
                  <Form.Item key={field.key} noStyle>
                    {renderItem({
                      field,
                      onRemove: () => remove(field.name),
                      fieldConfigs,
                      rowIndex: index, // 新增传递索引信息
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

// 定义模型的设置弹窗
export const ModelSetting: React.FC<ModelSettingProp> = ({
  value,
  onChange,
}) => {
  // 使用 useState 和 useEffect 实现受控组件
  const [setting, setSetting] = useState(value);
  // 默认显示高级设置
  const [showDispose, setShowDispose] = useState<boolean>(true);
  // 改变模式
  const changeSegmented = (value: string) => {
    console.log('changeSegmented', value);
  };
  useEffect(() => {
    // 当父组件传递新的 settings 时，更新本地状态
    setSetting(setting);
  }, [setting]);

  // 更新值的辅助函数
  const updateValue = (key: 'top' | 'reply' | 'random', val: number | null) => {
    const newValue = {
      ...value,
      [key]: val || 0,
    };
    setSetting(newValue);
    onChange(newValue); // 将更新后的值传递回父组件
  };

  return (
    <>
      <div className="model-dispose-mode-style">
        <div className="dis-sb">
          <span className="label-style">生成多样性</span>
          <Segmented<string>
            options={['精确模式', '平衡模式', '创意模式', '自定义']}
            onChange={(value) => changeSegmented(value)}
            className="slider-style"
          />
          <span
            onClick={() => setShowDispose(!showDispose)}
            className="input-style"
          >
            高级设置 {showDispose ? <CaretUpOutlined /> : <CaretDownOutlined />}
          </span>
        </div>
        <div className="dis-sb">
          <span className="label-style">生成随机性</span>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => updateValue('random', val)}
            value={value.random}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={value.random}
            onChange={(val: number | null) => updateValue('random', val)}
            className="input-style"
          />
        </div>
        <div className="dis-sb">
          <span className="label-style">top P</span>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => updateValue('top', val)}
            value={value.top}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            style={{ margin: '0 16px' }}
            size="small"
            value={value.top}
            onChange={(val: number | null) => updateValue('top', val)}
            className="input-style"
          />
        </div>
      </div>
      <div className="model-dispose-mode-style">
        <p className="node-title-style">输入及输出设置</p>
        <div className="dis-sb">
          <span className="label-style">最大回复长度</span>
          <Slider
            min={0}
            max={100}
            onChange={(val: number) => updateValue('reply', val)}
            value={value.reply}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={value.reply}
            onChange={(val: number | null) => updateValue('reply', val)}
            className="input-style"
          />
        </div>
      </div>
    </>
  );
};

// 定义模型列表类
export const ModelListItem: React.FC<ModelListItemProps> = ({
  icon,
  label,
  size,
  modelName,
  desc,
  tagList,
}) => {
  let _arr: string[] = [];
  // 如果tagList的长度超过2个,那么获取第三个及以后的标签
  if (tagList && tagList.length > 2) {
    _arr = tagList.slice(2, tagList.length);
  }

  return (
    <div className="dis-left model-list-item-style">
      {/* 图片 */}
      {icon}
      {/* 右侧内容 */}
      <div className="dis-col">
        <div className="dis-left">
          <span className="model-list-item-label">{label}</span>
          {tagList && tagList[0] && <Tag>{tagList[0]}</Tag>}
          {tagList && tagList[1] && <Tag>{tagList[1]}</Tag>}
        </div>
        <div className="dis-left divider-text">
          <span>{size}</span>
          <Divider type="vertical" />
          <span>{modelName}</span>
          {/* 根据标签来确定后续的显示 */}
          {_arr.length &&
            _arr.map((item: string) => (
              <div key={item}>
                <Divider type="vertical" />
                <span>{item}</span>
              </div>
            ))}
        </div>
        {/* 描述 */}
        <span className="model-list-item-desc">{desc}</span>
      </div>
    </div>
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

// 定义带图标的模型选择select
export const GroupedOptionSelect: React.FC<GroupModelListItemProps> = ({
  groupedOptionsData,
  onChange,
  value,
}) => {
  // 自定义渲染函数用于已选中的项
  const labelRender = (props: any) => {
    if (value === '') return null;
    // const { label } = props; // 假设 props 中包含了 label 和 icon
    return (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {props.label.props.icon}
        <span style={{ marginLeft: '8px' }}>{props.label.props.label}</span>
      </div>
    );
  };

  return (
    <Select
      placeholder="请选择模型"
      style={{ width: '100%', marginTop: '10px' }}
      className="input-style"
      value={value}
      onChange={onChange}
      labelRender={labelRender} // 使用 tagRender 来自定义已选中项的渲染
      placement={'bottomLeft'}
      popupMatchSelectWidth={false}
    >
      {groupedOptionsData?.map((group, groupIndex) => (
        <Select.OptGroup key={groupIndex} label={group.label}>
          {group.options.map((opt, index) => (
            <Select.Option
              key={`${groupIndex}-${index}`}
              value={opt.value}
              label={{ label: opt.label, icon: opt.icon }} // 设置 label 属性为一个对象
            >
              <ModelListItem
                icon={opt.icon}
                label={opt.label}
                size={opt.size}
                modelName={opt.modelName}
                desc={opt.desc}
                tagList={opt.tagList}
                value={opt.value}
              />
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );
};

// 定义模型模块
export const ModelSelect: React.FC<ModelSelectProp> = ({
  settings,
  groupModelList,
}) => {
  return (
    <div className="node-item-style">
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">模型</span>
        <Popover
          content={
            <ModelSetting value={settings.value} onChange={settings.onChange} />
          }
          title="模型"
          trigger="click"
          placement="left"
        >
          <SettingOutlined />
        </Popover>
      </div>
      {groupModelList.groupedOptionsData && (
        <GroupedOptionSelect
          groupedOptionsData={groupModelList.groupedOptionsData}
          onChange={groupModelList.onChange}
          value={groupModelList.value}
        />
      )}
    </div>
  );
};
