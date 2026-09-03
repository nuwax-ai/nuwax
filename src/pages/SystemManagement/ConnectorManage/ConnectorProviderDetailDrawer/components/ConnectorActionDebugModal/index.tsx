import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiConnectorProviderPageList,
  apiConnectorRuntimeExecute,
  apiSystemConnectorProviderDetail,
} from '@/services/systemManage';
import type {
  ConnectorProviderAction,
  ConnectorProviderInfo,
  ConnectorRuntimeExecuteResult,
} from '@/types/interfaces/systemManage';
import { MinusOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Select, Spin, message } from 'antd';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

/** 调试接口默认空间 ID（与连接器管理页保持一致） */
const DEFAULT_SPACE_ID = 52;

/** 列表一次拉全量：pageNum 固定 1、pageSize 固定 2000 */
const DEBUG_LIST_PAGE_NUM = 1;
const DEBUG_LIST_PAGE_SIZE = 2000;

export interface ConnectorActionDebugModalProps {
  /** 是否打开 */
  open: boolean;
  /** 空间 ID（不传时按默认值 52） */
  spaceId?: number | string;
  /** 关闭回调 */
  onClose: () => void;
}

/**
 * 按工具的 inputArgs 生成输入参数 JSON 模板
 * 顶层参数各生成一个空字符串占位（设计稿展示形态），供用户直接填值
 */
const toArgsTemplate = (
  action: ConnectorProviderAction | null | undefined,
): string => {
  const template: Record<string, string> = {};
  (action?.inputArgs ?? []).forEach((arg) => {
    if (arg?.name) {
      template[arg.name] = '';
    }
  });
  return JSON.stringify(template, null, 2);
};

/**
 * 工具调试弹窗
 *
 * 打开时数据流（按设计稿固定初始化逻辑）：
 *   1. GET /api/connector/providers?spaceId=52&pageNum=1&pageSize=2000
 *      —— 分页拉连接器列表（data.records），默认选中第一条
 *   2. GET /api/connector/providers/{service}?spaceId=52
 *      —— service 取上一步第一条数据的 service，拉详情（provider + actions）
 *   3. 动作下拉默认选中详情 actions 的第一个，并按其 inputArgs 生成
 *      输入参数 JSON 模板
 *
 * 左栏「执行参数」：连接器 / 动作 / 使用连接 三个下拉 + 输入参数 JSON 文本域 +
 * 「执行」按钮（POST /api/connector/runtime/execute）
 * 右栏「执行结果」：深色标题栏（可折叠）+ 米色结果区，pretty JSON 展示响应
 * data（success / message / data / errorCode / meta），未执行时展示「尚未执行。」
 */
