import {
  ModalForm,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
}

interface CategoryModalProps {
  open: boolean;
  mode: 'add' | 'edit';
  categoryLabel: string;
  initialData?: CategoryItem | null;
  onCancel: () => void;
  onFinish: (values: any) => Promise<boolean>;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  mode,
  categoryLabel,
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
          description: initialData.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialData, form]);

  return (
    <ModalForm
      title={`${mode === 'add' ? '添加' : '编辑'}${categoryLabel}分类`}
      open={open}
      form={form}
      width={520}
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
        label="分类名称"
        placeholder="请输入分类名称"
        rules={[{ required: true, message: '请输入分类名称' }]}
      />
      <ProFormTextArea
        name="description"
        label="描述"
        placeholder="请输入分类描述（可选）"
        fieldProps={{
          autoSize: { minRows: 4, maxRows: 6 },
        }}
      />
    </ModalForm>
  );
};

export default CategoryModal;
