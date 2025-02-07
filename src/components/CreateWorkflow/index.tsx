import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { WorkflowModeEnum } from '@/types/enums/library';
import type { CreateWorkflowProps } from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建工作流弹窗
 */
const CreateWorkflow: React.FC<CreateWorkflowProps> = ({
  type = WorkflowModeEnum.Create,
  workflowName,
  workflowId,
  img,
  intro,
  open,
  onCancel,
  onConfirm,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log(values, workflowId, img, type);
    message.success('智能体已创建');
    onConfirm();
  };

  const handlerSubmit = async () => {
    await form.submit();
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
      // loading={loading}
    >
      <Form
        form={form}
        preserve={false}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          workflowName: workflowName,
          intro: intro,
        }}
        autoComplete="off"
      >
        <Form.Item
          name="workflowName"
          label="名称"
          rules={[{ required: true, message: '请输入工作流名称' }]}
        >
          <Input placeholder="输入工作流名称" showCount maxLength={100} />
        </Form.Item>
        <OverrideTextArea
          name="intro"
          label="描述"
          placeholder="请输入描述，让大模型理解什么情况下应该调用此工作流"
          maxLength={2000}
        />
        <Form.Item name="image" label="图标">
          <UploadAvatar
            className={styles['upload-box']}
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={
              'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D'
            }
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateWorkflow;
