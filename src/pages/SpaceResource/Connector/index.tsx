import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import ConnectorProviderCreateDrawer from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderCreateDrawer';
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
import { apiSpaceList } from '@/services/workspace';
import { SpaceTypeEnum } from '@/types/enums/space';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { history } from 'umi';
import ConnectorImportDrawer from './components/ConnectorImportDrawer';
import styles from './index.less';

/**
 * 工作空间连接器页面
 * 路由：/space/:spaceId/connector
 *
 * 数据流：
 *   1. 页面打开调 GET /api/space/list 拉空间列表（空间下拉框数据源），
 *      默认选中第一个空间
 *   2. 按选中空间 + 筛选条件调
 *      GET /api/connector/providers?spaceId=&scope=space&status=&connected=&keyword=&pageNum=1&pageSize=500
 *
 * 视觉：与管理端 /system/connector-manage 相同的表格列表呈现
 * （LightFilter 筛选 + XProTable），差异：无勾选列、无拖拽排序列；
 * 「认证方式」为前端本地筛选（接口不支持 authType 参数）；
 * 空间选择器放在页面顶部「新增连接器」按钮左侧；
 * 工具栏右侧为搜索框（回车查询，无 查询/重置 按钮，与管理端一致）。
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
 * 行内「查看」跳转详情子页面 /space/:spaceId/connector/detail
 * （概览含连接状态 + 工具列表表格 + 去连接/OAuth 授权流程）。
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
  // 空间列表（下拉框数据源）
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const [spaceLoading, setSpaceLoading] = useState<boolean>(true);
  /** 当前选中的空间 ID（页面打开后默认第一个空间） */
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  /** 空间下拉搜索关键字（自行过滤，以便过滤后剔除空分组） */
  const [spaceSearch, setSpaceSearch] = useState<string>('');

  /** 「导入」抽屉开关 */
  const [importOpen, setImportOpen] = useState<boolean>(false);
  /** 「新增连接器」抽屉开关（复用管理端创建抽屉） */
  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  /** 「编辑」抽屉开关 + 正在编辑的连接器（复用管理端编辑抽屉） */
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] =
    useState<ConnectorProviderInfo | null>(null);
  /** 正在导出的连接器 service（防重复触发，同一时间仅一条导出在飞） */
  const [exportingService, setExportingService] = useState<string | null>(null);
  /** 正在启停切换的连接器 service（防重复触发） */
  const [togglingService, setTogglingService] = useState<string | null>(null);
  /** 工具栏搜索框输入值（未提交，回车 / 清空才触发查询） */
  const [keyword, setKeyword] = useState<string>('');
  /** 已提交的搜索关键字（经 params 注入 request，变化自动触发重载） */
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  /** 页面打开：拉空间列表并默认选中第一个空间 */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSpaceLoading(true);
        const response = await apiSpaceList();
        const list = response?.code === SUCCESS_CODE ? response.data ?? [] : [];
        if (cancelled) return;
        setSpaces(list);
        if (list.length) {
          setSelectedSpaceId(list[0].id);
        }
      } catch {
        if (!cancelled) {
          setSpaces([]);
        }
      } finally {
        if (!cancelled) {
          setSpaceLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
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
      if (!record.service || selectedSpaceId === null) {
        message.error('连接器 service 缺失，无法导出');
        return;
      }
      if (exportingService) return;
      setExportingService(record.service);
      try {
        const response = await apiConnectorProviderExport({
          service: record.service,
          spaceId: selectedSpaceId,
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
    [selectedSpaceId, exportingService],
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
   * 行内「查看」按钮：跳转连接器详情子页面
   * （概览 + 工具列表表格 + 连接流程；service/spaceId 走 query）
   */
  const handleView = useCallback(
    (record: ConnectorProviderInfo) => {
      if (selectedSpaceId === null) return;
      history.push(
        `/space/${selectedSpaceId}/connector/detail?service=${record.service}&spaceId=${selectedSpaceId}`,
      );
    },
    [selectedSpaceId],
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
   * 空间下拉框分组选项：按 SpaceInfo.type 分为「个人空间 / 团队空间」两组
   * （接口返回平铺列表，分组在前端完成；Class 等其余类型归入团队空间，
   * 与设计稿一致，空分组不渲染）
   */
  const spaceOptions = useMemo(() => {
    const keyword = spaceSearch.trim().toLowerCase();
    const filtered = keyword
      ? spaces.filter((item) => item.name?.toLowerCase().includes(keyword))
      : spaces;
    const personalOptions = filtered
      .filter((item) => item.type === SpaceTypeEnum.Personal)
      .map((item) => ({ label: item.name, value: item.id }));
    const teamOptions = filtered
      .filter((item) => item.type !== SpaceTypeEnum.Personal)
      .map((item) => ({ label: item.name, value: item.id }));

    const groups: Array<{
      label: string;
      options: Array<{ label: string; value: number }>;
    }> = [];
    if (personalOptions.length) {
      groups.push({ label: '个人空间', options: personalOptions });
    }
    if (teamOptions.length) {
      groups.push({ label: '团队空间', options: teamOptions });
    }
    return groups;
  }, [spaces, spaceSearch]);

  /** 操作列：5 个按钮（查看/编辑/导出/停用|启用/删除），与管理端风格一致 */
  const renderActions = useCallback(
    (record: ConnectorProviderInfo) => {
      const isEnabled = record.status === 'enabled';
      const toggling = togglingService === record.service;
      return (
        <Space size={12} className="connector-row-actions">
          <a onClick={() => handleView(record)}>查看</a>
          <a onClick={() => handleEdit(record)}>编辑</a>
          <a onClick={() => handleExport(record)}>导出</a>
          {toggling ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                color: isEnabled ? '#ff4d4f' : '#1890ff',
              }}
            >
              <Spin size="small" />
              <span>{isEnabled ? '停用中…' : '启用中…'}</span>
            </span>
          ) : (
            <a
              onClick={() => handleToggleStatus(record)}
              style={{ color: isEnabled ? '#ff4d4f' : undefined }}
            >
              {isEnabled ? '停用' : '启用'}
            </a>
          )}
          <a onClick={() => handleDelete(record)} style={{ color: '#ff4d4f' }}>
            删除
          </a>
        </Space>
      );
    },
    [
      handleView,
      handleEdit,
      handleExport,
      handleToggleStatus,
      handleDelete,
      togglingService,
    ],
  );

  /** 列定义（与管理端一致，去掉勾选列与拖拽排序列；新增「已连接」列） */
  const columns: ProColumns<ConnectorProviderInfo>[] = [
    {
      // 连接器：显示名 + 标签副标题（2 行布局，同管理端）；
      // 搜索已移到工具栏右侧搜索框（回车查询），此列不再进 LightFilter
      title: '连接器',
      dataIndex: 'displayName',
      width: 120,
      hideInSearch: true,
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>{record.displayName}</span>
          {record.tags?.length ? (
            <span style={{ color: '#999', fontSize: 12 }}>
              {record.tags.join(', ')}
            </span>
          ) : null}
        </div>
      ),
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
      // 操作列：5 个按钮平铺（fixed right 保证滚动时常驻）
      title: '操作',
      width: 260,
      align: 'center',
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => renderActions(record),
    },
  ];

  /**
   * request 回调：LightFilter 筛选 + params 注入的 spaceId/keyword 组装查询；
   * 接口一次性拉全量（pageSize 500），认证方式在前端本地过滤。
   * spaceId 与 keyword 均通过 XProTable 的 params prop 注入，
   * 切换空间 / 提交搜索自动触发重载。
   */
  const request = async (params: any = {}) => {
    const { spaceId, keyword: kw, status, authType, connected } = params;
    // 空间未就绪（列表还在加载 / 当前账号没有空间）时不请求
    if (spaceId === undefined || spaceId === null) {
      return { data: [], total: 0, success: true };
    }
    try {
      const response = await apiConnectorProviderPageList({
        spaceId,
        scope: 'space',
        status: status || 'all',
        connected: connected || 'all',
        keyword: String(kw ?? '').trim(),
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
          {/* 空间选择器：个人空间 / 团队空间分组展示，切换后按新 spaceId 重新拉取列表；
              位于「新增连接器」按钮左侧 */}
          <div className={styles.filterItem}>
            <span className={styles.filterItemLabel}>空间:</span>
            <Select
              className={styles.spaceSelect}
              variant="borderless"
              showSearch
              filterOption={false}
              searchValue={spaceSearch}
              onSearch={setSpaceSearch}
              loading={spaceLoading}
              value={selectedSpaceId ?? undefined}
              options={spaceOptions}
              onChange={(value) => setSelectedSpaceId(value)}
              popupMatchSelectWidth={false}
              notFoundContent={spaceLoading ? <Spin size="small" /> : null}
            />
          </div>
          {/* 新增连接器：与管理端同款 primary 按钮，右侧滑出创建抽屉；
              未选中空间时禁用（创建接口 body 必传 spaceId，与「导入」一致） */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
            disabled={selectedSpaceId === null}
          >
            新增连接器
          </Button>
          {/* 导入：右侧滑出导入抽屉（预览 diff + 确认导入） */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
            disabled={selectedSpaceId === null}
          >
            导入
          </Button>
        </Space>
      }
    >
      <div className={styles.page}>
        {/* 表格列表（与管理端同款呈现；无勾选列、无拖拽排序） */}
        {spaceLoading ? (
          <div className={styles.loadingWrap}>
            <Spin />
          </div>
        ) : selectedSpaceId === null ? (
          <div className={styles.emptyWrap}>
            <Empty description="暂无空间" />
          </div>
        ) : (
          <XProTable<ConnectorProviderInfo>
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={request}
            params={{ spaceId: selectedSpaceId, keyword: searchKeyword }}
            pagination={false}
            size="large"
            listItemHeight={74}
            tableLayout="fixed"
            scroll={{ x: 1100 }}
            virtual
            /**
             * 工具栏右侧放搜索框（原 查询/重置 按钮的位置，与管理端一致）：
             * 回车提交搜索、清空即重置；LightFilter 下拉筛选变化即时生效，
             * 因此不再需要 查询/重置 按钮。样式对齐其他列表页
             * （prefix 放大镜 + allowClear），宽度在其基础上加长 50px。
             */
            showQueryButtons={false}
            toolBarRender={() => [
              <Input
                key="connector-search"
                allowClear
                prefix={<SearchOutlined />}
                placeholder="搜索连接器（名称 / service）"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={() => setSearchKeyword(keyword.trim())}
                onClear={() => setSearchKeyword('')}
                style={{ width: 264 }}
              />,
            ]}
          />
        )}
      </div>

      {/* 导入连接器抽屉：预览 diff / 确认导入均按当前选中空间（spaceId 挂 query） */}
      {selectedSpaceId !== null ? (
        <ConnectorImportDrawer
          open={importOpen}
          onClose={() => setImportOpen(false)}
          spaceId={selectedSpaceId}
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
            spaceId: selectedSpaceId ?? undefined,
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
        // 保存成功：刷新表格列表，并跳转「查看」详情子页面
        // （详情页内部会拉 GET /api/connector/providers/{service} 展示最新数据）
        onSaved={(payload) => {
          actionRef.current?.reload();
          const service =
            editingRecord?.service ??
            (payload as { service?: string } | undefined)?.service;
          setEditDrawerOpen(false);
          setEditingRecord(null);
          if (service && selectedSpaceId !== null) {
            history.push(
              `/space/${selectedSpaceId}/connector/detail?service=${service}&spaceId=${selectedSpaceId}`,
            );
          }
        }}
        updateProviderMeta={apiConnectorProviderUpdateMeta}
        saveOauthConfig={apiConnectorOauthSharedConfigSave}
        spaceId={selectedSpaceId ?? undefined}
      />
    </WorkspaceLayout>
  );
};

export default SpaceConnector;
