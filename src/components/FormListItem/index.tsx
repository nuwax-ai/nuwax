import { RenderItemProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Checkbox, Form, Input, Popover, Space } from 'antd';
import React from 'react';
import './index.less';
import { InputOrReference } from './InputOrReference';

// 默认的变量输入输出方法
export const DefaultRenderItem: React.FC<RenderItemProps> = ({
  field,
  onRemove,
  fieldConfigs,
  referenceList,
  fieldName,
  showCheckbox,
  showCopy,
  form,
  onChange,
}) => {
  const changeValue = () => {
    onChange();
  };
  // 修正路径生成逻辑（使用父字段路径）
  const bindValueTypePath = [...fieldName.slice(0, -1), 'bindValueType'];
  // 是否展开子集
  // const [isExpand, setIsExpand] = useState(false);

  // 获取当前行的数据类型
  // const dataType = form.getFieldValue([field.name, 'dataType']) as string;

  return (
    <div>
      {/* 标题 */}
      {field.name === 0 && (
        <div className="dis-left">
          {fieldConfigs.map((item) => (
            <span
              key={item.name}
              style={{ width: (item.width as number) + 10 }}
            >
              {item.label}
            </span>
          ))}
        </div>
      )}
      <Space className="form-list-item-style" style={{ width: '100%' }}>
        {/* 如果是引用或输入没有dataType 则不显示绑定类型，否则显示绑定类型隐藏字段 */}
        {
          <Form.Item
            name={bindValueTypePath}
            hidden
            key={`${field.key}_bindType`}
          >
            <Input type="hidden" />
          </Form.Item>
        }
        {fieldConfigs.map((config, index) => {
          if (config.name === 'description' || config.name === 'require') {
            // 跳过 description 和 require 字段，将在后面单独处理
            return null;
          }
          const fieldValue = form.getFieldValue([field.name, config.name]);

          return (
            <div key={index} className="dis-left">
              <Form.Item
                name={[field.name, config.name]}
                rules={config.rules}
                style={{ width: config.width }}
              >
                {(() => {
                  const commonProps = {
                    placeholder: config.placeholder,
                    form: form,
                    index: field.name,
                    options: config.options,
                    fieldName: fieldName,
                    value: fieldValue,
                  };

                  // 特定于InputOrReference的props
                  const inputOrReferenceProps =
                    config.component === InputOrReference
                      ? { referenceList: referenceList ?? [] }
                      : {};

                  let eventHandlers = {} as {
                    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
                    onChange?: (value: string | string[]) => void;
                  };

                  // 根据组件类型动态添加事件处理器
                  if (config.component === Input) {
                    eventHandlers.onBlur = () => changeValue();
                  } else {
                    eventHandlers.onChange = () => changeValue();
                  }

                  return (
                    <config.component
                      {...commonProps}
                      {...inputOrReferenceProps}
                      {...eventHandlers}
                    />
                  );
                })()}
              </Form.Item>
            </div>
          );
        })}

        {/* 特殊处理 description 和 require 字段 */}
        <div className="dis-left">
          {showCopy && (
            <Form.Item noStyle>
              <Popover
                content={
                  <Form.Item
                    name={[field.name, 'description']}
                    noStyle
                    initialValue={form.getFieldValue([
                      field.name,
                      'description',
                    ])} // 添加description的initialValue
                  >
                    <Input.TextArea onChange={changeValue} />
                  </Form.Item>
                }
                trigger="click"
              >
                <FileDoneOutlined
                  style={{ marginBottom: '14px' }}
                  className="margin-right cursor-pointer"
                />
              </Popover>
            </Form.Item>
          )}

          {showCheckbox && (
            <Form.Item
              name={[field.name, 'require']}
              valuePropName="checked"
              initialValue={form.getFieldValue([field.name, 'require'])} // 添加require的initialValue
            >
              <Checkbox
                className="margin-right"
                onChange={(e) => {
                  form.setFieldsValue({
                    [field.name]: {
                      ...form.getFieldValue([field.name]),
                      require: e.target.checked,
                    },
                  });
                  changeValue();
                }}
              />
            </Form.Item>
          )}
          <Form.Item>
            <DeleteOutlined onClick={onRemove} />
          </Form.Item>
        </div>
      </Space>
    </div>
  );
};
