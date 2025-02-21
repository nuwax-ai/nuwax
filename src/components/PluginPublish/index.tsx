import CustomFormModal from '@/components/CustomFormModal';
import { apiPluginPublish } from '@/services/plugin';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import type { PluginPublishProps } from '@/types/interfaces/common';
import type { FormProps } from 'antd';
import { Checkbox, Form, Input, message } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';

const PluginPublish: React.FC<PluginPublishProps> = ({
  pluginId,
  open,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [scope, setScope] = useState<PluginPublishScopeEnum>();

  // 插件发布
  const { run: runPublish } = useRequest(apiPluginPublish, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('插件发布成功');
      onCancel();
    },
  });

  const handleChangeScope = (e) => {
    setScope(e.target.value);
  };

  const onFinish: FormProps<{
    scope: PluginPublishScopeEnum;
    remark: string;
  }>['onFinish'] = (values) => {
    runPublish({
      pluginId,
      scope,
      remark: values.remark,
    });
  };

  const handleConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      onCancel={onCancel}
      title="发布插件"
      onConfirm={handleConfirm}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="发布范围">
          <Checkbox
            value={PluginPublishScopeEnum.Tenant}
            checked={scope === PluginPublishScopeEnum.Tenant}
            onChange={handleChangeScope}
          >
            全局
          </Checkbox>
          <Checkbox
            value={PluginPublishScopeEnum.Space}
            checked={scope === PluginPublishScopeEnum.Space}
            onChange={handleChangeScope}
          >
            工作空间
          </Checkbox>
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
