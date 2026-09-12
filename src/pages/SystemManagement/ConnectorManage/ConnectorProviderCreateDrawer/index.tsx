import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import ConnectorAuthConfigSection, {
  type ConnectorProviderSubmitValues,
  isOauthLikeAuthType,
  toConnectorOauthConfigParams,
  toConnectorProviderPayload,
} from '@/pages/SystemManagement/ConnectorManage/components/ConnectorAuthConfigSection';
import { AUTH_TYPE_OPTIONS } from '@/pages/SystemManagement/ConnectorManage/constants';
import useConnectorCategoryOptions from '@/pages/SystemManagement/ConnectorManage/hooks/useConnectorCategoryOptions';
import {
  apiSystemConnectorOauthConfigSave,
  apiSystemConnectorProviderCreate,
} from '@/services/systemManage';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  CreateConnectorProviderParams,
  SaveConnectorOauthConfigParams,
} from '@/types/interfaces/systemManage';
import { Button, Col, Drawer, Form, Input, Row, Select, message } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

export interface ConnectorProviderCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  /** 创建成功回调（父组件用它刷新连接器列表） */
  onCreated?: () => void;
  /**
   * 自定义创建接口：入参/返回与管理端 POST /api/system/connector/providers 一致。
   * 工作空间连接器页复用本抽屉时传 space 维度接口（POST /api/connector/providers），
   * 不传走管理端默认。
   */
  createProvider?: (
    payload: CreateConnectorProviderParams,
  ) => Promise<RequestResponse<null>>;
  /**
   * 自定义 OAuth 平台 App 配置保存接口：入参/返回与管理端
   * POST /api/system/connector/oauth-config 一致。
   * 工作空间连接器页传 space 维度接口
   * （POST /api/connector/oauth/shared-config），不传走管理端默认。
   * 仅 oauth2 + platform 模式创建成功后调用。
   */
  saveOauthConfig?: (
    params: SaveConnectorOauthConfigParams,
  ) => Promise<RequestResponse<null>>;
  /** 创建成功提示文案；默认「连接器创建成功」 */
  successMessage?: string;
  /**
   * service 自动前缀（工作空间连接器传 's_'）：
   * label 提示「创建后自动加前缀」；输入框失焦时自动把前缀补进输入值
   * （如输入 github 失焦变 s_github，已带前缀不重复补），提交前再兜底补一次。
   * 不传则与管理端一致：完整 service 手动输入。
   */
  servicePrefix?: string;
}

const ConnectorProviderCreateDrawer: React.FC<
  ConnectorProviderCreateDrawerProps
