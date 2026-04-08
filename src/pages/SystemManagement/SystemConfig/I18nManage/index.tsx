import { DragHandle, Row } from '@/components/base/DraggableTableRow';
import WorkspaceLayout from '@/components/WorkspaceLayout';
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
import type { DragEndEvent } from '@dnd-kit/core';
import { closestCenter, DndContext } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Space, Switch, Table, Tooltip } from 'antd';
import { ColumnType } from 'antd/lib/table';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useRequest } from 'umi';
import AddLangModal from './AddLangModal';

/**
 * 语言列表管理页面
 */
const I18nManage: React.FC = () => {
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [langInfo, setLangInfo] = useState<I18nLangDto | null>(null);
  const [langList, setLangList] = useState<I18nLangDto[]>([]);
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
    history.push(`/system/config/lang-content/${record.lang}`);
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

  // 查询语言列表
  const { loading, run: runQuery } = useRequest(apiI18nAllLangList, {
    manual: true,
    onSuccess: (list: I18nLangDto[]) => {
      const _langList = list || [];
      setLangList(_langList);
    },
  });

  useEffect(() => {
    runQuery();
  }, []);

  // 删除语言
  const { run: runDeleteLang } = useRequest(apiI18nDeleteLang, {
    manual: true,
    onSuccess: () => {
      runQuery();
    },
  });

  // 删除语言
  const handleDelete = (record: I18nLangDto) => {
    modalConfirm(
      '删除语言',
      `您确定要删除语言「${record.name}」吗？删除后将无法恢复。`,
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
      runQuery();
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
      runQuery();
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
    if (!langList.length) return 1;
    const maxSort = Math.max(
      ...langList.map((item) =>
        typeof item.sort === 'number' ? item.sort : 0,
      ),
    );
    if (maxSort > 0) return maxSort + 1;
    return langList.length + 1;
  }, [langList]);

  // 拖拽排序
  const { run: runUpdateLangSort } = useRequest(apiI18nUpdateLangSort, {
    manual: true,
    onSuccess: () => {
      originalDragDataRef.current = null;
      runQuery();
    },
    onError: () => {
      if (originalDragDataRef.current) {
        setLangList(originalDragDataRef.current);
        originalDragDataRef.current = null;
      }
    },
  });

  // 拖拽结束
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeId = Number(active.id);
    const overId = Number(over.id);
    const activeIndex = langList.findIndex((item) => item.id === activeId);
    const overIndex = langList.findIndex((item) => item.id === overId);
    if (activeIndex < 0 || overIndex < 0) return;

    originalDragDataRef.current = [...langList];
    const nextData = arrayMove(langList, activeIndex, overIndex);
    const sortedData = nextData.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));
    setLangList(sortedData);
    runUpdateLangSort(sortedData);
  };

  // Table columns.
  const columns: ColumnType<I18nLangDto>[] = [
    {
      title: '',
      key: 'dragSort',
      width: 56,
      render: () => <DragHandle />,
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnName'),
      dataIndex: 'name',
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnLang'),
      dataIndex: 'lang',
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnDefault'),
      dataIndex: 'isDefault',
      render: (isDefault, record) => (
        <Switch
          checked={isDefault === I18nLangIsDefaultEnum.Yes}
          disabled={isDefault === I18nLangIsDefaultEnum.Yes}
          loading={defaultLoadingId === record.id}
          onChange={(checked) => handleSetDefault(checked, record)}
        />
      ),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnStatus'),
      dataIndex: 'status',
      render: (status, record) => (
        <Switch
          checked={status === I18nLangStatusEnum.Enabled}
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
      render: (modified) => formatDateTime(modified),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnCreated'),
      dataIndex: 'created',
      render: (created) => formatDateTime(created),
    },
    {
      title: dict('PC.Pages.SystemConfigI18n.columnAction'),
      key: 'actions',
      align: 'center',
      width: 140,
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
            <Tooltip title={isDefaultLang ? '默认语言不能删除' : ''}>
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
      rightSlot={
        <>
          <Button type="primary" onClick={() => runQuery()}>
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
          items={langList.map((item) => String(item.id))}
          strategy={verticalListSortingStrategy}
        >
          <Table<I18nLangDto>
            rowKey="id"
            loading={loading}
            dataSource={langList}
            pagination={false}
            columns={columns}
            components={{
              body: {
                row: Row,
              },
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
          runQuery();
        }}
      />
    </WorkspaceLayout>
  );
};

export default I18nManage;
