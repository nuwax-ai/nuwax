import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import {
  TableActions,
  XProTable,
  type ActionItem,
} from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiSystemConnectorProviderDelete,
  apiSystemConnectorProviderExport,
  apiSystemConnectorProviderList,
  apiSystemConnectorProviderOrder,
  apiSystemConnectorProviderToggleStatus,
} from '@/services/systemManage';
import { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import {
  DownloadOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, message, Modal, Space, Tag } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'umi';
import ConnectorImportDrawer from './ConnectorImportDrawer';
import ConnectorProviderCreateDrawer from './ConnectorProviderCreateDrawer';
import ConnectorProviderDetailDrawer from './ConnectorProviderDetailDrawer';
import ConnectorProviderEditDrawer from './ConnectorProviderEditDrawer';
import {
  AUTH_TYPE_COLOR_MAP,
  AUTH_TYPE_LABEL_MAP,
  AUTH_TYPE_OPTIONS,
  CONNECTED_OPTIONS,
  STATUS_OPTIONS,
} from './constants';

/**
 * 官方连接器列表页（原"连接器管理"）
 * 视觉与交互参考 GlobalModelManage（公共模型管理）
 * 数据源：GET /api/system/connector/providers（非分页）
 * 排序持久化：PUT /api/system/connector/providers/order
 * 查看详情：右侧 ConnectorProviderDetailDrawer 抽屉（内部拉 GET /api/connector/providers/{service}?spaceId=xxx）
 * 筛选：LightFilter（连接器名称搜索 + 认证方式/启用状态/连接状态，本地过滤），
 * 筛选行右侧带 重置/查询 按钮（XProTable showQueryButtons，对齐菜单管理）
 * 删除：行内「删除」二次确认后 DELETE /api/system/connector/providers/{service}
 * （管理端接口；空间侧列表走 DELETE /api/connector/providers/{service}）
 */

const ConnectorManage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  const [draggableData, setDraggableData] = useState<ConnectorProviderInfo[]>(
    [],
  );
  const isDraggingRef = useRef<boolean>(false);
  const originalDataRef = useRef<ConnectorProviderInfo[] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  /**
   * 正在切换状态的 service 集合（用于给按钮加 loading 态，防止重复点击）
   * 用 service 作为 key 而非 id —— 接口按 service 寻址。
   */
  const [togglingServices, setTogglingServices] = useState<Set<string>>(
    () => new Set(),
  );
  /**
   * 表单筛选态（LightFilter 任一条件非空）。
   * 筛选态下禁用拖拽排序：排序值是全局的，对过滤后的子集重排会让全量顺序错乱。
   */
  const [formFiltered, setFormFiltered] = useState<boolean>(false);
  /**
   * 导出进行中标记：'all' / 'selected' / 'single' / null
   * 给触发导出的那个按钮加 loading 态（工具栏两个按钮互不影响样式），
   * 并作为防重复点击的守卫标记（'single' 对应行内单条导出）。
   */
  const [exporting, setExporting] = useState<
    'all' | 'selected' | 'single' | null
  >(null);
  const [editRecord, setEditRecord] = useState<ConnectorProviderInfo | null>(
    null,
  );
  /**
   * 「查看」详情抽屉当前展示的连接器 service（null = 关闭）
   * 原地展开抽屉而非跳转子页面路由 —— 列表筛选态与滚动位置得以保留
   */
  const [detailService, setDetailService] = useState<string | null>(null);
  /**
   * "新增官方连接器"抽屉开关
   * 抽屉内「创建连接器」按钮暂为占位（功能待实现），这里只负责开关
   */
  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  /** "导入官方包"抽屉开关 */
  const [importDrawerOpen, setImportDrawerOpen] = useState<boolean>(false);

  /**
   * 检查导出数据是否为空（数组看长度、对象看 key 数、字符串看 trim 后长度）。
   */
  const isExportDataEmpty = (data: unknown): boolean => {
    if (data === null || data === undefined) return true;
    if (Array.isArray(data)) return data.length === 0;
    if (typeof data === 'object')
      return Object.keys(data as object).length === 0;
    if (typeof data === 'string') return data.trim() === '';
    return false;
  };

  /**
   * 触发浏览器下载：将服务端返回的 JSON 中 data 字段导出为 .json 文件。
   * 约定：本导出接口始终返回 JSON 格式（RequestResponse 包装），data 字段即导出内容。
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
      if (json.code !== '0000') {
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

  /** 核心导出逻辑：调 POST /api/system/connector/providers/export，处理下载 */
  const handleExportCore = useCallback(
    async (
      services: string[] | undefined,
      mode: 'all' | 'selected' | 'single',
      displayName?: string,
    ): Promise<boolean> => {
      if (exporting) return false;
      setExporting(mode);
      try {
        const response = await apiSystemConnectorProviderExport(
          services ? { services } : undefined,
        );
        // 文件名按场景生成：
        // - 单条导出：用该连接器的 displayName
        // - 多条选中：用条数
        // - 全部导出：固定名称
        let filename: string;
        if (mode === 'all') {
          filename = 'connector-export-all.json';
        } else if (displayName) {
          const safe = displayName.replace(/[\\/:*?"<>|]/g, '_');
          filename = `${safe}.connector.json`;
        } else {
          filename = `connector-export-${services?.length ?? 0}.json`;
        }
        const ok = await triggerJsonDownload(response, filename);
        if (ok) {
          message.success(
            mode === 'all'
              ? '已导出全部连接器'
              : mode === 'single'
              ? '已导出连接器'
              : '已导出所选连接器',
          );
        }
        return ok;
      } catch (err: any) {
        message.error(err?.message || '导出失败');
        return false;
      } finally {
        setExporting(null);
      }
    },
    [exporting],
  );

  /** 导出全部：不传参 */
  const handleExportAll = useCallback(() => {
    return handleExportCore(undefined, 'all');
  }, [handleExportCore]);

  /** 导出所选：根据 selectedRowKeys 映射出 service 列表；勾选为空时给出提示 */
  const handleExportSelected = useCallback(() => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先勾选要导出的连接器');
      return Promise.resolve(false);
    }
    const services = draggableData
      .filter((item) => selectedRowKeys.includes(item.id))
      .map((item) => item.service)
      .filter(Boolean);
    if (services.length === 0) {
      message.warning('所选行缺少 service 字段，无法导出');
      return Promise.resolve(false);
    }
    return handleExportCore(services, 'selected');
  }, [selectedRowKeys, draggableData, handleExportCore]);

  /** 单行导出：操作列的"导出"按钮调用（mode='single'，不影响工具栏按钮样式） */
  const handleExportSingle = useCallback(
    (record: ConnectorProviderInfo) => {
      if (!record.service) {
        message.error('连接器 service 缺失，无法导出');
        return;
      }
      handleExportCore([record.service], 'single', record.displayName);
    },
    [handleExportCore],
  );

  /** 根据当前表单值更新筛选态（任一筛选条件非空即视为筛选态） */
  const updateFilteredFromForm = useCallback(() => {
    const values = formRef.current?.getFieldsValue() as
      | {
          displayName?: string;
          status?: string;
          authType?: string;
          connected?: string;
        }
      | undefined;
    setFormFiltered(
      Boolean(
        values?.displayName?.trim() ||
          values?.status ||
          values?.authType ||
          values?.connected,
      ),
    );
  }, []);

  /** 筛选态 = LightFilter 任一条件（连接器名称/认证方式/启用状态/连接状态）非空 */
  const filtered = formFiltered;

  /**
   * 重置（由筛选行右侧「重置」按钮触发）：
   * 走 ProTable 官方 reset 流程（清表单 + 清内部 formSearch + 重载，
   * 对齐菜单管理），再手动同步筛选态并清空勾选。
   * 注意 XProTable 传了 onReset 后会跳过默认 reset，必须在这里自行调用。
   */
  const handleReset = useCallback(() => {
    actionRef.current?.reset?.();
    // antd Form.resetFields() 不会触发 onValuesChange，需手动同步筛选态
    updateFilteredFromForm();
    setSelectedRowKeys([]);
  }, [updateFilteredFromForm]);

  /** 监听菜单切换：清空查询参数 */
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state, handleReset]);

  /** 启用/停用连接器：调 PUT /api/system/connector/providers/{service}?enabled={boolean} */
  const handleToggleStatus = useCallback(
    async (record: ConnectorProviderInfo) => {
      const service = record.service;
      if (!service) {
        message.error('连接器 service 缺失，无法切换状态');
        return;
      }
      // 重复点击保护：同 service 已在请求中则直接忽略
      if (togglingServices.has(service)) {
        return;
      }
      const nextEnabled = record.status !== 'enabled';

      setTogglingServices((prev) => {
        const next = new Set(prev);
        next.add(service);
        return next;
      });

      try {
        const response = await apiSystemConnectorProviderToggleStatus({
          service,
          enabled: nextEnabled,
        });
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'toggle failed');
        }
        message.success(nextEnabled ? '已启用该连接器' : '已停用该连接器');
        // 刷新列表，让 status 字段以服务端为准
        actionRef.current?.reload();
      } catch (err) {
        message.error(nextEnabled ? '启用连接器失败' : '停用连接器失败');
      } finally {
        setTogglingServices((prev) => {
          const next = new Set(prev);
          next.delete(service);
          return next;
        });
      }
    },
    [togglingServices],
  );

  /**
   * 删除连接器：行内「删除」按钮触发，先弹二次确认（与空间侧一致）；
   * 确认后调 DELETE /api/system/connector/providers/{service}（管理端接口，
   * 可删除官方目录条目；空间侧走 DELETE /api/connector/providers/{service}），
   * 成功刷新列表。业务/网络错误由全局 errorHandler 统一提示（如
   * 「连接器仍存在连接或绑定，不能删除」），此处不重复弹错；
   * antd confirm 的 onOk 内抛错会被转成 Unhandled Rejection
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
          const response = await apiSystemConnectorProviderDelete(
            record.service,
          );
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
   * 操作列：5 个按钮，走 TableActions（link 模式，统一蓝色文字，对齐菜单管理），
   * 按 record.status 动态展示启用/停用；启用/停用按钮自带 loading（防重复点击）
   */
  const renderActions = useCallback(
    (record: ConnectorProviderInfo) => {
      const actions: ActionItem<ConnectorProviderInfo>[] = [
        {
          // 查看：原地打开右侧详情抽屉（概览 + 工具列表表格，不跳路由保住筛选态）
          key: 'detail',
          label: '查看',
          onClick: () => {
            setEditRecord(null);
            setDetailService(record.service);
          },
        },
        {
          key: 'edit',
          label: '编辑',
          onClick: () => {
            setEditRecord(record);
          },
        },
        {
          key: 'export',
          label: '导出',
          onClick: () => handleExportSingle(record),
        },
        {
          key: 'toggle',
          label: record.status === 'enabled' ? '停用' : '启用',
          loading: togglingServices.has(record.service),
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
    [handleToggleStatus, togglingServices, handleExportSingle, handleDelete],
  );

  /** 拖拽结束：乐观更新 + 持久化 + 失败回滚 */
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    // 防御：筛选态下禁止排序（即使 DragHandle 漏过滤也能兜底）
    if (filtered) {
      isDraggingRef.current = false;
      return;
    }
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }

    const activeId = Number(active.id);
    const overId = Number(over.id);
    const activeIndex = draggableData.findIndex((item) => item.id === activeId);
    const overIndex = draggableData.findIndex((item) => item.id === overId);

    if (activeIndex === -1 || overIndex === -1) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    originalDataRef.current = [...draggableData];

    const newData = arrayMove(draggableData, activeIndex, overIndex);
    setDraggableData(newData);

    // 数组索引即排序：第一个元素最靠前
    const payload = { services: newData.map((item) => item.service) };

    if (payload.services.length === 0) {
      isDraggingRef.current = false;
      return;
    }

    try {
      const response = await apiSystemConnectorProviderOrder(payload);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error('update connector order failed');
      }
      message.success(dict('PC.Common.Global.saveSuccess'));
      originalDataRef.current = null;
    } catch {
      if (originalDataRef.current) {
        setDraggableData(originalDataRef.current);
        originalDataRef.current = null;
      } else {
        actionRef.current?.reload();
      }
    } finally {
      isDraggingRef.current = false;
    }
  };

  /**
   * 拖拽行组件：必须保持引用稳定（useCallback + useMemo）。
   * antd Table 的 components.body.row 是行元素类型，内联箭头函数会每次渲染
   * 生成新类型 → 全表行卸载重挂（TableActions 重新测宽 → 操作列闪动）。
   * 仅筛选态切换（filtered 变化，需更新行内 disabled）时才更换引用。
   */
  const dndBodyRow = useCallback(
    (
      props: React.HTMLAttributes<HTMLTableRowElement> & {
        'data-row-key': string | number;
      },
    ) => <Row {...props} disabled={filtered} />,
    [filtered],
  );
  const tableComponents = useMemo(
    () => ({ body: { row: dndBodyRow } }),
    [dndBodyRow],
  );

  /** 列定义 */
  const columns: ProColumns<ConnectorProviderInfo>[] = [
    {
      // 拖拽手柄列：紧跟勾选列之后、连接器列之前（勾选列由 rowSelection 自动前置）
      title: '排序',
      key: 'sort',
      align: 'center',
      width: 52,
      fixed: 'left',
      hideInSearch: true,
      render: () => <DragHandle />,
    },
    {
      // 连接器：仅展示名称（不加粗、无副标题，行高随之收紧）
      // 进 LightFilter：点击搜索图标展开输入框（回车 / 查询按钮触发），匹配 displayName 或 service
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
      // 鉴权方式
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
      // 连接状态筛选器：仅作为 LightFilter 筛选项（不在表格中占列），
      // 前端本地按 provider.connected 过滤
      title: '连接状态',
      dataIndex: 'connected',
      valueType: 'select',
      hideInTable: true,
      valueEnum: {
        true: { text: '已连接' },
        false: { text: '未连接' },
      },
      fieldProps: {
        options: CONNECTED_OPTIONS,
      },
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

  /** request 回调：拉取全量后客户端过滤（displayName 由 LightFilter 表单提交） */
  const request = async (params: any = {}) => {
    const { displayName, status, authType, connected } = params;
    try {
      const res = await apiSystemConnectorProviderList();

      if (!res || res.code !== SUCCESS_CODE) {
        message.error(res?.message || '获取连接器列表失败');
        return { data: [], total: 0, success: false };
      }

      const rawData = Array.isArray(res.data) ? res.data : [];
      let data = rawData as ConnectorProviderInfo[];

      // 关键字搜索：匹配 displayName 或 service（OR 语义）
      if (displayName) {
        const lower = String(displayName).toLowerCase();
        data = data.filter(
          (v) =>
            v.displayName?.toLowerCase().includes(lower) ||
            v.service?.toLowerCase().includes(lower),
        );
      }
      // 启用状态筛选
      if (status) {
        data = data.filter((v) => v.status === status);
      }
      // 认证方式筛选
      if (authType) {
        data = data.filter((v) => v.authType === authType);
      }
      // 连接状态筛选（provider.connected 本地过滤）
      if (connected) {
        const want = connected === 'true';
        data = data.filter((v) => Boolean(v.connected) === want);
      }

      return {
        data,
        total: data.length,
        success: true,
      };
    } catch {
      return { data: [], total: 0, success: false };
    }
  };

  return (
    <WorkspaceLayout
      title="官方连接器"
      hideScroll
      rightSlot={
        <Space size={12}>
          {/* 导出按钮各自只在自己导出时转 loading，互不禁用：
              并发点击由 handleExportCore 内的 exporting 守卫拦截 */}
          <Button
            icon={<DownloadOutlined />}
            loading={exporting === 'selected'}
            onClick={handleExportSelected}
          >
            导出所选
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting === 'all'}
            onClick={handleExportAll}
          >
            导出全部
          </Button>
          {/* 新增官方连接器：右侧滑出 ConnectorProviderCreateDrawer（创建逻辑待实现） */}
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateDrawerOpen(true)}
          >
            新增官方连接器
          </Button>
          {/* 导入官方包：右侧滑出 ConnectorImportDrawer（粘贴/选文件导入 JSON） */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportDrawerOpen(true)}
          >
            导入官方包
          </Button>
        </Space>
      }
    >
      {/* 连接器名称筛选下拉加宽：弹层（.ant-popover）挂在 body 下，无法用页面祖先选择器；
          借输入框上的 class 反查所属 popover，放宽弹层内层宽度到 250px（完整展示 placeholder） */}
      <style>{`
        .ant-popover:has(.connector-name-filter-input) .ant-popover-inner {
          width: 250px;
        }
      `}</style>
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={draggableData.map((item) => String(item.id))}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<ConnectorProviderInfo>
            actionRef={actionRef}
            formRef={formRef}
            rowKey="id"
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            showIndex={false}
            /**
             * 筛选行右侧的 重置/查询 按钮（showQueryButtons 默认开启，对齐菜单管理）：
             * 重置走 onReset（清表单 + 清勾选 + 重载），查询走 form submit
             */
            onReset={handleReset}
            /**
             * 启用虚拟滚动：仅渲染可视区内的行，1256 条也无压力。
             * drag-sort 仍可用：SortableContext 按 ID 追踪，虚拟 row mount/unmount 不影响。
             * listItemHeight 对齐 middle 单行内容实际行高，避免最后一行被裁切。
             */
            virtual
            listItemHeight={48}
            tableLayout="fixed"
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys,
              onChange: (keys) => setSelectedRowKeys(keys),
              preserveSelectedRowKeys: true,
              // 勾选列宽度：对齐 antd 默认 32（复选框 16 + 两侧各 8 内边距）
              columnWidth: 32,
            }}
            /**
             * 隐藏 ProTable 默认的"已选择 X 项"提示条。
             * 传 () => null 让整条 alert 区域不渲染，避免和工具栏操作混淆。
             */
            tableAlertRender={() => null}
            /**
             * 跟踪筛选状态：任一筛选条件（displayName/status/authType/connected）非空即认为处于筛选态。
             * 筛选态下拖拽排序会让全局顺序错乱，因此禁用。
             */
            form={{
              onValuesChange: () => {
                // 实时同步筛选态（用户修改 LightFilter 字段时触发）
                updateFilteredFromForm();
              },
            }}
            components={tableComponents}
            postData={(data: ConnectorProviderInfo[]) => {
              // 拖拽过程中不要用 request 的响应覆盖乐观排序结果
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              return data;
            }}
          />
        </SortableContext>
      </DndContext>

      <ConnectorProviderEditDrawer
        open={editRecord !== null}
        record={editRecord}
        onClose={() => setEditRecord(null)}
        // 保存成功：刷新连接器列表（GET /api/system/connector/providers），
        // 并原地打开「查看」详情抽屉（抽屉内部会拉
        // GET /api/connector/providers/{service} 展示最新数据）
        onSaved={(payload) => {
          actionRef.current?.reload();
          const service =
            editRecord?.service ??
            (payload as { service?: string } | undefined)?.service;
          if (service) {
            setDetailService(service);
          }
          setEditRecord(null);
        }}
      />
      {/*
          查看详情抽屉（右侧滑出，原地展开不跳路由 —— 列表筛选态保留）：
          连接状态变化（连接/授权/断开）与工具增删改后刷新列表展示
        */}
      <ConnectorProviderDetailDrawer
        open={detailService !== null}
        service={detailService ?? ''}
        onClose={() => setDetailService(null)}
        onConnectionChanged={() => actionRef.current?.reload()}
        onActionsChanged={() => actionRef.current?.reload()}
      />
      {/*
          新增官方连接器抽屉（右侧滑出）
          创建成功后刷新连接器列表（GET /api/system/connector/providers）
        */}
      <ConnectorProviderCreateDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onCreated={() => actionRef.current?.reload()}
      />
      {/*
          导入官方包抽屉（右侧滑出）
          导入成功后刷新连接器列表（GET /api/system/connector/providers）
        */}
      <ConnectorImportDrawer
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        onImported={() => actionRef.current?.reload()}
      />
    </WorkspaceLayout>
  );
};

export default ConnectorManage;
