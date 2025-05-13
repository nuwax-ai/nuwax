import workflowIcon from '@/assets/images/workflow_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { apiAddWorkflow, apiUpdateWorkflow } from '@/services/library';
import { WorkflowModeEnum } from '@/types/enums/library';
import type {
  CreateWorkflowProps,
  UpdateWorkflowParams,
  WorkflowBaseInfo,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建工作流弹窗
 */
const CreateWorkflow: React.FC<CreateWorkflowProps> = ({
  type = WorkflowModeEnum.Create,
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
  const { run } = useRequest(apiAddWorkflow, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: number) => {
      message.success('工作流已创建成功');
      onCancel();
      history.push(`/space/${spaceId}/workflow/${result}`);
    },
  });

  // 更新工作流
  const { run: runUpdate } = useRequest(apiUpdateWorkflow, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: UpdateWorkflowParams[]) => {
      message.success('工作流更新成功');
      const info = params[0];
      onConfirm?.(info as WorkflowBaseInfo);
    },
  });

  useEffect(() => {
    if (icon) {
      setImageUrl(icon);
    }
  }, [icon]);

  const onFinish: FormProps<{
    name: string;
    description: string;
  }>['onFinish'] = (values) => {
    const params = {
      name: values?.name,
      description: values?.description,
      icon: imageUrl,
    };
    if (type === WorkflowModeEnum.Create) {
      run({
        spaceId,
        ...params,
      });
    } else {
      runUpdate({
        id,
        ...params,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title={type === WorkflowModeEnum.Create ? '创建工作流' : '更新工作流'}
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
        initialValues={{
          name,
          description,
        }}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[
            { required: true, message: '请输入工作流名称' },
            {
              validator(_, value) {
                if (!value || value?.length <= 30) {
                  return Promise.resolve();
                }
                if (value?.length > 30) {
                  return Promise.reject(new Error('名称不能超过30个字符!'));
                }
                return Promise.reject(new Error('输入工作流名称!'));
              },
            },
          ]}
        >
          <Input placeholder="输入工作流名称" showCount maxLength={30} />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label="描述"
          initialValue={description}
          placeholder="请输入描述，让大模型理解什么情况下应该调用此工作流"
          maxLength={100}
        />
        <Form.Item name="icon" label="图标">
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={workflowIcon as string}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateWorkflow;
