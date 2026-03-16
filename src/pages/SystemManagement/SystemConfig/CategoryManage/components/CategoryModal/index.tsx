import { XModalForm } from '@/components/ProComponents';
import { ProFormText, ProFormTextArea } from '@ant-design/pro-components';
import { Form } from 'antd';
import React, { useEffect } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  code: string;
  description: string;
  created?: string;
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
          code: initialData.code,
          description: initialData.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, mode, initialData, form]);

  return (
    <XModalForm
      title={`${mode === 'add' ? '添加' : '编辑'}${categoryLabel}分类`}
      open={open}
      form={form}
      width={520}
      autoFocusFirstInput
      modalProps={{
        destroyOnHidden: true,
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
        rules={[
          { required: true, message: '请输入分类名称' },
          { max: 100, message: '分类名称不能超过100个字符' },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormText
        name="code"
        label="分类编码"
        placeholder="请输入分类编码"
        rules={[
          { required: true, message: '请输入分类编码' },
          { max: 100, message: '分类编码不能超过100个字符' },
          {
            pattern: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
            message:
              '分类编码只能包含字母、数字、下划线(_)或美元符号($)，且不能以数字开头',
          },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="description"
        label="描述"
        placeholder="请输入分类描述（可选）"
        rules={[{ max: 100, message: '描述不能超过100个字符' }]}
        fieldProps={{
          autoSize: { minRows: 4, maxRows: 6 },
          maxLength: 100,
          showCount: true,
        }}
      />
    </XModalForm>
  );
};

export default CategoryModal;
