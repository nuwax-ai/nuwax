import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiI18nAllLangList,
  apiI18nDeleteLang,
  apiI18nLangUpdate,
  apiI18nSetLangDefault,
  apiI18nUpdateLangSort,
} from '@/services/i18n';
import { dict } from '@/services/i18nRuntime';
import {
  I18nLangIsDefaultEnum,
  I18nLangStatusEnum,
  type I18nLangDto,
} from '@/types/interfaces/i18n';
import { modalConfirm } from '@/utils/ant-custom';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
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
import { Button, Empty, message, Space, Switch, Tooltip } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import AddLangModal from './AddLangModal';

/**
 * 语言列表管理页面
 */
const I18nManage: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [langInfo, setLangInfo] = useState<I18nLangDto | null>(null);
  const [draggableData, setDraggableData] = useState<I18nLangDto[]>([]);
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  /** 拖拽过程中避免 postData 覆盖本地顺序 */
  const isDraggingRef = useRef<boolean>(false);
  const originalDragDataRef = useRef<I18nLangDto[] | null>(null);
  // 设置为默认语言的loading id
  const [defaultLoadingId, setDefaultLoadingId] = useState<number | null>(null);
  // 设置启用状态的loading id
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  // 格式化日期时间
  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = dayjs(value);
    if (!date.isValid()) return '-';
    return date.format('YYYY-MM-DD HH:mm:ss');
  };

  // 查看语言
  const handleView = (record: I18nLangDto) => {
    const defaultLang = draggableData?.find(
      (item) => item.isDefault === I18nLangIsDefaultEnum.Yes,
    )?.lang;
    if (defaultLang) {
      if (record.lang === defaultLang) {
        history.push(`/system/config/lang-content/${record.lang}`);
      } else {
        history.push(
          `/system/config/lang-content/${record.lang}?defaultLang=${defaultLang}`,
        );
      }
    } else {
      message.warning(dict('PC.Pages.SystemConfigI18n.noDefaultLang'));
    }
  };

  // 编辑语言
  const handleEdit = (record: I18nLangDto) => {
    setLangInfo(record);
    setAddModalOpen(true);
  };

  // 新增语言
  const handleAdd = () => {
    setLangInfo(null);
    setAddModalOpen(true);
  };

  const request = useCallback(async () => {
    try {
      const res = await apiI18nAllLangList();
      if (res?.code !== SUCCESS_CODE || !Array.isArray(res.data)) {
        setDraggableData([]);
        return { data: [], total: 0, success: false };
      }
      const data: I18nLangDto[] = [...res.data];
      return {
        data,
        total: data.length,
        success: true,
      };
    } catch (e) {
      console.error('[I18nManage] query lang list failed', e);
      setDraggableData([]);
      return { data: [], total: 0, success: false };
    }
  }, []);

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  // 删除语言
  const { run: runDeleteLang } = useRequest(apiI18nDeleteLang, {
    manual: true,
    onSuccess: () => {
      reloadTable();
    },
  });

  // 删除语言
  const handleDelete = (record: I18nLangDto) => {
    modalConfirm(
      dict('PC.Pages.SystemConfig.I18nManage.deleteLangTitle'),
      dict('PC.Pages.SystemConfig.I18nManage.deleteLangConfirm', record.name),
      async () => {
        await runDeleteLang(record.id);
        return Promise.resolve();
      },
    );
  };

  // 设置为默认语言
  const { run: runSetLangDefault } = useRequest(apiI18nSetLangDefault, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      setDefaultLoadingId(null);
      reloadTable();
    },
    onError: () => {
      setDefaultLoadingId(null);
    },
  });

  // 设置为默认语言
  const handleSetDefault = async (checked: boolean, record: I18nLangDto) => {
    if (!checked || record.isDefault === I18nLangIsDefaultEnum.Yes) {
      return;
    }
    setDefaultLoadingId(record.id);
    runSetLangDefault(record.id);
  };

  // 更新语言启用状态
  const { run: runUpdateLangStatus } = useRequest(apiI18nLangUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      setStatusLoadingId(null);
      reloadTable();
    },
    onError: () => {
      setStatusLoadingId(null);
    },
  });

  // 切换语言启用状态
  const handleToggleStatus = (checked: boolean, record: I18nLangDto) => {
    setStatusLoadingId(record.id);
    runUpdateLangStatus({
      id: record.id,
      status: checked
        ? I18nLangStatusEnum.Enabled
        : I18nLangStatusEnum.Disabled,
    });
  };

  // 新增语言默认排序值：优先使用当前最大 sort + 1，否则使用列表长度 + 1
  const addSortIndex = useMemo(() => {
    if (!draggableData.length) return 1;
    const maxSort = Math.max(
      ...draggableData.map((item) =>
        typeof item.sort === 'number' ? item.sort : 0,
      ),
    );
    if (maxSort > 0) return maxSort + 1;
    return draggableData.length + 1;
  }, [draggableData]);

  // 拖拽排序
  const { run: runUpdateLangSort } = useRequest(apiI18nUpdateLangSort, {
    manual: true,
    onSuccess: () => {
      originalDragDataRef.current = null;
      isDraggingRef.current = false;
      reloadTable();
    },
    onError: () => {
      isDraggingRef.current = false;
      if (originalDragDataRef.current) {
        setDraggableData(originalDragDataRef.current);
        originalDragDataRef.current = null;
      }
    },
  });

  // 拖拽结束
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      isDraggingRef.current = false;
      return;
    }
    const activeId = Number(active.id);
    const overId = Number(over.id);
    const activeIndex = draggableData.findIndex((item) => item.id === activeId);
    const overIndex = draggableData.findIndex((item) => item.id === overId);
    if (activeIndex < 0 || overIndex < 0) {
      isDraggingRef.current = false;
      return;
    }

    isDraggingRef.current = true;
    originalDragDataRef.current = [...draggableData];
    const nextData = arrayMove(draggableData, activeIndex, overIndex);
    const sortedData = nextData.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));
    setDraggableData(sortedData);
    runUpdateLangSort(sortedData);
  };

  const columns: ProColumns<I18nLangDto>[] = [
    {
      title: '',
      key: 'dragSort',
      width: 60,
      fixed: 'left',
      render: () => <DragHandle />,
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnName'),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnLang'),
      dataIndex: 'lang',
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnDefault'),
      dataIndex: 'isDefault',
      render: (_, record) => (
        <Switch
          checked={record.isDefault === I18nLangIsDefaultEnum.Yes}
          disabled={record.isDefault === I18nLangIsDefaultEnum.Yes}
          loading={defaultLoadingId === record.id}
          onChange={(checked) => handleSetDefault(checked, record)}
        />
      ),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnStatus'),
      dataIndex: 'status',
      render: (_, record) => (
        <Switch
          checked={record.status === I18nLangStatusEnum.Enabled}
          disabled={
            record.isDefault === I18nLangIsDefaultEnum.Yes &&
            record.status === I18nLangStatusEnum.Enabled
          }
          loading={statusLoadingId === record.id}
          onChange={(checked) => handleToggleStatus(checked, record)}
        />
      ),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnSort'),
      dataIndex: 'sort',
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnModified'),
      dataIndex: 'modified',
      width: 200,
      render: (_, record) => formatDateTime(record.modified),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnCreated'),
      dataIndex: 'created',
      width: 200,
      render: (_, record) => formatDateTime(record.created),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnAction'),
      key: 'actions',
      align: 'center',
      width: 140,
      fixed: 'right',
      render: (_value, record) => {
        const isDefaultLang = record.isDefault === I18nLangIsDefaultEnum.Yes;
        return (
          <Space size="small">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
            <Tooltip
              title={
                isDefaultLang
                  ? dict(
                      'PC.Pages.SystemConfig.I18nManage.defaultLangDeleteTip',
                    )
                  : ''
              }
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                disabled={isDefaultLang}
                onClick={() => handleDelete(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <WorkspaceLayout
      title={dict('PC.Pages.SystemConfigI18n.manageTitle')}
      hideScroll
      rightSlot={
        <>
          <Button type="primary" onClick={() => reloadTable()}>
            {dict('PC.Common.Global.refresh')}
          </Button>
          <Button type="primary" onClick={() => handleAdd()}>
            {dict('PC.Pages.SystemConfigI18n.addLang')}
          </Button>
        </>
      }
    >
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={draggableData?.map((item) => String(item.id))}
          strategy={verticalListSortingStrategy}
        >
          <XProTable<I18nLangDto>
            actionRef={actionRef}
            formRef={formRef}
            rowKey="id"
            columns={columns}
            request={request}
            dataSource={draggableData}
            pagination={false}
            scroll={{ x: 1090 }}
            search={false}
            showQueryButtons={false}
            showIndex={false}
            options={false}
            toolBarRender={false}
            components={{
              body: {
                row: Row,
              },
            }}
            postData={(data: I18nLangDto[]) => {
              if (!isDraggingRef.current) {
                setDraggableData(data || []);
              }
              return data;
            }}
            locale={{
              emptyText: (
                <Empty
                  description={dict('PC.Pages.SystemConfigI18n.empty')}
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        </SortableContext>
      </DndContext>

      {/* 新增语言弹窗 */}
      <AddLangModal
        open={addModalOpen}
        langInfo={langInfo}
        sortIndex={addSortIndex}
        onCancel={() => {
          setAddModalOpen(false);
          setLangInfo(null);
        }}
        onSuccess={() => {
          setAddModalOpen(false);
          setLangInfo(null);
          reloadTable();
        }}
      />
    </WorkspaceLayout>
  );
};

export default I18nManage;
