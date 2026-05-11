import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Form, message, Switch } from 'antd';
import React, { useRef, useState } from 'react';
import {
  apiDeleteCreditPackage,
  apiGetCreditPackageList,
  apiUpdateCreditPackage,
  apiUpdateCreditPackageSort,
} from '../services/credit';
import { CreditPackageInfo, CreditPackageStatusEnum } from '../types/credit';
import CreditPackageFormModal from './CreditPackageFormModal';

type CreditPackageRow = CreditPackageInfo & { key: number };

/**
 * 积分套餐管理页面
 */
const CreditPackages: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalOpen, setModalOpen] = useState(false);
  const [creditPackageInfo, setCreditPackageInfo] =
    useState<CreditPackageInfo | null>(null);
  const [draggableData, setDraggableData] = useState<CreditPackageRow[]>([]);
  const isDraggingRef = useRef<boolean>(false);
  const originalDataRef = useRef<CreditPackageRow[] | null>(null);
  const [form] = Form.useForm();

  const openCreate = () => {
    setCreditPackageInfo(null);
    form.resetFields();
    form.setFieldsValue({ enabled: true });
    setModalOpen(true);
  };

  const openEdit = (item: CreditPackageInfo) => {
    setCreditPackageInfo(item);
    form.setFieldsValue(item);
    setModalOpen(true);
  };

  const handleDelete = (item: CreditPackageInfo) => {
    if (!item.id) {
      return;
    }
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.packageName,
      async () => {
        await apiDeleteCreditPackage(item.id as number);
        message.success(dict('PC.Common.Global.deleteSuccess'));
        actionRef.current?.reload();
      },
    );
  };

  // 切换状态
  const handleToggle = async (item: CreditPackageInfo, enabled: boolean) => {
    if (!item.id) {
      return;
    }
    await apiUpdateCreditPackage({
      ...item,
      status: enabled
        ? CreditPackageStatusEnum.Enabled
        : CreditPackageStatusEnum.Disabled,
    });
    message.success(
      enabled
        ? dict('PC.Common.Global.enableSuccess')
        : dict('PC.Common.Global.disableSuccess'),
    );
    actionRef.current?.reload();
  };

  // 列配置
  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }

    const activeKey = Number(active.id);
    const overKey = Number(over.id);
    const activeIndex = draggableData.findIndex(
      (item) => item.key === activeKey,
    );
    const overIndex = draggableData.findIndex((item) => item.key === overKey);

    if (activeIndex === -1 || overIndex === -1) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    originalDataRef.current = [...draggableData];

    const newData = arrayMove(draggableData, activeIndex, overIndex);
    setDraggableData(newData);

    const sortPayload = newData
      .filter((item): item is CreditPackageRow & { id: number } => !!item.id)
      .map((item, index) => ({
        id: item.id,
        sort: index + 1,
      }));

    if (sortPayload.length === 0) {
      isDraggingRef.current = false;
      return;
    }

    try {
      const response = await apiUpdateCreditPackageSort(sortPayload);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error('update credit package sort failed');
      }
      message.success(dict('PC.Common.Global.saveSuccess'));
      originalDataRef.current = null;
    } catch (error) {
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

  const columns: ProColumns<CreditPackageRow>[] = [
    {
      title: dict('PC.Pages.SystemRoleManage.columnSort'),
      key: 'sort',
      align: 'center',
      width: 72,
      fixed: 'left',
      search: false,
      render: () => <DragHandle />,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colName'),
      dataIndex: 'packageName',
      key: 'packageName',
      search: false,
      render: (_, record) => <span>{record.packageName || '-'}</span>,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colCredits'),
      dataIndex: 'creditAmount',
      key: 'creditAmount',
      search: false,
      // render: (val) => `${val} 积分`,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colValidityPeriod'),
      dataIndex: 'period',
      key: 'period',
      search: false,
      render: (_, record) => `${record.period || '-'} 个月`,
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colPrice'),
      dataIndex: 'price',
      key: 'price',
      search: false,
      render: (_, record) => (
        <span>{record.price ? `¥${record.price}` : '-'}</span>
      ),
    },
    {
      title: dict('PC.Pages.SystemCreditPackages.colStatus'),
      dataIndex: 'status',
      key: 'status',
      search: true,
      valueType: 'select',
      valueEnum: {
        [CreditPackageStatusEnum.Enabled]: '启用',
        [CreditPackageStatusEnum.Disabled]: '禁用',
      },
      render: (_, record) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Switch
            checked={record.status === 1}
            onChange={(v) => handleToggle(record, v)}
          />
        </span>
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      search: false,
      width: 120,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (r) => openEdit(r),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              // confirm: { title: dict('PC.Common.Global.confirmDelete') },
              onClick: (r) => handleDelete(r),
            },
          ]}
        />
      ),
    },
  ];

  /**
   * ProTable request 函数
   */
  const request = async (params: {
    pageSize?: number;
    current?: number;
    keyword?: string;
    status?: number;
  }) => {
    const response = await apiGetCreditPackageList(params.status);
    const list = (response?.data || []).map((item, index) => ({
      ...item,
      key: item.id ?? index + 1,
    }));

    return {
      data: list,
      total: list.length,
      success: response?.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.creditsPackages')}
      rightSlot={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          {dict('PC.Pages.SystemCreditPackages.createPackage')}
        </Button>
      }
    >
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={draggableData.map((item) => String(item.key))}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<CreditPackageRow>
            rowKey="key"
            actionRef={actionRef}
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            showIndex={false}
            components={{
              body: {
                row: Row,
              },
            }}
            postData={(data: CreditPackageRow[]) => {
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              return data;
            }}
          />
        </SortableContext>
      </DndContext>

      {/* 新建、编辑积分套餐表单弹窗 */}
      <CreditPackageFormModal
        form={form}
        open={modalOpen}
        creditPackageInfo={creditPackageInfo}
        onSuccess={() => {
          setModalOpen(false);
          actionRef.current?.reload();
        }}
        onCancel={() => setModalOpen(false)}
      />
    </WorkspaceLayout>
  );
};

export default CreditPackages;
