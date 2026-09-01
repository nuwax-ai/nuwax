import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiSystemConnectorProviderList,
  apiSystemConnectorProviderOrder,
} from '@/services/systemManage';
import { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
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
import { message, Space, Tag } from 'antd';
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
  { label: '禁用', value: 'disabled' },
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

  /** 重置：清空表单 + 重置分页 + 重载 */
  const handleReset = useCallback(() => {
    formRef.current?.resetFields();
    actionRef.current?.reset?.();
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
    actionRef.current?.reload();
    setSelectedRowKeys([]);
  }, []);

  /** 监听菜单切换：清空查询参数 */
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state, handleReset]);

  /** 操作列：4 个占位按钮（按 record.status 动态展示启用/停用） */
  const renderActions = useCallback(
    (record: ConnectorProviderInfo) => (
      <Space size={12} className="connector-row-actions">
        <a onClick={() => message.info('查看功能开发中')}>查看</a>
        <a onClick={() => message.info('编辑功能开发中')}>编辑</a>
        <a onClick={() => message.info('导出功能开发中')}>导出</a>
        <a onClick={() => message.info('状态切换功能开发中')}>
          {record.status === 'enabled' ? '停用' : '启用'}
        </a>
      </Space>
    ),
    [],
  );

  /** 拖拽结束：乐观更新 + 持久化 + 失败回滚 */
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
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
        disabled: { text: '禁用', status: 'Default' },
      },
      fieldProps: {
        options: STATUS_OPTIONS.filter((v) => v.value !== ''),
      },
      render: (_, record) => (
        <Tag color={record.status === 'enabled' ? 'green' : 'default'}>
          {record.status === 'enabled' ? '启用' : '禁用'}
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
    <WorkspaceLayout title="连接器管理" hideScroll>
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
               * size="large" 把行高拉到 ~64px，容纳"显示名 + tags 副标题"两行布局不被裁剪。
               * 列宽总和 ≈ 1014（不含勾选列 50），无横向滚动。
               */
              size="large"
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
              components={{
                body: { row: Row },
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
