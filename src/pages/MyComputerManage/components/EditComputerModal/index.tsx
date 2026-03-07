import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import {
  ModalForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

interface EditComputerModalProps {
  open: boolean;
  initialData: SandboxItem | null;
  onOpenChange: (open: boolean) => void;
  onFinish: (values: {
    name: string;
    description: string;
    maxAgentCount?: number;
  }) => Promise<void>;
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
        maxAgentCount: initialData.maxAgentCount,
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
      {initialData && (
        <ProFormDigit
          name="maxAgentCount"
          label="最大存活Agent会话数量"
          placeholder="请输入"
          tooltip="每个Agent会话占用数百兆内存，请根据电脑实际的内存进行调整，超过配置的数量后，系统会自动停止未再使用的会话（再次向已停止的会话发送消息时会重新激活）"
          rules={[
            { required: true, message: '请输入最大存活Agent会话数量' },
            { type: 'number', min: 1, message: '必须大于0' },
          ]}
          fieldProps={{
            min: 1,
            precision: 0,
          }}
        />
      )}
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
