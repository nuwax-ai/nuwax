import agentImage from '@/assets/images/agent_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
} from '@/components/business-component/GuardedFormModal';
import WorkspaceDirPickerModal from '@/components/ChatInputHome/WorkspaceDirPickerModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { apiNormalProjectCreate } from '@/services/appDev';
import { dict } from '@/services/i18nRuntime';
import { apiGetUserSelectableSandboxList } from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { emitProjectChanged } from '@/utils/directorySyncEvents';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import {
  DownOutlined,
  FolderOpenOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import type { FormProps } from 'antd';
import { Dropdown, Form, Input, message, Select, Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 创建成功回调载荷：id 必返；其余为契约先行字段（缺省由调用方降级） */
export interface CreatedNormalProject {
  id: number;
  name: string;
  /** 运行环境沙箱 ID；-1=云电脑（后端默认分配），其他为个人电脑沙箱 */
  sandboxId?: number;
  /** 创建即建的首个会话 id */
  conversationId?: number;
  /** 首个会话归属智能体 id */
  agentId?: number;
}

interface CreateNormalProjectModalProps {
  /** 空间 ID */
  spaceId: number;
  open: boolean;
  onCancel: () => void;
  /** 创建成功回调（载荷含创建返回的会话/智能体 id，缺省触发调用方降级） */
  onConfirm: (project: CreatedNormalProject) => void;
}

interface CreateNormalProjectFormValues {
  name: string;
  description?: string;
  sandboxId: string;
}

/**
 * 新建常规项目弹窗：布局对齐创建智能体（名称 / 描述 / 图标），
 * 另含运行环境与工作目录。走 /api/normal-project/create。
 */
const CreateNormalProjectModal: React.FC<CreateNormalProjectModalProps> = ({
  spaceId,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm<CreateNormalProjectFormValues>();
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [computerOptions, setComputerOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [computerLoading, setComputerLoading] = useState(false);
  const [workspacePath, setWorkspaceDir] = useState('');
  const [dirPickerOpen, setDirPickerOpen] = useState(false);

  const sandboxId = Form.useWatch('sandboxId', form) || CLOUD_SANDBOX_ID;
  const isPersonal = sandboxId !== CLOUD_SANDBOX_ID;

  const resetForm = () => {
    setImageUrl('');
    setWorkspaceDir('');
    setDirPickerOpen(false);
    form.resetFields();
    form.setFieldsValue({ sandboxId: CLOUD_SANDBOX_ID });
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    resetForm();
    setComputerLoading(true);
    apiGetUserSelectableSandboxList()
      .then((res) => {
        if (res?.code === SUCCESS_CODE && res.data?.sandboxes) {
          const options = res.data.sandboxes.map((item) => ({
            label: item.name,
            value: String(item.sandboxId),
          }));
          if (!options.some((item) => item.value === CLOUD_SANDBOX_ID)) {
            options.unshift({
              label: dict('PC.Pages.SpaceProjectManage.cloudComputer'),
              value: CLOUD_SANDBOX_ID,
            });
          }
          setComputerOptions(options);
        }
      })
      .finally(() => setComputerLoading(false));
  }, [open]);

  const onFinish: FormProps<CreateNormalProjectFormValues>['onFinish'] = async (
    values,
  ) => {
    setLoading(true);
    const numericSandboxId = Number(values.sandboxId);
    try {
      const { icon, description } = await resolveCreateIcon({
        imageUrl,
        name: values.name,
        description: values.description,
      });
      const res = await apiNormalProjectCreate({
        spaceId,
        name: values.name.trim(),
        description: description?.trim() || undefined,
        icon: icon || undefined,
        sandboxId: numericSandboxId,
        workspacePath:
          values.sandboxId !== CLOUD_SANDBOX_ID
            ? workspacePath || undefined
            : undefined,
      });
      const newId = res?.data?.projectId;
      if (res?.code === SUCCESS_CODE && newId) {
        // 发送项目创建事件
        emitProjectChanged({
          operation: 'created',
          project: {
            projectId: String(newId),
            projectType: AgentComponentTypeEnum.NormalProject,
            ...(spaceId !== undefined ? { spaceId: String(spaceId) } : {}),
          },
          origin: 'create-normal-project-modal',
          reason: 'create',
        });

        message.success(dict('PC.Pages.SpaceProjectManage.createSuccess'));

        // 回调创建成功
        onConfirm({
          id: newId,
          name: values.name.trim(),
          sandboxId: numericSandboxId,
          conversationId: res.data.conversationId ?? undefined,
        });
      } else {
        message.error(
          res?.message || dict('PC.Pages.SpaceProjectManage.createFailed'),
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    form.submit();
  };

  const handleCancel = () => {
    onCancel();
    resetForm();
  };

  return (
    <GuardedFormModal
      form={form}
      title={dict('PC.Pages.SpaceProjectManage.createNormalProject')}
      open={open}
      loading={loading}
      onCancel={handleCancel}
      onConfirm={handleSubmit}
    >
      <GuardedFormModalForm
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        initialValues={{ sandboxId: CLOUD_SANDBOX_ID }}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="icon"
          label={dict('PC.Pages.SpaceProjectManage.iconLabel')}
        >
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={agentImage as string}
            svgIconName="icons-workspace-agent"
          />
        </Form.Item>
        <Form.Item
          name="name"
          label={dict('PC.Pages.SpaceProjectManage.nameLabel')}
          validateTrigger="onBlur"
          rules={[
            {
              required: true,
              message: dict('PC.Pages.SpaceProjectManage.nameRequired'),
            },
            {
              validator(_, value) {
                if (!value || value?.length <= 50) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(dict('PC.Pages.SpaceProjectManage.nameMaxLength')),
                );
              },
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
        <Form.Item
          name="sandboxId"
          label={dict('PC.Pages.SpaceProjectManage.runtimeEnv')}
        >
          <Select
            loading={computerLoading}
            notFoundContent={<Spin size="small" />}
            onChange={() => {
              setWorkspaceDir('');
              setDirPickerOpen(false);
            }}
            options={computerOptions}
          />
        </Form.Item>
        {isPersonal ? (
          <Form.Item label={dict('PC.Components.WorkspaceDir.pick')}>
            <Dropdown
              trigger={['click']}
              menu={{
                selectable: true,
                selectedKeys: [workspacePath ? 'pick-folder' : 'default'],
                items: [
                  {
                    key: 'default',
                    icon: <FolderOutlined />,
                    label: dict('PC.Components.WorkspaceDir.defaultDir'),
                  },
                  {
                    key: 'pick-folder',
                    icon: <FolderOpenOutlined />,
                    label: dict(
                      'PC.Components.WorkspaceDir.openComputerFolder',
                    ),
                  },
                ],
                onClick: ({ key }: { key: string }) => {
                  if (key === 'pick-folder') {
                    setDirPickerOpen(true);
                  } else {
                    setWorkspaceDir('');
                  }
                },
              }}
            >
              <button
                type="button"
                className={cx(styles['dir-trigger'])}
                title={workspacePath || undefined}
              >
                <FolderOutlined />
                <span className={cx(styles['dir-text'])}>
                  {workspacePath ||
                    dict('PC.Components.WorkspaceDir.defaultDir')}
                </span>
                <DownOutlined className={cx(styles['dir-caret'])} />
              </button>
            </Dropdown>
          </Form.Item>
        ) : null}
      </GuardedFormModalForm>
      <WorkspaceDirPickerModal
        sandboxId={sandboxId}
        open={dirPickerOpen}
        onCancel={() => setDirPickerOpen(false)}
        onConfirm={(dir) => {
          setDirPickerOpen(false);
          setWorkspaceDir(dir);
        }}
      />
    </GuardedFormModal>
  );
};

export default CreateNormalProjectModal;
