import { XModalForm } from '@/components/ProComponents';
import { t } from '@/services/i18nRuntime';
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
      title={
        mode === 'add'
          ? t('PC.Pages.SystemConfigCategoryModal.addTitle', categoryLabel)
          : t('PC.Pages.SystemConfigCategoryModal.editTitle', categoryLabel)
      }
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
          resetText: t('PC.Common.Global.cancel'),
          submitText: t('PC.Common.Global.save'),
        },
      }}
      onFinish={onFinish}
    >
      <ProFormText
        name="name"
        label={t('PC.Pages.SystemConfigCategoryModal.name')}
        placeholder={t('PC.Pages.SystemConfigCategoryModal.namePlaceholder')}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigCategoryModal.nameRequired'),
          },
          {
            max: 100,
            message: t('PC.Pages.SystemConfigCategoryModal.nameMaxLength'),
          },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormText
        name="code"
        label={t('PC.Pages.SystemConfigCategoryModal.code')}
        placeholder={t('PC.Pages.SystemConfigCategoryModal.codePlaceholder')}
        rules={[
          {
            required: true,
            message: t('PC.Pages.SystemConfigCategoryModal.codeRequired'),
          },
          {
            max: 100,
            message: t('PC.Pages.SystemConfigCategoryModal.codeMaxLength'),
          },
          {
            pattern: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/,
            message: t('PC.Pages.SystemConfigCategoryModal.codePatternInvalid'),
          },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      <ProFormTextArea
        name="description"
        label={t('PC.Pages.SystemConfigCategoryModal.description')}
        placeholder={t(
          'PC.Pages.SystemConfigCategoryModal.descriptionPlaceholder',
        )}
        rules={[
          {
            max: 100,
            message: t(
              'PC.Pages.SystemConfigCategoryModal.descriptionMaxLength',
            ),
          },
        ]}
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
