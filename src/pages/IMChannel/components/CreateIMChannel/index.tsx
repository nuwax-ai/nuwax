import { XModalForm } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  IM_PLATFORM_LABEL_MAP,
  IMPlatformEnum,
} from '@/constants/imChannel.constants';
import SelectTargetFormItem from '@/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItem';
import {
  apiAddIMConfigChannel,
  apiGetIMConfigChannelDetail,
  apiTestIMConfigChannelConnection,
  apiUpdateIMConfigChannel,
} from '@/services/imChannel';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { IMChannelInfo, IMChannelTypeEnum } from '@/types/interfaces/imChannel';
import { ProFormSwitch } from '@ant-design/pro-components';
import { Button, Form, message } from 'antd';
import React, { useEffect, useState } from 'react';
import DynamicChannelForm, {
  PlatformChannel,
} from './components/DynamicChannelForm';

export interface CreateIMChannelProps {
  open: boolean;
  mode: CreateUpdateModeEnum;
  info?: IMChannelInfo | null;
  initialType?: IMChannelTypeEnum;
  platform?: PlatformChannel;
  spaceId?: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateIMChannel: React.FC<CreateIMChannelProps> = ({
  open,
  mode,
  info,
  initialType,
  platform,
  spaceId,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const currentType =
    mode === CreateUpdateModeEnum.Update ? info?.targetType : initialType;
  const robotType = (currentType as IMChannelTypeEnum) || IMChannelTypeEnum.Bot;

  useEffect(() => {
    const initData = async () => {
      if (mode === CreateUpdateModeEnum.Update && info) {
        try {
          // 获取最新详情
          const res = await apiGetIMConfigChannelDetail(info.id);
          if (res.code === SUCCESS_CODE && res.data) {
            const detail = res.data;
            let dynamicConfig = {};
            try {
              dynamicConfig = detail.configData
                ? JSON.parse(detail.configData)
                : {};
            } catch (e) {
              console.error('Parse configData failed:', e);
            }

            form.setFieldsValue({
              name: detail.name,
              targetType: detail.targetType || IMChannelTypeEnum.Bot,
              enabled: detail.enabled,
              target: {
                name: detail.agentName,
                targetId: detail.agentId,
                icon: detail.agentIcon,
                description: detail.agentDescription,
              },
              configData: dynamicConfig,
            });
            return;
          }
          form.resetFields();
        } catch (error) {
          console.error('Fetch IMChannel detail failed:', error);
          form.resetFields();
        }
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: initialType || IMChannelTypeEnum.Bot,
          enabled: true,
        });
      }
    };

    if (open) {
      initData();
    }
  }, [open, mode, info, form, initialType]);

  const handleConfirm = async (values: any) => {
    try {
      const params: any = {
        channel: platform,
        targetType: robotType,
        agentId: values.target.targetId,
        enabled: values.enabled,
        configData: JSON.stringify(values.configData || {}),
        spaceId,
      };

      if (mode === CreateUpdateModeEnum.Update) {
        params.id = info?.id;
      }

      const res =
        mode === CreateUpdateModeEnum.Create
          ? await apiAddIMConfigChannel(params)
          : await apiUpdateIMConfigChannel(params);

      if (res.code === SUCCESS_CODE) {
        message.success(
          mode === CreateUpdateModeEnum.Create ? '新增成功' : '编辑成功',
        );
        onSuccess();
        return true;
      }
    } catch (error) {
      console.error('Validate Failed:', error);
    }
    return false;
  };

  const handleTestConnection = async () => {
    try {
      const values = await form.validateFields();
      setTesting(true);
      const res = await apiTestIMConfigChannelConnection({
        channel: platform || '',
        targetType: robotType,
        configData: JSON.stringify(values.configData || {}),
      });

      if (res.code === SUCCESS_CODE) {
        message.success('测试连接成功');
      }
    } catch (error) {
      console.error('Test Connection Failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const showTestBtn =
    (platform === IMPlatformEnum.Feishu &&
      robotType === IMChannelTypeEnum.Bot) ||
    (platform === IMPlatformEnum.Dingtalk &&
      robotType === IMChannelTypeEnum.Bot) ||
    (platform === IMPlatformEnum.Wework && robotType === IMChannelTypeEnum.App);

  const getTitle = () => {
    const pName = platform
      ? IM_PLATFORM_LABEL_MAP[platform as IMPlatformEnum]
      : '';
    const prefix = mode === CreateUpdateModeEnum.Update ? '编辑' : '新增';
    const suffix = robotType === IMChannelTypeEnum.App ? '应用' : '机器人';
    return `${prefix}${pName}${suffix}`;
  };

  return (
    <XModalForm
      title={getTitle()}
      open={open}
      form={form}
      onOpenChange={(visible) => !visible && onCancel()}
      onFinish={handleConfirm}
      modalProps={{
        destroyOnClose: true,
        width: 600,
      }}
      submitter={{
        render: (props, defaultDoms) => {
          return [
            defaultDoms[0],
            showTestBtn && (
              <Button
                key="test"
                loading={testing}
                onClick={handleTestConnection}
              >
                测试连通性
              </Button>
            ),
            defaultDoms[1],
          ];
        },
      }}
    >
      <DynamicChannelForm platform={platform} type={robotType} />
      <SelectTargetFormItem
        form={form}
        name="target"
        label="智能体"
        hideTop={[
          AgentComponentTypeEnum.Knowledge,
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Plugin,
          AgentComponentTypeEnum.Workflow,
        ]}
        checkTag={AgentComponentTypeEnum.Agent}
      />
      <ProFormSwitch name="enabled" label="启用状态" />
    </XModalForm>
  );
};

export default CreateIMChannel;
