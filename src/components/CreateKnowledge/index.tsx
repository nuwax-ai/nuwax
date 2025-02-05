import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import type { CreateAgentProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const CreateKnowledge: React.FC<CreateAgentProps> = ({
  agentName,
  intro,
  open,
  onCancel,
  onConfirm,
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  const [form] = Form.useForm();

  const onFinish = (values) => {
    console.log(values);
    onConfirm();
  };

  const handlerSubmit = async () => {
    await form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title="创建知识库"
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
          agentName: agentName,
          intro: intro,
        }}
        autoComplete="off"
      >
        <Form.Item
          name={'knowledgeName'}
          label="名称"
          rules={[{ required: true, message: '输入知识库名称' }]}
        >
          <Input
            placeholder="输入知识库名称"
            showCount
            maxLength={100}
          />
        </Form.Item>
        <OverrideTextArea
          name="intro"
          label="描述"
          placeholder="输入知识库内容的描述"
          maxLength={2000}
        />
        <Form.Item
          name="image"
          label="图标"
          rules={[{ required: true, message: '请选择图标' }]}
        >
          <UploadAvatar
            className={cx(styles['upload-box'])}
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

export default CreateKnowledge;
