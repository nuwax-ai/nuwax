import { SystemUserConfig } from '@/types/interfaces/systemManage';
import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Form, Input, Select, Tooltip, Upload } from 'antd';

export default function BaseFormItem({ props }: { props: SystemUserConfig }) {
  return (
    <Form.Item
      key={props.name}
      {...(props.inputType === 'MultiInput'
        ? {
            label: (
              <div>
                <span style={{ marginRight: '5px' }}>{props.description}</span>
                {props.notice && (
                  <Tooltip title={props.notice}>
                    <QuestionCircleOutlined className="ant-form-item-tooltip" />
                  </Tooltip>
                )}
                <PlusOutlined
                  style={{
                    marginLeft: '20px',
                    cursor: 'pointer',
                    color: '#1D2129',
                  }}
                />
              </div>
            ),
          }
        : {
            label: props.description,
            tooltip: props.notice && {
              title: props.notice,
              icon: <QuestionCircleOutlined />,
            },
          })}
    >
      {(() => {
        const attrs = {
          placeholder: props.placeholder,
          name: props.name,
          value: props.value as string,
        };
        switch (props.inputType) {
          case 'Input':
            return <Input {...attrs} />;
          case 'Textarea':
            return <Input.TextArea {...attrs} rows={4} />;
          case 'File':
            return (
              <Upload
                action="/upload.do"
                listType="picture-card"
                accept="image/*"
                maxCount={1}
              >
                <button
                  style={{
                    color: 'inherit',
                    cursor: 'inherit',
                    border: 0,
                    background: 'none',
                  }}
                  type="button"
                >
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>{props.placeholder}</div>
                </button>
              </Upload>
            );
          case 'Select':
          case 'MultiSelect':
            return (
              <Select
                {...attrs}
                mode={
                  props.inputType === 'MultiSelect' ? 'multiple' : undefined
                }
                options={props.placeholder.split(',').map((v) => {
                  const [value, label] = v.split(':');
                  return { value, label };
                })}
              ></Select>
            );
          case 'MultiInput':
            return (props.value as string[]).map((v, index) => (
              <div
                style={{ display: 'flex', alignItems: 'center' }}
                key={index}
              >
                <Input {...attrs} value={v} />
                <DeleteOutlined style={{ marginLeft: 8, cursor: 'pointer' }} />
              </div>
            ));
        }
      })()}
    </Form.Item>
  );
}
