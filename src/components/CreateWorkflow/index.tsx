import workflowIcon from '@/assets/images/workflow_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { apiAddWorkflow, apiUpdateWorkflow } from '@/services/library';
import { WorkflowModeEnum } from '@/types/enums/library';
import type {
  CreateWorkflowProps,
  WorkflowBaseInfo,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useRequest } from 'umi';
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
  const [imageUrl, setImageUrl] = useState<string>(icon || '');

  // 新增工作流
  const { run } = useRequest(apiAddWorkflow, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result, params) => {
      message.success('工作流已创建成功');
      const data: WorkflowBaseInfo = {
        id: result,
        ...params[0],
      };
      onConfirm(data);
    },
  });

  // 更新工作流
  const { run: runUpdate } = useRequest(apiUpdateWorkflow, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_, params) => {
      message.success('工作流更新成功');
      onConfirm(...params);
    },
  });

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
      title="创建工作流"
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
        preserve={false}
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
          rules={[{ required: true, message: '请输入工作流名称' }]}
        >
          <Input placeholder="输入工作流名称" showCount maxLength={100} />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label="描述"
          placeholder="请输入描述，让大模型理解什么情况下应该调用此工作流"
          maxLength={2000}
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
