import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { SandboxConfigItem as SandboxItem } from '@/types/interfaces/systemManage';
import {
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
    <XModalForm
      title={
        initialData
          ? dict('PC.Pages.MyComputerManage.EditComputerModal.editTitle')
          : dict('PC.Pages.MyComputerManage.EditComputerModal.addTitle')
      }
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
          resetText: dict('PC.Common.Global.cancel'),
          submitText: dict('PC.Common.Global.confirm'),
        },
      }}
      onFinish={async (values: any) => {
        await onFinish(values);
        return true;
      }}
    >
      <ProFormText
        name="name"
        label={dict('PC.Pages.MyComputerManage.EditComputerModal.nameLabel')}
        placeholder={dict(
          'PC.Pages.MyComputerManage.EditComputerModal.namePlaceholder',
        )}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.MyComputerManage.EditComputerModal.nameRequired',
            ),
          },
          {
            max: 100,
            message: dict(
              'PC.Pages.MyComputerManage.EditComputerModal.nameMaxLength',
            ),
          },
        ]}
        fieldProps={{
          maxLength: 100,
          showCount: true,
        }}
      />
      {initialData && (
        <ProFormDigit
          name="maxAgentCount"
          label={dict(
            'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountLabel',
          )}
          placeholder={dict(
            'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountPlaceholder',
          )}
          tooltip={dict(
            'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountTooltip',
          )}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountRequired',
              ),
            },
            {
              type: 'number',
              min: 1,
              max: 99999999,
              message: dict(
                'PC.Pages.MyComputerManage.EditComputerModal.maxAgentCountRange',
              ),
            },
          ]}
          fieldProps={{
            min: 1,
            max: 99999999,
            precision: 0,
          }}
        />
      )}
      <ProFormTextArea
        name="description"
        label={dict(
          'PC.Pages.MyComputerManage.EditComputerModal.descriptionLabel',
        )}
        placeholder={dict(
          'PC.Pages.MyComputerManage.EditComputerModal.descriptionPlaceholder',
        )}
        fieldProps={{
          maxLength: 200,
          showCount: true,
          rows: 3,
        }}
      />
    </XModalForm>
  );
};

export default EditComputerModal;
