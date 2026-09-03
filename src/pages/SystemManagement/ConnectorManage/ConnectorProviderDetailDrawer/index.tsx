import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { AUTH_TYPE_LABEL_MAP } from '@/pages/SystemManagement/ConnectorManage/constants';
import {
  apiSystemConnectorActionDelete,
  apiSystemConnectorActionToggleStatus,
  apiSystemConnectorProviderDetail,
} from '@/services/systemManage';
import type {
  ConnectorProviderAction,
  ConnectorProviderDetail,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import {
  Button,
  Drawer,
  Empty,
  message,
  Popconfirm,
  Space,
  Spin,
  Tag,
} from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import ConnectorActionCreateModal from './components/ConnectorActionCreateModal';
import ConnectorActionDebugModal from './components/ConnectorActionDebugModal';
import styles from './index.less';

/**
 * 连接器提供方详情抽屉
 *
 * 数据源：GET /api/connector/providers/{service}?spaceId=xxx
 *
 * 触发场景：连接器管理列表 "查看" 操作列
 *
 * 抽屉标题：当前 service 的 displayName（或 fallback 到 service）
 * 抽屉内容：
 *   1. 顶部信息（认证方式 / BASE URL / 通用代理 / 归属）
 *   2. 工具栏（「+ 添加工具」打开 ConnectorActionCreateModal 新增/编辑工具弹窗）
 *   3. 工具列表（卡片形式：name + 状态 tag + actionKey + 描述 +
 *                底部 4 个操作按钮 + 右下角 HTTP 接口 tag）
 *
 * 工具的「编辑」按钮：复用 ConnectorActionCreateModal（编辑模式，传
 * editAction 回填详情接口返回的该条 action 定义，ACTIONKEY 禁改），
 * 保存调 PUT /api/system/connector/providers/{service}/actions/{actionKey}
 * （body 与创建一致）
 *
 * 工具的 停用/启用 按钮调：
 *   PUT /api/system/connector/actions/{id}/status?enabled={boolean}
 * 工具的 删除 按钮调：
 *   DELETE /api/system/connector/actions/{id}（点击后会先弹 Popconfirm 二次确认）
 */

export interface ConnectorProviderDetailDrawerProps {
  /** 是否打开 */
  open: boolean;
  /** 当前查看的连接器行（用来拿 service 拼接口路径、用 displayName 做标题兜底） */
  record: ConnectorProviderInfo | null;
  /** 空间 ID（query 参数，可选 —— 无效值会被接口层过滤掉） */
  spaceId?: number | string;
  /** 关闭回调 */
  onClose: () => void;
  /**
   * 新增工具成功回调
   * 由父组件注入：重新拉取连接器列表（GET /api/system/connector/providers）
   * 抽屉内部同时会刷新工具列表详情
   */
  onActionCreated?: () => void;
}

/**
 * 单个工具卡片
 *
 * 视觉结构（自上而下）：
 *   - Header  左侧：name + 状态 tag（仅 disabled 时显示"已停用"）
 *               右侧：actionKey
 *   - 描述行
 *   - Footer  左侧：调试 / 编辑 / 停用(启用) / 删除
 *               右下角：HTTP 接口 tag
 */
const ConnectorProviderToolCard: React.FC<{
  action: ConnectorProviderAction;
  /** 是否正在切换状态（用于替换"停用/启用"按钮的展示，防止重复点击） */
  toggling: boolean;
  /** 是否正在删除（用于给 Popconfirm 的"确定"按钮加 loading） */
  deleting: boolean;
  onToggle: (action: ConnectorProviderAction) => void;
  onDelete: (action: ConnectorProviderAction) => void;
  /** 打开「编辑工具」弹窗（复用新增工具弹窗回填该工具定义） */
  onEdit: (action: ConnectorProviderAction) => void;
  /** 打开「工具调试」弹窗（已停用的工具不可调试，按钮置灰禁用） */
  onDebug: (action: ConnectorProviderAction) => void;
}> = ({ action, toggling, deleting, onToggle, onDelete, onEdit, onDebug }) => {
  const isEnabled = action.status === 'enabled';

  return (
    <div className={styles.toolCard}>
      <div className={styles.toolCardHeader}>
        <div className={styles.toolCardTitle}>
          <span className={styles.toolName}>{action.name}</span>
          {!isEnabled ? (
            <Tag className={styles.toolStatusTag}>已停用</Tag>
          ) : null}
        </div>
        {action.actionKey ? (
          <span className={styles.toolActionKey}>{action.actionKey}</span>
        ) : null}
      </div>
      {action.description ? (
        <div className={styles.toolDescription}>{action.description}</div>
      ) : null}
      <div className={styles.toolCardFooter}>
        <Space size={12} className={styles.toolCardActions}>
          {/* 调试：已停用的工具不可调试，按钮置灰禁用 */}
          {isEnabled ? (
            <a onClick={() => onDebug(action)}>调试</a>
          ) : (
            <span className={styles.debugDisabled}>调试</span>
          )}
          {/* 编辑：复用「新增工具」弹窗回填当前工具定义（编辑模式） */}
          <a onClick={() => onEdit(action)}>编辑</a>
          {toggling ? (
            <span
              className={styles.toggleLoading}
              style={{
                color: isEnabled ? '#ff4d4f' : '#1890ff',
              }}
            >
              <Spin size="small" />
              <span>{isEnabled ? '停用中…' : '启用中…'}</span>
            </span>
          ) : (
            <a
              onClick={() => onToggle(action)}
              style={{ color: isEnabled ? '#ff4d4f' : '#1890ff' }}
            >
              {isEnabled ? '停用' : '启用'}
            </a>
          )}
          {/*
            删除：包一层 Popconfirm 做二次确认。
            - okButtonProps.loading：删除请求飞行中把"确定"置为 loading，避免重复触发
            - onConfirm 才真正调接口；onCancel 什么都不做
          */}
          <Popconfirm
            title="确认删除该工具？"
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{
              danger: true,
              loading: deleting,
            }}
            onConfirm={() => onDelete(action)}
          >
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
        <div className={styles.toolProtocol}>
          {(action.protocol || 'HTTP').toUpperCase()} 接口
        </div>
      </div>
    </div>
  );
};

