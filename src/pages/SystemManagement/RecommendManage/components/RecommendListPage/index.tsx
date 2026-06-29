import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import { TableActions, XProTable } from '@/components/ProComponents';
import type { ActionItem } from '@/components/ProComponents/TableActions';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { App, Button } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'umi';
import { type RecommendPageConfig } from '../../constants';
import {
  apiSystemDeleteDisplayRecommend,
  apiSystemGetDisplayRecommendList,
  apiSystemUpdateDisplayRecommendSort,
} from '../../services/recomment';
import {
  DisplayRecommendFunctionTypeEnum,
  DisplayRecommendInfo,
  DisplayRecommendTargetTypeEnum,
  DisplayRecTypeEnum,
} from '../../types';
import { getChatboxFunctionTypeLabel } from '../../utils/chatboxFunctionTypeLabel';
import { getSquareTargetTypeTitle } from '../../utils/squareTargetTypeLabel';
import RecommendAddModal from '../RecommendAddModal';
import RecommendFormModal from '../RecommendFormModal';

export interface RecommendListPageProps {
  titleKey: string;
  config: RecommendPageConfig;
}

/** 列表一次性拉取条数（前端不分页，接口仍传分页参数） */
const LIST_PAGE_SIZE = 1000;

/**
 * 推荐管理通用列表页
 */
