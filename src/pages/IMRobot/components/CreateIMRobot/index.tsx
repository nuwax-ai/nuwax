import CustomFormModal from '@/components/CustomFormModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import SelectTargetFormItem from '@/pages/SpaceTaskCenter/CreateTimedTask/components/SelectTargetFormItem';
import { apiAddIMRobot, apiUpdateIMRobot } from '@/services/imRobot';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  IMRobotInfo,
  IMRobotStatusEnum,
  IMRobotTypeEnum,
} from '@/types/interfaces/imRobot';
import { Form, Input, message, Radio, Switch } from 'antd';
import React, { useEffect, useState } from 'react';

export interface CreateIMRobotProps {
  open: boolean;
  mode: CreateUpdateModeEnum;
  info?: IMRobotInfo | null;
  spaceId: number;
  onCancel: () => void;
  onSuccess: () => void;
}

const CreateIMRobot: React.FC<CreateIMRobotProps> = ({
  open,
  mode,
  info,
  spaceId,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const robotType = Form.useWatch('type', form);

  useEffect(() => {
    if (open) {
      if (mode === CreateUpdateModeEnum.Update && info) {
        form.setFieldsValue({
          name: info.name,
          type: info.type,
          status: info.status === IMRobotStatusEnum.Enabled,
          target: {
            name: info.targetName,
            icon: info.targetIcon,
            type: info.targetType,
            targetId: info.targetId,
          },
          webhookUrl: info.config?.webhookUrl,
          agentId: info.config?.agentId,
          secret: info.config?.secret,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: IMRobotTypeEnum.WeChatBot,
          status: true,
        });
      }
    }
  }, [open, mode, info, form]);

  const handleConfirm = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const params: any = {
        spaceId,
        name: values.name,
        type: values.type,
        status: values.status
          ? IMRobotStatusEnum.Enabled
          : IMRobotStatusEnum.Disabled,
        targetType: AgentComponentTypeEnum.Agent,
        targetId: values.target.targetId,
        config: {
          webhookUrl: values.webhookUrl,
          agentId: values.agentId,
          secret: values.secret,
        },
      };

      let res;
      if (mode === CreateUpdateModeEnum.Create) {
        res = await apiAddIMRobot(params);
      } else {
        res = await apiUpdateIMRobot({ ...params, id: info?.id });
      }

      if (res.code === SUCCESS_CODE) {
        message.success(
          mode === CreateUpdateModeEnum.Create ? '新增成功' : '编辑成功',
        );
        onSuccess();
      }
    } catch (error) {
      console.error('Validate Failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomFormModal
      title={mode === CreateUpdateModeEnum.Create ? '新增机器人' : '编辑机器人'}
      open={open}
      form={form}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      loading={loading}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="机器人名称"
          rules={[{ required: true, message: '请输入机器人名称' }]}
        >
          <Input placeholder="请输入机器人名称" maxLength={50} showCount />
        </Form.Item>

        <Form.Item
          name="type"
          label="机器人类型"
          rules={[{ required: true, message: '请选择机器人类型' }]}
        >
          <Radio.Group>
            <Radio value={IMRobotTypeEnum.WeChatBot}>微信机器人</Radio>
            <Radio value={IMRobotTypeEnum.WeChatApp}>企业应用</Radio>
          </Radio.Group>
        </Form.Item>

        <Form.Item name="status" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
        </Form.Item>

        <SelectTargetFormItem form={form} name="target" label="绑定智能体" />

        {robotType === IMRobotTypeEnum.WeChatBot && (
          <Form.Item
            name="webhookUrl"
            label="Webhook URL"
            rules={[{ required: true, message: '请输入 Webhook URL' }]}
          >
            <Input placeholder="请输入企业微信机器人 Webhook URL" />
          </Form.Item>
        )}

        {robotType === IMRobotTypeEnum.WeChatApp && (
          <>
            <Form.Item
              name="agentId"
              label="AgentID"
              rules={[{ required: true, message: '请输入 AgentID' }]}
            >
              <Input placeholder="请输入企业应用 AgentID" />
            </Form.Item>
            <Form.Item
              name="secret"
              label="Secret"
              rules={[{ required: true, message: '请输入 Secret' }]}
            >
              <Input.Password placeholder="请输入企业应用 Secret" />
            </Form.Item>
          </>
        )}
      </Form>
    </CustomFormModal>
  );
};

export default CreateIMRobot;
