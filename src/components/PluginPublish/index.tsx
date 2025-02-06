import CustomFormModal from '@/components/CustomFormModal';
import { Checkbox, Form, Input } from 'antd';
import React from 'react';

interface PluginPublishProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const PluginPublish: React.FC<PluginPublishProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();

  return (
    <CustomFormModal
      form={form}
      open={open}
      onCancel={onCancel}
      title="发布插件"
      onConfirm={onConfirm}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="发布范围">
          <Checkbox.Group
            options={[
              { label: '全局', value: '1' },
              { label: '工作空间', value: '2' },
            ]}
          />
        </Form.Item>
        <Form.Item label="发布记录">
          <Input.TextArea
            autoSize={{ minRows: 6, maxRows: 8 }}
            placeholder="这里填写详细的发布记录，如果范围选择了全局，审核通过后将在广场进行展示，同时所有工作空间均可引用该插件"
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PluginPublish;
