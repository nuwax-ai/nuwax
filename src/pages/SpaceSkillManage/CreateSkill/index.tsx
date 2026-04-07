import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiAddSkill, apiUpdateSkill } from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type {
  AddSkillParams,
  CreateSkillProps,
  UpdateSkillParams,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

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
  const { id, name, description, icon } = skillInfo || {};
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 新增技能
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

  // 更新技能
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
      });
    }
  }, [open, icon, name, description]);

  const onFinish: FormProps<{
    name: string;
    description: string;
  }>['onFinish'] = (values) => {
    const params = {
      name: values?.name,
      description: values?.description,
      icon: imageUrl,
    };
    if (type === CreateUpdateModeEnum.Create) {
      run({ spaceId, ...params } as AddSkillParams);
    } else {
      runUpdate({ id, ...params } as UpdateSkillParams);
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  return (
    <CustomFormModal
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
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
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
                      dict(
                        'PC.Pages.SpaceSkillManage.CreateSkill.nameMaxLength',
                      ),
                    ),
                  );
                }
                return Promise.reject(
                  new Error(
                    dict(
                      'PC.Pages.SpaceSkillManage.CreateSkill.inputSkillName',
                    ),
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
        <OverrideTextArea
          name="description"
          label={dict('PC.Pages.SpaceSkillManage.CreateSkill.descriptionLabel')}
          initialValue={description}
          placeholder={dict(
            'PC.Pages.SpaceSkillManage.CreateSkill.descriptionPlaceholder',
          )}
          maxLength={10000}
        />
      </Form>
    </CustomFormModal>
  );
};

export default CreateSkill;
