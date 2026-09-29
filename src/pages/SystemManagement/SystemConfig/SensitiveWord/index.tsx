/**
 * 敏感词管控（系统管理 › 系统配置）
 *
 * - 列表：服务端分页，支持敏感词模糊搜索与分类/匹配方式/触发策略/状态筛选
 * - 新增 / 编辑：SensitiveWordFormModal；状态走单独的启停接口
 * - 权限：sensitive_word_query / _add / _modify / _delete / _enable
 */
import { TableActions, XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiSensitiveWordCreate,
  apiSensitiveWordDelete,
  apiSensitiveWordPage,
  apiSensitiveWordUpdate,
  apiSensitiveWordUpdateStatus,
} from '@/services/sensitiveWord';
import {
  SensitiveWordMatchTypeEnum,
  type SensitiveWordCreateParams,
  type SensitiveWordInfo,
} from '@/types/interfaces/sensitiveWord';
import { PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, message, Switch, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useModel } from 'umi';
import {
  CATEGORY_COLOR,
  getActionOptions,
  getCategoryOptions,
  getMatchTypeOptions,
  toValueEnum,
} from './constants';
import styles from './index.less';
import SensitiveWordFormModal from './SensitiveWordFormModal';

const cx = classNames.bind(styles);

const labelOf = (options: { label: string; value: string }[], value: string) =>
  options.find((o) => o.value === value)?.label ?? value ?? '--';

