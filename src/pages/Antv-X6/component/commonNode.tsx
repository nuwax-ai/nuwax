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
  Cascader,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Segmented,
  Slider,
  Space,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import '../index.less';
import {
  CommonInputProp,
  FieldConfig,
  NodeRenderProps,
  OptionItem,
  RenderItemProps,
  SkillProps,
} from '../type';

// 通用输入或引用参考值的input
export const CommonInput: React.FC<CommonInputProp> = ({ options }) => {
  // 自定义菜单项模板，用于添加图标
  const optionRender = (labels: string[], selectedOptions?: OptionItem[]) => {
    if (!selectedOptions || selectedOptions.length === 0) return null;
    console.log(selectedOptions);
    // 将选中的选项转换为带有图标和标签的 JSX.Element 数组
    const elements = selectedOptions.map((option, index) => (
      <span key={index}>
        {option.icon && <span className="icon">{option.icon}</span>}
        {option.label}
      </span>
    ));

    // 如果有层级关系，可以使用分隔符，并且确保所有的项都是 ReactNode 类型
    return elements
      .reduce<React.ReactNode[]>((prev, curr, index) => {
        prev.push(curr);
        if (index < elements.length - 1) {
          prev.push(' / '); // 分隔符
        }
        return prev;
      }, [])
      .reduce((prev, curr) => [prev, curr], []); // 确保最终结果是单一的 ReactElement 数组
  };
  // 处理变更事件
  const onChange = (value: any) => {
    console.log(value);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Input
        placeholder="输入或引用参考值"
        suffix={
          <Cascader
            options={options}
            displayRender={optionRender}
            onChange={onChange}
          >
            <SettingOutlined />
          </Cascader>
        }
      />
    </Space>
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
}) => {
  return (
    <Space className="dis-sb" style={{ width: '100%' }}>
      {fieldConfigs.map((config, index) => (
        <div key={index}>
          {rowIndex === 0 && <Typography.Text>{config.label}</Typography.Text>}
          <Form.Item
            name={[field.name, config.name]}
            rules={config.rules}
            style={config.style}
          >
            {/* 使用 ...config.props 来传递特定组件的属性 */}
            <config.component
              {...config.props}
              placeholder={config.placeholder}
            />
          </Form.Item>
        </div>
      ))}
      <Form.Item
        name={[field.name, 'isSelect']}
        valuePropName="checked"
        initialValue={true}
      >
        {/* 根据节点的需求，动态赋予右侧图标 */}
        <div className={`dis-sa  ${rowIndex === 0 ? 'right-icon-style' : ''}`}>
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
              {fields.map((field, index) => (
                <Form.Item key={field.key} noStyle>
                  {renderItem({
                    field,
                    onRemove: () => remove(field.name),
                    fieldConfigs,
                    rowIndex: index, // 新增传递索引信息
                    showCheckbox,
                    showCopy,
                    showAssociation,
                  })}
                </Form.Item>
              ))}
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
export const ModelSetting: React.FC = () => {
  // 默认显示高级设置
  const [showDispose, setShowDispose] = useState<boolean>(true);
  // 随机性的值
  const [inputValue, setInputValue] = useState(0);
  //   top的值
  const [topValue, setTopValue] = useState(0);
  //   回复长度
  const [replyValue, setReplyValue] = useState(0);

  // 改变模式
  const changeSegmented = (value: string) => {
    console.log('changeSegmented', value);
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
            onChange={(value: number) => setInputValue(value)}
            value={typeof inputValue === 'number' ? inputValue : 0}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={inputValue}
            onChange={(value: number | string | null) =>
              setInputValue(Number(value))
            }
            className="input-style"
          />
        </div>
        <div className="dis-sb">
          <span className="label-style">top P</span>
          <Slider
            min={0}
            max={100}
            onChange={(value: number) => setTopValue(value)}
            value={typeof topValue === 'number' ? topValue : 0}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            style={{ margin: '0 16px' }}
            size="small"
            value={topValue}
            onChange={(value: number | string | null) =>
              setTopValue(Number(value))
            }
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
            onChange={(value: number) => setReplyValue(value)}
            value={typeof replyValue === 'number' ? topValue : 0}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={replyValue}
            onChange={(value: number | string | null) =>
              setReplyValue(Number(value))
            }
            className="input-style"
          />
        </div>
      </div>
    </>
  );
};
