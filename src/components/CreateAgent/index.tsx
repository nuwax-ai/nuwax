import agentImage from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SPACE_ID } from '@/constants/home.constants';
import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import { CREATE_AGENT_LIST } from '@/constants/space.contants';
import { apiAgentAdd } from '@/services/agentConfig';
import { CreateAgentEnum, CreateEditAgentEnum } from '@/types/enums/common';
import type { AgentAddParams } from '@/types/interfaces/agent';
import type { CreateAgentProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

const CreateAgent: React.FC<CreateAgentProps> = ({
  type = CreateEditAgentEnum.Create,
  name,
  description,
  icon,
  open,
  onCancel,
  onConfirm,
}) => {
  // 分段控制器：标准创建、AI 创建
  const [createAgentType, setCreateAgentType] = useState<CreateAgentEnum>(
    CreateAgentEnum.Standard,
  );
  const [imageUrl, setImageUrl] = useState<string>(icon || '');
  const spaceId = localStorage.getItem(SPACE_ID);

  const [form] = Form.useForm();

  const { run } = useRequest(apiAgentAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_, params) => {
      console.log(params);
      onConfirm();
      message.success('智能体已创建');
    },
  });

  const handlerChange = (value: CreateAgentEnum) => {
    setCreateAgentType(value);
  };

  const onFinish: FormProps<AgentAddParams>['onFinish'] = (values) => {
    run({
      ...values,
      icon: imageUrl,
      spaceId,
    });
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
    >
      {type === CreateEditAgentEnum.Create && (
        <Segmented
          className={cx(styles.segment)}
          value={createAgentType}
          onChange={handlerChange}
          block
          options={CREATE_AGENT_LIST}
        />
      )}
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
        {createAgentType === CreateAgentEnum.Standard ? (
          <>
            <Form.Item
              name="name"
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
              name="description"
              label="智能体功能介绍"
              placeholder="介绍智能体的功能，将会展示给智能体的用户"
              maxLength={500}
            />
            <Form.Item
              name="icon"
              label="图标"
              rules={[{ required: true, message: '请选择图标' }]}
            >
              <div className={cx('flex', 'items-end', styles['image-box'])}>
                <UploadAvatar
                  className={styles['upload-box']}
                  onUploadSuccess={setImageUrl}
                  imageUrl={imageUrl}
                  defaultImage={agentImage as string}
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