> = ({
  open,
  onClose,
  onCreated,
  createProvider,
  saveOauthConfig,
  successMessage,
  servicePrefix,
}) => {
  const [form] = Form.useForm<ConnectorProviderSubmitValues>();
  // 创建中：给「创建连接器」按钮加 loading，防止重复提交
  const [submitting, setSubmitting] = useState<boolean>(false);
  /** 图标 URL（上传成功回写隐藏表单字段 icon，随表单一起提交） */
  const iconUrl = (Form.useWatch('icon', form) ?? '') as string;
  /**
   * 图标展示地址：/api/f/ 为需鉴权的受保护文件地址，img 直接请求不带
   * Authorization 会被拒（Chrome ORB 拦截 → 图片加载失败宽度为 0），
   * 走 Bearer fetch + blob object URL 展示；表单里存的仍是原始 URL（提交用）
   */
  const { displaySrc: iconDisplaySrc } = useAuthProtectedImageSrc(iconUrl);

  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 720;
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  const authTypeOptions = useMemo(
    () => AUTH_TYPE_OPTIONS.filter((item) => item.value !== ''),
    [],
  );

  /**
   * 分类下拉字典（GET /api/published/category/list → Connector.children，
   * 与编辑抽屉共用 hook）；新增模式在字典到达后默认选中第一个
   */
  const { categoryOptions, categoryLoading } =
    useConnectorCategoryOptions(open);

  // 默认选中第一个分类：表单打开重置后 category 为空，字典拉取成功即预选。
  // 仅在 category 为空时写入，不覆盖用户已选 / 已清空的状态
  useEffect(() => {
    if (categoryOptions.length > 0 && !form.getFieldValue('category')) {
      form.setFieldValue('category', categoryOptions[0].value);
    }
  }, [categoryOptions, form]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      service: '',
      displayName: '',
      description: '',
      icon: '',
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
   * service 失焦自动补前缀（servicePrefix 模式）：
   * 用户只输后半段（如 github），失焦后输入值自动变为 s_github；
   * 已带前缀（如手动输过 s_）不重复补，空值不处理
   */
  const handleServiceBlur = useCallback(() => {
    if (!servicePrefix) return;
    const current = (form.getFieldValue('service') as string | undefined) ?? '';
    if (current && !current.startsWith(servicePrefix)) {
      form.setFieldValue('service', `${servicePrefix}${current}`);
    }
  }, [form, servicePrefix]);

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

    // servicePrefix 模式兜底：失焦未触发（如输入框内直接回车提交）时补前缀
    if (
      servicePrefix &&
      values.service &&
      !values.service.startsWith(servicePrefix)
    ) {
      values.service = `${servicePrefix}${values.service}`;
    }

    const payload = toConnectorProviderPayload(values);
    // oauth2 同族（含扫描授权 oauth2_device）+ platform：创建成功后追加保存平台 App 配置
    const isOauth2Platform =
      isOauthLikeAuthType(values.authType) && values.oauthAppMode !== 'byo';

    try {
      setSubmitting(true);
      // 创建接口可注入：管理端默认 POST /api/system/connector/providers，
      // 工作空间连接器页复用本抽屉时传 POST /api/connector/providers
      const doCreate = createProvider ?? apiSystemConnectorProviderCreate;
      const response = await doCreate(payload);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error(response?.message || 'create provider failed');
      }
      // oauth2 + platform：创建成功后追加保存平台 App 配置
      // （clientSecret 不进创建接口，由此接口加密落库）。
      // 接口可注入：管理端默认 POST /api/system/connector/oauth-config，
      // 工作空间连接器页传 POST /api/connector/oauth/shared-config。
      // 失败不回滚创建——重提交会导致 service 重复，提示到编辑连接器里重试
      let oauthConfigFailed = false;
      if (isOauth2Platform) {
        try {
          const doSaveOauthConfig =
            saveOauthConfig ?? apiSystemConnectorOauthConfigSave;
          const oauthResponse = await doSaveOauthConfig(
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
      message.success(successMessage ?? '连接器创建成功');
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
  }, [
    form,
    onClose,
    onCreated,
    createProvider,
    saveOauthConfig,
    successMessage,
    servicePrefix,
  ]);

  return (
    <Drawer
      className={styles.drawer}
      title="新增连接器"
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
            label={
              servicePrefix
                ? `SERVICE（创建后自动加 ${servicePrefix.toUpperCase()} 前缀，如 ${servicePrefix.toUpperCase()}GITHUB）`
                : 'SERVICE（唯一标识，创建后不可改）'
            }
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
              maxLength={100}
              showCount
              allowClear
              onBlur={handleServiceBlur}
            />
          </Form.Item>
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input
              placeholder="目录卡片展示名称"
              maxLength={100}
              showCount
              allowClear
            />
          </Form.Item>
          {/* 图标：点击上传连接器图标（jpg/png/svg、<2M，样式对齐推荐位新增弹窗），
              上传成功即回显并写入隐藏字段 icon，随表单一起提交 */}
          <Form.Item label="图标（可选）">
            <UploadAvatar
              imageUrl={iconDisplaySrc}
              onUploadSuccess={(url) => form.setFieldValue('icon', url)}
              svgIconName="icons-nav-connector"
            />
          </Form.Item>
          <Form.Item name="icon" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述（可选）">
            <Input.TextArea
              rows={3}
              placeholder="连接器介绍，展示在目录卡片"
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="baseUrl"
            label="BASE URL"
            rules={[{ required: true, message: '请输入 BASE URL' }]}
          >
            <Input
              placeholder="https://api.example.com"
              maxLength={100}
              showCount
              allowClear
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              {/* 不加 required：与设计稿一致，认证方式不显示红星（默认免鉴权） */}
              <Form.Item name="authType" label="认证方式">
                <Select options={authTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* 分类：已发布分类接口 Connector.children 字典中选择，
                  打开抽屉时默认选中第一个（见上方拉取 effect） */}
              <Form.Item name="category" label="分类">
                <Select
                  options={categoryOptions}
                  loading={categoryLoading}
                  placeholder="请选择分类"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签（逗号分隔）">
            <Input
              placeholder="如 github,dev"
              maxLength={100}
              showCount
              allowClear
            />
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
