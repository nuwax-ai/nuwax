import agentImage from '@/assets/images/agent_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
} from '@/components/business-component/GuardedFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import { Form, Input, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { apiThirdAppOauth2Update } from '../../services/thirdAppOauth2';

/** 编辑三方应用表单数据 */
interface EditThirdAppFormValues {
  /** 应用名称 */
  name: string;
  /** 应用描述 */
  description?: string;
}

/** 编辑三方应用后返回的基础信息 */
export interface EditedThirdAppInfo {
  /** 应用名称 */
  name: string;
  /** 应用描述 */
  description: string;
  /** 应用图标 */
  icon: string;
}

/** 编辑三方应用弹窗属性 */
export interface EditThirdAppModalProps {
  /** 当前编辑的应用；为空时关闭弹窗 */
  app?: UserProjectItem;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 编辑成功 */
  onEdited: (appId: number, info: EditedThirdAppInfo) => void;
}

/**
 * 编辑三方应用弹窗。
 *
 * 表单字段与创建三方应用一致，可编辑名称、描述和图标。
 *
 * @param props 弹窗属性
 * @returns 三方应用编辑弹窗
 */
const EditThirdAppModal: React.FC<EditThirdAppModalProps> = ({
  app,
  onCancel,
  onEdited,
}) => {
  const [form] = Form.useForm<EditThirdAppFormValues>();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  /** 打开弹窗时回填当前应用信息 */
  useEffect(() => {
    if (!app) {
      return;
    }
    form.setFieldsValue({
      name: app.name,
      description: app.description || '',
    });
    setImageUrl(app.icon || '');
  }, [app, form]);

  /** 清空编辑中的临时数据 */
  const resetForm = useCallback(() => {
    form.resetFields();
    setImageUrl('');
  }, [form]);

  /** 关闭弹窗 */
  const handleCancel = useCallback(() => {
    resetForm();
    onCancel();
  }, [onCancel, resetForm]);

  /** 提交三方应用基础信息 */
  const handleFinish = useCallback(
    async (values: EditThirdAppFormValues) => {
      if (!app) {
        return;
      }
      setLoading(true);
      try {
        const resolved = await resolveCreateIcon({
          imageUrl,
          name: values.name,
          description: values.description,
        });
        const editedInfo: EditedThirdAppInfo = {
          name: values.name.trim(),
          description: resolved.description?.trim() || '',
          icon: resolved.icon || '',
        };
        const response = await apiThirdAppOauth2Update({
          projectId: app.id,
          ...editedInfo,
        });
        if (response?.code !== SUCCESS_CODE) {
          return;
        }
        resetForm();
        message.success(dict('PC.Common.Global.saveSuccess'));
        onEdited(app.id, editedInfo);
      } finally {
        setLoading(false);
      }
    },
    [app, imageUrl, onEdited, resetForm],
  );

  return (
    <GuardedFormModal
      form={form}
      title={dict('PC.Pages.ThirdAppIntegration.editTitle')}
      open={!!app}
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

export default EditThirdAppModal;
