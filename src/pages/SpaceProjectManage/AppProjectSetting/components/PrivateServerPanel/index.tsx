import { dict } from '@/services/i18nRuntime';
import type { RequestResponse } from '@/types/interfaces/request';
import {
  DeleteOutlined,
  LoadingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Modal, Spin, message } from 'antd';
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
  apiPrivateServerHealthCheck,
  type PrivateServerInfo,
} from '../../../services/privateServer';
import PrivateServerForm, {
  getEmptyPrivateServerForm,
  type PrivateServerFormValue,
} from '../PrivateServerForm';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface PrivateServerPanelProps {
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
  item.name || `${item.scheme}://${item.host}:${item.appPort}`;

/**
 * 已保存私服转成表单值。
 *
 * @param item 私服
 * @returns 表单值
 */
const toFormValue = (item: PrivateServerInfo): PrivateServerFormValue => ({
  scheme: item.scheme === 'http' ? 'http' : 'https',
  host: item.host || '',
  appPort: item.appPort != null ? String(item.appPort) : '',
  agentPort: item.agentPort != null ? String(item.agentPort) : '',
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
 * 私服列表、行内追加空行与删除。
 *
 * @param props.servers 当前列表
 * @param props.loading 列表 loading
 * @param props.onRefresh 刷新回调
 * @returns 私服管理区域
 */
const PrivateServerPanel: React.FC<PrivateServerPanelProps> = ({
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
          dict('PC.Pages.AppProjectSetting.addPrivateServerSuccess'),
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

  const { run: runDelete } = useRequest(apiPrivateServerDelete, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.deleteSuccess'));
      onRefresh();
    },
  });

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
        message.warning(dict('PC.Pages.AppProjectSetting.invalidServerIp'));
        return;
      }
      if (
        !isValidPort(row.value.appPort) ||
        !isValidPort(row.value.agentPort)
      ) {
        message.warning(dict('PC.Pages.AppProjectSetting.invalidPort'));
        return;
      }
      submittingKeyRef.current = row.key;
      setSubmittingKey(row.key);
      runCreate({
        name: host,
        scheme: row.value.scheme,
        host,
        appPort: Number(row.value.appPort),
        agentPort: Number(row.value.agentPort),
      });
    },
    [runCreate],
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
        title: dict('PC.Pages.AppProjectSetting.deletePrivateServerTitle'),
        content: dict(
          'PC.Pages.AppProjectSetting.deletePrivateServerContent',
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
          ? dict('PC.Pages.AppProjectSetting.healthOnline')
          : dict('PC.Pages.AppProjectSetting.healthOffline')}
      </span>
    );
  };

  return (
    <Spin spinning={!!loading || createLoading}>
      {rows.length > 0 ? (
        <div className={cx(styles.header)}>
          <div className={cx(styles['header-fields'])}>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectSetting.protocol')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectSetting.serverIp')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectSetting.appPort')}
            </span>
            <span className={cx(styles['header-cell'])}>
              {dict('PC.Pages.AppProjectSetting.managePort')}
            </span>
          </div>
          <span className={cx(styles.actions)} />
        </div>
      ) : null}
      <div className={cx(styles.list)}>
        {rows.map((row) => (
          <div key={row.key} className={cx(styles.row)}>
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
                  {dict('PC.Pages.AppProjectSetting.addServerRow')}
                </Button>
              )}
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
        ))}
      </div>
      <Button
        icon={<PlusOutlined />}
        className={cx(styles.add)}
        onClick={handleOpenAdd}
      >
        {dict('PC.Pages.AppProjectSetting.addPrivateServer')}
      </Button>
      <p className={cx(styles.hint)}>
        {dict('PC.Pages.AppProjectSetting.privateHint')}
      </p>
    </Spin>
  );
};

export default PrivateServerPanel;
