import { customizeRequiredMark } from '@/utils/form';
import {
  Cascader,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
} from 'antd';
import React from 'react';
import './index.less';
import type { AddedProps, FormItem } from './type';
const Added: React.FC<AddedProps> = ({
  visible,
  title,
  formList,
  onSubmit,
  onCancel,
  width,
  initialValues,
}) => {
  const [form] = Form.useForm();

  const inputNode = (item: FormItem) => {
    switch (item.type) {
      case 'Checkbox':
        return <Checkbox.Group options={item.options} />;
      case 'DatePicker':
        return (
          <DatePicker showTime placeholder={item.placeholder || '请选择时间'} />
        );
      case 'RangePicker':
        return <DatePicker.RangePicker />;
      case 'Select':
        return (
          <Select
            options={item.options}
            placeholder={item.placeholder || '请选择'}
          />
        );
      case 'TextArea':
        return <Input.TextArea placeholder={item.placeholder || '请输入'} />;
      case 'Cascader':
        return (
          <Cascader
            options={item.options}
            placeholder={item.placeholder || '请选择'}
          />
        );
      case 'Radio':
        return <Radio.Group options={item.options} />;
      case 'Uplpad':
        return <Radio.Group options={item.options} />;
      case 'Number':
        return <InputNumber />;
      default:
        return <Input placeholder={item.placeholder || '请输入'} />;
    }
  };

  const getValuePropName = (type: string) => {
    switch (type) {
      case 'Checkbox':
        return 'checked';
      case 'Upload':
        return 'fileList';
      default:
        return 'value';
    }
  };

  const onFinish = (values: any) => {
    console.log('Success:', values);
    onSubmit(values);
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={() => {
        form.submit();
      }}
      onCancel={() => {
        onCancel();
        form.resetFields();
      }}
      width={width}
      okText="提交"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onFinish}
        requiredMark={customizeRequiredMark}
        className="add-modify-form"
      >
        {formList.map((item) => {
          return (
            <Form.Item
              key={item.dataIndex}
              name={item.dataIndex}
              label={item.label}
              valuePropName={getValuePropName(item.type)}
              rules={item.rules}
            >
              {inputNode(item)}
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
};

export default Added;
