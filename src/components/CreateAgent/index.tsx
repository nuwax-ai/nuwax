import agentImage from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SPACE_ID } from '@/constants/home.constants';
import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import { CREATE_AGENT_LIST } from '@/constants/space.constants';
import { apiAgentAdd, apiAgentConfigUpdate } from '@/services/agentConfig';
import { CreateAgentEnum, CreateUpdateModeEnum } from '@/types/enums/common';
import type { AgentAddParams } from '@/types/interfaces/agent';
import type { CreateAgentProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

const CreateAgent: React.FC<CreateAgentProps> = ({
  mode = CreateUpdateModeEnum.Create,
  agentConfigInfo,
  open,
  onCancel,
  onConfirmCreate,
  onConfirmUpdate,
}) => {
  // 分段控制器：标准创建、AI 创建
  const [createAgentType, setCreateAgentType] = useState<CreateAgentEnum>(
    CreateAgentEnum.Standard,
  );
  const [imageUrl, setImageUrl] = useState<string>('');
  const [form] = Form.useForm();

  // 新增智能体接口
  const { run: runEdit } = useRequest(apiAgentAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setImageUrl('');
      onConfirmCreate?.(result);
      message.success('智能体已创建');
    },
  });

  // 更新智能体基础配置信息
  const { run: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: (_, params) => {
      message.success('智能体编辑成功');
      onConfirmUpdate?.(...params);
    },
  });

  useEffect(() => {
    setImageUrl(agentConfigInfo?.icon as string);
  }, [agentConfigInfo?.icon]);

  const onFinish: FormProps<AgentAddParams>['onFinish'] = (values) => {
    if (mode === CreateUpdateModeEnum.Create) {
      const spaceId = localStorage.getItem(SPACE_ID);
      runEdit({
        ...values,
        icon: imageUrl,
        spaceId,
      });
    } else {
      // 更新智能体
      runUpdate({
        ...values,
        icon: imageUrl,
        id: agentConfigInfo?.id,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
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
      {mode === CreateUpdateModeEnum.Create && (
        <Segmented
          className={cx(styles.segment)}
          value={createAgentType}
          onChange={setCreateAgentType}
          block
          options={CREATE_AGENT_LIST}
        />
      )}
      <Form
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        initialValues={{
          name: agentConfigInfo?.name,
          description: agentConfigInfo?.description,
        }}
        onFinish={onFinish}
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
              initialValue={agentConfigInfo?.description}
              placeholder="介绍智能体的功能，将会展示给智能体的用户"
              maxLength={500}
            />
            <Form.Item name="icon" label="图标">
              <UploadAvatar
                className={styles['upload-box']}
                onUploadSuccess={setImageUrl}
                imageUrl={imageUrl}
                defaultImage={agentImage as string}
              />
            </Form.Item>
          </>
        ) : (
          <Form.Item
            className={cx(styles['text-area'])}
            name="description"
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
