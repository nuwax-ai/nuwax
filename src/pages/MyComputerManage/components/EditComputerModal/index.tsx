import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

interface EditComputerModalProps {
  open: boolean;
  initialData: SandboxItem | null;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: { name: string; description: string }) => Promise<void>;
}

const EditComputerModal: React.FC<EditComputerModalProps> = ({
  open,
  initialData,
  onOpenChange,
  onFinish,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialData) {
      form.setFieldsValue({
        name: initialData.name,
        description: initialData.description,
      });
    } else {
      form.resetFields();
    }
  }, [open, initialData, form]);

  return (
    <ModalForm
      title={initialData ? '修改电脑名称' : '新增电脑'}
      width={480}
      open={open}
      form={form}
      onOpenChange={onOpenChange}
      autoFocusFirstInput
      modalProps={{
        destroyOnHidden: true,
      }}
      submitter={{
        searchConfig: {
          resetText: '取消',
          submitText: '确认',
        },
      }}
      onFinish={async (values) => {
        await onFinish(values);
        return true;
      }}
    >
      <ProFormText
        name="name"
        label="电脑名称"
        placeholder="请输入电脑名称"
        rules={[
          { required: true, message: '请输入电脑名称' },
          { max: 100, message: '名称不能超过 100 个字符' },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="description"
        label="描述"
        placeholder="请输入描述"
        fieldProps={{
          maxLength: 200,
          showCount: true,
          rows: 3,
        }}
      />
    </ModalForm>
  );
};

export default EditComputerModal;
