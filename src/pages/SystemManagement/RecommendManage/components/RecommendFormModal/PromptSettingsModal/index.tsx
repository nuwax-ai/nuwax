import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { dict } from '@/services/i18nRuntime';
import type { DisplayRecommendPrompt } from '@/types/interfaces/displayRecommend';
import { customizeRequiredMark } from '@/utils/form';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Tooltip } from 'antd';
import React, { useEffect } from 'react';
import styles from './index.less';

interface PromptSettingsModalProps {
  open: boolean;
  value?: DisplayRecommendPrompt;
  onCancel: () => void;
  onConfirm: (value: DisplayRecommendPrompt) => void;
}

const PromptIconControl: React.FC<{
  imageUrl?: string;
  onUploadSuccess?: (url: string) => void;
}> = ({ imageUrl, onUploadSuccess }) => (
  <div className={styles['icon-control']}>
    <Tooltip title={dict('PC.Pages.SystemRecommendManage.uploadPromptIcon')}>
      <span className={styles['upload-trigger']}>
        <UploadAvatar
          imageUrl={imageUrl}
          onUploadSuccess={onUploadSuccess}
          className={styles.icon}
        />
      </span>
    </Tooltip>
    {!imageUrl && (
      <span className={styles['empty-icon']} aria-hidden="true">
        <PlusOutlined />
      </span>
    )}
    {imageUrl && (
      <Tooltip title={dict('PC.Pages.SystemRecommendManage.clearPromptIcon')}>
        <Button
          type="text"
          shape="circle"
          size="small"
          className={styles['clear-icon']}
          icon={<CloseOutlined />}
          aria-label={dict('PC.Pages.SystemRecommendManage.clearPromptIcon')}
          onClick={() => onUploadSuccess?.('')}
        />
      </Tooltip>
    )}
  </div>
);

const PromptSettingsModal: React.FC<PromptSettingsModalProps> = ({
  open,
  value,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<DisplayRecommendPrompt>();

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    form.setFieldsValue({
      title: value?.title || '',
      content: value?.content || '',
      icon: value?.icon || '',
    });
  }, [open, value, form]);

  const handleConfirm = async () => {
    let values: DisplayRecommendPrompt;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    onConfirm({
      ...values,
      title: values.title || '',
      icon: values.icon || '',
    });
  };

  return (
    <CustomFormModal
      open={open}
      title={dict('PC.Pages.SystemRecommendManage.promptSettingsTitle')}
      form={form}
      centered
      zIndex={1100}
      classNames={{ body: styles['modal-body'] }}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <Form
        form={form}
        layout="vertical"
        className={styles.form}
        requiredMark={customizeRequiredMark}
      >
        <Form.Item
          name="icon"
          label={dict('PC.Components.CreateAgent.iconLabel')}
          valuePropName="imageUrl"
          trigger="onUploadSuccess"
        >
          <PromptIconControl />
        </Form.Item>
        <Form.Item
          name="title"
          label={dict('PC.Pages.SystemRecommendManage.promptTitle')}
        >
          <Input
            placeholder={dict(
              'PC.Pages.SystemRecommendManage.promptTitlePlaceholder',
            )}
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="content"
          label={dict('PC.Pages.SystemRecommendManage.promptContent')}
          rules={[
            {
              required: true,
              whitespace: true,
              message: dict(
                'PC.Pages.SystemRecommendManage.promptContentRequired',
              ),
            },
          ]}
        >
          <Input.TextArea
            placeholder={dict(
              'PC.Pages.SystemRecommendManage.promptContentPlaceholder',
            )}
            autoSize={{ minRows: 1, maxRows: 6 }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PromptSettingsModal;
