import {
  TableActions,
  XProTable,
  type ActionItem,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import ConnectorProviderCreateDrawer from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderCreateDrawer';
import ConnectorProviderDetailDrawer from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderDetailDrawer';
import ConnectorProviderEditDrawer from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderEditDrawer';
import {
  AUTH_TYPE_COLOR_MAP,
  AUTH_TYPE_LABEL_MAP,
  AUTH_TYPE_OPTIONS,
  CONNECTED_OPTIONS,
  STATUS_OPTIONS,
} from '@/pages/SystemManagement/ConnectorManage/constants';
import {
  apiConnectorOauthSharedConfigSave,
  apiConnectorProviderCreate,
  apiConnectorProviderDelete,
  apiConnectorProviderExport,
  apiConnectorProviderPageList,
  apiConnectorProviderToggleStatus,
  apiConnectorProviderUpdateMeta,
} from '@/services/systemManage';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Empty, message, Modal, Space, Tag } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import { useParams } from 'umi';
import ConnectorImportDrawer from './components/ConnectorImportDrawer';
import styles from './index.less';

/**
 * 工作空间连接器页面
 * 路由：/space/:spaceId/connector
 *
 * 数据流：
 *   1. 空间由路由 /space/:spaceId/connector 提供（左侧导航「空间筛选」切换
 *      空间即切换路由参数），页面不再自带空间下拉框
 *   2. 按路由空间 + 筛选条件调
 *      GET /api/connector/providers?spaceId=&scope=space&status=&connected=&keyword=&pageNum=1&pageSize=500
 *
 * 视觉：与管理端 /system/content/official-connector 相同的表格列表呈现
 * （LightFilter 筛选 + XProTable，对齐菜单管理），差异：无勾选列、无拖拽排序列；
 * 「认证方式」为前端本地筛选（接口不支持 authType 参数）；
 * 连接器名称搜索走 LightFilter（点击展开输入框），筛选行右侧带 重置/查询 按钮。
 * 「导入」走 ConnectorImportDrawer（预览 diff + 确认导入，接口 space 维度）；
 * 行内「删除」二次确认后调 DELETE /api/connector/providers/{service}；
 * 行内「导出」调 POST /api/connector/export?service=&spaceId=，
 * 下载文件名 {service}.connector.json；
 * 行内「停用/启用」调 POST /api/connector/providers/{service}/status?enabled=；
 * 「新增连接器」复用管理端 ConnectorProviderCreateDrawer（展示/交互一致），
 * 提交走 POST /api/connector/providers（body 带当前空间 spaceId，必填），
 * service 失焦自动补 s_ 前缀；
 * 行内「编辑」复用管理端 ConnectorProviderEditDrawer，
 * meta 更新走 PUT /api/connector/providers/{service}，
 * oauth2+platform 的 App 配置保存走 POST /api/connector/oauth/shared-config；
 * 行内「查看」原地打开右侧 ConnectorProviderDetailDrawer 详情抽屉
 * （概览含连接状态 + 工具列表表格 + 去连接/OAuth 授权流程，不跳路由保住筛选态）。
 */

/** 检查导出数据是否为空（数组看长度、对象看 key 数、字符串看 trim 后长度） */
const isExportDataEmpty = (data: unknown): boolean => {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object') return Object.keys(data as object).length === 0;
  if (typeof data === 'string') return data.trim() === '';
  return false;
};

/**
 * 触发浏览器下载：将服务端返回的 JSON 中 data 字段导出为 .json 文件。
 * 约定（与管理端导出一致）：导出接口以 blob 接收，始终返回 JSON 格式
 * （RequestResponse 包装），data 字段即导出内容。
 */