const ConnectorActionDebugModal: React.FC<ConnectorActionDebugModalProps> = ({
  open,
  spaceId,
  onClose,
}) => {
  // 初始化加载中（拉连接器列表）
  const [loading, setLoading] = useState<boolean>(false);
  // 连接器详情加载中（切换连接器时刷新动作下拉）
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  // 连接器列表（下拉数据源）
  const [providers, setProviders] = useState<ConnectorProviderInfo[]>([]);
  // 当前选中的连接器 service
  const [selectedService, setSelectedService] = useState<string>();
  // 当前连接器详情（actions 为动作下拉数据源）
  const [detailActions, setDetailActions] = useState<ConnectorProviderAction[]>(
    [],
  );
  // 当前选中的动作（value = actionKey，缺省回退 name）
  const [selectedActionKey, setSelectedActionKey] = useState<string>();
  // 输入参数 JSON（按 inputArgs 生成的模板，可自由编辑）
  const [argsJson, setArgsJson] = useState<string>('');
  // 执行结果面板是否折叠（点击标题栏「—」切换）
  const [resultCollapsed, setResultCollapsed] = useState<boolean>(false);
  // 执行中：给「执行」按钮加 loading，防止重复提交
  const [executing, setExecuting] = useState<boolean>(false);
  /**
   * 执行结果（POST /api/connector/runtime/execute 响应 data）
   * undefined = 尚未执行（占位「尚未执行。」）；切换连接器/动作后失效清空
   */
  const [result, setResult] = useState<ConnectorRuntimeExecuteResult | null>();

  /** spaceId：优先用父组件传入值，兜底默认值 52 */
  const resolvedSpaceId = useMemo(() => spaceId ?? DEFAULT_SPACE_ID, [spaceId]);

  /** 弹窗宽度：PC 端固定 920，小屏自适应收窄 */
  const modalWidth = useMemo(() => {
    if (typeof window === 'undefined') return 920;
    return Math.min(920, Math.max(360, window.innerWidth - 48));
  }, []);

  /** 连接器下拉选项（展示 displayName，缺失回退 service） */
  const providerOptions = useMemo(
    () =>
      providers
        .filter((item) => item?.service)
        .map((item) => ({
          label: item.displayName || item.service,
          value: item.service,
        })),
    [providers],
  );

  /** 动作下拉选项（设计稿展示形态：名称（actionKey）） */
  const actionOptions = useMemo(
    () =>
      (detailActions ?? [])
        .filter((action) => action?.actionKey || action?.name)
        .map((action) => ({
          label: action.actionKey
            ? `${action.name}（${action.actionKey}）`
            : action.name,
          value: String(action.actionKey ?? action.name),
        })),
    [detailActions],
  );

  /**
   * 拉取连接器详情并重置动作选择：
   * 动作默认选 actions 第一条，同时生成输入参数 JSON 模板
   */
  const fetchDetail = useCallback(
    async (service: string) => {
      try {
        setDetailLoading(true);
        const response = await apiSystemConnectorProviderDetail({
          service,
          spaceId: resolvedSpaceId,
          // 调试场景需要看到全部动作（含已停用），由后端原样返回
          includeDisabled: true,
        });
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'fetch detail failed');
        }
        const actions = response.data?.actions ?? [];
        setDetailActions(actions);
        const firstAction = actions[0];
        setSelectedActionKey(
          firstAction
            ? String(firstAction.actionKey ?? firstAction.name)
            : undefined,
        );
        setArgsJson(toArgsTemplate(firstAction));
      } catch {
        setDetailActions([]);
        setSelectedActionKey(undefined);
        setArgsJson('');
        message.error('加载连接器详情失败');
      } finally {
        setDetailLoading(false);
      }
    },
    [resolvedSpaceId],
  );

  // 打开弹窗：拉连接器列表 → 默认选中第一条 → 拉其详情；关闭时重置全部状态
  useEffect(() => {
    if (!open) {
      setProviders([]);
      setSelectedService(undefined);
      setDetailActions([]);
      setSelectedActionKey(undefined);
      setArgsJson('');
      setResultCollapsed(false);
      setResult(undefined);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await apiConnectorProviderPageList({
          spaceId: resolvedSpaceId,
          pageNum: DEBUG_LIST_PAGE_NUM,
          pageSize: DEBUG_LIST_PAGE_SIZE,
        });
        if (cancelled) return;
        if (response?.code !== SUCCESS_CODE) {
          throw new Error(response?.message || 'fetch providers failed');
        }
        const records = response.data?.records ?? [];
        setProviders(records);
        // 默认选中第一条数据的 service，并拉取其详情
        const firstService = records[0]?.service;
        if (firstService) {
          setSelectedService(firstService);
          await fetchDetail(firstService);
        }
      } catch {
        if (!cancelled) {
          message.error('加载连接器列表失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // fetchDetail 依赖 resolvedSpaceId，此处随 spaceId 变化重新初始化
  }, [open, resolvedSpaceId, fetchDetail]);

  /** 切换连接器：刷新动作下拉与输入参数模板，旧执行结果失效清空 */
  const handleServiceChange = useCallback(
    async (service: string) => {
      setSelectedService(service);
      setResult(undefined);
      await fetchDetail(service);
    },
    [fetchDetail],
  );

  /** 切换动作：重生成输入参数模板，旧执行结果失效清空 */
  const handleActionChange = useCallback(
    (value: string) => {
      setSelectedActionKey(value);
      setResult(undefined);
      const action = (detailActions ?? []).find(
        (item) => String(item.actionKey ?? item.name) === value,
      );
      setArgsJson(toArgsTemplate(action));
    },
    [detailActions],
  );

  /**
   * 执行调试：POST /api/connector/runtime/execute
   * - args 取输入参数 JSON 文本域解析结果（须为 JSON 对象；空内容按 {} 提交）
   * - 响应 data（success / message / data / errorCode / meta）原样 pretty JSON
   *   展示在「执行结果」区，不做成功/失败分支渲染 —— 调试场景需要看到原始返回
   * - 业务失败（如 connection_required）由 data.success=false 传达，不算请求错误
   */
  const handleExecute = useCallback(async () => {
    if (!selectedService || !selectedActionKey) return;

    let args: Record<string, unknown> = {};
    const trimmed = argsJson.trim();
    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        if (
          typeof parsed !== 'object' ||
          parsed === null ||
          Array.isArray(parsed)
        ) {
          message.error('输入参数必须是 JSON 对象');
          return;
        }
        args = parsed as Record<string, unknown>;
      } catch {
        message.error('输入参数不是有效的 JSON');
        return;
      }
    }

    try {
      setExecuting(true);
      const response = await apiConnectorRuntimeExecute({
        providerService: selectedService,
        actionKey: selectedActionKey,
        args,
      });
      if (response?.code === SUCCESS_CODE) {
        setResult(response.data ?? null);
      } else {
        // 非 0000：data 缺失，展示 envelope 关键信息方便排障
        setResult({
          message: response?.message || '执行失败（无返回数据）',
        });
      }
    } catch {
      message.error('执行失败');
    } finally {
      setExecuting(false);
    }
  }, [selectedService, selectedActionKey, argsJson]);

  return (
    <Modal
      className={styles.modal}
      title="工具调试"
      open={open}
      onCancel={onClose}
      footer={null}
      width={modalWidth}
      centered
      destroyOnHidden
    >
      <Spin spinning={loading}>
        <div className={styles.layout}>
          {/* 左栏：执行参数 */}
          <div className={styles.paramsCard}>
            <div className={styles.paramsTitle}>执行参数</div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>连接器</div>
              <Select
                value={selectedService}
                options={providerOptions}
                onChange={handleServiceChange}
                placeholder="请选择连接器"
                showSearch
                optionFilterProp="label"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>动作</div>
              <Select
                value={selectedActionKey}
                options={actionOptions}
                onChange={handleActionChange}
                placeholder={detailLoading ? '加载中…' : '请选择动作'}
                loading={detailLoading}
                showSearch
                optionFilterProp="label"
              />
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>使用连接</div>
              <Select
                value="auto"
                options={[
                  // 暂无连接列表接口：仅提供自动匹配（第一个 active 连接）
                  { label: '自动（第一个 active 连接）', value: 'auto' },
                ]}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabel}>输入参数（JSON）</div>
              <Input.TextArea
                className={styles.jsonInput}
                value={argsJson}
                onChange={(event) => setArgsJson(event.target.value)}
                rows={10}
                placeholder="{}"
                autoComplete="off"
              />
            </div>

            {/* 执行：POST /api/connector/runtime/execute，结果展示在右侧「执行结果」区 */}
            <Button
              type="primary"
              className={styles.executeButton}
              style={{ background: '#1f1f1f' }}
              loading={executing}
              disabled={!selectedService || !selectedActionKey}
              onClick={handleExecute}
            >
              执行
            </Button>
          </div>

          {/* 右栏：执行结果（标题栏可折叠） */}
          <div className={styles.resultPanel}>
            <div className={styles.resultHeader}>
              <span>执行结果</span>
              <MinusOutlined
                className={styles.resultCollapseBtn}
                onClick={() => setResultCollapsed((prev) => !prev)}
              />
            </div>
            {!resultCollapsed ? (
              <div className={styles.resultBody}>
                {result === undefined ? (
                  '尚未执行。'
                ) : (
                  <pre className={styles.resultJson}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default memo(ConnectorActionDebugModal);
