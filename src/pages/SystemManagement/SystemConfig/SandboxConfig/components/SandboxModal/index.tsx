import {
  ModalForm,
  ProFormDigit,
  ProFormText,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

export interface SandboxItem {
  id: number;
  name: string;
  address: string[];
  currentUsage: number;
  totalCapacity: number;
  status: 'online' | 'offline';
}

interface SandboxModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialData?: SandboxItem | null;
  onCancel: () => void;
  onFinish: (values: any) => Promise<boolean>;
}

const SandboxModal: React.FC<SandboxModalProps> = ({
  open,
  mode,
  initialData,
  onCancel,
  onFinish,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialData) {
        form.setFieldsValue({
          name: initialData.name,
          agentAddress: initialData.address[0],
          vncAddress: initialData.address[1],
          maxUsers: initialData.totalCapacity,
          currentUsers: initialData.currentUsage,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ currentUsers: 0 });
      }
    }
  }, [open, mode, initialData, form]);

  return (
    <ModalForm
      title={mode === 'add' ? '添加沙盒' : '编辑沙盒'}
      open={open}
      form={form}
      grid={true}
      autoFocusFirstInput
      modalProps={{
        destroyOnClose: true,
        onCancel: onCancel,
      }}
      submitter={{
        searchConfig: {
          resetText: '取消',
          submitText: '保存',
        },
      }}
      onFinish={onFinish}
    >
      <ProFormText
        name="name"
        label="沙盒名称"
        placeholder="例如：AGENT沙箱"
        colProps={{ span: 24 }}
        rules={[{ required: true, message: '请输入沙盒名称' }]}
      />
      <ProFormText
        name="agentAddress"
        label="Agent地址"
        placeholder=":9086"
        colProps={{ span: 12 }}
        rules={[{ required: true, message: '请输入Agent地址' }]}
      />
      <ProFormText
        name="vncAddress"
        label="VNC地址"
        placeholder=":9088"
        colProps={{ span: 12 }}
        rules={[{ required: true, message: '请输入VNC地址' }]}
      />
      <ProFormText
        name="fileServiceAddress"
        label="文件服务地址"
        placeholder=":60001"
        colProps={{ span: 24 }}
        rules={[{ required: true, message: '请输入文件服务地址' }]}
      />
      <ProFormDigit
        name="maxUsers"
        label="最大用户数"
        placeholder="30"
        colProps={{ span: 12 }}
        rules={[{ required: true, message: '请输入最大用户数' }]}
      />
      <ProFormDigit
        name="currentUsers"
        label="当前使用人数"
        placeholder="0"
        colProps={{ span: 12 }}
      />
    </ModalForm>
  );
};

export default SandboxModal;
