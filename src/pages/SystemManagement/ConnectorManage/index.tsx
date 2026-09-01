import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiSystemConnectorProviderExport,
  apiSystemConnectorProviderList,
  apiSystemConnectorProviderOrder,
  apiSystemConnectorProviderToggleStatus,
} from '@/services/systemManage';
import { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import { DownloadOutlined } from '@ant-design/icons';
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
import { Button, message, Space, Spin, Tag } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'umi';

/**
 * 连接器管理列表页
 * 视觉与交互参考 GlobalModelManage（公共模型管理）
 * 数据源：GET /api/system/connector/providers（非分页）
 * 排序持久化：PUT /api/system/connector/providers/order
 */

/* 鉴权方式筛选选项（空串=全部） */
const AUTH_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: '' },
  { label: '免鉴权', value: 'no_auth' },
  { label: 'Api Key', value: 'api_key' },
  { label: 'Bearer', value: 'bearer' },
  { label: 'Outh 2.0', value: 'oauth2' },
  { label: '自定义', value: 'custom' },
];

/* 鉴权方式值到中文标签 */
const AUTH_TYPE_LABEL_MAP: Record<string, string> = {
  no_auth: '免鉴权',
  api_key: 'Api Key',
  bearer: 'Bearer',
  oauth2: 'Outh 2.0',
  custom: '自定义',
};

