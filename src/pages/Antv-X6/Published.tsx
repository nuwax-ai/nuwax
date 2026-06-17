import { PLUGIN_PUBLISH_OPTIONS } from '@/constants/agent.constants';
import { dict } from '@/services/i18nRuntime';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { Form, FormProps, Input, Modal, Radio } from 'antd';
import React, { useEffect } from 'react';

interface Values {
  scope: PluginPublishScopeEnum;
  remark?: string;
  id?: number;
}
interface PublishedProp {
  id: number;
  open: boolean;
  onCancel: () => void;
  onSubmit: (params: Values) => void;
  loading: boolean;
  scope?: PluginPublishScopeEnum | null;
}

const Published: React.FC<PublishedProp> = ({
  id,
  open,
  onCancel,
  onSubmit,
  loading,
  scope = PluginPublishScopeEnum.Tenant,
}) => {
  const [form] = Form.useForm();

  const onFinish: FormProps<{
    scope: PluginPublishScopeEnum;
    remark: string;
  }>['onFinish'] = (values) => {
    onSubmit({ id, ...values });
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
    } else {
      form.setFieldsValue({ scope: scope });
    }
  }, [open]);
  return (
    <Modal
      open={open}
      title={dict('PC.Pages.AntvX6Published.title')}
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      onCancel={onCancel}
      confirmLoading={loading}
      cancelText={dict('PC.Common.Global.cancel')}
      okText={dict('PC.Common.Global.confirm')}
      onOk={() => {
        form.submit();
      }}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="scope" label={dict('PC.Pages.AntvX6Published.scope')}>
          <Radio.Group options={PLUGIN_PUBLISH_OPTIONS} />
        </Form.Item>
        <Form.Item
          name="remark"
          label={dict('PC.Pages.AntvX6Published.releaseNote')}
        >
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder={dict(
              'PC.Pages.AntvX6Published.releaseNotePlaceholder',
            )}
          ></Input.TextArea>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Published;
