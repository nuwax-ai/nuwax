import CustomFormModal from '@/components/CustomFormModal';
import { PLUGIN_PUBLISH_OPTIONS } from '@/constants/agent.constants';
import { apiPluginPublish } from '@/services/plugin';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import type { PluginPublishProps } from '@/types/interfaces/common';
import type { FormProps } from 'antd';
import { Form, Input, message, Radio } from 'antd';
import React from 'react';
import { useRequest } from 'umi';

const PluginPublish: React.FC<PluginPublishProps> = ({
  pluginId,
  open,
  onCancel,
}) => {
  const [form] = Form.useForm();

  // 插件发布
  const { run: runPublish, loading } = useRequest(apiPluginPublish, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('插件发布成功');
      onCancel();
    },
  });

  const onFinish: FormProps<{
    scope: PluginPublishScopeEnum;
    remark: string;
  }>['onFinish'] = (values) => {
    runPublish({
      pluginId,
      ...values,
    });
  };

  const handleConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      loading={loading}
      onCancel={onCancel}
      title="发布插件"
      onConfirm={handleConfirm}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          scope: PluginPublishScopeEnum.Tenant,
        }}
      >
        <Form.Item name="scope" label="发布范围">
          <Radio.Group options={PLUGIN_PUBLISH_OPTIONS} />
        </Form.Item>
        <Form.Item name="remark" label="发布记录">
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
