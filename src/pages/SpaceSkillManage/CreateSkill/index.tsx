import agentImage from '@/assets/images/agent_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
  useFormModalSubmit,
} from '@/components/business-component/GuardedFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { SKILL_USAGE_SCENARIO_LIST } from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import { apiAddSkill, apiUpdateSkill } from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { AgentTypeEnum } from '@/types/enums/space';
import type {
  AddSkillParams,
  CreateSkillProps,
  UpdateSkillParams,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import type { FormInstance, FormProps } from 'antd';
import { Form, Input, message, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CreateSkillFormProps {
  form: FormInstance;
  type: CreateUpdateModeEnum;
  spaceId: number | undefined;
  id?: number;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  description?: string;
  run: (data: AddSkillParams) => Promise<void>;
  runUpdate: (data: UpdateSkillParams) => Promise<void>;
}

/** 须在 GuardedFormModal 子树内，以便 resolveCreateIcon 失败时释放提交锁 */
const CreateSkillForm: React.FC<CreateSkillFormProps> = ({
  form,
  type,
  spaceId,
  id,
  imageUrl,
  setImageUrl,
  description,
  run,
  runUpdate,
}) => {
  const modalSubmit = useFormModalSubmit();

  const onFinish: FormProps<{
    name: string;
    description: string;
    usageScenarios: string[];
  }>['onFinish'] = async (values) => {
    let icon = imageUrl;
    let desc = values?.description;
    if (type === CreateUpdateModeEnum.Create) {
      try {
        const resolved = await resolveCreateIcon({
          imageUrl,
          name: values?.name,
          description: values?.description,
        });
        icon = resolved.icon;
        desc = resolved.description ?? values?.description;
      } catch {
        modalSubmit?.abortSubmit();
        return;
      }
    }
    const params = {
      name: values?.name,
      description: desc,
      usageScenarios: values?.usageScenarios,
      icon,
    };
    if (type === CreateUpdateModeEnum.Create) {
      await run({ spaceId, ...params } as AddSkillParams);
    } else {
      await runUpdate({ id, ...params } as UpdateSkillParams);
    }
  };

  return (
    <GuardedFormModalForm
      form={form}
      requiredMark={customizeRequiredMark}
      layout="vertical"
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        name="icon"
        label={dict('PC.Pages.SpaceSkillManage.CreateSkill.iconLabel')}
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
        label={dict('PC.Pages.SpaceSkillManage.CreateSkill.nameLabel')}
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.SpaceSkillManage.CreateSkill.pleaseInputSkillName',
            ),
          },
          {
            validator(_, value) {
              if (!value || value?.length <= 30) {
                return Promise.resolve();
              }
              if (value?.length > 30) {
                return Promise.reject(
                  new Error(
                    dict('PC.Pages.SpaceSkillManage.CreateSkill.nameMaxLength'),
                  ),
                );
              }
              return Promise.reject(
                new Error(
                  dict('PC.Pages.SpaceSkillManage.CreateSkill.inputSkillName'),
                ),
              );
            },
          },
        ]}
      >
        <Input
          placeholder={dict(
            'PC.Pages.SpaceSkillManage.CreateSkill.inputSkillNamePlaceholder',
          )}
          showCount
          maxLength={30}
        />
      </Form.Item>
      <Form.Item
        name="usageScenarios"
        label={dict('PC.Pages.SpaceSkillManage.CreateSkill.usageScenarioLabel')}
        initialValue={
          type === CreateUpdateModeEnum.Create
            ? [AgentTypeEnum.TaskAgent]
            : undefined
        }
        rules={[
          {
            required: true,
            message: dict(
              'PC.Pages.SpaceSkillManage.CreateSkill.usageScenarioRequired',
            ),
          },
        ]}
      >
        <Select
          mode="multiple"
          placeholder={dict(
            'PC.Pages.SpaceSkillManage.CreateSkill.usageScenarioPlaceholder',
          )}
          options={SKILL_USAGE_SCENARIO_LIST}
        />
      </Form.Item>
      <OverrideTextArea
        name="description"
        label={dict('PC.Pages.SpaceSkillManage.CreateSkill.descriptionLabel')}
        initialValue={description}
        placeholder={dict(
          'PC.Pages.SpaceSkillManage.CreateSkill.descriptionPlaceholder',
        )}
        maxLength={10000}
      />
    </GuardedFormModalForm>
  );
};

/**
 * 创建技能弹窗
 */
const CreateSkill: React.FC<CreateSkillProps> = ({
  type = CreateUpdateModeEnum.Create,
  spaceId,
  skillInfo,
  open,
  onCancel,
  onConfirm,
}) => {
  const { id, name, description, icon, usageScenarios } = skillInfo || {};
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const run = async (data: AddSkillParams) => {
    try {
      setLoading(true);
      const resp = await apiAddSkill(data);
      if (resp?.code === SUCCESS_CODE) {
        message.success(
          dict(
            'PC.Pages.SpaceSkillManage.CreateSkill.skillCreatedSuccessfully',
          ),
        );
        onConfirm?.();
        history.push(`/space/${spaceId}/skill-details/${resp?.data}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const runUpdate = async (data: UpdateSkillParams) => {
    try {
      setLoading(true);
      const resp = await apiUpdateSkill(data);
      if (resp?.code === SUCCESS_CODE) {
        message.success(
          dict(
            'PC.Pages.SpaceSkillManage.CreateSkill.skillUpdatedSuccessfully',
          ),
        );
        onConfirm?.();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setImageUrl(icon || '');
      form.setFieldsValue({
        name,
        description,
        usageScenarios,
      });
    }
  }, [open, icon, name, description, usageScenarios, form]);

  const handlerSubmit = () => {
    form.submit();
  };

  return (
    <GuardedFormModal
      loading={loading}
      form={form}
      title={
        type === CreateUpdateModeEnum.Create
          ? dict('PC.Pages.SpaceSkillManage.CreateSkill.createSkill')
          : dict('PC.Pages.SpaceSkillManage.CreateSkill.updateSkill')
      }
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
      }}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <CreateSkillForm
        form={form}
        type={type}
        spaceId={spaceId}
        id={id}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        description={description}
        run={run}
        runUpdate={runUpdate}
      />
    </GuardedFormModal>
  );
};

export default CreateSkill;
