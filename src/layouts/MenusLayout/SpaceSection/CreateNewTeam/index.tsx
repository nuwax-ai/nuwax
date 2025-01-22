import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import type { CreateNewTeamProps } from '@/types/interfaces/menus';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 创建新团队组件
 */
const CreateNewTeam: React.FC<CreateNewTeamProps> = ({ open, onCancel }) => {
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Received values of form: ', values);
  };

  const handleOk = () => {
    setConfirmLoading(true);
    form.submit();
    setTimeout(() => {
      onCancel();
      setConfirmLoading(false);
    }, 3000);
  };

  return (
    <CustomFormModal
      form={form}
      title={'创建新团队'}
      open={open}
      onCancel={onCancel}
      loading={confirmLoading}
      onConfirm={handleOk}
    >
      <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
        <p className={cx(styles['create-team-tips'])}>
          通过创建团队，将支持项目、智能体、插件、工作流和知识库在团队内进行协作和共享。
        </p>
        <UploadAvatar
          className={styles['upload-box']}
          onUploadSuccess={setImageUrl}
          imageUrl={imageUrl}
          defaultImage={
            'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D'
          }
        />
        <Form
          form={form}
          preserve={false}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx(styles['create-team-form'])}
          autoComplete="off"
        >
          <Form.Item
            name="teamName"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" showCount maxLength={50} />
          </Form.Item>
          <OverrideTextArea name="desc" label="描述" />
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default CreateNewTeam;
