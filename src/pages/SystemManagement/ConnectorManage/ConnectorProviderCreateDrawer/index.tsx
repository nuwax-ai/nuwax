import { SUCCESS_CODE } from '@/constants/codes.constants';
import ConnectorAuthConfigSection, {
  type ConnectorProviderSubmitValues,
  toConnectorOauthConfigParams,
  toConnectorProviderPayload,
} from '@/pages/SystemManagement/ConnectorManage/components/ConnectorAuthConfigSection';
import { AUTH_TYPE_OPTIONS } from '@/pages/SystemManagement/ConnectorManage/constants';
import {
  apiSystemConnectorOauthConfigSave,
  apiSystemConnectorProviderCreate,
} from '@/services/systemManage';
import { Button, Col, Drawer, Form, Input, Row, Select, message } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

export interface ConnectorProviderCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  /** 创建成功回调（父组件用它刷新连接器列表） */
  onCreated?: () => void;
}

const ConnectorProviderCreateDrawer: React.FC<
  ConnectorProviderCreateDrawerProps
> = ({ open, onClose, onCreated }) => {
  const [form] = Form.useForm<ConnectorProviderSubmitValues>();
  // 创建中：给「创建连接器」按钮加 loading，防止重复提交
  const [submitting, setSubmitting] = useState<boolean>(false);

  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 720;
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  const authTypeOptions = useMemo(
    () => AUTH_TYPE_OPTIONS.filter((item) => item.value !== ''),
    [],
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      service: '',
      displayName: '',
      description: '',
      baseUrl: '',
      authType: 'no_auth',
      category: '',
      tags: '',
      credentialFieldName: '',
      injectionLocation: 'header',
      requestHeaderName: '',
      valuePrefix: '',
      // OAuth 2.0：默认 platform 模式
      oauthAppMode: 'platform',
      oauthClientId: '',
      oauthClientSecret: '',
      oauthAuthUrl: '',
      oauthTokenUrl: '',
      oauthScopes: '',
      // 自定义认证：两组动态行各预置一行空行（密文框默认勾选）
      customCredentialFields: [{ name: '', label: '', secret: true }],
      customInjectRules: [{ field: '', location: 'header', targetName: '' }],
    });
  }, [open, form]);

  /**
   * 创建连接器：
   * 1. 校验必填项 —— 失败时表单控件下方已有红字提示，静默返回
   * 2. POST /api/system/connector/providers（body 由共享函数组装，见
   *    toConnectorProviderPayload）
   * 3. 成功后关闭抽屉并触发 onCreated —— 父组件刷新连接器列表
   *    （GET /api/system/connector/providers）
   */
  const handleCreate = useCallback(async () => {
    let values: ConnectorProviderSubmitValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    const payload = toConnectorProviderPayload(values);
    const isOauth2Platform =
      values.authType === 'oauth2' && values.oauthAppMode !== 'byo';

    try {
      setSubmitting(true);
      const response = await apiSystemConnectorProviderCreate(payload);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error(response?.message || 'create provider failed');
      }
      // oauth2 + platform：创建成功后追加保存平台 App 配置
      // （POST /api/system/connector/oauth-config；clientSecret 不进创建接口）。
      // 失败不回滚创建——重提交会导致 service 重复，提示到编辑连接器里重试
      let oauthConfigFailed = false;
      if (isOauth2Platform) {
        try {
          const oauthResponse = await apiSystemConnectorOauthConfigSave(
            toConnectorOauthConfigParams(values, payload.service),
          );
          if (oauthResponse?.code !== SUCCESS_CODE) {
            throw new Error(
              oauthResponse?.message || 'save oauth config failed',
            );
          }
        } catch {
          oauthConfigFailed = true;
        }
      }
      message.success('连接器创建成功');
      if (oauthConfigFailed) {
        message.warning('OAuth App 配置保存失败，请在「编辑连接器」中重试');
      }
      onClose();
      onCreated?.();
    } catch {
      message.error('创建连接器失败');
    } finally {
      setSubmitting(false);
    }
  }, [form, onClose, onCreated]);

  return (
    <Drawer
      className={styles.drawer}
      title="新增官方连接器"
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnHidden
      rootStyle={{ overflow: 'hidden' }}
      styles={{ body: { padding: 0 } }}
    >
      <div className={styles.content}>
        <Form
          form={form}
          layout="vertical"
          className={styles.form}
          autoComplete="off"
        >
          <Form.Item
            name="service"
            label="SERVICE（唯一标识，创建后不可改）"
            rules={[
              { required: true, message: '请输入 service' },
              {
                pattern: /^[a-z][a-z0-9_]*$/,
                message: '请输入小写字母开头的小写字母/数字/下划线',
              },
            ]}
          >
            <Input
              placeholder="小写字母开头，小写字母/数字/下划线，如 github"
              allowClear
            />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="目录卡片展示名称" allowClear />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <Input.TextArea rows={3} placeholder="连接器介绍，展示在目录卡片" />
          </Form.Item>
          <Form.Item
            name="baseUrl"
            label="BASE URL"
            rules={[{ required: true, message: '请输入 BASE URL' }]}
          >
            <Input placeholder="https://api.example.com" allowClear />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              {/* 不加 required：与设计稿一致，认证方式不显示红星（默认免鉴权） */}
              <Form.Item name="authType" label="认证方式">
                <Select options={authTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Input placeholder="如 代码托管" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input placeholder="如 github,dev" allowClear />
          </Form.Item>

          {/* 认证配置区：按认证方式切换展示（与编辑抽屉共用组件，行为保持一致） */}
          <ConnectorAuthConfigSection form={form} />

          <Button
            type="primary"
            block
            className={styles.submitButton}
            loading={submitting}
            onClick={handleCreate}
          >
            创建连接器
          </Button>
        </Form>
      </div>
    </Drawer>
  );
};

export default memo(ConnectorProviderCreateDrawer);