/**
 * 抽屉内容：顶部基础信息 + 工具列表
 *
 * BASE URL 等"provider 级"字段优先取接口返回的 detail（最权威），
 * 若接口未返回则回退到 record 上的同名字段（避免页面空荡）。
 */
const ConnectorProviderDetailContent: React.FC<{
  detail: ConnectorProviderDetail | null;
  record: ConnectorProviderInfo | null;
  togglingActionIds: Set<string | number>;
  deletingActionIds: Set<string | number>;
  onToggleAction: (action: ConnectorProviderAction) => void;
  onDeleteAction: (action: ConnectorProviderAction) => void;
  /** 打开「新增工具」弹窗（新增模式） */
  onOpenActionCreate: () => void;
  /** 打开「编辑工具」弹窗（复用新增工具弹窗回填该工具定义） */
  onEditAction: (action: ConnectorProviderAction) => void;
  /** 打开「工具调试」弹窗 */
  onDebugAction: (action: ConnectorProviderAction) => void;
}> = ({
  detail,
  record,
  togglingActionIds,
  deletingActionIds,
  onToggleAction,
  onDeleteAction,
  onOpenActionCreate,
  onEditAction,
  onDebugAction,
}) => {
  // 鉴权方式：与列表"认证"列保持完全一致的展示 —— 找不到标签就 fallback 到原始值
  const authTypeValue = detail?.provider?.authType ?? record?.authType;
  const authLabel =
    (authTypeValue && AUTH_TYPE_LABEL_MAP[authTypeValue]) ??
    authTypeValue ??
    '-';

  // BASE URL：取接口 provider 的 baseUrl；详情未返回时回退到列表行
  const baseUrl = detail?.provider?.baseUrl ?? record?.baseUrl ?? '-';

  // 通用代理 / 归属 / 描述：详情接口未返回时回退到列表行
  const proxyEnabled =
    detail?.provider?.proxyEnabled ?? record?.proxyEnabled ?? false;
  const managedBy = detail?.provider?.managedBy ?? record?.managedBy;
  const proxyLabel = proxyEnabled ? '已开启' : '未开启';

  return (
    <div className={styles.content}>
      {/* 顶部基础信息（label / value 两列网格） */}
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>认证方式</span>
          <span className={styles.infoValue}>{authLabel}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>BASE URL</span>
          <span className={styles.infoValue}>{baseUrl}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>通用代理</span>
          <span className={styles.infoValue}>{proxyLabel}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>归属</span>
          <span className={styles.infoValue}>
            {managedBy
              ? managedBy === 'OFFICIAL'
                ? '官方目录'
                : managedBy === 'ADMIN'
                ? '管理员可编辑'
                : managedBy
              : '-'}
          </span>
        </div>
      </div>

      {/* 工具栏（仅「添加工具」；导出统一走列表"操作列 → 单行导出"） */}
      <div className={styles.toolbar}>
        <Space size={8}>
          {/* 添加工具：打开「新增工具」弹窗（ConnectorActionCreateModal，新增模式） */}
          <Button type="primary" onClick={onOpenActionCreate}>
            + 添加工具
          </Button>
        </Space>
      </div>

      {/* 工具列表 */}
      <div className={styles.toolSection}>
        <div className={styles.toolSectionTitle}>工具列表</div>
        {detail?.actions?.length ? (
          <div className={styles.toolList}>
            {detail.actions.map((action) => (
              <ConnectorProviderToolCard
                key={String(action.id ?? action.name)}
                action={action}
                toggling={togglingActionIds.has(action.id as string | number)}
                deleting={deletingActionIds.has(action.id as string | number)}
                onToggle={onToggleAction}
                onDelete={onDeleteAction}
                onEdit={onEditAction}
                onDebug={onDebugAction}
              />
            ))}
          </div>
        ) : (
          <Empty description="暂无工具" />
        )}
      </div>
    </div>
  );
};

