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
        <div className="dis-left font-12">
          {fieldConfigs.map((item) => (
            <span
              key={item.name}
              style={{ width: (item.width as number) + 10, marginLeft: '5px' }}
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
            <div key={index} className="dis-left font-12">
              <Form.Item
                name={[field.name, config.name]}
                rules={config.rules}
                style={{ width: config.width }}
              >
                {(() => {
                  if (config.component === InputOrReference) {
                    return (
                      <InputOrReference
                        placeholder={config.placeholder}
                        form={form}
                        fieldName={bindValueTypePath}
                        value={fieldValue}
                        referenceList={referenceList}
                        onChange={(e: string) => {
                          form.setFieldValue(
                            [...fieldName.slice(0, -1), config.name],
                            e,
                          );
                          onChange();
                        }}
                      />
                    );
                  } else {
                    return (
                      <Input
                        placeholder={config.placeholder}
                        value={fieldValue}
                        onChange={(e) => {
                          form.setFieldValue(
                            [...fieldName.slice(0, -1), config.name],
                            e.target.value,
                          );
                          onChange();
                        }}
                      />
                    );
                  }
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
                    <Input.TextArea
                      autoSize={{ minRows: 3, maxRows: 5 }}
                      onBlur={(e) => {
                        form.setFieldsValue({
                          [field.name]: {
                            ...form.getFieldValue([field.name]),
                            description: e.target.value,
                          },
                        });
                        changeValue();
                      }}
                    />
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