const SensitiveWord: React.FC = () => {
  const { hasPermission } = useModel('menuModel');
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SensitiveWordInfo | null>(null);
  // 正在切换状态的行，防止重复点击
  const [togglingId, setTogglingId] = useState<number>();

  const handleReset = useCallback(() => {
    formRef.current?.resetFields();
    actionRef.current?.reset?.();
    actionRef.current?.reload();
  }, []);

  // 通过菜单再次进入时刷新
  useEffect(() => {
    if ((location.state as any)?._t) handleReset();
  }, [location.state, handleReset]);

  const openModal = (record: SensitiveWordInfo | null) => {
    setEditing(record);
    setModalOpen(true);
  };

  const handleFinish = async (values: SensitiveWordCreateParams) => {
    try {
      const res = editing
        ? await apiSensitiveWordUpdate({ ...values, id: editing.id })
        : await apiSensitiveWordCreate(values);
      if (res.code !== SUCCESS_CODE) return false;
      message.success(
        dict(
          editing
            ? 'PC.Common.Global.saveSuccess'
            : 'PC.Common.Global.createSuccess',
        ),
      );
      setModalOpen(false);
      actionRef.current?.reload();
      return true;
    } catch {
      // 业务错误已由全局请求层提示
      return false;
    }
  };

  const handleToggle = async (record: SensitiveWordInfo, checked: boolean) => {
    setTogglingId(record.id);
    try {
      await apiSensitiveWordUpdateStatus({
        id: record.id,
        status: checked ? 1 : 0,
      });
      message.success(
        dict(
          checked
            ? 'PC.Common.Global.enableSuccess'
            : 'PC.Common.Global.disableSuccess',
        ),
      );
      actionRef.current?.reload();
    } finally {
      setTogglingId(undefined);
    }
  };

  const handleDelete = async (record: SensitiveWordInfo) => {
    await apiSensitiveWordDelete(record.id);
    message.success(dict('PC.Common.Global.deleteSuccess'));
    actionRef.current?.reload();
  };

  const categoryOptions = getCategoryOptions();
  const matchTypeOptions = getMatchTypeOptions();
  const actionOptions = getActionOptions();

  const columns: ProColumns<SensitiveWordInfo>[] = [
    {
      title: dict('PC.Pages.SystemSensitiveWord.word'),
      dataIndex: 'word',
      width: 260,
      fieldProps: {
        placeholder: dict('PC.Pages.SystemSensitiveWord.searchPlaceholder'),
        allowClear: true,
      },
      render: (_, record) => (
        <Tooltip title={record.word}>
          <Tag
            className={cx(styles['word-tag'], {
              [styles['word-tag-regex']]:
                record.matchType === SensitiveWordMatchTypeEnum.Regex,
            })}
          >
            {record.word}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: dict('PC.Pages.SystemSensitiveWord.category'),
      dataIndex: 'category',
      width: 140,
      valueType: 'select',
      valueEnum: toValueEnum(categoryOptions),
      render: (_, record) => (
        <Tag color={CATEGORY_COLOR[record.category] ?? 'default'}>
          {labelOf(categoryOptions, record.category)}
        </Tag>
      ),
    },
    {
      title: dict('PC.Pages.SystemSensitiveWord.matchType'),
      dataIndex: 'matchType',
      width: 120,
      valueType: 'select',
      valueEnum: toValueEnum(matchTypeOptions),
      render: (_, record) => labelOf(matchTypeOptions, record.matchType),
    },
    {
      title: dict('PC.Pages.SystemSensitiveWord.actionLabel'),
      dataIndex: 'action',
      width: 120,
      valueType: 'select',
      valueEnum: toValueEnum(actionOptions),
      render: (_, record) => labelOf(actionOptions, record.action),
    },
    {
      title: dict('PC.Pages.SystemSensitiveWord.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: dict('PC.Common.Global.enable') },
        0: { text: dict('PC.Common.Global.disable') },
      },
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.status === 1}
          loading={togglingId === record.id}
          disabled={!hasPermission('sensitive_word_enable')}
          onChange={(checked) => handleToggle(record, checked)}
        />
      ),
    },
    {
      title: dict('PC.Pages.SystemSensitiveWord.modified'),
      dataIndex: 'modified',
      width: 170,
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: dict('PC.Common.Global.action'),
      valueType: 'option',
      fixed: 'right',
      align: 'center',
      width: 140,
      render: (_, record) => (
        <TableActions<SensitiveWordInfo>
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              disabled: !hasPermission('sensitive_word_modify'),
              onClick: openModal,
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              disabled: !hasPermission('sensitive_word_delete'),
              confirm: {
                title: dict('PC.Common.Global.confirmDelete'),
                description: (r) => r.word,
              },
              onClick: handleDelete,
            },
          ]}
        />
      ),
    },
  ];

  const request = async (params: {
    current?: number;
    pageSize?: number;
    word?: string;
    category?: SensitiveWordInfo['category'];
    matchType?: SensitiveWordInfo['matchType'];
    action?: SensitiveWordInfo['action'];
    status?: string;
  }) => {
    const {
      current = 1,
      pageSize = 15,
      word,
      category,
      matchType,
      action,
      status,
    } = params;
    const res = await apiSensitiveWordPage({
      current,
      pageSize,
      queryFilter: {
        word: word?.trim() || undefined,
        category,
        matchType,
        action,
        // valueEnum 的 key 回传为字符串
        status:
          status === undefined || status === '' ? undefined : Number(status),
      },
    });
    return {
      data: res.data?.records ?? [],
      total: res.data?.total ?? 0,
      success: res.code === SUCCESS_CODE,
    };
  };

  return (
    <WorkspaceLayout
      title={dict('PC.Routes.sensitiveWordConfig')}
      hideScroll
      rightSlot={
        hasPermission('sensitive_word_add') && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal(null)}
          >
            {dict('PC.Pages.SystemSensitiveWord.addButton')}
          </Button>
        )
      }
    >
      <XProTable<SensitiveWordInfo>
        rowKey="id"
        actionRef={actionRef}
        formRef={formRef}
        columns={columns}
        request={request}
        onReset={handleReset}
        showQueryButtons={hasPermission('sensitive_word_query')}
      />
      <SensitiveWordFormModal
        open={modalOpen}
        record={editing}
        onCancel={() => setModalOpen(false)}
        onFinish={handleFinish}
      />
    </WorkspaceLayout>
  );
};

export default SensitiveWord;
