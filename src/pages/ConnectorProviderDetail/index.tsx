import Loading from '@/components/custom/Loading';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import ConnectorConnectDrawer from '@/pages/SpaceResource/Connector/components/ConnectorConnectDrawer';
import ConnectorActionCreateModal from '@/pages/SystemManagement/ConnectorManage/components/ConnectorActionCreateModal';
import ConnectorActionDebugModal from '@/pages/SystemManagement/ConnectorManage/components/ConnectorActionDebugModal';
import { AUTH_TYPE_LABEL_MAP } from '@/pages/SystemManagement/ConnectorManage/constants';
import {
  apiConnectorActionCreate,
  apiConnectorActionDelete,
  apiConnectorActionToggleStatus,
  apiConnectorActionUpdate,
  apiConnectorConnectionDelete,
  apiConnectorOauthAuthorize,
  apiSystemConnectorActionDelete,
  apiSystemConnectorActionToggleStatus,
  apiSystemConnectorProviderDetail,
} from '@/services/systemManage';
import type {
  ConnectorAuthConfigField,
  ConnectorProviderAction,
  ConnectorProviderDetail,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import {
  Button,
  Empty,
  message,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation, useSearchParams } from 'umi';
import styles from './index.less';

/**
 * 连接器详情子页面（管理侧 / 空间侧共用）
 *
 * 路由：
 *   - 管理侧：/system/connector-manage/detail?service=xxx
 *   - 空间侧：/space/:spaceId/connector/detail?service=xxx&spaceId=xxx
 *   （按路径前缀区分 scope：/system/ 开走管理端工具接口，其余走空间维度接口）
 *
 * 数据源：GET /api/connector/providers/{service}?spaceId=xxx&includeDisabled=true
 *
 * 页面结构：
 *   1. 顶部概览（认证方式 / BASE URL / 通用代理 / 连接状态）：
 *      连接状态取代原抽屉的「归属」展示；空间侧未连接时在状态后展示
 *      「去连接」（oauth2 →「发起OAuth授权」），免鉴权（no_auth）不展示；
 *      已连接时状态后展示「断开连接」（Popconfirm 二次确认后
 *      DELETE /api/connector/connections/{id}，管理侧 / 空间侧均展示）
 *   2. 工具栏（「+ 添加工具」打开 ConnectorActionCreateModal 新增/编辑工具弹窗）
 *   3. 工具列表（表格呈现：工具名称 / ACTIONKEY / 工具说明 / 状态 / 接口 / 操作）
 *
 * 工具的「编辑」复用 ConnectorActionCreateModal（编辑模式，传 editAction
 * 回填详情接口返回的该条 action 定义，ACTIONKEY 禁改）。
 * 工具的 停用/启用 走乐观更新（管理端 PUT /api/system/connector/actions/{id}/status，
 * 空间侧 POST /api/connector/actions/{id}/status），失败回滚；
 * 工具的 删除 走 Popconfirm 二次确认（管理端 DELETE /api/system/connector/actions/{id}，
 * 空间侧 DELETE /api/connector/actions/{id}）。
 *
 * 「发起OAuth授权」（oauth2）：GET /api/connector/oauth/authorize 拿授权地址后
 * window.open 新窗口打开（IdP 授权页带 X-Frame-Options 拒绝 iframe 嵌入），
 * 轮询弹窗 closed 后刷新详情（connected 变 true 按钮自动消失）。
 */

/**
 * 「去连接」点击上下文（凭据抽屉用它渲染表单并回调刷新）
 * 与原详情抽屉导出的 ConnectorGoConnectContext 同构
 */
interface GoConnectContext {
  /** 当前连接器（详情接口返回的 provider） */
  record: ConnectorProviderInfo | null;
  /** 最新详情（凭证字段定义在 provider.authConfig.fields 里） */
  detail: ConnectorProviderDetail | null;
  /** 连接成功后调用：刷新详情（connected 变 true、按钮消失） */
  refresh: () => void;
}

const ConnectorProviderDetailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();

  /** 路径参数：service（接口寻址）、spaceId（空间维度接口 query） */
  const service = searchParams.get('service') || '';
  const spaceIdParam = Number(searchParams.get('spaceId'));
  const spaceId =
    Number.isFinite(spaceIdParam) && spaceIdParam > 0
      ? spaceIdParam
      : undefined;

  /** scope：管理侧（/system/ 前缀）走管理端工具接口，空间侧走空间维度接口 */
  const isSpaceScope = !location.pathname.startsWith('/system/');

  // 详情加载中
  const [loading, setLoading] = useState<boolean>(false);
  // 详情
  const [detail, setDetail] = useState<ConnectorProviderDetail | null>(null);
  /**
   * 正在切换状态的工具 id 集合（给行内按钮加 loading 态，防止重复点击；
   * 用 id 作 key 与后端寻址字段一致）
   */
  const [togglingActionIds, setTogglingActionIds] = useState<
    Set<string | number>
  >(() => new Set());
  /** 正在删除的工具 id 集合（给 Popconfirm 的「确定」加 loading） */
  const [deletingActionIds, setDeletingActionIds] = useState<
    Set<string | number>
  >(() => new Set());
  /** 「新增/编辑工具」弹窗开关 + 编辑模式回填的工具定义（null = 新增模式） */
  const [actionModalOpen, setActionModalOpen] = useState<boolean>(false);
  const [editingAction, setEditingAction] =
    useState<ConnectorProviderAction | null>(null);
  /** 「工具调试」弹窗开关 + 所点工具（做弹窗默认选中；null = 未从工具行进入） */
  const [debugModalOpen, setDebugModalOpen] = useState<boolean>(false);
  const [debuggingAction, setDebuggingAction] =
    useState<ConnectorProviderAction | null>(null);
  /** 「去连接」凭据抽屉上下文（api_key/bearer/custom；null = 关闭） */
  const [connectCtx, setConnectCtx] = useState<GoConnectContext | null>(null);
  /** 「发起OAuth授权」：授权地址请求中（按钮 loading） */
  const [oauthOpening, setOauthOpening] = useState<boolean>(false);
  /** 「断开连接」请求中（给按钮与 Popconfirm 确定键加 loading，防重复点击） */
  const [disconnecting, setDisconnecting] = useState<boolean>(false);
  /** 授权弹窗引用：重复点击时聚焦已有弹窗；轮询其 closed 判断授权流程结束 */
  const oauthWinRef = useRef<Window | null>(null);
  /** 授权弹窗关闭轮询定时器（组件卸载时清理） */
  const oauthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 页面标题：详情 displayName 优先，回退 service */
  const title = useMemo(
    () => detail?.provider?.displayName || service || '',
    [detail, service],
  );

  /** 工具启停/删除接口：空间侧传空间维度实现，管理侧走管理端默认 */
  const doToggleActionStatus = isSpaceScope
    ? apiConnectorActionToggleStatus
    : apiSystemConnectorActionToggleStatus;
  const doDeleteAction = isSpaceScope
    ? apiConnectorActionDelete
    : apiSystemConnectorActionDelete;

  /**
   * 获取详情
   * 返回最新详情（而非 void）：授权弹窗关闭后调用方要据此提示连接结果
   */
  const fetchDetail =
    useCallback(async (): Promise<ConnectorProviderDetail | null> => {
      if (!service) return null;
      try {
        setLoading(true);
        const response = await apiSystemConnectorProviderDetail({
          service,
          spaceId,
          // 页面需要展示已停用工具的「停用」状态 + 「启用」按钮，因此 includeDisabled=true
          includeDisabled: true,
        });
        if (response?.code === SUCCESS_CODE) {
          const latest = response.data ?? null;
          setDetail(latest);
          return latest;
        }
        setDetail(null);
        return null;
      } catch {
        setDetail(null);
        return null;
      } finally {
        setLoading(false);
      }
    }, [service, spaceId]);

  // 页面打开：拉取详情（service 变化时也会重新拉取）
  useEffect(() => {
    if (service) {
      setDetail(null);
      fetchDetail();
    }
  }, [service, fetchDetail]);

  // 组件卸载时清理授权弹窗轮询定时器（防止泄漏与卸载后更新 state）
  useEffect(() => {
    return () => {
      if (oauthPollRef.current) {
        clearInterval(oauthPollRef.current);
        oauthPollRef.current = null;
      }
    };
  }, []);

  /**
   * 切换单个工具的启用状态
   * - 乐观更新：先在本地把 status 翻转，失败回滚
   * - 成功后再静默拉一次详情，以服务端最新 status 为权威源
   * - 用 id 寻址；id 缺失时直接报错并拒绝执行
   */
  const handleToggleAction = useCallback(
    async (action: ConnectorProviderAction) => {
      if (action.id === undefined || action.id === null || action.id === '') {
        message.error('工具 id 缺失，无法切换状态');
        return;
      }
      const idKey = action.id;
      if (togglingActionIds.has(idKey)) {
        return;
      }

      const isEnabled = action.status === 'enabled';
      const nextEnabled = !isEnabled;
      const previousStatus = action.status;

      setTogglingActionIds((prev) => {
        const next = new Set(prev);
        next.add(idKey);
        return next;
      });

      // 乐观更新：本地立刻翻转状态
      setDetail((prev) => {
        if (!prev?.actions) return prev;
        return {
          ...prev,
          actions: prev.actions.map((a) =>
            a.id === idKey
              ? { ...a, status: nextEnabled ? 'enabled' : 'disabled' }
              : a,
          ),
        };
      });

      try {
        const response = await doToggleActionStatus({
          id: idKey,
          enabled: nextEnabled,
        });
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'toggle failed');
        }
        message.success(nextEnabled ? '已启用该工具' : '已停用该工具');
        // 静默刷新详情：失败也不影响用户已看到的乐观结果
        try {
          const refreshResponse = await apiSystemConnectorProviderDetail({
            service,
            spaceId,
            includeDisabled: true,
          });
          if (refreshResponse?.code === SUCCESS_CODE) {
            setDetail(refreshResponse.data ?? null);
          }
        } catch {
          /* 静默忽略：乐观更新已生效，详情刷新只是兜底 */
        }
      } catch {
        // 回滚到原状态
        setDetail((prev) => {
          if (!prev?.actions) return prev;
          return {
            ...prev,
            actions: prev.actions.map((a) =>
              a.id === idKey ? { ...a, status: previousStatus } : a,
            ),
          };
        });
        message.error(nextEnabled ? '启用工具失败' : '停用工具失败');
      } finally {
        setTogglingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(idKey);
          return next;
        });
      }
    },
    [togglingActionIds, service, spaceId, doToggleActionStatus],
  );

  /**
   * 删除单个工具（Popconfirm 的「确定」触发，UI 层已二次确认）
   * 接口成功后从本地列表里直接移除该项，无需重新拉详情
   */
  const handleDeleteAction = useCallback(
    async (action: ConnectorProviderAction) => {
      if (action.id === undefined || action.id === null || action.id === '') {
        message.error('工具 id 缺失，无法删除');
        return;
      }
      const idKey = action.id;
      if (deletingActionIds.has(idKey)) {
        return;
      }

      setDeletingActionIds((prev) => {
        const next = new Set(prev);
        next.add(idKey);
        return next;
      });

      try {
        const response = await doDeleteAction({ id: idKey });
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'delete failed');
        }
        setDetail((prev) => {
          if (!prev?.actions) return prev;
          return {
            ...prev,
            actions: prev.actions.filter((a) => a.id !== idKey),
          };
        });
        message.success('已删除该工具');
      } catch {
        message.error('删除工具失败');
      } finally {
        setDeletingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(idKey);
          return next;
        });
      }
    },
    [deletingActionIds, doDeleteAction],
  );

  /** 新增/编辑工具成功：重新拉取详情刷新工具表格（列表页返回时会自行重拉） */
  const handleActionCreated = useCallback(() => {
    fetchDetail();
  }, [fetchDetail]);

  /**
   * 发起 OAuth 授权（「发起OAuth授权」按钮，认证方式 oauth2，空间侧）
   * GET /api/connector/oauth/authorize 拿地址 → window.open 新窗口 →
   * 轮询 closed → 刷新详情（connected 变 true 时按钮消失并提示「连接成功」）
   */
  const handleOauthAuthorize = useCallback(async () => {
    if (!service) {
      message.error('连接器 service 缺失，无法发起授权');
      return;
    }
    // 已有授权弹窗在打开：聚焦既有弹窗即可，不重复发起
    if (oauthWinRef.current && !oauthWinRef.current.closed) {
      oauthWinRef.current.focus();
      return;
    }
    try {
      setOauthOpening(true);
      const response = await apiConnectorOauthAuthorize({
        service,
        spaceId,
      });
      if (response?.code !== SUCCESS_CODE || !response.data?.authorizeUrl) {
        message.error(response?.message || '获取授权地址失败');
        return;
      }
      // 保持 window 引用（不加 noopener），后续要轮询它的 closed 状态
      const win = window.open(response.data.authorizeUrl, '_blank');
      if (!win) {
        message.warning('授权窗口被浏览器拦截，请允许弹窗后重试');
        return;
      }
      oauthWinRef.current = win;
      win.focus();
      oauthPollRef.current = setInterval(() => {
        if (oauthWinRef.current?.closed) {
          if (oauthPollRef.current) {
            clearInterval(oauthPollRef.current);
            oauthPollRef.current = null;
          }
          oauthWinRef.current = null;
          // 弹窗关闭即刷新详情：授权成功则 connected=true、按钮消失
          void fetchDetail().then((latest) => {
            if (latest?.provider?.connected) {
              message.success('连接成功');
            }
          });
        }
      }, 500);
    } finally {
      setOauthOpening(false);
    }
  }, [service, spaceId, fetchDetail]);

  /**
   * 「去连接」抽屉的凭证字段定义（优先详情接口）：
   * - 自定义认证：authConfig.fields 数组直接驱动（如 clientId / apiKey）
   * - API Key 认证：authConfig 无 fields，按 keyName 生成单个凭证字段
   * - Bearer 认证：fields 缺失时兜底生成 token 字段（提交键 token）
   */
  const connectFields = useMemo(() => {
    const source = connectCtx?.detail?.provider ?? connectCtx?.record ?? null;
    const authType = source?.authType;
    const authConfig = source?.authConfig as
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(authConfig?.fields)) {
      return authConfig.fields as ConnectorAuthConfigField[];
    }
    if (authType === 'api_key') {
      const keyName =
        typeof authConfig?.keyName === 'string' && authConfig.keyName
          ? authConfig.keyName
          : 'apiKey';
      return [
        {
          name: keyName,
          label: keyName,
          placeholder: '粘贴 API Key',
          secret: true,
        },
      ];
    }
    if (authType === 'bearer') {
      return [
        {
          name: 'token',
          label: 'token',
          placeholder: '粘贴 Token',
          secret: true,
        },
      ];
    }
    return [];
  }, [connectCtx]);

  // ---------------- 概览字段（详情接口 provider 为权威源） ----------------
  const provider = detail?.provider ?? null;
  const authTypeValue = provider?.authType;
  const authLabel =
    (authTypeValue && AUTH_TYPE_LABEL_MAP[authTypeValue]) ??
    authTypeValue ??
    '-';
  const baseUrl = provider?.baseUrl ?? '-';
  const proxyLabel = provider?.proxyEnabled ?? false ? '已开启' : '未开启';
  const connected = provider?.connected ?? false;

  /**
   * 概览「连接状态」后的连接按钮（仅空间侧）：
   * - oauth2 →「发起OAuth授权」（页面内部打开授权窗口并监听关闭）
   * - api_key/bearer/custom →「去连接」（打开凭据抽屉）
   * - no_auth（免鉴权）→ 不展示；管理侧不展示（连接是空间用户动作）
   */
  const connectButtonText =
    isSpaceScope && authTypeValue && authTypeValue !== 'no_auth'
      ? authTypeValue === 'oauth2'
        ? '发起OAuth授权'
        : '去连接'
      : null;

  const handleConnectClick = () => {
    if (authTypeValue === 'oauth2') {
      void handleOauthAuthorize();
      return;
    }
    // 携带 record/detail/refresh：凭据抽屉用 authConfig.fields 渲染表单，
    // 连接成功后调 refresh 刷新本页（connected 变 true、按钮消失）
    setConnectCtx({
      record: provider,
      detail,
      refresh: () => void fetchDetail(),
    });
  };

  /**
   * 断开连接（「已连接」后的「断开连接」按钮，Popconfirm 二次确认后触发；
   * 管理侧 / 空间侧均展示）
   * DELETE /api/connector/connections/{id}，id 取详情响应的 provider.id，
   * 成功后刷新详情（connected 变 false、按钮消失，空间侧随之出现「去连接」）。
   * 业务/网络错误由全局 errorHandler 统一提示后端报错，此处不重复弹错，
   * 且不能在 onConfirm 里抛错（会同 Modal.confirm 一样被 antd 转成
   * Unhandled Rejection 导致页面崩溃），catch 全部静默吞掉
   */
  const handleDisconnect = useCallback(async () => {
    const connectionId = provider?.id;
    if (connectionId === undefined || connectionId === null) {
      message.error('连接 id 缺失，无法断开连接');
      return;
    }
    if (disconnecting) return;
    try {
      setDisconnecting(true);
      const response = await apiConnectorConnectionDelete(connectionId);
      if (response?.code === SUCCESS_CODE) {
        message.success('已断开连接');
        await fetchDetail();
      }
      // 非成功码理论上会被全局拦截器 reject，不会 resolve 到这里
    } catch {
      // 业务/网络错误：全局 errorHandler 已提示后端报错，此处不再重复弹错
    } finally {
      setDisconnecting(false);
    }
  }, [provider, disconnecting, fetchDetail]);

  // ---------------- 工具表格列 ----------------
  const toolColumns: ColumnsType<ConnectorProviderAction> = [
    {
      title: '工具名称',
      dataIndex: 'name',
      width: 220,
      render: (_, action) => (
        <span style={{ fontWeight: 500 }}>{action.name}</span>
      ),
    },
    {
      title: 'ACTIONKEY',
      dataIndex: 'actionKey',
      width: 150,
      render: (_, action) => (
        <code style={{ fontSize: 12 }}>{action.actionKey ?? '-'}</code>
      ),
    },
    {
      title: '工具说明',
      dataIndex: 'description',
      ellipsis: true,
      render: (_, action) => action.description || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      align: 'center',
      render: (_, action) => (
        <Tag color={action.status === 'enabled' ? 'green' : 'default'}>
          {action.status === 'enabled' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '接口',
      dataIndex: 'protocol',
      width: 90,
      align: 'center',
      render: (_, action) => (action.protocol || 'HTTP').toUpperCase(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 250,
      align: 'center',
      fixed: 'right',
      render: (_, action) => {
        const isEnabled = action.status === 'enabled';
        const toggling = togglingActionIds.has(action.id as string | number);
        const deleting = deletingActionIds.has(action.id as string | number);
        return (
          <Space size={12} className="connector-row-actions">
            {/* 调试：已停用的工具不可调试，置灰禁用 */}
            {isEnabled ? (
              <a
                onClick={() => {
                  setDebuggingAction(action);
                  setDebugModalOpen(true);
                }}
              >
                调试
              </a>
            ) : (
              <span className={styles.actionDisabled}>调试</span>
            )}
            {/* 编辑：复用「新增工具」弹窗回填当前工具定义（编辑模式） */}
            <a
              onClick={() => {
                setEditingAction(action);
                setActionModalOpen(true);
              }}
            >
              编辑
            </a>
            {toggling ? (
              <span
                className={styles.actionLoading}
                style={{ color: isEnabled ? '#ff4d4f' : '#1890ff' }}
              >
                <Spin size="small" />
                <span>{isEnabled ? '停用中…' : '启用中…'}</span>
              </span>
            ) : (
              <a
                onClick={() => handleToggleAction(action)}
                style={{ color: isEnabled ? '#ff4d4f' : '#1890ff' }}
              >
                {isEnabled ? '停用' : '启用'}
              </a>
            )}
            {/* 删除：Popconfirm 二次确认，请求飞行中「确定」置 loading */}
            <Popconfirm
              title="确认删除该工具？"
              okText="确认删除"
              cancelText="取消"
              okButtonProps={{ danger: true, loading: deleting }}
              onConfirm={() => handleDeleteAction(action)}
            >
              <a style={{ color: '#ff4d4f' }}>删除</a>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <WorkspaceLayout title={title} back hideScroll>
      <div className={styles.page}>
        {!service ? (
          <div className={styles.emptyWrap}>
            <Empty description="缺少 service 参数" />
          </div>
        ) : loading ? (
          <Loading className="h-full" />
        ) : !detail ? (
          <div className={styles.emptyWrap}>
            <Empty description="暂无数据" />
          </div>
        ) : (
          <>
            {/* 顶部概览（label / value 两列网格） */}
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>认证方式</span>
                <span className={styles.infoValue}>{authLabel}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>BASE URL</span>
                <span className={styles.infoValue}>{baseUrl}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>通用代理</span>
                <span className={styles.infoValue}>{proxyLabel}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>连接状态</span>
                <span className={`${styles.infoValue} ${styles.connectValue}`}>
                  {connected ? (
                    <>
                      <span className={styles.connectedText}>已连接</span>
                      {/* 断开连接：Popconfirm 二次确认（交互同工具删除），
                          管理侧 / 空间侧均展示；成功后 connected 变 false、
                          按钮消失（空间侧随之出现「去连接」） */}
                      <Popconfirm
                        title="确认断开该连接？"
                        okText="确认断开"
                        cancelText="取消"
                        okButtonProps={{ danger: true, loading: disconnecting }}
                        onConfirm={handleDisconnect}
                      >
                        <Button
                          size="small"
                          danger
                          className={styles.disconnectBtn}
                          loading={disconnecting}
                        >
                          断开连接
                        </Button>
                      </Popconfirm>
                    </>
                  ) : (
                    <>
                      <span className={styles.disconnectedText}>未连接</span>
                      {connectButtonText ? (
                        <Button
                          type="primary"
                          size="small"
                          className={styles.goConnectBtn}
                          loading={oauthOpening}
                          onClick={handleConnectClick}
                        >
                          {connectButtonText}
                        </Button>
                      ) : null}
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* 工具栏：工具列表标题 + 「+ 添加工具」 */}
            <div className={styles.toolbar}>
              <div className={styles.toolSectionTitle}>工具列表</div>
              <Button
                type="primary"
                onClick={() => {
                  // 新增模式：清空编辑态再打开，确保表单空白
                  setEditingAction(null);
                  setActionModalOpen(true);
                }}
              >
                + 添加工具
              </Button>
            </div>

            {/* 工具列表（表格呈现） */}
            <Table<ConnectorProviderAction>
              rowKey={(action) => String(action.id ?? action.name)}
              columns={toolColumns}
              dataSource={detail.actions ?? []}
              pagination={false}
              scroll={{ x: 900 }}
            />
          </>
        )}
      </div>

      {/* 新增/编辑工具弹窗（编辑模式传 editingAction 回填；
          空间侧传空间维度创建/更新接口，管理侧走弹窗内管理端默认） */}
      <ConnectorActionCreateModal
        open={actionModalOpen}
        record={provider}
        editAction={editingAction}
        onClose={() => setActionModalOpen(false)}
        onCreated={handleActionCreated}
        {...(isSpaceScope
          ? {
              createAction: apiConnectorActionCreate,
              updateAction: apiConnectorActionUpdate,
            }
          : {})}
      />

      {/* 工具调试弹窗（打开时默认选中当前连接器 + 所点工具的 actionKey） */}
      <ConnectorActionDebugModal
        open={debugModalOpen}
        spaceId={spaceId}
        defaultService={service || undefined}
        defaultActionKey={
          debuggingAction
            ? String(debuggingAction.actionKey ?? debuggingAction.name)
            : undefined
        }
        onClose={() => setDebugModalOpen(false)}
      />

      {/* 去连接凭据抽屉（认证方式 custom/api_key/bearer）：凭证字段按
          authConfig.fields 动态渲染，提交 POST /api/connector/connections/api-key；
          连接成功后刷新本页（connected 变 true、按钮消失） */}
      <ConnectorConnectDrawer
        open={connectCtx !== null}
        record={connectCtx?.record ?? null}
        fields={connectFields}
        spaceId={spaceId}
        onClose={() => setConnectCtx(null)}
        onConnected={() => {
          connectCtx?.refresh();
          fetchDetail();
        }}
      />
    </WorkspaceLayout>
  );
};

export default ConnectorProviderDetailPage;
