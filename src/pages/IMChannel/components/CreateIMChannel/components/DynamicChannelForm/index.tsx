import { IMPlatformEnum } from '@/constants/imChannel.constants';
import { ProFormText } from '@ant-design/pro-components';
import React from 'react';

export type PlatformChannel = IMPlatformEnum | string;
export type RobotType = 'bot' | 'app';

interface DynamicChannelFormProps {
  platform: PlatformChannel | undefined;
  type: RobotType | undefined;
}

const DynamicChannelForm: React.FC<DynamicChannelFormProps> = ({
  platform,
  type,
}) => {
  const commonRules = [{ required: true, message: '此项为必填项' }];
  const maxProps = { maxLength: 100, showCount: true };

  if (!platform) return null;

  // 飞书机器人
  if (platform === IMPlatformEnum.Feishu) {
    return (
      <>
        <ProFormText
          name={['configData', 'appId']}
          label="App ID"
          rules={commonRules}
          fieldProps={maxProps}
        />
        <ProFormText.Password
          name={['configData', 'appSecret']}
          label="App Secret"
          rules={commonRules}
          fieldProps={maxProps}
        />
        <ProFormText.Password
          name={['configData', 'encryptKey']}
          label="Encrypt Key"
          fieldProps={maxProps}
        />
        <ProFormText.Password
          name={['configData', 'verificationToken']}
          label="Verification Token"
          fieldProps={maxProps}
        />
      </>
    );
  }

  // 钉钉机器人
  if (platform === IMPlatformEnum.Dingtalk) {
    return (
      <>
        <ProFormText
          name={['configData', 'robotCode']}
          label="RobotCode"
          rules={commonRules}
          fieldProps={maxProps}
        />
        <ProFormText
          name={['configData', 'clientId']}
          label="Client ID"
          rules={commonRules}
          fieldProps={maxProps}
        />
        <ProFormText.Password
          name={['configData', 'clientSecret']}
          label="Client Secret"
          rules={commonRules}
          fieldProps={maxProps}
        />
      </>
    );
  }

  // 企业微信
  if (platform === IMPlatformEnum.Wework) {
    if (type === 'app') {
      // ... (omitting unchanged code for brevity)
      return (
        <>
          <ProFormText.Password
            name={['configData', 'token']}
            label="Token"
            rules={commonRules}
            fieldProps={maxProps}
          />
          <ProFormText
            name={['configData', 'agentId']}
            label="AgentId"
            rules={commonRules}
            fieldProps={maxProps}
          />
          <ProFormText
            name={['configData', 'corpId']}
            label="CorpId"
            rules={commonRules}
            fieldProps={maxProps}
          />
          <ProFormText.Password
            name={['configData', 'corpSecret']}
            label="Secret"
            rules={commonRules}
            fieldProps={maxProps}
          />

          <ProFormText.Password
            name={['configData', 'encodingAesKey']}
            label="EncodingAESKey"
            rules={commonRules}
            fieldProps={maxProps}
          />
        </>
      );
    }
    return (
      <>
        <ProFormText.Password
          name={['configData', 'token']}
          label="Token"
          rules={commonRules}
          fieldProps={maxProps}
        />
        <ProFormText
          name={['configData', 'aibotId']}
          label="Bot ID"
          rules={commonRules}
          fieldProps={maxProps}
        />
        <ProFormText
          name={['configData', 'corpId']}
          label="CorpId"
          rules={commonRules}
          fieldProps={maxProps}
        />

        <ProFormText.Password
          name={['configData', 'encodingAesKey']}
          label="EncodingAESKey"
          rules={commonRules}
          fieldProps={maxProps}
        />
      </>
    );
  }

  return null;
};

export default DynamicChannelForm;
