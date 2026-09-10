import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import ConnectorAuthConfigSection, {
  type ConnectorProviderSubmitValues,
  type InjectionLocation,
  toConnectorOauthConfigParams,
  toConnectorProviderPayload,
} from '@/pages/SystemManagement/ConnectorManage/components/ConnectorAuthConfigSection';
import { AUTH_TYPE_OPTIONS } from '@/pages/SystemManagement/ConnectorManage/constants';
import useConnectorCategoryOptions from '@/pages/SystemManagement/ConnectorManage/hooks/useConnectorCategoryOptions';
import {
  apiSystemConnectorOauthConfigGet,
  apiSystemConnectorOauthConfigSave,
  apiSystemConnectorProviderDetail,
  apiSystemConnectorProviderUpdateMeta,
} from '@/services/systemManage';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  ConnectorProviderInfo,
  CreateConnectorProviderParams,
  SaveConnectorOauthConfigParams,
} from '@/types/interfaces/systemManage';
import { Button, Col, Drawer, Form, Input, Row, Select, message } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

export interface ConnectorProviderEditDrawerProps {
  open: boolean;
  record: ConnectorProviderInfo | null;
  onClose: () => void;
  /** 保存成功回调（父组件刷新连接器列表并打开详情抽屉） */
  onSaved?: (payload: CreateConnectorProviderParams) => void;
  /**
   * 自定义元信息更新接口：body/返回与管理端
   * PUT /api/system/connector/providers/{service}/meta 一致。
   * 工作空间连接器页传 space 维度接口
   * （PUT /api/connector/providers/{service}），不传走管理端默认。
   */
  updateProviderMeta?: (
    payload: CreateConnectorProviderParams,
  ) => Promise<RequestResponse<null>>;
  /**
   * 自定义 OAuth App 配置保存接口：入参/返回与管理端
   * POST /api/system/connector/oauth-config 一致。
   * 工作空间连接器页传 space 维度接口
   * （POST /api/connector/oauth/shared-config），不传走管理端默认。
   * 认证方式为 oauth2 时在 meta 保存成功后追加调用。
   */
  saveOauthConfig?: (
    params: SaveConnectorOauthConfigParams,
  ) => Promise<RequestResponse<null>>;
  /**
   * 详情拉取用的空间 ID：工作空间连接器页传当前选中空间。
   * 不传时与管理端一致：record.spaceId → 52 兜底。
   */
  spaceId?: number;
}

