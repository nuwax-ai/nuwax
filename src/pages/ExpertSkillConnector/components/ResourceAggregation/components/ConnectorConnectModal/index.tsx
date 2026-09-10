import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiConnectorConnectionCreate } from '@/services/systemManage';
import type {
  ConnectorAuthConfigField,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import { Button, Form, Input, message, Modal } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

/**
 * 「连接设置」凭据填写弹窗
 *
 * 触发场景：专家·技能·连接器页连接器卡片「连接」按钮
 * （认证方式 api_key / bearer / custom；oauth2 走授权弹窗，免鉴权无连接概念）
 *
 * 弹窗框架与表单样式按项目通用范式（如 UserFormModal / RawSegmentEditModal）：
 * 标准底部「取消 / 加密保存并连接」按钮（主按钮 loading 防重复提交）+
 * body 内 plain vertical 表单；表单结构与提交链路与空间侧/管理侧的
 * ConnectorConnectDrawer 凭据抽屉同口径（原抽屉保持不变，本页改用弹窗交互）：
 *   1. 连接器名称静态展示（不做选择功能）
 *   2. 连接名称（可选，缺省使用连接器名称）
 *   3. 凭证字段：按详情接口 authConfig.fields 动态渲染——
 *      label 取字段 label（凭证字段 · XXX），placeholder 取字段
 *      placeholder（指引去哪里获取凭证），secret !== false 时用密文框
 *
 * 提交：POST /api/connector/connections/api-key（自定义 / API Key / Bearer
 * 统一走该接口）——body：spaceId（团队空间传，系统广场不传）/ providerService /
 * name（可选，未填由后端默认使用连接器名称）/ fields（键为
 * authConfig.fields[].name，值为用户输入的凭证）；成功后关闭弹窗并触发
 * onConnected（父组件就地更新卡片为已连接）
 */
export interface ConnectorConnectModalProps {
  /** 是否打开 */
  open: boolean;
  /** 当前连接器（名称静态展示在表单顶部） */
  record: ConnectorProviderInfo | null;
  /** 凭证字段定义（详情接口 authConfig.fields，驱动表单动态渲染） */
  fields: ConnectorAuthConfigField[];
  /** 空间 ID（团队空间传当前选中空间；系统广场不传） */
  spaceId?: number | string;
  /** 关闭回调 */
  onClose: () => void;
  /** 连接成功回调（就地更新卡片连接状态） */
  onConnected?: () => void;
}

const ConnectorConnectModal: React.FC<ConnectorConnectModalProps> = ({
  open,
  record,
  fields,
  spaceId,
  onClose,
  onConnected,
}) => {
  const [form] = Form.useForm();
  // 提交中：给底部「加密保存并连接」主按钮加 loading，防止重复提交
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 打开时重置表单（上次填写不残留，回到空白的动态凭证字段）
  useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  /** 连接器显示名：displayName 优先，回退 service */
  const displayName = record?.displayName || record?.service || '-';

  /**
   * 加密保存并建立连接
   * POST /api/connector/connections/api-key（自定义 / API Key / Bearer 统一）：
   * body = spaceId（系统广场不传）/ providerService / name（可选，未填不传，
   * 由后端默认使用连接器名称）/ fields（键为 authConfig.fields[].name）
   */
  const handleSubmit = useCallback(async () => {
    let values: {
      connectionName?: string;
      credentials?: Record<string, string>;
    };
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!record?.service) {
      message.error('连接器 service 缺失，无法建立连接');
      return;
    }
    const connectionName = String(values.connectionName ?? '').trim();
    try {
      setSubmitting(true);
      const response = await apiConnectorConnectionCreate({
        // 只在 spaceId 是有限数时透传（团队空间），系统广场不传
        spaceId: Number.isFinite(Number(spaceId)) ? Number(spaceId) : undefined,
        providerService: record.service,
        name: connectionName || undefined,
        fields: values.credentials ?? {},
      });
      if (response?.code !== SUCCESS_CODE) {
        message.error(response?.message || '建立连接失败');
        return;
      }
      message.success('连接成功');
      onClose();
      onConnected?.();
    } catch {
      message.error('建立连接失败');
    } finally {
      setSubmitting(false);
    }
  }, [form, record?.service, spaceId, onClose, onConnected]);

  return (
    <Modal
      title="连接设置"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          加密保存并连接
        </Button>,
      ]}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        {/* 连接器名称：静态展示当前连接器（设计稿是选择框，按需求不做选择） */}
        <Form.Item label="连接器">{displayName}</Form.Item>
        {/* 连接名称：可选，缺省使用连接器名称 */}
        <Form.Item name="connectionName" label="连接名称（可选）">
          <Input placeholder="默认使用连接器名称" allowClear maxLength={100} />
        </Form.Item>
        {/*
          凭证字段：按 authConfig.fields 动态渲染。
          name 缺失时用下标兜底作表单键；label 大写展示与设计稿一致
          （中文 label 不受 toUpperCase 影响）
        */}
        {fields.map((field, index) => {
          const fieldKey = field.name || `field_${index}`;
          const label = (
            field.label ||
            field.name ||
            `字段 ${index + 1}`
          ).toUpperCase();
          return (
            <Form.Item
              key={fieldKey}
              name={['credentials', fieldKey]}
              label={`凭证字段 · ${label}`}
              rules={[{ required: true, message: `请输入${label}` }]}
            >
              {field.secret !== false ? (
                <Input.Password
                  placeholder={field.placeholder}
                  autoComplete="new-password"
                />
              ) : (
                <Input placeholder={field.placeholder} allowClear />
              )}
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
};

export default ConnectorConnectModal;