const RecommendListPage: React.FC<RecommendListPageProps> = ({
  titleKey,
  config,
}) => {
  const { modal, message } = App.useApp();
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  const isDraggingRef = useRef(false);
  const originalDataRef = useRef<DisplayRecommendInfo[] | null>(null);

  const [records, setRecords] = useState<DisplayRecommendInfo[]>([]);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<DisplayRecommendInfo | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const isChatboxPage = config.recType === DisplayRecTypeEnum.ChatBoxNav;

  /** 新增时的默认排序值 */
  const defaultSort = useMemo(() => {
    const maxSort = records.reduce(
      (max, item) => Math.max(max, item.sort ?? 0),
      0,
    );
    return Math.max(maxSort, records.length) + 1;
  }, [records]);

  /** 可拖拽的推荐列表项 ID 列表 */
  const sortableItems = useMemo(
    () => records.map((item) => String(item.id)),
    [records],
  );

  /** 重新加载表格 */
  const reloadTable = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  /** 切换推荐类型时重置列表 */
  useEffect(() => {
    setRecords([]);
  }, [config.recType]);

  /** 监听页面状态变化 */
  useEffect(() => {
    const state = location.state as { _t?: number } | undefined;
    if (state?._t) {
      reloadTable();
    }
  }, [location.state, reloadTable]);

  /**
   * 查询推荐列表请求函数
   */
  const tableRequest = useCallback(
    async (params: {
      current?: number;
      pageSize?: number;
      label?: string;
      name?: string;
    }) => {
      // 查询推荐列表（按当前页面 recType 筛选）
      const res = await apiSystemGetDisplayRecommendList({
        pageNo: 1,
        pageSize: LIST_PAGE_SIZE,
        name: params.label || params.name,
        recType: config.recType,
      });

      if (res?.code !== SUCCESS_CODE) {
        return { data: [], success: false, total: 0 };
      }

      const records = res.data?.records || [];

      return {
        data: records,
        success: true,
        total: records.length,
      };
    },
    [config.recType],
  );

  /**
   * 删除推荐
   */
  const handleDelete = useCallback(
    (record: DisplayRecommendInfo) => {
      modal.confirm({
        title: dict('PC.Pages.SystemRecommendManage.confirmDeleteTitle'),
        content: dict('PC.Pages.SystemRecommendManage.confirmDeleteContent'),
        onOk: async () => {
          const res = await apiSystemDeleteDisplayRecommend(record.id);
          if (res?.code === SUCCESS_CODE) {
            message.success(dict('PC.Common.Global.deleteSuccess'));
            reloadTable();
          }
        },
      });
    },
    [modal, message, reloadTable],
  );

  /**
   * 获取操作列（首页/官方推荐仅删除；对话框智能体支持编辑）
   */
  const getActions = useCallback(
    (record: DisplayRecommendInfo): ActionItem<DisplayRecommendInfo>[] => {
      const actions: ActionItem<DisplayRecommendInfo>[] = [];

      /* 对话框智能体支持编辑 */
      if (isChatboxPage) {
        actions.push({
          key: 'edit',
          label: dict('PC.Common.Global.edit'),
          onClick: () => {
            setEditingRecord(record);
            setFormModalOpen(true);
          },
        });
      }

      actions.push({
        key: 'delete',
        label: dict('PC.Common.Global.delete'),
        danger: true,
        onClick: () => handleDelete(record),
      });

      return actions;
    },
    [handleDelete, isChatboxPage],
  );

  /**
   * 表格列定义（对话框智能体页额外展示子类型列）
   */
  const columns: ProColumns<DisplayRecommendInfo>[] = useMemo(() => {
    const baseColumns: ProColumns<DisplayRecommendInfo>[] = [
      {
        title: dict('PC.Pages.SystemRoleManage.columnSort'),
        key: 'dragHandle',
        width: 72,
        align: 'center',
        search: false,
        render: () => <DragHandle />,
      },
      {
        title: dict('PC.Pages.SystemRecommendManage.colLabel'),
        dataIndex: 'label',
        ellipsis: true,
        fieldProps: {
          placeholder: dict('PC.Pages.SystemRecommendManage.searchName'),
          allowClear: true,
        },
      },
      {
        title: dict('PC.Pages.SystemRecommendManage.colTargetId'),
        dataIndex: 'targetId',
        width: 120,
        search: false,
      },
    ];

    if (!isChatboxPage) {
      baseColumns.push({
        title: dict('PC.Pages.SystemRecommendManage.colTargetType'),
        dataIndex: 'targetType',
        width: 120,
        search: false,
        render: (_, record) =>
          getSquareTargetTypeTitle(
            record.targetType as DisplayRecommendTargetTypeEnum,
          ),
      });
    }

    if (isChatboxPage) {
      baseColumns.push({
        title: dict('PC.Pages.SystemRecommendManage.colSubType'),
        dataIndex: 'functionType',
        width: 120,
        search: false,
        render: (_, record) =>
          record.functionType
            ? getChatboxFunctionTypeLabel(
                record.functionType as DisplayRecommendFunctionTypeEnum,
              )
            : '-',
      });
    }

    baseColumns.push(
      {
        title: dict('PC.Pages.SystemRecommendManage.colCreated'),
        dataIndex: 'created',
        width: 170,
        search: false,
        valueType: 'dateTime',
      },
      {
        title: dict('PC.Pages.SystemRecommendManage.colModified'),
        dataIndex: 'modified',
        width: 170,
        search: false,
        valueType: 'dateTime',
      },
      {
        title: dict('PC.Pages.SystemRecommendManage.colAction'),
        valueType: 'option',
        width: isChatboxPage ? 140 : 80,
        align: 'center',
        render: (_, record) => (
          <TableActions record={record} actions={getActions(record)} />
        ),
      },
    );

    return baseColumns;
  }, [config.recType, getActions, isChatboxPage]);

  /**
   * 拖拽结束
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }

    const oldIndex = records.findIndex(
      (item) => String(item.id) === String(active.id),
    );
    const newIndex = records.findIndex(
      (item) => String(item.id) === String(over.id),
    );
    if (oldIndex < 0 || newIndex < 0) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    originalDataRef.current = [...records];

    const reordered = arrayMove(records, oldIndex, newIndex).map(
      (item, index) => ({
        ...item,
        sort: index + 1,
      }),
    );
    setRecords(reordered);

    try {
      const res = await apiSystemUpdateDisplayRecommendSort({
        items: reordered.map((item, index) => ({
          id: item.id,
          sortIndex: index + 1,
        })),
      });
      if (res?.code !== SUCCESS_CODE) {
        throw new Error('update sort failed');
      }
      message.success(dict('PC.Pages.SystemRecommendManage.sortUpdated'));
      originalDataRef.current = null;
    } catch {
      if (originalDataRef.current) {
        setRecords(originalDataRef.current);
        originalDataRef.current = null;
      } else {
        reloadTable();
      }
    } finally {
      isDraggingRef.current = false;
    }
  };

  return (
    <WorkspaceLayout
      title={dict(titleKey)}
      hideScroll
      rightSlot={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRecord(null);
            if (isChatboxPage) {
              setFormModalOpen(true);
            } else {
              setAddModalOpen(true);
            }
          }}
        >
          {dict('PC.Pages.SystemRecommendManage.addTitle')}
        </Button>
      }
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={sortableItems}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<DisplayRecommendInfo>
            key={config.recType}
            actionRef={actionRef}
            rowKey="id"
            columns={columns}
            request={tableRequest}
            dataSource={records}
            pagination={false}
            search={{ labelWidth: 'auto' }}
            options={false}
            components={{ body: { row: Row } }}
            postData={(data: DisplayRecommendInfo[]) => {
              if (!isDraggingRef.current) {
                setRecords(data || []);
              }
              return data;
            }}
          />
        </SortableContext>
      </DndContext>

      {/* 首页/官方推荐：新建弹窗 */}
      {!isChatboxPage && (
        <RecommendAddModal
          open={addModalOpen}
          recType={config.recType}
          existingRecords={records}
          defaultSort={defaultSort}
          onCancel={() => setAddModalOpen(false)}
          onSuccess={reloadTable}
        />
      )}

      {/* 对话框智能体：新增 / 编辑推荐弹窗 */}
      {isChatboxPage && (
        <RecommendFormModal
          open={formModalOpen}
          editingRecord={editingRecord}
          existingRecords={records}
          defaultSort={defaultSort}
          onCancel={() => {
            setFormModalOpen(false);
            setEditingRecord(null);
          }}
          onSuccess={reloadTable}
        />
      )}
    </WorkspaceLayout>
  );
};

export default RecommendListPage;
