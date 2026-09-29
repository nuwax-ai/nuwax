import { dict } from '@/services/i18nRuntime';
import type { RequestResponse } from '@/types/interfaces/request';
import type { UserAppInfo } from '@/types/interfaces/userProject';
import {
  DeleteOutlined,
  EyeOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, Modal, Spin, Tooltip, message } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRequest } from 'umi';
import {
  apiPrivateServerCreate,
  apiPrivateServerDelete,
  apiPrivateServerGet,
  apiPrivateServerHealthCheck,
  apiPrivateServerUpdate,
  type PrivateServerInfo,
  type PrivateServerUpdateParams,
} from '../../../services/privateServer';
import PrivateServerDetailModal from '../PrivateServerDetailModal';
import PrivateServerForm, {
  getEmptyPrivateServerForm,
  type PrivateServerFormValue,
} from '../PrivateServerForm';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PrivateServerPanelProps {
  /** 应用详情，用其中的 deployServerId 标出当前部署私服 */
  appInfo?: UserAppInfo;
  /** 私服列表 */
  servers: PrivateServerInfo[];
  /** 列表加载中 */
  loading?: boolean;
  /** 增删后刷新列表 */
  onRefresh: () => void;
}

/** 列表行：已保存或未提交空行 */
interface ServerRow {
  key: string;
  /** 已保存时带接口数据 */
  saved?: PrivateServerInfo;
  value: PrivateServerFormValue;
}

/** 健康检查结果：检查中 / 在线 / 离线 */
type HealthState = 'loading' | boolean;

const PORT_PATTERN = /^\d+$/;
const FALLBACK_KEY = 'draft-fallback';

/**
 * 校验端口是否为 1-65535。
 *
 * @param value 输入值
 * @returns 是否合法
 */
const isValidPort = (value: string): boolean => {
  if (!PORT_PATTERN.test(value.trim())) {
    return false;
  }
  const port = Number(value);
  return port >= 1 && port <= 65535;
};

/**
 * 列表展示文案：名称优先，否则用地址。
 *
 * @param item 私服
 * @returns 展示名
 */
const getServerLabel = (item: PrivateServerInfo): string =>
  item.name || `${item.scheme}://${item.host}`;

/**
 * 已保存私服转成表单值。
 *
 * @param item 私服
 * @returns 表单值
 */
const toFormValue = (item: PrivateServerInfo): PrivateServerFormValue => ({
  scheme: item.scheme === 'http' ? 'http' : 'https',
  host: item.host || '',
  agentPort: item.agentPort != null ? String(item.agentPort) : '',
  vncPort: item.vncPort != null ? String(item.vncPort) : '',
  fileServerPort:
    item.fileServerPort != null ? String(item.fileServerPort) : '',
});

const createDraftRow = (key: string): ServerRow => ({
  key,
  value: getEmptyPrivateServerForm(),
});

/**
 * 解开健康检查返回值，兼容直接 boolean 与包装结构。
 *
 * @param result 接口结果
 * @returns 是否在线
 */
const pickHealthOnline = (
  result?: boolean | RequestResponse<boolean>,
): boolean => {
  if (typeof result === 'boolean') {
    return result;
  }
  return result?.data === true;
};

/**
 * 从创建接口结果中取出私服 ID。
 *
 * @param result 创建结果
 * @returns 私服 ID
 */
const pickCreatedId = (
  result?: PrivateServerInfo | RequestResponse<PrivateServerInfo>,
): number | undefined => {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  if ('id' in result && typeof result.id === 'number') {
    return result.id;
  }
  const wrapped = result as RequestResponse<PrivateServerInfo>;
  return wrapped.data?.id;
};

/**
 * 解开私服详情，兼容直接对象与包装结构。
 *
 * @param result 接口结果
 * @returns 私服详情
 */
const pickServerDetail = (
  result?: PrivateServerInfo | RequestResponse<PrivateServerInfo>,
): PrivateServerInfo | undefined => {
  if (!result || typeof result !== 'object') {
    return undefined;
  }
  if ('host' in result && typeof result.id === 'number') {
    return result;
  }
  const wrapped = result as RequestResponse<PrivateServerInfo>;
  return wrapped.data;
};

/**
 * 私服列表、行内追加空行与删除。
 * 应用详情里的 deployServerId 与列表 id 一致时，给该行加主题色背景。
 *
 * @param props.appInfo 应用详情
 * @param props.servers 当前列表
 * @param props.loading 列表 loading
 * @param props.onRefresh 刷新回调
 * @returns 私服管理区域
 */
