import { BaseFormItemProps, TabKey } from '@/types/interfaces/systemManage';
import {
  DeleteOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { Form, Input, Select, Tooltip, Upload } from 'antd';
import { Rule } from 'antd/es/form';
import { useEffect, useState } from 'react';

function MultiInput({
  value,
  onChange,
}: {
  value?: string[];
  onChange?: (value: string[]) => void;
}) {
  // 多行文本输入处理
  const [multValue, setMultValue] = useState<string[]>([]);
  useEffect(() => {
    setMultValue(value || []);
  }, [value]);
  const handleDeleteInput = (index: number) => {
    const newMultValue = multValue.filter((_, i) => i !== index);
    setMultValue(newMultValue);
    onChange?.(newMultValue);
  };
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const newMultValue = [...multValue];
    newMultValue[index] = e.target.value;
    setMultValue(newMultValue);
    onChange?.(newMultValue);
  };
  return multValue.map((v, index) => (
    <div
      style={{ display: 'flex', alignItems: 'center', marginTop: 8 }}
      key={index}
    >
      <Input value={v} onChange={(e) => handleInputChange(e, index)} />
      <DeleteOutlined
        style={{ marginLeft: 8, cursor: 'pointer' }}
        onClick={() => handleDeleteInput(index)}
      />
    </div>
  ));
}

export default function BaseFormItem({
  props,
  modelList,
  agentList,
  currentTab,
}: BaseFormItemProps) {
  const form = Form.useFormInstance();
  const handleAddInput = () => {
    const newMultValue = [...props.value, ''];
    console.log(newMultValue, props.value);

    form.setFieldValue(props.name, newMultValue);
  };
  const MultiInputLabel = () => {
    return (
      <div>
        <span style={{ marginRight: '5px' }}>{props.description}</span>
        {props.notice && (
          <Tooltip title={props.notice}>
            <QuestionCircleOutlined className="ant-form-item-tooltip" />
          </Tooltip>
        )}
        <PlusOutlined
          onClick={handleAddInput}
          style={{
            marginLeft: '20px',
            cursor: 'pointer',
            color: '#1D2129',
          }}
        />
      </div>
    );
  };
  const rules: { [p in TabKey]?: Rule[] } = {
    DomainBind: [
      {
        required: true,
        validator: (_: any, value: string[]) => {
          if (value.length === 0 || value.some((item) => item === '')) {
            return Promise.reject(new Error('请输入域名'));
          }
          return Promise.resolve();
        },
      },
    ],
  };
  // 处理 Select 类型的初始值：-1 表示未选择，应转换为 undefined
  const getInitialValue = () => {
    if (['Select'].includes(props.inputType) && Number(props.value) === -1) {
      return undefined;
    }
    if (
      ['MultiSelect'].includes(props.inputType) &&
      Number(props.value) === -1
    ) {
      return [];
    }
    return props.value;
  };

  return (
    <Form.Item
      key={props.name}
      name={props.name}
      initialValue={getInitialValue()}
      rules={rules[currentTab]}
      {...(props.inputType === 'MultiInput'
        ? {
            label: <MultiInputLabel />,
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
          onChange: (e: any) => {
            const value = ['Input', 'Textarea'].includes(props.inputType)
              ? e.target.value
              : e;
            form?.setFieldValue(props.name, value);
          },
        };
        switch (props.inputType) {
          case 'Input':
            return <Input {...attrs} />;
          case 'Textarea':
            return <Input.TextArea {...attrs} rows={4} />;
          case 'File':
            return (
              <Upload
                action={process.env.BASE_URL + '/api/file/upload'}
                headers={{
                  Authorization: `Bearer ${localStorage.getItem(
                    'ACCESS_TOKEN',
                  )}`,
                }}
                listType="picture-card"
                accept="image/*"
                maxCount={1}
                defaultFileList={
                  props.value ? ([{ url: props.value }] as any) : []
                }
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
          case 'MultiSelect': {
            let options: any[] = [];
            const mode =
              props.inputType === 'MultiSelect' ? 'multiple' : undefined;
            if (currentTab === 'ModelSetting') {
              options = modelList.map((v) => ({ label: v.name, value: v.id }));
            }
            if (currentTab === 'AgentSetting') {
              options = agentList.map((v) => ({
                label: v.name,
                value: v.targetId,
              }));
            }
            if (currentTab === 'BaseConfig') {
              options = props.placeholder.split(',').map((v) => {
                const [value, label] = v.split(':');
                return { label, value: +value };
              });
            }
            return (
              <Select
                {...attrs}
                mode={mode}
                options={options}
                allowClear
              ></Select>
            );
          }
          case 'MultiInput':
            return <MultiInput />;
        }
      })()}
    </Form.Item>
  );
}
