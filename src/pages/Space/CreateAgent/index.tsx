import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import { CREATE_AGENT_LIST } from '@/constants/space.contants';
import { CreateAgentEnum } from '@/types/enums/space';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, message, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CreateAgentProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const { TextArea } = Input;
const CreateAgent: React.FC<CreateAgentProps> = ({
  open,
  onCancel,
  onConfirm,
}) => {
  // 分段控制器：标准创建、AI 创建
  const [createAgentType, setCreateAgentType] = useState<CreateAgentEnum>(
    CreateAgentEnum.Standard,
  );
  const [teamId, setTeamId] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const [form] = Form.useForm();

  const handlerChange = (value: CreateAgentEnum) => {
    setCreateAgentType(value);
  };

  const onFinish = (values) => {
    console.log(values);
    message.success('智能体已创建');
    onConfirm();
  };

  const handlerSubmit = async () => {
    await form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      title="创建智能体"
      open={open}
      okText={createAgentType === CreateAgentEnum.Standard ? '' : '生成'}
      okPrefixIcon={
        createAgentType === CreateAgentEnum.Standard ? (
          ''
        ) : (
          <ICON_CONFIRM_STAR />
        )
      }
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      loading={loading}
    >
      <Segmented
        className={cx(styles.segment)}
        value={createAgentType}
        onChange={handlerChange}
        block
        options={CREATE_AGENT_LIST}
      />
      <Form
        form={form}
        preserve={false}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        {createAgentType === CreateAgentEnum.Standard ? (
          <>
            <Form.Item
              name={'agentName'}
              label="智能体名称"
              rules={[{ required: true, message: '请输入智能体名称' }]}
            >
              <Input
                placeholder="给智能体起一个独一无二的名字"
                showCount
                maxLength={20}
              />
            </Form.Item>
            <OverrideTextArea
              name="intro"
              label="智能体功能介绍"
              placeholder="介绍智能体的功能，将会展示给智能体的用户"
              maxLength={500}
            />
            <Form.Item
              name="image"
              label="图标"
              rules={[{ required: true, message: '请选择图标' }]}
            >
              <div className={cx('flex', 'items-end', styles['image-box'])}>
                <UploadAvatar
                  className={styles['upload-box']}
                  onUploadSuccess={setImageUrl}
                  imageUrl={imageUrl}
                  defaultImage={
                    'https://lf3-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736495925&x-signature=Cep9yaOi9FW4Y14KmEY9u366780%3D'
                  }
                />
                <span className={cx(styles['vertical-line'])} />
                <img
                  className={cx(styles['recommend-img'], 'cursor-pointer')}
                  src=""
                  alt=""
                />
              </div>
            </Form.Item>
          </>
        ) : (
          <Form.Item
            className={cx(styles['text-area'])}
            name="intro"
            rules={[
              { required: true, message: '请描述你希望创建一个什么样的智能体' },
            ]}
          >
            <TextArea
              placeholder="请描述你希望创建一个什么样的智能体"
              autoSize={{ minRows: 4, maxRows: 6 }}
            />
          </Form.Item>
        )}
      </Form>
    </CustomFormModal>
  );
};

export default CreateAgent;
