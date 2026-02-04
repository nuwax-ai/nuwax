import {
  ModalForm,
  ProFormDigit,
  ProFormText,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';

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
          configValue: initialData.configValue,
        });
      } else {
        form.resetFields();
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
        name={['configValue', 'hostWithScheme']}
        label="沙盒根地址"
        placeholder="例如：http://192.168.1.21"
        colProps={{ span: 24 }}
        rules={[
          { required: true, message: '请输入沙盒根地址' },
          {
            pattern: /^https?:\/\/.+/,
            message: '请输入正确的地址格式，需包含 http:// 或 https://',
          },
        ]}
      />
      <ProFormDigit
        name={['configValue', 'agentPort']}
        label="Agent端口"
        placeholder="9086"
        colProps={{ span: 8 }}
        fieldProps={{ precision: 0, min: 1, max: 65535 }}
        rules={[{ required: true, message: '请输入Agent端口' }]}
      />
      <ProFormDigit
        name={['configValue', 'vncPort']}
        label="VNC端口"
        placeholder="9088"
        colProps={{ span: 8 }}
        fieldProps={{ precision: 0, min: 1, max: 65535 }}
        rules={[{ required: true, message: '请输入VNC端口' }]}
      />
      <ProFormDigit
        name={['configValue', 'fileServerPort']}
        label="文件服务端口"
        placeholder="60001"
        colProps={{ span: 8 }}
        fieldProps={{ precision: 0, min: 1, max: 65535 }}
        rules={[{ required: true, message: '请输入文件服务端口' }]}
      />
      <ProFormText
        name={['configValue', 'apiKey']}
        label="通信key (可选)"
        placeholder="留空表示不使用通信密钥"
        colProps={{ span: 24 }}
      />
      <ProFormDigit
        name={['configValue', 'maxUsers']}
        label="最大并发用户数"
        placeholder="30"
        colProps={{ span: 24 }}
        fieldProps={{ precision: 0, min: 1 }}
        rules={[{ required: true, message: '请输入最大并发用户数' }]}
      />
    </ModalForm>
  );
};

export default SandboxModal;