/* 状态筛选选项（空串=全部） */
const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '停用', value: 'disabled' },
];

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
   * 当前是否处于筛选态（任一筛选条件非空）。
   * 筛选态下禁用拖拽排序：排序值是全局的，对过滤后的子集重排会让全量顺序错乱。
   */
  const [filtered, setFiltered] = useState<boolean>(false);
  /**
   * 导出进行中标记：'all' / 'selected' / null
   * 用来给对应 toolbar 按钮加 loading 态，并避免重复点击。
   */
  const [exporting, setExporting] = useState<'all' | 'selected' | null>(null);

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
      mode: 'all' | 'selected',
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
            mode === 'all' ? '已导出全部连接器' : '已导出所选连接器',
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

  /** 单行导出：操作列的"导出"按钮调用 */
  const handleExportSingle = useCallback(
    (record: ConnectorProviderInfo) => {
      if (!record.service) {
        message.error('连接器 service 缺失，无法导出');
        return;
      }
      handleExportCore([record.service], 'selected', record.displayName);
    },
    [handleExportCore],
  );

  /** 根据当前表单值更新筛选态（任一筛选条件非空即视为筛选态） */
  const updateFilteredFromForm = useCallback(() => {
    const values = formRef.current?.getFieldsValue() as
      | { displayName?: string; status?: string; authType?: string }
      | undefined;
    setFiltered(
      Boolean(values?.displayName || values?.status || values?.authType),
    );
  }, []);

  /** 重置：清空表单 + 重置分页 + 重载 */
  const handleReset = useCallback(() => {
    formRef.current?.resetFields();
    // antd Form.resetFields() 不会触发 onValuesChange，需手动同步筛选态
    updateFilteredFromForm();
    actionRef.current?.reset?.();
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
    actionRef.current?.reload();
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

  /** 操作列：4 个按钮（按 record.status 动态展示启用/停用，启用/停用调用真实接口） */
  const renderActions = useCallback(
    (record: ConnectorProviderInfo) => {
      const isEnabled = record.status === 'enabled';
      const toggling = togglingServices.has(record.service);
      return (
        <Space size={12} className="connector-row-actions">
          <a onClick={() => message.info('查看功能开发中')}>查看</a>
          <a onClick={() => message.info('编辑功能开发中')}>编辑</a>
          <a onClick={() => handleExportSingle(record)}>导出</a>
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
        </Space>
      );
    },
    [handleToggleStatus, togglingServices, handleExportSingle],
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

  /** 列定义 */
  const columns: ProColumns<ConnectorProviderInfo>[] = [
    {
      // 连接器：显示名 + 标签副标题（2 行布局）
      // XProTable 已通过 size="large" 把行高拉到 ~64px，可容纳副标题不被裁剪。
      title: '连接器',
      dataIndex: 'displayName',
      width: 120,
      fieldProps: {
        placeholder: '搜索连接器（名称 / service）',
      },
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
      // 鉴权方式
      title: '认证',
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
        <Tag color={record.authType === 'no_auth' ? 'default' : 'blue'}>
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
      // 状态
      title: '状态',
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
      // 更新时间
      title: '更新时间',
      dataIndex: 'modified',
      width: 170,
      hideInSearch: true,
      valueType: 'dateTime',
      align: 'center',
    },
    {
      // 拖拽手柄列（移到操作列左侧）
      title: '排序',
      key: 'sort',
      align: 'center',
      width: 64,
      hideInSearch: true,
      render: () => <DragHandle />,
    },
    {
      // 操作列：4 个按钮平铺（fixed right 保证滚动时常驻）
      title: '操作',
      width: 220,
      align: 'center',
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => renderActions(record),
    },
  ];

  /** request 回调：拉取全量后客户端过滤 */
  const request = async (params: any = {}) => {
    const { displayName, status, authType } = params;
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
        const kw = String(displayName).toLowerCase();
        data = data.filter(
          (v) =>
            v.displayName?.toLowerCase().includes(kw) ||
            v.service?.toLowerCase().includes(kw),
        );
      }
      // 状态筛选
      if (status) {
        data = data.filter((v) => v.status === status);
      }
      // 鉴权筛选
      if (authType) {
        data = data.filter((v) => v.authType === authType);
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
      title="连接器管理"
      hideScroll
      rightSlot={
        <Space size={12}>
          <Button
            icon={<DownloadOutlined />}
            loading={exporting === 'selected'}
            disabled={exporting === 'all'}
            onClick={handleExportSelected}
          >
            导出所选
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting === 'all'}
            disabled={exporting === 'selected'}
            onClick={handleExportAll}
          >
            导出全部
          </Button>
        </Space>
      }
    >
      <div className="connector-manage-page">
        <style>{`
          /* 勾选列表头与列表左对齐：覆盖 XProTable 默认 24px 内边距 */
          .connector-manage-page .x-pro-table .ant-table-thead > tr > th.ant-table-selection-column,
          .connector-manage-page .x-pro-table .ant-table-tbody > tr > td.ant-table-selection-column {
            padding-left: 28px !important;
            text-align: left !important;
          }
          /* 整个 ant-pro-table-alert 区域（含提示文本和操作按钮）都隐藏 */
          .connector-manage-page .x-pro-table .ant-pro-table-alert {
            display: none !important;
          }
          /* 仅对"连接器"筛选 popover 加宽：
             antd popover 通过 Portal 渲染到 document.body 下，不在 .connector-manage-page 子树里，
             因此无法用祖先选择器做作用域。改为靠 input[placeholder^="搜索连接器"] 作唯一锚点
             —— 只有本页"连接器"筛选的 placeholder 以"搜索连接器"开头，其他页 LightFilter 不会命中。
             兼容主流浏览器（Chrome 105+/Edge 105+/Safari 15.4+/Firefox 121+ 支持 :has()）。 */
          .ant-popover .ant-popover-content:has(input[placeholder^="搜索连接器"]) {
            min-width: 260px !important;
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
              onReset={handleReset}
              showQueryButtons
              /**
               * 两行内容需要更高的虚拟项高度；这里显式对齐到实际 row 高度，避免最后一行被裁切。
               * 列宽总和 ≈ 1014（不含勾选列 50），无横向滚动。
               */
              size="large"
              listItemHeight={74}
              tableLayout="fixed"
              scroll={{ x: 1064 }}
              /**
               * 启用虚拟滚动：仅渲染可视区内的行，1256 条也无压力。
               * drag-sort 仍可用：SortableContext 按 ID 追踪，虚拟 row mount/unmount 不影响。
               */
              virtual
              rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
                preserveSelectedRowKeys: true,
                columnWidth: 50,
              }}
              /**
               * 隐藏 ProTable 默认的"已选择 X 项"提示条。
               * 传 () => null 让整条 alert 区域不渲染，避免和工具栏操作混淆。
               */
              tableAlertRender={() => null}
              /**
               * 跟踪筛选状态：任一筛选条件（displayName/status/authType）非空即认为处于筛选态。
               * 筛选态下拖拽排序会让全局顺序错乱，因此禁用。
               */
              form={{
                onValuesChange: () => {
                  // 实时同步筛选态（用户修改 LightFilter 字段时触发）
                  updateFilteredFromForm();
                },
              }}
              components={{
                body: {
                  // 筛选态下禁用整行的 useSortable，DragHandle 通过 Context 也会自动禁用
                  row: (
                    props: React.HTMLAttributes<HTMLTableRowElement> & {
                      'data-row-key': string | number;
                    },
                  ) => <Row {...props} disabled={filtered} />,
                },
              }}
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
      </div>
    </WorkspaceLayout>
  );
};

export default ConnectorManage;
