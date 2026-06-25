import {
  HOOK_STATUS_DISABLED,
  HOOK_STATUS_ENABLED,
} from '@/constants/hook.constants';
import { apiAgentComponentHookUpdate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { HookConfig } from '@/types/interfaces/agent';
import type { CreateHooksProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
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
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import CreateHookModal from './CreateHookModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * Hook 管理弹窗：列表、新建 / 编辑 / 删除 / 状态切换
 */
const CreateHooks: React.FC<CreateHooksProps> = ({
  open,
  hooksInfo,
  onCancel,
  onConfirm,
}) => {
  const [hookList, setHookList] = useState<HookConfig[]>([]);
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
    setHookList(hooksInfo?.bindConfig?.hooks ?? []);
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
  const persistHooks = (nextHooks: HookConfig[], successMessage?: string) => {
    runHookUpdate({
      id: hooksInfo?.id as number,
      targetId: hooksInfo?.targetId ?? -1,
      bindConfig: { hooks: nextHooks },
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
    const nextHooks = hookList.filter((_, idx) => idx !== index);
    persistHooks(
      nextHooks,
      t('PC.Pages.AgentArrangeCreateHooks.deleteSuccess'),
    );
  };

  // 切换 Hook 状态
  const handleToggleStatus = (index: number, enabled: boolean) => {
    const nextHooks = hookList.map((item, idx) =>
      idx === index
        ? {
            ...item,
            status: enabled ? HOOK_STATUS_ENABLED : HOOK_STATUS_DISABLED,
          }
        : item,
    );
    persistHooks(nextHooks);
  };

  // 确定 Hook 配置变更
  const handleHookModalConfirm = (nextHooks: HookConfig[]) => {
    setHookModalOpen(false);
    setHookList(nextHooks);
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

  // 表格列配置
  const columns: TableColumnsType<HookConfig & { _index: number }> = [
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnName'),
      dataIndex: 'name',
      key: 'name',
      width: 140,
      render: (value: string) => value || '--',
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnEvent'),
      dataIndex: 'event',
      key: 'event',
      width: 120,
      render: (value: string) => (
        <span className={cx(styles.tag)}>{value || '--'}</span>
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnMatcher'),
      dataIndex: 'matcher',
      key: 'matcher',
      ellipsis: true,
      render: (value: string) =>
        value ? (
          <span className={cx(styles.tag)}>{value}</span>
        ) : (
          <span className={cx(styles.tag, styles['tag-muted'])}>-</span>
        ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnType'),
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value: string) => (
        <span className={cx(styles.tag)}>{value || '--'}</span>
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      align: 'center',
      render: (value: number | undefined, record) => (
        <Switch
          size="small"
          checked={value !== HOOK_STATUS_DISABLED}
          onChange={(checked) => handleToggleStatus(record._index, checked)}
        />
      ),
    },
    {
      title: t('PC.Pages.AgentArrangeCreateHooks.columnAction'),
      key: 'action',
      width: 88,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            className={cx(styles['action-btn'])}
            icon={<EditOutlined />}
            onClick={() => handleEditHook(record, record._index)}
          />
          <Button
            type="text"
            size="small"
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
        width={920}
        title={t('PC.Pages.AgentArrangeCreateHooks.title')}
        open={open}
        footer={null}
        destroyOnHidden
        onCancel={handleClose}
      >
        <Table
          rowKey={(record) => `${record.name}-${record.event}-${record._index}`}
          className={cx(styles['table-container'])}
          columns={columns}
          dataSource={hookList.map((item, index) => ({
            ...item,
            _index: index,
          }))}
          pagination={false}
          scroll={{
            y: hookList.length >= 10 ? 560 : undefined,
          }}
          footer={() => (
            <Button icon={<PlusOutlined />} onClick={handleAddHook}>
              {t('PC.Pages.AgentArrangeCreateHooks.add')}
            </Button>
          )}
        />
      </Modal>

      {/* 新建 / 编辑 Hook 弹窗 */}
      <CreateHookModal
        open={hookModalOpen}
        mode={mode}
        hooksInfo={hooksInfo}
        currentHook={currentHook ?? undefined}
        hookList={hookList}
        editIndex={editIndex}
        onCancel={() => setHookModalOpen(false)}
        onConfirm={handleHookModalConfirm}
      />
    </>
  );
};

export default CreateHooks;
