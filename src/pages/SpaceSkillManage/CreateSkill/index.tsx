import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import { apiAddSkill, apiUpdateWorkflow } from '@/services/library';
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
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建技能弹窗
 */
const CreateSkill: React.FC<CreateSkillProps> = ({
  type = CreateUpdateModeEnum.Create,
  name,
  spaceId,
  id,
  icon,
  description,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');

  // 新增工作流
  const { run } = useRequest(apiAddSkill, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('技能已创建成功');
      onCancel();
      onConfirm?.();
    },
  });

  // 更新技能
  const { run: runUpdate } = useRequest(apiUpdateWorkflow, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('技能更新成功');
      onConfirm?.();
    },
  });

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
      form={form}
      title={type === CreateUpdateModeEnum.Create ? '创建技能' : '更新技能'}
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
          label="名称"
          rules={[
            { required: true, message: '请输入技能名称' },
            {
              validator(_, value) {
                if (!value || value?.length <= 30) {
                  return Promise.resolve();
                }
                if (value?.length > 30) {
                  return Promise.reject(new Error('名称不能超过30个字符!'));
                }
                return Promise.reject(new Error('输入技能名称!'));
              },
            },
          ]}
        >
          <Input placeholder="输入技能名称" showCount maxLength={30} />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label="描述"
          initialValue={description}
          placeholder="请输入描述，让大模型理解什么情况下应该调用此技能"
          maxLength={10000}
        />
      </Form>
    </CustomFormModal>
  );
};

export default CreateSkill;
