import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import {
  Checkbox,
  CheckboxChangeEvent,
  Form,
  FormProps,
  Input,
  Modal,
} from 'antd';
import React, { useEffect, useState } from 'react';

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
}

const Published: React.FC<PublishedProp> = ({
  id,
  open,
  onCancel,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();
  const [scope, setScope] = useState<PluginPublishScopeEnum>(
    PluginPublishScopeEnum.Tenant,
  );

  const onFinish: FormProps<{
    scope: PluginPublishScopeEnum;
    remark: string;
  }>['onFinish'] = (values) => {
    onSubmit({ id, scope, remark: values.remark });
  };

  const handleChangeScope = (e: CheckboxChangeEvent) => {
    setScope(e.target.value as PluginPublishScopeEnum);
  };

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [open]);
  return (
    <Modal
      open={open}
      title={'发布工作流'}
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      onCancel={onCancel}
      confirmLoading={loading}
      cancelText="取消"
      okText="确认"
      onOk={() => {
        form.submit();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ id }}
      >
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
        <Form.Item name={'remark'} label="发布记录">
          <Input.TextArea
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder="这里填写详细的发布记录，如果范围选择了全局，审核通过后，所有工作空间均可引用该工作流"
          ></Input.TextArea>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default Published;
