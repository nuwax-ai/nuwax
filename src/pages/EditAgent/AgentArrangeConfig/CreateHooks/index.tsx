import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import { apiAgentComponentHookUpdate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { HookStatusEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { HookConfig } from '@/types/interfaces/agent';
import type { CreateHooksProps } from '@/types/interfaces/agentConfig';
import { modalConfirm } from '@/utils/ant-custom';
import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  message,
  Modal,
  Space,
  Switch,
  Table,
  type TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import CreateHookModal from './CreateHookModal';
import styles from './index.less';

const cx = classNames.bind(styles);

type HookListItem = HookConfig & { key: string };

interface HookTableRow extends HookListItem {
  _index: number;
}

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row: React.FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props['data-row-key'] });

  const style: React.CSSProperties = {
    ...props.style,
    ...(isDragging ? { position: 'relative' } : {}),
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    paddingRight: '10px',
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const toHookConfigs = (hooks: HookListItem[]): HookConfig[] =>
  hooks.map((item) => {
    const hook = { ...item };
    delete (hook as Partial<HookListItem>).key;
    return hook as HookConfig;
  });

const withHookKeys = (hooks: HookConfig[]): HookListItem[] =>
  hooks.map((hook) => ({ ...hook, key: uuidv4() }));

/**
 * Hook 管理弹窗：列表、新建 / 编辑 / 删除 / 状态切换
 */
const CreateHooks: React.FC<CreateHooksProps> = ({
  open,
  hooksInfo,
  onCancel,
  onConfirm,
}) => {
  const [hookList, setHookList] = useState<HookListItem[]>([]);
  const [hookModalOpen, setHookModalOpen] = useState(false);
  const [mode, setMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );
  const [currentHook, setCurrentHook] = useState<HookConfig | null>(null);
  const [editIndex, setEditIndex] = useState<number>();
  const isUpdatedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setHookList(withHookKeys(hooksInfo?.bindConfig?.hooks ?? []));
    isUpdatedRef.current = false;
  }, [open, hooksInfo]);

  // 更新 Hook 配置
  const { run: runHookUpdate } = useRequest(apiAgentComponentHookUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      isUpdatedRef.current = true;
    },
  });

  // 持久化 Hook 配置
  const persistHooks = (nextHooks: HookListItem[], successMessage?: string) => {
    runHookUpdate({
      id: hooksInfo?.id as number,
      targetId: hooksInfo?.targetId ?? -1,
      bindConfig: { hooks: toHookConfigs(nextHooks) },
    });
    setHookList(nextHooks);
    if (successMessage) {
      message.success(successMessage);
    }
  };

  // 添加 Hook
  const handleAddHook = () => {
    setMode(CreateUpdateModeEnum.Create);
    setCurrentHook(null);
    setEditIndex(undefined);
    setHookModalOpen(true);
  };

  // 编辑 Hook
  const handleEditHook = (record: HookConfig, index: number) => {
    setMode(CreateUpdateModeEnum.Update);
    setCurrentHook(record);
    setEditIndex(index);
    setHookModalOpen(true);
  };

  // 删除 Hook
  const handleDeleteHook = (index: number) => {
    modalConfirm(
      t('PC.Common.Global.deleteConfirmTitle'),
      t('PC.Common.Global.deleteConfirmContent'),
      () => {
        const nextHooks = hookList.filter((_, idx) => idx !== index);
        persistHooks(
          nextHooks,
          t('PC.Pages.AgentArrangeCreateHooks.deleteSuccess'),
        );
      },
    );
  };

  // 切换 Hook 状态
  const handleToggleStatus = (index: number, enabled: boolean) => {
    const nextHooks = hookList.map((item, idx) =>
      idx === index
        ? {
            ...item,
            status: enabled ? HookStatusEnum.Enabled : HookStatusEnum.Disabled,
          }
        : item,
    );
    persistHooks(nextHooks);
  };

  // 确定 Hook 配置变更
  const handleHookModalConfirm = (nextHooks: HookConfig[]) => {
    setHookModalOpen(false);
    setHookList((prev) =>
      nextHooks.map((hook, index) => {
        const existing = prev[index];
        const sameItem =
          existing &&
          existing.name === hook.name &&
          existing.event === hook.event;
        return {
          ...hook,
          key: sameItem ? existing.key : uuidv4(),
        };
      }),
    );
    isUpdatedRef.current = true;
  };

  // 关闭 Hook 管理弹窗
  const handleClose = () => {
    if (isUpdatedRef.current) {
      onConfirm();
    } else {
      onCancel();
    }
  };

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = hookList.findIndex((item) => item.key === active.id);
      const overIndex = hookList.findIndex((item) => item.key === over.id);
      const nextHooks = arrayMove(hookList, activeIndex, overIndex);
      persistHooks(nextHooks);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const tableData: HookTableRow[] = hookList.map((item, index) => ({
    ...item,
    _index: index,
  }));

  // 表格列配置
  const columns: TableColumnsType<HookTableRow> = [
    {
      dataIndex: 'sort',
      key: 'sort',
      align: 'center',
      width: 40,
      fixed: 'left',
      render: () => (
        <span className={cx('flex', 'items-center', 'h-full')}>
          <DragHandle />
        </span>
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnName'),
      dataIndex: 'name',
      key: 'name',
      width: 140,
      fixed: 'left',
      render: (value: string) => (
        <div className={cx('flex', 'items-center', 'h-full')}>
          <span className={cx('text-ellipsis')}>{value || '--'}</span>
        </div>
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnEvent'),
      dataIndex: 'event',
      key: 'event',
      width: 160,
      render: (value: string) => (
        <span className={cx('flex', 'items-center', 'h-full')}>
          <span className={cx(styles.tag)}>{value || '--'}</span>
        </span>
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnMatcher'),
      dataIndex: 'matcher',
      key: 'matcher',
      ellipsis: true,
      width: 180,
      render: (value: string) => {
        if (!value) {
          return (
            <span className={cx('flex', 'items-center', 'h-full')}>
              <span className={cx(styles['tag-muted'])}>-</span>
            </span>
          );
        }

        return (
          <span
            className={cx(
              'flex',
              'items-center',
              'h-full',
              styles['matcher-cell'],
            )}
          >
            <EllipsisTooltip text={value} className={cx(styles.tag)} />
          </span>
        );
      },
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnType'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value: string) => (
        <span className={cx('flex', 'items-center', 'h-full')}>
          <span className={cx(styles.tag)}>{value || '--'}</span>
        </span>
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (value: number | undefined, record) => (
        <span
          className={cx('flex', 'items-center', 'content-center', 'h-full')}
        >
          <Switch
            size="small"
            checked={value !== HookStatusEnum.Disabled}
            onChange={(checked) => handleToggleStatus(record._index, checked)}
          />
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space className={cx('flex', 'content-between', 'items-center')}>
          <Button
            type="text"
            className={cx(styles['action-btn'])}
            icon={<EditOutlined />}
            onClick={() => handleEditHook(record, record._index)}
          />
          <Button
            type="text"
            className={cx(styles['action-btn'])}
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteHook(record._index)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        width={870}
        title={t('PC.Pages.AgentArrangeCreateHooks.title')}
        open={open}
        footer={null}
        destroyOnHidden
        classNames={{ body: styles['modal-body'] }}
        onCancel={handleClose}
      >
        <div className={cx(styles['table-scroll'])}>
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={hookList.map((item) => item.key)}
              strategy={verticalListSortingStrategy}
            >
              <Table<HookTableRow>
                rowKey="key"
                components={{ body: { row: Row } }}
                className={cx(styles['table-container'])}
                columns={columns}
                dataSource={tableData}
                pagination={false}
              />
            </SortableContext>
          </DndContext>
        </div>
        <div className={cx(styles['modal-action'])}>
          <Button icon={<PlusOutlined />} onClick={handleAddHook}>
            {t('PC.Pages.AgentArrangeCreateHooks.add')}
          </Button>
        </div>
      </Modal>

      {/* 新建 / 编辑 Hook 弹窗 */}
      <CreateHookModal
        open={hookModalOpen}
        mode={mode}
        hooksInfo={hooksInfo}
        currentHook={currentHook ?? undefined}
        hookList={toHookConfigs(hookList)}
        editIndex={editIndex}
        onCancel={() => setHookModalOpen(false)}
        onConfirm={handleHookModalConfirm}
      />
    </>
  );
};

export default CreateHooks;
