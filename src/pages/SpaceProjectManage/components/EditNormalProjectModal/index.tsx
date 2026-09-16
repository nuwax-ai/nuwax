import agentImage from '@/assets/images/agent_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
} from '@/components/business-component/GuardedFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiNormalProjectUpdate } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { UserProjectItem } from '@/types/interfaces/userProject';
import { emitProjectChanged } from '@/utils/directorySyncEvents';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

/** 常规项目基础信息表单 */
interface EditNormalProjectFormValues {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description?: string;
}

/** 编辑后的常规项目基础信息 */
export interface EditedNormalProjectInfo {
  /** 项目名称 */
  name: string;
  /** 项目描述 */
  description: string;
  /** 项目图标 */
  icon: string;
}

/** 常规项目编辑弹窗属性 */
export interface EditNormalProjectModalProps {
  /** 当前编辑项目；为空时关闭弹窗 */
  project?: UserProjectItem;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 编辑成功 */
  onEdited: (projectId: number, info: EditedNormalProjectInfo) => void;
}

/**
 * 编辑常规项目基础信息。
 *
 * 可编辑项目名称、描述和图标，保存时调用 apiNormalProjectUpdate。
 *
 * @param props 弹窗属性
 * @returns 常规项目编辑弹窗
 */
const EditNormalProjectModal: React.FC<EditNormalProjectModalProps> = ({
  project,
  onCancel,
  onEdited,
}) => {
  const [form] = Form.useForm<EditNormalProjectFormValues>();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  /** 打开弹窗时回填项目基础信息 */
  useEffect(() => {
    if (!project) {
      return;
    }
    form.setFieldsValue({
      name: project.name,
      description: project.description || '',
    });
    setImageUrl(project.icon || '');
  }, [form, project]);

  /** 重置表单临时数据 */
  const resetForm = useCallback(() => {
    form.resetFields();
    setImageUrl('');
  }, [form]);

  /** 关闭编辑弹窗 */
  const handleCancel = useCallback(() => {
    resetForm();
    onCancel();
  }, [onCancel, resetForm]);

  /** 保存常规项目基础信息 */
  const handleFinish: FormProps<EditNormalProjectFormValues>['onFinish'] =
    useCallback(
      async (values: EditNormalProjectFormValues) => {
        if (!project) {
          return;
        }
        setLoading(true);
        try {
          const editedInfo: EditedNormalProjectInfo = {
            name: values.name.trim(),
            description: values.description?.trim() || '',
            icon: imageUrl,
          };
          const response = await apiNormalProjectUpdate({
            id: project.id,
            ...editedInfo,
          });
          if (response?.code !== SUCCESS_CODE) {
            return;
          }
          resetForm();
          message.success(dict('PC.Common.Global.saveSuccess'));
          emitProjectChanged({
            operation: 'updated',
            project: {
              projectId: String(project.id),
              projectType: AgentComponentTypeEnum.NormalProject,
              ...(project.spaceId !== undefined
                ? { spaceId: String(project.spaceId) }
                : {}),
            },
            patch: editedInfo,
            origin: 'edit-normal-project-modal',
            reason: 'rename',
          });
          onEdited(project.id, editedInfo);
        } finally {
          setLoading(false);
        }
      },
      [imageUrl, onEdited, project, resetForm],
    );

  return (
    <GuardedFormModal
      form={form}
      title={dict('PC.Pages.SpaceProjectManage.editNormalProject')}
      open={!!project}
      loading={loading}
      onCancel={handleCancel}
      onConfirm={() => form.submit()}
    >
      <GuardedFormModalForm
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={handleFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label={dict('PC.Pages.SpaceProjectManage.nameLabel')}
          validateTrigger="onBlur"
          rules={[
            {
              required: true,
              message: dict('PC.Pages.SpaceProjectManage.nameRequired'),
            },
          ]}
        >
          <Input
            placeholder={dict('PC.Pages.SpaceProjectManage.namePlaceholder')}
            showCount
            maxLength={50}
          />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label={dict('PC.Pages.SpaceProjectManage.descriptionLabel')}
          placeholder={dict(
            'PC.Pages.SpaceProjectManage.descriptionPlaceholder',
          )}
          maxLength={10000}
        />
        <Form.Item label={dict('PC.Pages.SpaceProjectManage.iconLabel')}>
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={agentImage as string}
            svgIconName="icons-workspace-agent"
          />
        </Form.Item>
      </GuardedFormModalForm>
    </GuardedFormModal>
  );
};

export default EditNormalProjectModal;
