import agentImage from '@/assets/images/agent_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
} from '@/components/business-component/GuardedFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import { Form, Input, message } from 'antd';
import React, { useCallback, useState } from 'react';
import { apiThirdAppOauth2CredentialCreate } from '../../services/thirdAppOauth2';

export interface CreateThirdAppModalProps {
  /** 所属空间 ID */
  spaceId: number;
  /** 是否打开 */
  open: boolean;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 创建成功 */
  onCreated: () => void;
}

interface CreateThirdAppFormValues {
  /** 应用名称 */
  name: string;
  /** 应用描述 */
  description?: string;
}

/**
 * 创建第三方应用弹窗：填写名称、描述和图标，创建后自动生成 OAuth2 凭证。
 *
 * @param props.spaceId 所属空间 ID
 * @param props.open 是否打开
 * @param props.onCancel 关闭回调
 * @param props.onCreated 创建成功回调
 * @returns 第三方应用创建弹窗
 */
const CreateThirdAppModal: React.FC<CreateThirdAppModalProps> = ({
  spaceId,
  open,
  onCancel,
  onCreated,
}) => {
  const [form] = Form.useForm<CreateThirdAppFormValues>();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  /** 重置表单和上传图标 */
  const resetForm = useCallback(() => {
    form.resetFields();
    setImageUrl('');
  }, [form]);

  /** 关闭并清理临时表单数据 */
  const handleCancel = useCallback(() => {
    resetForm();
    onCancel();
  }, [onCancel, resetForm]);

  /** 提交创建请求 */
  const handleFinish = useCallback(
    async (values: CreateThirdAppFormValues) => {
      setLoading(true);
      try {
        const resolved = await resolveCreateIcon({
          imageUrl,
          name: values.name,
          description: values.description,
        });
        const response = await apiThirdAppOauth2CredentialCreate({
          spaceId,
          name: values.name.trim(),
          description: resolved.description?.trim() || undefined,
          icon: resolved.icon || undefined,
        });
        if (response?.code !== SUCCESS_CODE) {
          return;
        }
        resetForm();
        message.success(dict('PC.Pages.SpaceProjectManage.createSuccess'));
        onCreated();
      } finally {
        setLoading(false);
      }
    },
    [imageUrl, onCreated, resetForm, spaceId],
  );

  return (
    <GuardedFormModal
      form={form}
      title={dict('PC.Pages.ThirdAppIntegration.createTitle')}
      open={open}
      loading={loading}
      onCancel={handleCancel}
      onConfirm={() => form.submit()}
    >
      <GuardedFormModalForm
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={handleFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label={dict('PC.Pages.SpaceProjectManage.nameLabel')}
          rules={[
            {
              required: true,
              message: dict('PC.Pages.SpaceProjectManage.nameRequired'),
            },
          ]}
        >
          <Input
            placeholder={dict('PC.Pages.SpaceProjectManage.namePlaceholder')}
            maxLength={128}
            showCount
          />
        </Form.Item>
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpaceProjectManage.descriptionLabel')}
        >
          <Input.TextArea
            placeholder={dict(
              'PC.Pages.SpaceProjectManage.descriptionPlaceholder',
            )}
            maxLength={512}
            showCount
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
        <Form.Item label={dict('PC.Pages.SpaceProjectManage.iconLabel')}>
          <UploadAvatar
            imageUrl={imageUrl}
            defaultImage={agentImage as string}
            svgIconName="icons-workspace-agent"
            onUploadSuccess={setImageUrl}
          />
        </Form.Item>
      </GuardedFormModalForm>
    </GuardedFormModal>
  );
};

export default CreateThirdAppModal;
