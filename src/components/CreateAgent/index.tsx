import agentImage from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { apiAgentAdd, apiAgentConfigUpdate } from '@/services/agentConfig';
import { dict } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { AgentSubTypeEnum, AgentTypeEnum } from '@/types/enums/space';
import type {
  AgentAddParams,
  AgentAddResult,
  AgentConfigUpdateParams,
} from '@/types/interfaces/agent';
import type { CreateAgentProps } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useRequest } from 'umi';

const CreateAgent: React.FC<CreateAgentProps> = ({
  type,
  spaceId,
  mode = CreateUpdateModeEnum.Create,
  agentConfigInfo,
  open,
  onCancel,
  onConfirmCreate,
  onConfirmUpdate,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 新增智能体接口
  const { run: runAdd } = useRequest(apiAgentAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentAddResult) => {
      setImageUrl('');
      onConfirmCreate?.(result);
      message.success(dict('PC.Components.CreateAgent.createSuccess'));
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 更新智能体基础配置信息
  const { run: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: AgentConfigUpdateParams[]) => {
      message.success(dict('PC.Components.CreateAgent.editSuccess'));
      setLoading(false);
      const info: AgentConfigUpdateParams = params[0];
      onConfirmUpdate?.(info);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const initForm = () => {
    setImageUrl(agentConfigInfo?.icon as string);
    form.setFieldsValue({
      name: agentConfigInfo?.name,
      description: agentConfigInfo?.description,
    });
  };

  useEffect(() => {
    if (open) {
      initForm();
    }
  }, [open, agentConfigInfo]);

  const onFinish: FormProps<AgentAddParams>['onFinish'] = (values) => {
    setLoading(true);
    if (mode === CreateUpdateModeEnum.Create) {
      // AgentFlow / AgentGroup 在后端实际类型为 TaskAgent，通过 subType 区分
      const isAgentFlow = type === AgentTypeEnum.AgentFlow;
      const isAgentGroup = type === AgentTypeEnum.AgentGroup;
      const resolveSubType = () => {
        if (isAgentFlow) return AgentSubTypeEnum.Flow;
        if (isAgentGroup) return AgentSubTypeEnum.Group;
        return undefined;
      };
      runAdd({
        ...values,
        icon: imageUrl,
        spaceId,
        type: isAgentFlow || isAgentGroup ? AgentTypeEnum.TaskAgent : type,
        subType: resolveSubType(),
      });
    } else {
      // 更新智能体
      runUpdate({
        ...values,
        icon: imageUrl,
        id: agentConfigInfo?.id,
        type,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 取消操作
  const handleCancel = () => {
    onCancel();
    initForm();
  };

  // 获取标题
  const getTitle = useCallback(() => {
    if (type) {
      let typeName: string | undefined;
      switch (type) {
        case AgentTypeEnum.ChatBot:
          typeName = dict('PC.Components.CreateAgent.typeChatBot');
          break;
        case AgentTypeEnum.TaskAgent:
          typeName = dict('PC.Components.CreateAgent.typeTaskAgent');
          break;
        case AgentTypeEnum.AgentFlow:
          typeName = dict('PC.Components.CreateAgent.typeAgentFlow');
          break;
        case AgentTypeEnum.AgentGroup:
          typeName = dict('PC.Components.CreateAgent.typeAgentGroup');
          break;
        default:
          typeName = undefined;
      }

      if (typeName) {
        return mode === CreateUpdateModeEnum.Create
          ? dict('PC.Components.CreateAgent.createTypeTitle', typeName)
          : dict('PC.Components.CreateAgent.updateTypeTitle', typeName);
      }
    }
    return mode === CreateUpdateModeEnum.Create
      ? dict('PC.Components.CreateAgent.createTitle')
      : dict('PC.Components.CreateAgent.updateTitle');
  }, [type, mode]);

  return (
    <CustomFormModal
      form={form}
      title={getTitle()}
      open={open}
      loading={loading}
      onCancel={handleCancel}
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
          label={dict('PC.Components.CreateAgent.nameLabel')}
          validateTrigger="onBlur"
          rules={[
            {
              required: true,
              message: dict('PC.Components.CreateAgent.nameRequired'),
            },
            {
              validator(_, value) {
                if (!value || value?.length <= 50) {
                  return Promise.resolve();
                }
                if (value?.length > 50) {
                  return Promise.reject(
                    new Error(dict('PC.Components.CreateAgent.nameMaxLength')),
                  );
                }
                return Promise.reject(
                  new Error(dict('PC.Components.CreateAgent.nameRequired')),
                );
              },
            },
          ]}
        >
          <Input
            placeholder={dict('PC.Components.CreateAgent.namePlaceholder')}
            showCount
            maxLength={50}
          />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label={dict('PC.Components.CreateAgent.descriptionLabel')}
          initialValue={agentConfigInfo?.description}
          placeholder={dict('PC.Components.CreateAgent.descriptionPlaceholder')}
          maxLength={10000}
        />
        <Form.Item
          name="icon"
          label={dict('PC.Components.CreateAgent.iconLabel')}
        >
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={agentImage as string}
            svgIconName="icons-workspace-agent"
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateAgent;