const pickString = (
  source: Record<string, unknown> | undefined,
  keys: string[],
  fallback = '',
) => {
  for (const key of keys) {
    const value = source?.[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return fallback;
};

/**
 * 自定义认证的注入规则项（authConfig.inject 数组元素：{ from, to }，
 * to 为 "位置:名称" 拼接串，如 header:x-api-key）
 */
interface StoredInjectRule {
  from?: string;
  to?: string;
}

/** to = "位置:名称" → 注入规则表单行（位置非法时回退 header） */
const toInjectRuleRow = (rule: StoredInjectRule) => {
  const [location, ...rest] = String(rule?.to ?? '').split(':');
  return {
    field: rule?.from ?? '',
    location: (location === 'query' ? 'query' : 'header') as InjectionLocation,
    targetName: rest.join(':'),
  };
};

const toFormValues = (
  source: ConnectorProviderInfo | null,
): ConnectorProviderSubmitValues => {
  const authConfig = (source as any)?.authConfig as
    | Record<string, unknown>
    | undefined;
  const injectionLocation = pickString(
    authConfig,
    // injectTo 为后端真实键（创建接口 api_key 参考传参），其余为历史兼容候选
    ['injectTo', 'injectionLocation', 'injectLocation', 'location', 'type'],
    'header',
  ) as InjectionLocation;
  const authType = source?.authType;

  const values: ConnectorProviderSubmitValues = {
    service: source?.service || '',
    displayName: source?.displayName || '',
    description: source?.description || '',
    // 图标回填：详情接口 provider.icon（无图标时为空串 → 显示占位 svg）
    icon: source?.icon || '',
    baseUrl: source?.baseUrl || '',
    authType,
    category: source?.category || '',
    tags: Array.isArray(source?.tags) ? source?.tags?.join(', ') : '',
    credentialFieldName: pickString(authConfig, [
      'credentialFieldName',
      'fieldName',
      'credentialName',
      'paramName',
      'keyName',
    ]),
    injectionLocation: injectionLocation === 'query' ? 'query' : 'header',
    requestHeaderName: pickString(authConfig, [
      'requestHeaderName',
      'headerName',
      'header',
      'headerKey',
    ]),
    valuePrefix: pickString(authConfig, ['valuePrefix', 'prefix']),
  };

  // 自定义认证：fields / inject → 两组动态行；无数据时预置一行空行（与新增抽屉一致）
  if (authType === 'custom') {
    const fields = Array.isArray(authConfig?.fields)
      ? (authConfig.fields as Array<{
          name?: string;
          label?: string;
          secret?: boolean;
        }>)
      : [];
    values.customCredentialFields = fields.length
      ? fields.map((field) => ({
          name: field?.name ?? '',
          label: field?.label ?? '',
          secret: field?.secret !== false,
        }))
      : [{ name: '', label: '', secret: true }];
    const inject = Array.isArray(authConfig?.inject)
      ? (authConfig.inject as StoredInjectRule[])
      : [];
    values.customInjectRules = inject.length
      ? inject.map(toInjectRuleRow)
      : [{ field: '', location: 'header', targetName: '' }];
  }

  // OAuth 2.0：模式回填顶层 oauthAppMode；App 配置回填非密文项
  // （clientSecret 加密落库不回显；platform 的 App 配置若后端未随详情返回则留空）
  if (authType === 'oauth2') {
    values.oauthAppMode = source?.oauthAppMode === 'byo' ? 'byo' : 'platform';
    values.oauthClientId = pickString(authConfig, ['clientId']);
    values.oauthAuthUrl = pickString(authConfig, ['authUrl']);
    values.oauthTokenUrl = pickString(authConfig, ['tokenUrl']);
    const scopes = Array.isArray(authConfig?.scopes)
      ? (authConfig.scopes as unknown[]).filter(
          (scope): scope is string => typeof scope === 'string',
        )
      : [];
    values.oauthScopes = scopes.join(' ');
  }

  return values;
};

const ConnectorProviderEditDrawer: React.FC<
  ConnectorProviderEditDrawerProps
> = ({
  open,
  record,
  onClose,
  onSaved,
  updateProviderMeta,
  saveOauthConfig,
  spaceId,
}) => {
  const [form] = Form.useForm<ConnectorProviderSubmitValues>();
  // 保存中：给「保存修改」按钮加 loading，防止重复提交
  const [submitting, setSubmitting] = useState<boolean>(false);
  /** 图标 URL（回填 provider.icon；重新上传后覆盖隐藏表单字段 icon） */
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
   * 与新增抽屉共用 hook）。编辑模式回填已存 category 原值：
   * 历史自由文本值（不在字典 key 中）下拉会原样展示、保存不丢；
   * 不做「默认选中第一个」预选 —— 以存储值为准，避免保存时静默改分类
   */
  const { categoryOptions, categoryLoading } =
    useConnectorCategoryOptions(open);

  /**
   * 保存修改：
   * 1. 校验必填项 —— 失败时表单控件下方已有红字提示，静默返回
   * 2. PUT /api/system/connector/providers/{service}/meta（body 与新增接口
   *    一致，由共享函数 toConnectorProviderPayload 组装）
   * 3. 认证方式为 oauth2 时追加保存 App 配置：管理端默认
   *    POST /api/system/connector/oauth-config，空间侧注入
   *    saveOauthConfig（POST /api/connector/oauth/shared-config）；
   *    clientSecret 加密落库不回显，留空 = 保持已存密钥
   * 4. 成功后关闭抽屉并触发 onSaved —— 父组件刷新列表并打开详情抽屉
   */
  const handleSave = useCallback(async () => {
    const service = record?.service;
    if (!service) return;

    let values: ConnectorProviderSubmitValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    // service 创建后不可改，提交值以列表行/详情的 service 为准
    const payload = toConnectorProviderPayload({ ...values, service });
    /**
     * App 配置保存时机：认证方式为 oauth2 即保存（管理侧 / 空间侧一致，
     * 与新增连接器一致）—— clientId / 授权端点 / 令牌端点 / scopes 的修改
     * 不能因未重填 CLIENT SECRET 而丢失（secret 留空时后端保持已存密钥）
     */
    const shouldSaveOauthConfig = values.authType === 'oauth2';

    try {
      setSubmitting(true);
      // meta 更新接口可注入：管理端默认 PUT /api/system/connector/providers/{service}/meta，
      // 工作空间连接器页传 PUT /api/connector/providers/{service}
      const doUpdate =
        updateProviderMeta ?? apiSystemConnectorProviderUpdateMeta;
      const response = await doUpdate(payload);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error(response?.message || 'update provider failed');
      }
      // App 配置更新失败不回滚 meta —— 提示用户重试
      let oauthConfigFailed = false;
      if (shouldSaveOauthConfig) {
        try {
          // oauth 接口可注入：管理端默认 POST /api/system/connector/oauth-config，
          // 工作空间连接器页传 POST /api/connector/oauth/shared-config
          const doSaveOauthConfig =
            saveOauthConfig ?? apiSystemConnectorOauthConfigSave;
          const oauthResponse = await doSaveOauthConfig(
            toConnectorOauthConfigParams(values, service),
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
      message.success('连接器更新成功');
      if (oauthConfigFailed) {
        message.warning('OAuth App 配置保存失败，请重试');
      }
      onClose();
      onSaved?.(payload);
    } catch {
      message.error('保存修改失败');
    } finally {
      setSubmitting(false);
    }
  }, [form, record, onClose, onSaved, updateProviderMeta, saveOauthConfig]);

  useEffect(() => {
    let cancelled = false;

    const applyValues = (source: ConnectorProviderInfo) => {
      if (cancelled) return;
      form.setFieldsValue(toFormValues(source));
    };

    /**
     * oauth2：追加 GET /api/system/connector/oauth-config?service= 回填
     * 平台 App 配置（scopeType → 模式，clientId / authUrl / tokenUrl /
     * scopes → 表单项；clientSecret 不回明文，编辑留空 = 保持已存配置）
     */
    const applyOauthConfig = async (service: string) => {
      try {
        const response = await apiSystemConnectorOauthConfigGet({ service });
        if (cancelled) return;
        if (response?.code !== SUCCESS_CODE || !response.data) return;
        const config = response.data;
        form.setFieldsValue({
          oauthAppMode: config.scopeType === 'byo' ? 'byo' : 'platform',
          oauthClientId: config.clientId || '',
          oauthAuthUrl: config.authUrl || '',
          oauthTokenUrl: config.tokenUrl || '',
          oauthScopes: Array.isArray(config.scopes)
            ? config.scopes.join(' ')
            : '',
        });
      } catch {
        // oauth 配置拉取失败：保留 authConfig 的回填值，不阻塞编辑
      }
    };

    if (!open || !record) {
      form.resetFields();
      return () => {
        cancelled = true;
      };
    }

    form.resetFields();
    applyValues(record);

    (async () => {
      // 实际回填来源：详情成功取 provider，失败沿用列表行
      let applied: ConnectorProviderInfo = record;
      try {
        // 详情接口为 space 维度（GET /api/connector/providers/{service}）：
        // 优先用注入的 spaceId（空间页当前选中空间），
        // 其次 record.spaceId，均无效时兜底 52（管理端历史行为）
        const recordSpaceId = Number(record.spaceId);
        const detailSpaceId =
          spaceId ??
          (Number.isFinite(recordSpaceId) && recordSpaceId > 0
            ? recordSpaceId
            : 52);
        const response = await apiSystemConnectorProviderDetail({
          service: record.service,
          spaceId: detailSpaceId,
          includeDisabled: true,
        });
        if (cancelled) return;
        if (response?.code === SUCCESS_CODE && response.data) {
          // 详情响应为嵌套结构：提供方信息在 data.provider 下（data.actions
          // 为工具列表）；provider 缺失时沿用列表行回填值，避免被空值覆盖
          applied = response.data.provider ?? record;
          applyValues(applied);
        }
      } catch {
        // 详情拉取失败时继续沿用列表行回填值
      }
      // provider.authType = oauth2：再拉平台 App 配置回填认证配置表单
      // （放在详情回填之后，避免 setFieldsValue 相互覆盖）
      if (applied.authType === 'oauth2') {
        await applyOauthConfig(record.service);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, record, form, spaceId]);

  return (
    <Drawer
      className={styles.drawer}
      title="编辑连接器"
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
          preserve={false}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="service"
                label="SERVICE（唯一标识，创建后不可改）"
              >
                <Input disabled />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="displayName"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input
              placeholder="请输入显示名称"
              maxLength={100}
              showCount
              allowClear
            />
          </Form.Item>
          {/* 图标：点击上传连接器图标（jpg/png/svg、<2M，样式对齐推荐位新增弹窗）；
              回填已存图标，重新上传即覆盖隐藏字段 icon，随表单一起提交 */}
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
              placeholder="请输入 BASE URL"
              maxLength={100}
              showCount
              allowClear
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="authType" label="认证方式">
                <Select options={authTypeOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              {/* 分类：已发布分类接口 Connector.children 字典中选择（与新增
                  抽屉同款）；存量自由文本值不在字典中时原样展示、保存不丢 */}
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
              placeholder="请输入标签"
              maxLength={100}
              showCount
              allowClear
            />
          </Form.Item>

          {/* 认证配置区：按认证方式切换展示（与新增抽屉共用组件，行为保持一致；
              editMode：CLIENT SECRET 不强制重填） */}
          <ConnectorAuthConfigSection form={form} editMode />

          <Button
            type="primary"
            block
            className={styles.submitButton}
            loading={submitting}
            onClick={handleSave}
          >
            保存修改
          </Button>
        </Form>
      </div>
    </Drawer>
  );
};

export default memo(ConnectorProviderEditDrawer);