const PrivateServerPanel: React.FC<PrivateServerPanelProps> = ({
  appInfo,
  servers,
  loading,
  onRefresh,
}) => {
  const draftSeqRef = useRef(0);
  const submittingKeyRef = useRef<string>();
  const [drafts, setDrafts] = useState<ServerRow[]>([]);
  const [submittingKey, setSubmittingKey] = useState<string>();
  const [hideFallback, setHideFallback] = useState(false);

  const [healthMap, setHealthMap] = useState<Record<number, HealthState>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailServer, setDetailServer] = useState<PrivateServerInfo>();
  const healthMapRef = useRef(healthMap);
  healthMapRef.current = healthMap;

  /**
   * 检查单台私服是否可达。
   *
   * @param id 私服 ID
   */
  const checkHealth = useCallback(async (id: number) => {
    setHealthMap((prev) => ({ ...prev, [id]: 'loading' }));
    try {
      const result = await apiPrivateServerHealthCheck(id);
      setHealthMap((prev) => ({ ...prev, [id]: pickHealthOnline(result) }));
    } catch (error) {
      console.error('Failed to check private server health:', error);
      setHealthMap((prev) => ({ ...prev, [id]: false }));
    }
  }, []);

  const { run: runCreate, loading: createLoading } = useRequest(
    apiPrivateServerCreate,
    {
      manual: true,
      onSuccess: (
        result?: PrivateServerInfo | RequestResponse<PrivateServerInfo>,
      ) => {
        const key = submittingKeyRef.current;
        message.success(
          dict('PC.Pages.AppProjectDetail.addPrivateServerSuccess'),
        );
        setDrafts((prev) => prev.filter((item) => item.key !== key));
        submittingKeyRef.current = undefined;
        setSubmittingKey(undefined);
        const createdId = pickCreatedId(result);
        if (createdId) {
          void checkHealth(createdId);
        }
        onRefresh();
      },
      onError: () => {
        submittingKeyRef.current = undefined;
        setSubmittingKey(undefined);
      },
    },
  );

  // 删除私服
  const { run: runDelete } = useRequest(apiPrivateServerDelete, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.deleteSuccess'));
      onRefresh();
    },
  });

  // 更新私服信息
  const { run: runUpdate, loading: updateLoading } = useRequest(
    apiPrivateServerUpdate,
    {
      manual: true,
      onSuccess: (
        _result: unknown,
        params: PrivateServerUpdateParams[],
      ) => {
        message.success(
          dict('PC.Pages.AppProjectDetail.updatePrivateServerSuccess'),
        );
        setDetailOpen(false);
        const updatedId = params[0]?.id;
        if (updatedId) {
          void checkHealth(updatedId);
        }
        onRefresh();
      },
    },
  );

  useEffect(() => {
    servers.forEach((item) => {
      if (healthMapRef.current[item.id] !== undefined) {
        return;
      }
      void checkHealth(item.id);
    });
    setHealthMap((prev) => {
      const alive = new Set(servers.map((item) => item.id));
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((key) => {
        const id = Number(key);
        if (!alive.has(id)) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [checkHealth, servers]);

  /** 已保存行 + 未提交空行 */
  const rows = useMemo(() => {
    const savedRows: ServerRow[] = servers.map((item) => ({
      key: `saved-${item.id}`,
      saved: item,
      value: toFormValue(item),
    }));
    if (drafts.length > 0) {
      return [...savedRows, ...drafts];
    }
    if (servers.length === 0 && !loading && !hideFallback) {
      return [...savedRows, createDraftRow(FALLBACK_KEY)];
    }
    return savedRows;
  }, [drafts, hideFallback, loading, servers]);

  /** 在列表末尾追加一行空表单 */
  const handleOpenAdd = useCallback(() => {
    draftSeqRef.current += 1;
    setHideFallback(false);
    setDrafts((prev) => {
      const base =
        prev.length === 0 && servers.length === 0 && !hideFallback
          ? [createDraftRow(FALLBACK_KEY)]
          : prev;
      return [...base, createDraftRow(`draft-${draftSeqRef.current}`)];
    });
  }, [hideFallback, servers.length]);

  const handleRowChange = useCallback(
    (key: string, value: PrivateServerFormValue) => {
      setDrafts((prev) => {
        if (prev.some((item) => item.key === key)) {
          return prev.map((item) =>
            item.key === key ? { ...item, value } : item,
          );
        }
        return [...prev, { key, value }];
      });
    },
    [],
  );

  const handleSubmitAdd = useCallback(
    (row: ServerRow) => {
      const host = row.value.host.trim();
      if (!host) {
        message.warning(dict('PC.Pages.AppProjectDetail.invalidServerIp'));
        return;
      }
      if (
        !isValidPort(row.value.agentPort) ||
        !isValidPort(row.value.vncPort) ||
        !isValidPort(row.value.fileServerPort)
      ) {
        message.warning(dict('PC.Pages.AppProjectDetail.invalidPort'));
        return;
      }
      submittingKeyRef.current = row.key;
      setSubmittingKey(row.key);
      runCreate({
        name: host,
        scheme: row.value.scheme,
        host,
        agentPort: Number(row.value.agentPort),
        vncPort: Number(row.value.vncPort),
        fileServerPort: Number(row.value.fileServerPort),
      });
    },
    [runCreate],
  );

  /**
   * 打开已保存私服的详情。先用列表数据占位，再以详情接口结果覆盖。
   *
   * @param server 列表中的私服
   */
  const handleViewDetail = useCallback(async (server: PrivateServerInfo) => {
    setDetailServer(server);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const result = await apiPrivateServerGet(server.id);
      const next = pickServerDetail(result);
      if (next) {
        setDetailServer(next);
      }
    } catch (error) {
      console.error('Failed to load private server detail:', error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  /** 关闭私服详情弹窗 */
  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  /**
   * 提交私服详情更新。
   *
   * @param data 更新参数
   */
  const handleUpdateDetail = useCallback(
    (data: PrivateServerUpdateParams) => {
      runUpdate(data);
    },
    [runUpdate],
  );

  /**
   * 重新检查已添加私服的连接状态。
   */
  const handleRefreshHealth = useCallback(() => {
    servers.forEach((item) => {
      void checkHealth(item.id);
    });
  }, [checkHealth, servers]);

  const healthChecking = useMemo(
    () => Object.values(healthMap).some((status) => status === 'loading'),
    [healthMap],
  );

  const handleDelete = useCallback(
    (row: ServerRow) => {
      if (!row.saved) {
        setDrafts((prev) => prev.filter((item) => item.key !== row.key));
        setHideFallback(true);
        return;
      }
      const saved = row.saved;
      Modal.confirm({
        title: dict('PC.Pages.AppProjectDetail.deletePrivateServerTitle'),
        content: dict(
          'PC.Pages.AppProjectDetail.deletePrivateServerContent',
          getServerLabel(saved),
        ),
        okButtonProps: { danger: true },
        okText: dict('PC.Common.Global.delete'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => {
          if (servers.length <= 1) {
            setHideFallback(false);
          }
          runDelete(saved.id);
        },
      });
    },
    [runDelete, servers.length],
  );

  const renderHealth = (id: number) => {
    const status = healthMap[id];
    if (status === 'loading' || status === undefined) {
      return (
        <span className={cx(styles.health)}>
          <LoadingOutlined />
        </span>
      );
    }
    return (
      <span
        className={cx(styles.health, status ? styles.online : styles.offline)}
      >
        {status
          ? dict('PC.Pages.AppProjectDetail.healthOnline')
          : dict('PC.Pages.AppProjectDetail.healthOffline')}
      </span>
    );
  };

  return (
    <Spin spinning={!!loading || createLoading}>
      {rows.length > 0 ? (
        <div className={cx(styles.header)}>
          <div className={cx(styles['header-fields'])}>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectDetail.protocol')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectDetail.serverIp')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectDetail.agentPort')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectDetail.vncPort')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectDetail.fileServerPort')}
            </span>
          </div>
          <span className={cx(styles.actions)}>
            {servers.length > 0 ? (
              <Button
                size="small"
                className={cx(styles.refresh)}
                icon={<ReloadOutlined spin={healthChecking} />}
                onClick={handleRefreshHealth}
              >
                {dict('PC.Pages.AppProjectDetail.refreshConnectionStatus')}
              </Button>
            ) : null}
          </span>
        </div>
      ) : null}
      <div className={cx(styles.list)}>
        {rows.map((row) => {
          const selected =
            row.saved != null &&
            appInfo?.deployServerId != null &&
            Number(row.saved.id) === Number(appInfo.deployServerId);
          return (
            <div
              key={row.key}
              className={cx(styles.row, {
                [styles.selected]: selected,
              })}
            >
              <PrivateServerForm
                disabled={!!row.saved}
                value={row.value}
                onChange={(value) => handleRowChange(row.key, value)}
              />
              <div className={cx(styles.actions)}>
                {row.saved ? (
                  renderHealth(row.saved.id)
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    className={cx(styles.confirm)}
                    loading={submittingKey === row.key}
                    onClick={() => handleSubmitAdd(row)}
                  >
                    {dict('PC.Pages.AppProjectDetail.addServerRow')}
                  </Button>
                )}
                {row.saved ? (
                  <Tooltip
                    title={dict(
                      'PC.Pages.AppProjectDetail.viewPrivateServerDetail',
                    )}
                  >
                    <Button
                      type="text"
                      size="small"
                      className={cx(styles.detail)}
                      icon={<EyeOutlined />}
                      aria-label={dict(
                        'PC.Pages.AppProjectDetail.viewPrivateServerDetail',
                      )}
                      onClick={() => {
                        if (row.saved) {
                          void handleViewDetail(row.saved);
                        }
                      }}
                    />
                  </Tooltip>
                ) : null}
                <Button
                  type="text"
                  danger
                  size="small"
                  className={cx(styles.delete)}
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(row)}
                />
              </div>
            </div>
          );
        })}
      </div>
      <Button
        icon={<PlusOutlined />}
        className={cx(styles.add)}
        onClick={handleOpenAdd}
      >
        {dict('PC.Pages.AppProjectDetail.addPrivateServer')}
      </Button>
      <div className={cx(styles.hint)}>
        <p>
          http: {dict('PC.Pages.AppProjectDetail.privateHintHttp')}
        </p>
        <p>
          https: {dict('PC.Pages.AppProjectDetail.privateHint')}
        </p>
      </div>
      <PrivateServerDetailModal
        open={detailOpen}
        loading={detailLoading}
        confirmLoading={updateLoading}
        server={detailServer}
        onCancel={handleCloseDetail}
        onUpdate={handleUpdateDetail}
      />
    </Spin>
  );
};

export default PrivateServerPanel;