const triggerJsonDownload = async (
  response: any,
  filename: string,
): Promise<boolean> => {
  let json: any;
  try {
    const text = await (response?.data as Blob).text();
    json = JSON.parse(text);
  } catch {
    message.error('导出失败：响应不是有效的 JSON');
    return false;
  }

  // 业务错误码：RequestResponse 模式 code !== '0000' 即失败
  if (json && typeof json === 'object' && 'code' in json) {
    if (json.code !== SUCCESS_CODE) {
      message.error(json.message || '导出失败');
      return false;
    }
  }

  // 提取 data 字段；若无 data 字段则使用整个响应体
  const exportData = json && 'data' in json ? json.data : json;
  if (isExportDataEmpty(exportData)) {
    message.warning('导出数据为空');
    return false;
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};

const SpaceConnector: React.FC = () => {
  const actionRef = useRef<ActionType>();
  // umi 的 useParams 不支持泛型参数，取值时再断言
  const routeParams = useParams() as { spaceId?: string };
  /**
   * 当前空间 ID：由路由 /space/:spaceId/connector 提供，
   * 左侧导航「空间筛选」切换空间 = 切换路由参数（页面不再自带空间下拉框）
   */
  const spaceId = Number(routeParams.spaceId);
  /** 路由参数就绪（有效数字）才发请求 / 开抽屉 */
  const spaceIdReady = Number.isFinite(spaceId) && spaceId > 0;

  /** 「导入」抽屉开关 */
  const [importOpen, setImportOpen] = useState<boolean>(false);
  /** 「新增连接器」抽屉开关（复用管理端创建抽屉） */
  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  /** 「编辑」抽屉开关 + 正在编辑的连接器（复用管理端编辑抽屉） */
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] =
    useState<ConnectorProviderInfo | null>(null);
  /**
   * 「查看」详情抽屉当前展示的连接器 service（null = 关闭）
   * 原地展开抽屉而非跳转子页面路由 —— 列表筛选态与滚动位置得以保留
   */
  const [detailService, setDetailService] = useState<string | null>(null);
  /** 正在导出的连接器 service（防重复触发，同一时间仅一条导出在飞） */
  const [exportingService, setExportingService] = useState<string | null>(null);
  /** 正在启停切换的连接器 service（防重复触发） */
  const [togglingService, setTogglingService] = useState<string | null>(null);

  /**
   * 重置（由筛选行右侧「重置」按钮触发）：
   * XProTable 传 onReset 后会跳过默认 reset，需自行调用 ProTable 官方 reset
   * （清表单 + 清内部 formSearch + 重载，对齐菜单管理）
   */
  const handleReset = useCallback(() => {
    actionRef.current?.reset?.();
  }, []);

  /**
   * 删除连接器：行内「删除」按钮触发，先弹二次确认；
   * 确认后调 DELETE /api/connector/providers/{service}，成功刷新列表。
   * 业务/网络错误由全局 errorHandler 统一提示（如「连接器仍存在连接或绑定，不能删除」），
   * 此处不重复弹错；antd confirm 的 onOk 内抛错会被转成 Unhandled Rejection
   * 导致页面崩溃（见 antd ActionButton 对 onOk reject 的处理），故不能 throw
   */
  const handleDelete = useCallback((record: ConnectorProviderInfo) => {
    Modal.confirm({
      title: `删除连接器 ${record.displayName || record.service}？`,
      content:
        '其全部工具将一并删除。若仍有用户连接，删除会被拒绝（需先断开）。',
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await apiConnectorProviderDelete(record.service);
          if (response?.code === SUCCESS_CODE) {
            message.success('删除成功');
            actionRef.current?.reload();
          }
          // 非成功码理论上会被全局拦截器 reject，不会 resolve 到这里；静默关闭弹窗即可
        } catch {
          // 业务/网络错误：全局 errorHandler 已弹过后端报错信息，此处不再重复提示
        }
      },
    });
  }, []);

  /**
   * 导出连接器：行内「导出」按钮触发，
   * 调 POST /api/connector/export?service=&spaceId=（blob 同管理端导出），
   * 下载文件名 {service}.connector.json
   */
  const handleExport = useCallback(
    async (record: ConnectorProviderInfo) => {
      if (!record.service || !spaceIdReady) {
        message.error('连接器 service 缺失，无法导出');
        return;
      }
      if (exportingService) return;
      setExportingService(record.service);
      try {
        const response = await apiConnectorProviderExport({
          service: record.service,
          spaceId,
        });
        const ok = await triggerJsonDownload(
          response,
          `${record.service}.connector.json`,
        );
        if (ok) {
          message.success('已导出连接器');
        }
      } catch (err: any) {
        message.error(err?.message || '导出失败');
      } finally {
        setExportingService(null);
      }
    },
    [spaceIdReady, exportingService],
  );

  /**
   * 启用/停用连接器：行内「停用/启用」按钮触发，
   * 调 POST /api/connector/providers/{service}/status?enabled={boolean}
   * （当前已启用 → enabled=false 停用；已停用 → enabled=true 启用），
   * 成功后刷新列表，按钮文案与状态列随之切换
   */
  const handleToggleStatus = useCallback(
    async (record: ConnectorProviderInfo) => {
      if (!record.service) {
        message.error('连接器 service 缺失，无法操作');
        return;
      }
      if (togglingService) return;
      const nextEnabled = record.status !== 'enabled';
      try {
        setTogglingService(record.service);
        const response = await apiConnectorProviderToggleStatus(
          record.service,
          nextEnabled,
        );
        if (response?.code !== SUCCESS_CODE) {
          message.error(
            response?.message || (nextEnabled ? '启用失败' : '停用失败'),
          );
          return;
        }
        message.success(nextEnabled ? '已启用' : '已停用');
        actionRef.current?.reload();
      } catch {
        message.error(nextEnabled ? '启用失败' : '停用失败');
      } finally {
        setTogglingService(null);
      }
    },
    [togglingService],
  );

  /**
   * 行内「查看」按钮：原地打开连接器详情抽屉
   * （概览 + 工具列表表格 + 连接流程；spaceId 取当前选中空间）
   */
  const handleView = useCallback(
    (record: ConnectorProviderInfo) => {
      if (!spaceIdReady) return;
      setDetailService(record.service);
    },
    [spaceIdReady],
  );

  /**
   * 打开编辑抽屉：行内「编辑」按钮触发。
   * 抽屉复用管理端 ConnectorProviderEditDrawer，差异点通过注入实现：
   * meta 更新走 PUT /api/connector/providers/{service}、
   * oauth2+platform 的 App 配置保存走 POST /api/connector/oauth/shared-config、
   * 详情拉取用当前选中空间的 spaceId
   */
  const handleEdit = useCallback((record: ConnectorProviderInfo) => {
    setEditingRecord(record);
    setEditDrawerOpen(true);
  }, []);

  /**
   * 操作列：5 个按钮，走 TableActions（link 模式，统一蓝色文字，对齐菜单管理）；
   * 启用/停用与导出按钮自带 loading（防重复点击）
   */
  const renderActions = useCallback(
    (record: ConnectorProviderInfo) => {
      const actions: ActionItem<ConnectorProviderInfo>[] = [
        {
          key: 'detail',
          label: '查看',
          onClick: () => handleView(record),
        },
        {
          key: 'edit',
          label: '编辑',
          onClick: () => handleEdit(record),
        },
        {
          key: 'export',
          label: '导出',
          loading: exportingService === record.service,
          onClick: () => handleExport(record),
        },
        {
          key: 'toggle',
          label: record.status === 'enabled' ? '停用' : '启用',
          loading: togglingService === record.service,
          onClick: () => handleToggleStatus(record),
        },
        {
          key: 'delete',
          label: '删除',
          onClick: () => handleDelete(record),
        },
      ];
      return (
        <TableActions<ConnectorProviderInfo>
          record={record}
          actions={actions}
        />
      );
    },
    [
      handleView,
      handleEdit,
      handleExport,
      handleToggleStatus,
      handleDelete,
      togglingService,
      exportingService,
    ],
  );

  /** 列定义（与管理端一致，去掉勾选列与拖拽排序列；新增「已连接」列） */
  const columns: ProColumns<ConnectorProviderInfo>[] = [
    {
      // 连接器：仅展示名称（不加粗、无副标题，行高随之收紧）
      // 进 LightFilter：点击搜索图标展开输入框（回车 / 查询按钮触发），
      // 提交后作为接口 keyword 参数（服务端匹配 displayName/service）
      title: '连接器',
      dataIndex: 'displayName',
      width: 200,
      fieldProps: {
        placeholder: '请输入连接器名称/service',
        // 弹层挂在 body 下无法用页面祖先选择器，借此 class 反查所属 popover 放宽宽度（见下方 style 标签）
        className: 'connector-name-filter-input',
      },
    },
    {
      // service：等宽字体
      title: 'service',
      dataIndex: 'service',
      width: 160,
      hideInSearch: true,
      render: (_, record) => (
        <code style={{ fontSize: 12 }}>{record.service}</code>
      ),
    },
    {
      // 认证方式（本地筛选：接口不支持 authType 参数）
      title: '认证方式',
      dataIndex: 'authType',
      width: 120,
      align: 'center',
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(AUTH_TYPE_LABEL_MAP).map(([k, v]) => [k, { text: v }]),
      ),
      fieldProps: {
        options: AUTH_TYPE_OPTIONS.filter((v) => v.value !== ''),
      },
      render: (_, record) => (
        <Tag color={AUTH_TYPE_COLOR_MAP[record.authType] ?? 'default'}>
          {AUTH_TYPE_LABEL_MAP[record.authType] ?? record.authType}
        </Tag>
      ),
    },
    {
      // 工具数
      title: '工具数',
      dataIndex: 'actionCount',
      width: 80,
      align: 'center',
      hideInSearch: true,
    },
    {
      // 启用状态
      title: '启用状态',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        enabled: { text: '启用', status: 'Success' },
        disabled: { text: '停用', status: 'Default' },
      },
      fieldProps: {
        options: STATUS_OPTIONS.filter((v) => v.value !== ''),
      },
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'green' : 'default'}>
          {record.status === 'enabled' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      // 连接状态（空间维度特有，对应接口 connected 参数）
      title: '连接状态',
      dataIndex: 'connected',
      width: 100,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        true: { text: '已连接' },
        false: { text: '未连接' },
      },
      fieldProps: {
        options: CONNECTED_OPTIONS,
      },
      render: (_, record) => (
        <Tag color={record.connected ? 'green' : 'default'}>
          {record.connected ? '已连接' : '未连接'}
        </Tag>
      ),
    },
    {
      // 更新时间
      title: '更新时间',
      dataIndex: 'modified',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
      align: 'center',
    },
    {
      // 操作列：TableActions 渲染的蓝色文字链接（fixed right 保证滚动时常驻）
      title: '操作',
      width: 240,
      align: 'center',
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => renderActions(record),
    },
  ];

  /**
   * request 回调：LightFilter 筛选（displayName 提交后映射为接口 keyword）+
   * 路由 params 注入的 spaceId 组装查询；
   * 接口一次性拉全量（pageSize 500），认证方式在前端本地过滤。
   * spaceId 经 XProTable 的 params prop 注入，左侧导航切换空间自动触发重载。
   */
  const request = async (params: any = {}) => {
    const { spaceId, displayName, status, authType, connected } = params;
    // 路由参数未就绪（异常路径）时不请求
    if (!spaceId) {
      return { data: [], total: 0, success: true };
    }
    try {
      const response = await apiConnectorProviderPageList({
        spaceId,
        scope: 'space',
        status: status || 'all',
        connected: connected || 'all',
        keyword: String(displayName ?? '').trim(),
        pageNum: 1,
        pageSize: 500,
      });
      if (response?.code !== SUCCESS_CODE) {
        message.error(response?.message || '获取连接器列表失败');
        return { data: [], total: 0, success: false };
      }
      let data = response.data?.records ?? [];
      // 认证方式：接口无 authType 参数，前端本地过滤
      if (authType) {
        data = data.filter((item) => item.authType === authType);
      }
      return { data, total: data.length, success: true };
    } catch {
      return { data: [], total: 0, success: false };
    }
  };

  return (
    <WorkspaceLayout
      title="连接器"
      rightSlot={
        <Space size={12}>
          {/* 新增连接器：与管理端同款 primary 按钮，右侧滑出创建抽屉；
              路由参数未就绪时禁用（创建接口 body 必传 spaceId，与「导入」一致） */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
            disabled={!spaceIdReady}
          >
            新增连接器
          </Button>
          {/* 导入：右侧滑出导入抽屉（预览 diff + 确认导入） */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
            disabled={!spaceIdReady}
          >
            导入
          </Button>
        </Space>
      }
    >
      <div className={styles.page}>
        {/* 连接器名称筛选下拉加宽：弹层（.ant-popover）挂在 body 下，无法用页面祖先选择器；
            借输入框上的 class 反查所属 popover，放宽弹层内层宽度到 250px（完整展示 placeholder） */}
        <style>{`
          .ant-popover:has(.connector-name-filter-input) .ant-popover-inner {
            width: 250px;
          }
        `}</style>
        {/* 表格列表（与管理端同款呈现；无勾选列、无拖拽排序） */}
        {!spaceIdReady ? (
          <div className={styles.emptyWrap}>
            <Empty description="空间参数缺失" />
          </div>
        ) : (
          <XProTable<ConnectorProviderInfo>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={request}
            params={{ spaceId }}
            pagination={false}
            /**
             * 筛选行右侧的 重置/查询 按钮（showQueryButtons 默认开启，对齐菜单管理）：
             * 重置走 onReset（ProTable 官方 reset：清表单 + 清内部 formSearch + 重载），
             * 查询走 form submit
             */
            onReset={handleReset}
            /**
             * 启用虚拟滚动：仅渲染可视区内的行。
             * listItemHeight 对齐 middle 单行内容实际行高，避免最后一行被裁切。
             */
            virtual
            listItemHeight={48}
            tableLayout="fixed"
            scroll={{ x: 'max-content' }}
          />
        )}
      </div>

      {/* 导入连接器抽屉：预览 diff / 确认导入均按路由空间（spaceId 挂 query） */}
      {spaceIdReady ? (
        <ConnectorImportDrawer
          open={importOpen}
          onClose={() => setImportOpen(false)}
          spaceId={spaceId}
          onImported={() => actionRef.current?.reload()}
        />
      ) : null}

      {/* 新增连接器抽屉：展示/交互与管理端一致，差异点：创建接口走 space 维度
          （body 追加当前选中空间 spaceId，后端必填校验）、
          oauth2+platform 追加保存走 shared-config 接口、service 输入失焦自动补
          s_ 前缀（label 同步提示）、成功提示文案 */}
      <ConnectorProviderCreateDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={() => actionRef.current?.reload()}
        createProvider={(payload) =>
          apiConnectorProviderCreate({
            ...payload,
            spaceId: spaceIdReady ? spaceId : undefined,
          })
        }
        saveOauthConfig={apiConnectorOauthSharedConfigSave}
        successMessage="创建成功，请到查看工具里面添加工具"
        servicePrefix="s_"
      />

      {/* 编辑连接器抽屉：展示/交互与管理端一致，差异点：meta 更新与 oauth 配置
          保存走 space 维度接口、详情拉取用当前选中空间 spaceId；保存成功刷新列表 */}
      <ConnectorProviderEditDrawer
        open={editDrawerOpen}
        record={editingRecord}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingRecord(null);
        }}
        // 保存成功：刷新表格列表，并原地打开「查看」详情抽屉
        // （抽屉内部会拉 GET /api/connector/providers/{service} 展示最新数据）
        onSaved={(payload) => {
          actionRef.current?.reload();
          const service =
            editingRecord?.service ??
            (payload as { service?: string } | undefined)?.service;
          setEditDrawerOpen(false);
          setEditingRecord(null);
          if (service) {
            setDetailService(service);
          }
        }}
        updateProviderMeta={apiConnectorProviderUpdateMeta}
        saveOauthConfig={apiConnectorOauthSharedConfigSave}
        spaceId={spaceIdReady ? spaceId : undefined}
      />

      {/* 查看详情抽屉（右侧滑出，空间维度：展示去连接/去授权，工具增删改走空间接口；
          原地展开不跳路由 —— 列表筛选态保留；连接状态与工具数变化后刷新列表） */}
      <ConnectorProviderDetailDrawer
        open={detailService !== null}
        service={detailService ?? ''}
        scope="space"
        spaceId={spaceIdReady ? spaceId : undefined}
        onClose={() => setDetailService(null)}
        onConnectionChanged={() => actionRef.current?.reload()}
        onActionsChanged={() => actionRef.current?.reload()}
      />
    </WorkspaceLayout>
  );
};

export default SpaceConnector;
