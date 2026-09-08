import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiConnectorConnectionCreate } from '@/services/systemManage';
import type {
  ConnectorAuthConfigField,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import { Button, Drawer, Form, Input, message } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

/**
 * 「连接设置」凭据填写抽屉（自定义认证）
 *
 * 触发场景：连接器详情抽屉工具列表底部「去连接」按钮
 * （认证方式 custom / api_key / bearer，由工作空间连接器页打开）
 *
 * 表单结构（与设计稿一致）：
 *   1. 顶部「连接器」名称静态展示（不做选择功能）
 *   2. 连接名称（可选，缺省使用连接器名称）
 *   3. 凭证字段：按详情接口 authConfig.fields 动态渲染——
 *      label 取字段 label（凭证字段 · XXX），placeholder 取字段
 *      placeholder（指引去哪里获取凭证），secret !== false 时用密文框
 *   4. 底部通栏「加密保存并建立连接」主按钮
 *
 * 提交：POST /api/connector/connections/api-key（自定义 / API Key / Bearer
 * 统一走该接口）——body：spaceId / providerService / name（可选，未填由后端
 * 默认使用连接器名称）/ fields（键为 authConfig.fields[].name，值为用户
 * 输入的凭证）；成功后关闭抽屉并触发 onConnected（父组件刷新详情与列表）
 */
export interface ConnectorConnectDrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 当前连接器行（名称静态展示在抽屉顶部） */
  record: ConnectorProviderInfo | null;
  /** 凭证字段定义（详情接口 authConfig.fields，驱动表单动态渲染） */
  fields: ConnectorAuthConfigField[];
  /** 空间 ID（提交建立连接接口的必传参数） */
  spaceId?: number | string;
  /** 关闭回调 */
  onClose: () => void;
  /** 连接成功回调（刷新详情抽屉与卡片列表） */
  onConnected?: () => void;
}

const ConnectorConnectDrawer: React.FC<ConnectorConnectDrawerProps> = ({
  open,
  record,
  fields,
  spaceId,
  onClose,
  onConnected,
}) => {
  const [form] = Form.useForm();
  // 提交中：给「加密保存并建立连接」按钮加 loading，防止重复提交
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * 抽屉宽度：PC 固定 480，移动端尽量占满
   * 比详情抽屉（720）窄一层，叠在其上展示
   */
  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 480;
    const w = window.innerWidth || 480;
    return Math.min(480, Math.max(360, Math.floor(w * 0.92)));
  }, []);

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
   * body = spaceId / providerService / name（可选，未填不传，
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
    const spaceIdValue = Number(spaceId);
    if (!Number.isFinite(spaceIdValue)) {
      message.error('空间信息缺失，无法建立连接');
      return;
    }

    const connectionName = String(values.connectionName ?? '').trim();
    try {
      setSubmitting(true);
      const response = await apiConnectorConnectionCreate({
        spaceId: spaceIdValue,
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
    <Drawer
      className={styles.drawer}
      title="连接设置"
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnHidden
      rootStyle={{ overflow: 'hidden' }}
      styles={{ body: { padding: 0 } }}
    >
      <div className={styles.content}>
        {/* 连接器名称：静态展示当前连接器（设计稿是选择框，按需求不做选择） */}
        <div className={styles.connectorSection}>
          <span className={styles.connectorLabel}>连接器</span>
          <div className={styles.connectorNameBox}>{displayName}</div>
        </div>

        <Form form={form} layout="vertical" className={styles.form}>
          {/* 连接名称：可选，缺省使用连接器名称 */}
          <Form.Item name="connectionName" label="连接名称（可选）">
            <Input
              placeholder="默认使用连接器名称"
              allowClear
              maxLength={100}
            />
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

        <Button
          type="primary"
          block
          className={styles.submitButton}
          loading={submitting}
          onClick={handleSubmit}
        >
          加密保存并建立连接
        </Button>
      </div>
    </Drawer>
  );
};

export default ConnectorConnectDrawer;
