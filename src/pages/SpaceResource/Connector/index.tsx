import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import ConnectorProviderCreateDrawer from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderCreateDrawer';
import ConnectorProviderDetailDrawer, {
  type ConnectorGoConnectContext,
} from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderDetailDrawer';
import ConnectorProviderEditDrawer from '@/pages/SystemManagement/ConnectorManage/ConnectorProviderEditDrawer';
import {
  apiConnectorActionCreate,
  apiConnectorActionDelete,
  apiConnectorActionToggleStatus,
  apiConnectorActionUpdate,
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
import type {
  ConnectorAuthConfigField,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConnectorCard from './components/ConnectorCard';
import ConnectorConnectDrawer from './components/ConnectorConnectDrawer';
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
 * 视觉：卡片网格（与管理端 /system/connector-manage 的表格列表不同）；
 * 顶部筛选栏样式参考管理端连接器列表（关键字 + 状态 + 连接）。
 * 「导入」走 ConnectorImportDrawer（预览 diff + 确认导入，接口 space 维度）；
 * 卡片「删除」二次确认后调 DELETE /api/connector/providers/{service}；
 * 卡片「导出」调 POST /api/connector/export?service=&spaceId=，
 * 下载文件名 {service}.connector.json；
 * 卡片「停用/启用」调 POST /api/connector/providers/{service}/status?enabled=；
 * 「新增连接器」复用管理端 ConnectorProviderCreateDrawer（展示/交互一致），
 * 提交走 POST /api/connector/providers（body 带当前空间 spaceId，必填），
 * service 失焦自动补 s_ 前缀；
 * 卡片「编辑」复用管理端 ConnectorProviderEditDrawer，
 * meta 更新走 PUT /api/connector/providers/{service}，
 * oauth2+platform 的 App 配置保存走 POST /api/connector/oauth/shared-config；
 * 卡片「查看工具」复用管理端 ConnectorProviderDetailDrawer
 * （GET /api/connector/providers/{service}?spaceId=，工具栏仅「+ 添加工具」）。
 */

/** 状态筛选选项（value 直接透传接口 status 参数） */
const STATUS_FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

/** 连接筛选选项（value 直接透传接口 connected 参数） */
const CONNECTED_FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: 'all' },
  { label: '已连接', value: 'true' },
  { label: '未连接', value: 'false' },
];

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
  // 空间列表（下拉框数据源）
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const [spaceLoading, setSpaceLoading] = useState<boolean>(true);
  /** 当前选中的空间 ID（页面打开后默认第一个空间） */
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  /** 空间下拉搜索关键字（自行过滤，以便过滤后剔除空分组） */
  const [spaceSearch, setSpaceSearch] = useState<string>('');

  // 筛选条件（value 与接口参数一一对应）
  const [keyword, setKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');
  const [status, setStatus] = useState<string>('all');
  const [connected, setConnected] = useState<string>('all');

  // 连接器卡片列表
  const [records, setRecords] = useState<ConnectorProviderInfo[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(false);
  /** 「导入」抽屉开关 */
  const [importOpen, setImportOpen] = useState<boolean>(false);
  /** 「新增连接器」抽屉开关（复用管理端创建抽屉） */
  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  /** 「编辑」抽屉开关 + 正在编辑的连接器（复用管理端编辑抽屉） */
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] =
    useState<ConnectorProviderInfo | null>(null);
  /** 「查看工具」详情抽屉正在查看的连接器（null = 关闭，复用管理端详情抽屉） */
  const [detailRecord, setDetailRecord] =
    useState<ConnectorProviderInfo | null>(null);
  /**
   * 「去连接」凭据抽屉的上下文（详情抽屉「去连接」按钮写入；null = 关闭）：
   * detail 里的 authConfig.fields 驱动凭证表单，refresh 用于连接成功后刷新详情
   */
  const [connectCtx, setConnectCtx] =
    useState<ConnectorGoConnectContext | null>(null);
  /** 正在导出的连接器 service（防重复触发，同一时间仅一条导出在飞） */
  const [exportingService, setExportingService] = useState<string | null>(null);
  /** 正在启停切换的连接器 service（防重复触发） */
  const [togglingService, setTogglingService] = useState<string | null>(null);

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

  /** 关键字防抖：输入停止 400ms 后才触发列表请求 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [keyword]);

  /**
   * 拉取连接器列表：选中空间或任一筛选条件变化时重新请求；
   * 导入抽屉「确认导入」成功后也手动调用刷新。
   * isCancelled 由调用方（useEffect 清理逻辑）传入，防止竞态写入过期响应
   */
  const fetchList = useCallback(
    async (isCancelled?: () => boolean) => {
      // 空间未就绪（列表还在加载 / 当前账号没有空间）时不请求
      if (selectedSpaceId === null) return;
      try {
        setListLoading(true);
        const response = await apiConnectorProviderPageList({
          spaceId: selectedSpaceId,
          scope: 'space',
          status,
          connected,
          keyword: debouncedKeyword,
          pageNum: 1,
          pageSize: 500,
        });
        if (isCancelled?.()) return;
        if (response?.code === SUCCESS_CODE) {
          setRecords(response.data?.records ?? []);
        } else {
          setRecords([]);
          message.error(response?.message || '获取连接器列表失败');
        }
      } catch {
        if (!isCancelled?.()) {
          setRecords([]);
        }
      } finally {
        if (!isCancelled?.()) {
          setListLoading(false);
        }
      }
    },
    [selectedSpaceId, status, connected, debouncedKeyword],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchList(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  /**
   * 删除连接器：卡片「删除」按钮触发，先弹二次确认；
   * 确认后调 DELETE /api/connector/providers/{service}，成功刷新列表。
   * 失败（如仍有用户连接被后端拒绝）时提示后端 message 并保持弹窗打开便于重试
   */
  const handleDelete = useCallback(
    (record: ConnectorProviderInfo) => {
      Modal.confirm({
        title: `删除连接器 ${record.displayName || record.service}？`,
        content:
          '其全部工具将一并删除。若仍有用户连接，删除会被拒绝（需先断开）。',
        okText: '删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          let errorMessage = '';
          try {
            const response = await apiConnectorProviderDelete(record.service);
            if (response?.code !== SUCCESS_CODE) {
              errorMessage = response?.message || '删除连接器失败';
            }
          } catch {
            errorMessage = '删除连接器失败';
          }
          if (errorMessage) {
            message.error(errorMessage);
            // 抛出让 Modal 保持打开，用户可取消去断开连接后重试
            throw new Error(errorMessage);
          }
          message.success('删除成功');
          void fetchList();
        },
      });
    },
    [fetchList],
  );

  /**
   * 导出连接器：卡片「导出」按钮触发，
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
   * 启用/停用连接器：卡片「停用/启用」按钮触发，
   * 调 POST /api/connector/providers/{service}/status?enabled={boolean}
   * （当前已启用 → enabled=false 停用；已停用 → enabled=true 启用），
   * 成功后刷新列表，按钮文案与状态徽章随之切换
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
        void fetchList();
      } catch {
        message.error(nextEnabled ? '启用失败' : '停用失败');
      } finally {
        setTogglingService(null);
      }
    },
    [fetchList, togglingService],
  );

  /**
   * 打开详情抽屉：卡片「查看工具」按钮触发。
   * 抽屉复用管理端 ConnectorProviderDetailDrawer（工具栏仅「+ 添加工具」，
   * 无编辑/删除/导出连接器按钮），详情/工具操作接口由抽屉内部调用，
   * spaceId 传当前选中空间（管理端是写死的 52）
   */
  const handleView = useCallback((record: ConnectorProviderInfo) => {
    setDetailRecord(record);
  }, []);

  /**
   * 打开编辑抽屉：卡片「编辑」按钮触发。
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
   * 「去连接」抽屉的凭证字段定义（优先详情接口，回退列表行）：
   * - 自定义认证：authConfig.fields 数组直接驱动（如 clientId / apiKey）
   * - API Key 认证：authConfig 无 fields（形如 { base64, prefix, keyName,
   *   injectTo, headerName }），按 keyName 生成单个凭证字段——
   *   如 keyName: "apiKey" →「凭证字段 · APIKEY」，提交键即 keyName
   * - Bearer 认证：fields 缺失时兜底生成 token 字段（提交键 token，
   *   与建立连接接口的 bearer 示例 fields: { token } 一致）
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

  return (
    <WorkspaceLayout
      title="连接器"
      rightSlot={
        <Space size={12}>
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
        {/* 筛选栏：关键字 + 状态 + 连接（样式参考管理端连接器列表）；右侧为空间选择器 */}
        <div className={styles.filterBar}>
          <Input
            className={styles.searchInput}
            allowClear
            prefix={<SearchOutlined className={styles.searchIcon} />}
            placeholder="搜索空间连接器（名称 / service / 分类 / 标签）"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className={styles.filterItem}>
            <span className={styles.filterItemLabel}>状态:</span>
            <Select
              className={styles.filterItemSelect}
              variant="borderless"
              value={status}
              options={STATUS_FILTER_OPTIONS}
              onChange={setStatus}
              popupMatchSelectWidth={false}
            />
          </div>
          <div className={styles.filterItem}>
            <span className={styles.filterItemLabel}>连接:</span>
            <Select
              className={styles.filterItemSelect}
              variant="borderless"
              value={connected}
              options={CONNECTED_FILTER_OPTIONS}
              onChange={setConnected}
              popupMatchSelectWidth={false}
            />
          </div>
          <div className={styles.flexSpace} />
          {/* 空间选择器：个人空间 / 团队空间分组展示，切换后按新 spaceId 重新拉取列表 */}
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
        </div>

        {/* 卡片网格 */}
        {listLoading ? (
          <div className={styles.loadingWrap}>
            <Spin />
          </div>
        ) : selectedSpaceId === null ? (
          <div className={styles.emptyWrap}>
            <Empty description="暂无空间" />
          </div>
        ) : records.length ? (
          <div className={styles.grid}>
            {records.map((record) => (
              <ConnectorCard
                key={record.id}
                record={record}
                onDelete={handleDelete}
                onExport={handleExport}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEdit}
                onView={handleView}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyWrap}>
            <Empty description="暂无连接器" />
          </div>
        )}
      </div>

      {/* 导入连接器抽屉：预览 diff / 确认导入均按当前选中空间（spaceId 挂 query） */}
      {selectedSpaceId !== null ? (
        <ConnectorImportDrawer
          open={importOpen}
          onClose={() => setImportOpen(false)}
          spaceId={selectedSpaceId}
          onImported={() => void fetchList()}
        />
      ) : null}

      {/* 新增连接器抽屉：展示/交互与管理端一致，差异点：创建接口走 space 维度
          （body 追加当前选中空间 spaceId，后端必填校验）、
          oauth2+platform 追加保存走 shared-config 接口、service 输入失焦自动补
          s_ 前缀（label 同步提示）、成功提示文案 */}
      <ConnectorProviderCreateDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={() => void fetchList()}
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
        // 保存成功：刷新卡片列表，并用最新提交值合成详情行打开「查看工具」
        // 抽屉（与管理端一致；详情抽屉内部会再拉
        // GET /api/connector/providers/{service} 详情覆盖展示）
        onSaved={(payload) => {
          void fetchList();
          setDetailRecord({
            ...(editingRecord ?? ({} as ConnectorProviderInfo)),
            ...payload,
          } as ConnectorProviderInfo);
          setEditDrawerOpen(false);
          setEditingRecord(null);
        }}
        updateProviderMeta={apiConnectorProviderUpdateMeta}
        saveOauthConfig={apiConnectorOauthSharedConfigSave}
        spaceId={selectedSpaceId ?? undefined}
      />

      {/* 查看工具详情抽屉：展示/交互与管理端一致（工具栏仅「+ 添加工具」），
          详情拉取 spaceId 用当前选中空间；工具启停走
          POST /api/connector/actions/{id}/status；工具编辑走
          POST /api/connector/actions/{id}；添加工具走
          POST /api/connector/providers/{service}/actions；
          删除工具走 DELETE /api/connector/actions/{id}（Popconfirm 二次确认）；
          添加工具成功后刷新卡片列表的工具数徽章；
          未连接时工具列表底部按认证方式动态展示连接按钮（不受工具
          列表是否有数据影响）：oauth2 → 发起OAuth授权（抽屉内调
          GET /api/connector/oauth/authorize 后新窗口打开授权页，
          授权窗口关闭后自动刷新详情）；api_key/bearer/custom → 去连接
          （打开 ConnectorConnectDrawer 凭据抽屉，凭证字段按
          authConfig.fields 动态渲染，提交走
          POST /api/connector/connections/api-key）；免鉴权无按钮 */}
      <ConnectorProviderDetailDrawer
        open={detailRecord !== null}
        record={detailRecord}
        spaceId={selectedSpaceId ?? undefined}
        onClose={() => setDetailRecord(null)}
        onActionCreated={() => void fetchList()}
        showGoConnect
        onGoConnect={(ctx) => setConnectCtx(ctx)}
        toggleActionStatus={apiConnectorActionToggleStatus}
        updateAction={apiConnectorActionUpdate}
        createAction={apiConnectorActionCreate}
        deleteAction={apiConnectorActionDelete}
      />

      {/* 去连接凭据抽屉（认证方式 custom/api_key/bearer）：详情抽屉
          「去连接」按钮打开，凭证字段按 authConfig.fields 动态渲染，
          提交 POST /api/connector/connections/api-key；
          连接成功后刷新详情抽屉（按钮消失）与卡片列表（已连接徽章） */}
      <ConnectorConnectDrawer
        open={connectCtx !== null}
        record={connectCtx?.record ?? null}
        fields={connectFields}
        spaceId={selectedSpaceId ?? undefined}
        onClose={() => setConnectCtx(null)}
        onConnected={() => {
          // 连接成功：刷新详情抽屉（connected 变 true、按钮消失）+ 卡片列表徽章
          connectCtx?.refresh();
          void fetchList();
        }}
      />
    </WorkspaceLayout>
  );
};

export default SpaceConnector;
