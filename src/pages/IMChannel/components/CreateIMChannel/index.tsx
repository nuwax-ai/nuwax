import { XModalForm } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  IM_PLATFORM_LABEL_MAP,
  IMPlatformEnum,
} from '@/constants/imChannel.constants';
import SelectTargetFormItem from '@/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItem';
import { dict } from '@/services/i18nRuntime';
import {
  apiAddIMConfigChannel,
  apiGetIMConfigChannelDetail,
  apiTestIMConfigChannelConnection,
  apiUpdateIMConfigChannel,
} from '@/services/imChannel';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { IMChannelInfo, IMChannelTypeEnum } from '@/types/interfaces/imChannel';
import { ProFormRadio, ProFormSwitch } from '@ant-design/pro-components';
import { Button, Form, message } from 'antd';
import React, { useEffect, useState } from 'react';
import DynamicChannelForm, {
  PlatformChannel,
} from './components/DynamicChannelForm';
import WechatIlinkForm from './components/WechatIlinkForm';

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
              outputMode:
                detail.outputMode ||
                (platform === IMPlatformEnum.Wework ? 'once' : 'stream'),
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
          outputMode:
            platform === IMPlatformEnum.Wework ||
            platform === IMPlatformEnum.WechatIlink
              ? 'once'
              : 'stream',
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
        outputMode: values.outputMode,
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
          mode === CreateUpdateModeEnum.Create
            ? dict('PC.Pages.IMChannel.CreateIMChannel.addSuccess')
            : dict('PC.Pages.IMChannel.CreateIMChannel.editSuccess'),
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
        message.success(
          dict('PC.Pages.IMChannel.CreateIMChannel.testConnectionSuccess'),
        );
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
    const prefix =
      mode === CreateUpdateModeEnum.Update
        ? dict('PC.Pages.IMChannel.CreateIMChannel.edit')
        : dict('PC.Pages.IMChannel.CreateIMChannel.add');
    const suffix =
      robotType === IMChannelTypeEnum.App
        ? dict('PC.Pages.IMChannel.CreateIMChannel.app')
        : dict('PC.Pages.IMChannel.CreateIMChannel.bot');
    return `${prefix}${pName}${suffix}`;
  };

  const isWechat = platform === IMPlatformEnum.WechatIlink;

  return (
    <XModalForm
      title={getTitle()}
      open={open}
      form={form}
      onOpenChange={(visible) => !visible && onCancel()}
      onFinish={handleConfirm}
      modalProps={{
        destroyOnHidden: true,
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
                {dict('PC.Pages.IMChannel.CreateIMChannel.testConnectivity')}
              </Button>
            ),
            defaultDoms[1],
          ];
        },
      }}
    >
      <DynamicChannelForm platform={platform} type={robotType} />

      {isWechat && <WechatIlinkForm form={form} />}

      <SelectTargetFormItem
        form={form}
        name="target"
        label={dict('PC.Pages.IMChannel.CreateIMChannel.agent')}
        tooltip={dict('PC.Pages.IMChannel.CreateIMChannel.agentTooltip')}
        hideTop={[
          AgentComponentTypeEnum.Knowledge,
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Plugin,
          AgentComponentTypeEnum.Workflow,
        ]}
        checkTag={AgentComponentTypeEnum.Agent}
      />

      <ProFormRadio.Group
        name="outputMode"
        label={dict('PC.Pages.IMChannel.CreateIMChannel.outputMode')}
        tooltip={dict('PC.Pages.IMChannel.CreateIMChannel.outputModeTooltip')}
        options={[
          {
            label: dict('PC.Pages.IMChannel.CreateIMChannel.streamOutput'),
            value: 'stream',
          },
          {
            label: dict('PC.Pages.IMChannel.CreateIMChannel.onceOutput'),
            value: 'once',
          },
        ]}
        disabled={platform === IMPlatformEnum.Wework || isWechat}
      />
      <ProFormSwitch
        name="enabled"
        label={dict('PC.Pages.IMChannel.CreateIMChannel.enabledStatus')}
      />
    </XModalForm>
  );
};

export default CreateIMChannel;