const ConnectorProviderDetailDrawer: React.FC<
  ConnectorProviderDetailDrawerProps
> = ({ open, record, spaceId, onClose, onActionCreated }) => {
  /**
   * 抽屉宽度：PC 端固定 720，移动端尽量占满
   * 与 LogQuery/OperationLog/LogDetailDrawer 保持一致
   */
  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 720;
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  // 加载中
  const [loading, setLoading] = useState<boolean>(false);
  // 详情
  const [detail, setDetail] = useState<ConnectorProviderDetail | null>(null);
  /**
   * 正在切换状态的工具 id 集合
   * - 用 id 作 key（不是 name），与后端寻址字段一致
   * - 用于给单个卡片按钮加 loading 态，防止重复点击
   */
  const [togglingActionIds, setTogglingActionIds] = useState<
    Set<string | number>
  >(() => new Set());
  /**
   * 正在删除的工具 id 集合
   * - 给 Popconfirm 的"确定"按钮加 loading 态，避免用户在请求飞行中再次触发
   */
  const [deletingActionIds, setDeletingActionIds] = useState<
    Set<string | number>
  >(() => new Set());
  /**
   * 「新增/编辑工具」弹窗开关
   * - 工具栏「+ 添加工具」打开（新增模式，editingAction 为 null）
   * - 工具卡片「编辑」打开（编辑模式，editingAction 为对应工具定义）
   * - 抽屉关闭时同步收起，避免弹窗孤零零悬浮在页面上
   */
  const [actionModalOpen, setActionModalOpen] = useState<boolean>(false);
  /** 编辑模式回填的工具定义（详情接口 actions 列表项；null = 新增模式） */
  const [editingAction, setEditingAction] =
    useState<ConnectorProviderAction | null>(null);
  /**
   * 「工具调试」弹窗开关
   * - 工具卡片「调试」按钮打开（已停用的工具按钮置灰不可点）
   * - 弹窗自身按设计稿固定初始化：连接器默认选列表第一条 + 动作默认选第一条
   * - 抽屉关闭时同步收起
   */
  const [debugModalOpen, setDebugModalOpen] = useState<boolean>(false);

  /**
   * 抽屉标题：以接口返回的 displayName 优先；其次 record.displayName；最后回退到 service
   * 每次切换查看的连接器时，标题立刻切换（不等接口返回），避免标题滞后于加载态
   */
  const title = useMemo(() => {
    return (
      detail?.provider?.displayName ||
      record?.displayName ||
      record?.service ||
      ''
    );
  }, [detail, record]);

  /** 获取详情 */
  const fetchDetail = useCallback(async () => {
    if (!record?.service) return;
    try {
      setLoading(true);
      const response = await apiSystemConnectorProviderDetail({
        service: record.service,
        spaceId,
        // 抽屉里需要展示已停用工具的"已停用" tag + "启用" 按钮，因此 includeDisabled=true
        includeDisabled: true,
      });
      if (response?.code === SUCCESS_CODE) {
        setDetail(response.data ?? null);
      } else {
        setDetail(null);
      }
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [record?.service, spaceId]);

  // 打开抽屉 / 切换查看的连接器时，重新拉取详情
  useEffect(() => {
    if (open) {
      // 切换行时清空旧数据，避免闪现上一条内容
      setDetail(null);
      fetchDetail();
    } else {
      // 抽屉关闭时同步收起工具弹窗并清空编辑态
      setActionModalOpen(false);
      setEditingAction(null);
      setDebugModalOpen(false);
    }
  }, [open, record?.service, spaceId, fetchDetail]);

  /**
   * 切换单个工具的启用状态
   * - 走乐观更新：先在本地把 status 翻转，让 UI 立刻反馈
   * - 接口失败时回滚到原状态
   * - status 接口成功后，再调一次详情接口刷新列表（让服务端最新 status/排序等成为权威源）
   * - 用 id 寻址；id 缺失时直接报错并拒绝执行
   */
  const handleToggleAction = useCallback(
    async (action: ConnectorProviderAction) => {
      // id 缺失：后端按 id 寻址，没有 id 就没法调
      if (action.id === undefined || action.id === null || action.id === '') {
        message.error('工具 id 缺失，无法切换状态');
        return;
      }
      // 重复点击保护：同 id 已在请求中则直接忽略
      const idKey = action.id;
      if (togglingActionIds.has(idKey)) {
        return;
      }

      const isEnabled = action.status === 'enabled';
      const nextEnabled = !isEnabled;
      const previousStatus = action.status;

      setTogglingActionIds((prev) => {
        const next = new Set(prev);
        next.add(idKey);
        return next;
      });

      // 乐观更新：本地立刻翻转状态，让按钮文案/状态 tag 立刻刷新
      setDetail((prev) => {
        if (!prev?.actions) return prev;
        return {
          ...prev,
          actions: prev.actions.map((a) =>
            a.id === idKey
              ? { ...a, status: nextEnabled ? 'enabled' : 'disabled' }
              : a,
          ),
        };
      });

      try {
        const response = await apiSystemConnectorActionToggleStatus({
          id: idKey,
          enabled: nextEnabled,
        });
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'toggle failed');
        }
        message.success(nextEnabled ? '已启用该工具' : '已停用该工具');
        // status 接口成功后，重新拉一次详情：以服务端最新 status 为权威源
        // 静默刷新：不显示 loading（页面已经在响应用户的操作），失败也不影响用户已看到的乐观结果
        // 此时能进到 try 说明 record 一定存在（否则前面的 fetchDetail 早就 return 了）
        if (record?.service) {
          try {
            const refreshResponse = await apiSystemConnectorProviderDetail({
              service: record.service,
              spaceId,
              includeDisabled: true,
            });
            if (refreshResponse?.code === SUCCESS_CODE) {
              setDetail(refreshResponse.data ?? null);
            }
          } catch {
            /* 静默忽略：乐观更新已生效，详情刷新只是兜底 */
          }
        }
      } catch {
        // 回滚到原状态
        setDetail((prev) => {
          if (!prev?.actions) return prev;
          return {
            ...prev,
            actions: prev.actions.map((a) =>
              a.id === idKey ? { ...a, status: previousStatus } : a,
            ),
          };
        });
        message.error(nextEnabled ? '启用工具失败' : '停用工具失败');
      } finally {
        setTogglingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(idKey);
          return next;
        });
      }
    },
    [togglingActionIds, record?.service, spaceId],
  );

  /**
   * 新增/编辑工具成功：
   * - 重新拉取详情刷新抽屉内工具列表（改动立即可见）
   * - 通知父组件刷新连接器列表（GET /api/system/connector/providers）
   */
  const handleActionCreated = useCallback(() => {
    fetchDetail();
    onActionCreated?.();
  }, [fetchDetail, onActionCreated]);

  /** 打开编辑工具弹窗：复用新增工具弹窗，回填该工具定义 */
  const handleOpenActionEdit = useCallback(
    (action: ConnectorProviderAction) => {
      setEditingAction(action);
      setActionModalOpen(true);
    },
    [],
  );

  /**
   * 删除单个工具
   * - 由 Popconfirm 的"确定"按钮触发，UI 层已经做了二次确认
   * - 接口成功后从本地列表里直接移除该项，无需重新拉详情
   * - id 缺失时拒绝执行；同 id 已在请求中则忽略（避免重复弹窗）
   */
  const handleDeleteAction = useCallback(
    async (action: ConnectorProviderAction) => {
      if (action.id === undefined || action.id === null || action.id === '') {
        message.error('工具 id 缺失，无法删除');
        return;
      }
      const idKey = action.id;
      if (deletingActionIds.has(idKey)) {
        return;
      }

      setDeletingActionIds((prev) => {
        const next = new Set(prev);
        next.add(idKey);
        return next;
      });

      try {
        const response = await apiSystemConnectorActionDelete({ id: idKey });
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'delete failed');
        }
        // 从本地列表中移除该工具
        setDetail((prev) => {
          if (!prev?.actions) return prev;
          return {
            ...prev,
            actions: prev.actions.filter((a) => a.id !== idKey),
          };
        });
        message.success('已删除该工具');
      } catch {
        message.error('删除工具失败');
      } finally {
        setDeletingActionIds((prev) => {
          const next = new Set(prev);
          next.delete(idKey);
          return next;
        });
      }
    },
    [deletingActionIds],
  );

  return (
    <>
      <Drawer
        className={styles.drawer}
        title={title}
        placement="right"
        open={open}
        onClose={onClose}
        width={drawerWidth}
        destroyOnHidden
        rootStyle={{ overflow: 'hidden' }}
        styles={{ body: { padding: 0 } }}
      >
        {loading ? (
          <Loading className="h-full" />
        ) : detail || record ? (
          <ConnectorProviderDetailContent
            detail={detail}
            record={record}
            togglingActionIds={togglingActionIds}
            deletingActionIds={deletingActionIds}
            onToggleAction={handleToggleAction}
            onDeleteAction={handleDeleteAction}
            onOpenActionCreate={() => {
              // 新增模式：清空编辑态再打开，确保表单空白
              setEditingAction(null);
              setActionModalOpen(true);
            }}
            onEditAction={handleOpenActionEdit}
            onDebugAction={() => setDebugModalOpen(true)}
          />
        ) : (
          <div className={styles.emptyWrap}>
            <Empty description="暂无数据" />
          </div>
        )}
      </Drawer>

      {/* 新增/编辑工具弹窗（Portal 渲染到 body；编辑模式传 editingAction 回填） */}
      <ConnectorActionCreateModal
        open={actionModalOpen}
        record={record}
        editAction={editingAction}
        onClose={() => setActionModalOpen(false)}
        onCreated={handleActionCreated}
      />

      {/* 工具调试弹窗（打开时自动拉连接器列表 + 第一条连接器详情） */}
      <ConnectorActionDebugModal
        open={debugModalOpen}
        spaceId={spaceId}
        onClose={() => setDebugModalOpen(false)}
      />
    </>
  );
};

export default memo(ConnectorProviderDetailDrawer);
