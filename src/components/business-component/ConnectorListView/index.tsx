/**
 * ConnectorListView — 独立连接器列表组件（数据与连接流程内聚 + 双布局变体）
 * @description 只做「连接器列表」：按 type 四场景拉数（已连接/系统广场/
 * 团队空间/搜索场景，接口参数矩阵见 useConnectorList）、滚动分页、
 * 连接/断开全流程内聚（共享 useConnectorConnect：oauth2 授权窗 / 扫码
 * 设备码 / 凭据弹窗 / 断开寻址，两个子弹窗随组件渲染）。
 * 无选中交互（纯连接管理）；tab/搜索框/分类 pill 等宿主 UI 不在组件内，
 * 连接态变更经 onConnectedChange 通知宿主同步派生数据（如「已连接」页签）。
 *
 * 用法：
 * ```tsx
 * <ConnectorListView
 *   type="team"
 *   keyword={kw}
 *   spaceId={spaceId}
 *   onConnectedChange={(item, connected) => syncConnectedTab()}
 * />
 * ```
 */
import ConnectorConnectModal from '@/components/business-component/ConnectorConnectModal';
import ConnectorDeviceAuthModal from '@/components/business-component/ConnectorDeviceAuthModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useConnectorConnect from '@/hooks/useConnectorConnect';
import { t } from '@/services/i18nRuntime';
import {
  apiConnectorConnectionList,
  apiConnectorConnectionToggleStatus,
} from '@/services/systemManage';
import { Empty, message, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ConnectorGridCard from './ConnectorGridCard';
import ConnectorListRow from './ConnectorListRow';
import useConnectorList from './hooks/useConnectorList';
import styles from './index.less';
import type { ConnectorListItem, ConnectorListViewProps } from './types';

const cx = classNames.bind(styles);

const ConnectorListView: React.FC<ConnectorListViewProps> = ({
  type,
  variant = 'grid',
  keyword,
  category,
  spaceId,
  onConnectedChange,
  pageSize = 20,
  simple = false,
  className,
}) => {
  const { list, loading, hasMore, loadMore, reload, updateItem } =
    useConnectorList({
      type,
      keyword,
      category,
      spaceId,
      pageSize,
    });

  // ---- 连接/断开/启停（共享 hook + 启用状态接口）----
  // team 视图带 spaceId 发起；connected/search/system 视图按系统口径不带。
  // listRef 镜像最新列表：连接态变更时就地回写（连接即启用、断开即停用）
  // + 通知宿主（同步「已连接」页签）。「已连接」视图下连接/断开改变集合
  // 成员——就地回写会让断开的条目以未连接态残留在列表，故整区重拉
  // （无分页全量接口，不丢滚动加载位置）；其余视图维持就地回写
  const listRef = useRef<ConnectorListItem[]>(list);
  listRef.current = list;
  const connectSource = type === 'team' ? 'team' : 'system';
  const {
    handleConnect,
    connectingIds,
    handleDisconnect,
    disconnectingIds,
    connectCtx,
    closeConnectModal,
    handleConnected,
    deviceCtx,
    closeDeviceAuthModal,
    handleDeviceConnected,
  } = useConnectorConnect({
    source: connectSource,
    spaceId: connectSource === 'team' ? spaceId : undefined,
    updateItem: (key, patch) => {
      // 连接成功 → 连接即启用；断开 → 一并停用（开关回落）
      const merged =
        patch.connected === undefined
          ? patch
          : { ...patch, connectionEnabled: patch.connected };
      updateItem(key, merged);
      if (patch.connected !== undefined) {
        const item = listRef.current.find((entry) => entry.key === key);
        if (item) {
          onConnectedChange?.({ ...item, ...merged }, patch.connected);
        }
        // 「已连接」视图：断开的条目需移出列表，整区重拉同步集合
        if (type === 'connected') {
          reload();
        }
      }
    },
  });
  // 启停请求中的条目 key（开关 loading 防重复）
  const [togglingKeys, setTogglingKeys] = useState<string[]>([]);
  // 开关 loading：连接中 + 启停中（不含断开——断开是独立按钮独立 loading）
  const switchBusyKeys = useMemo(
    () => [...connectingIds, ...togglingKeys],
    [connectingIds, togglingKeys],
  );
  // 断开按钮 loading：仅断开中（启停不应带亮断开按钮）
  const disconnectBusyKeys = disconnectingIds;

  /**
   * 切换连接启用状态（POST .../connections/{连接id}/status，连接 id 取
   * 列表接口响应的 connectionId，非提供方主键——与 /expert-skill-connector
   * 连接器页同口径）；成功后就地回写开关。连接成功后就地回写不经过列表
   * 接口，新连接 id 缺失时按 service 查连接列表兜底寻址（与断开流程同
   * 口径），并在成功后补写 connectionId 避免后续重复兜底查询
   */
  const toggleConnectionEnabled = useCallback(
    async (item: ConnectorListItem, enabled: boolean) => {
      let connectionId = item.connectionId;
      if (!connectionId && item.rawId !== undefined) {
        // 刚连接成功、尚未重拉列表的条目：新连接 id 未随就地回写带上，
        // 按 service 匹配连接列表兜底寻址
        try {
          const connRes = await apiConnectorConnectionList({
            spaceId: connectSource === 'team' ? spaceId : undefined,
          });
          const connections = Array.isArray(connRes?.data) ? connRes.data : [];
          const service = String(item.rawId);
          connectionId = connections.find(
            (conn) => (conn.providerService ?? conn.service) === service,
          )?.id;
        } catch {
          // 兜底查询失败落入下方统一提示
        }
      }
      if (!connectionId) {
        console.warn(
          '[ConnectorListView] toggle enabled skipped: missing connectionId, item =',
          item.key,
        );
        message.error('连接 id 缺失，无法切换连接状态');
        return;
      }
      setTogglingKeys((prev) => [...prev, item.key]);
      try {
        const res = await apiConnectorConnectionToggleStatus(
          connectionId,
          enabled,
        );
        if (res?.code === SUCCESS_CODE) {
          updateItem(item.key, {
            connectionEnabled: enabled,
            ...(item.connectionId ? null : { connectionId }),
          });
        } else {
          message.error(res?.message || t('PC.Common.Global.operationFailed'));
        }
      } finally {
        setTogglingKeys((prev) => prev.filter((key) => key !== item.key));
      }
    },
    [connectSource, spaceId, updateItem],
  );

  /**
   * 启用开关切换：
   * - 未连接/未启用 → 发起连接（连接即启用，按 authType 分流
   *   oauth2 授权窗 / 扫码 / 凭据弹窗）；
   * - 已连接 → 切换连接启用状态（POST .../connections/{id}/status），
   *   关闭开关仅停用、**不执行断开**——断开是独立的 hover 按钮。
   */
  const handleToggleConnect = useCallback(
    (item: ConnectorListItem) => {
      const enabled =
        item.connected === true && item.connectionEnabled !== false;
      if (!enabled) {
        if (item.connected) {
          // 已连接未启用 → 启用
          void toggleConnectionEnabled(item, true);
          return;
        }
        // 未连接 → 连接并启用（连接成功经 updateItem 回写启用态）
        void handleConnect({
          id: item.key,
          service: item.rawId !== undefined ? String(item.rawId) : undefined,
          authType: item.authType,
          connected: item.connected,
        });
        return;
      }
      // 已启用 → 仅停用（不断开）
      void toggleConnectionEnabled(item, false);
    },
    [handleConnect, toggleConnectionEnabled],
  );

  /** 「断开」按钮：已连接态直接断开（独立于开关的停用语义） */
  const handleDisconnectClick = useCallback(
    (item: ConnectorListItem) => {
      void handleDisconnect({
        id: item.key,
        service: item.rawId !== undefined ? String(item.rawId) : undefined,
        authType: item.authType,
        connected: item.connected,
      });
    },
    [handleDisconnect],
  );

  // ---- 滚动分页与首屏补拉（滚动容器为组件根节点）----
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.clientHeight > 0 &&
      el.scrollHeight - el.scrollTop - el.clientHeight < 48 &&
      !loading &&
      hasMore
    ) {
      loadMore();
    }
  };
  // 列表未填满容器且还有数据时自动补拉
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const fillViewport = () => {
      if (
        !loading &&
        hasMore &&
        list.length > 0 &&
        el.clientHeight > 0 &&
        el.scrollHeight <= el.clientHeight
      ) {
        loadMore();
      }
    };
    fillViewport();
    // 隐藏容器先不翻页；恢复可见或容器变高时重新检查，避免短列表无法滚动。
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fillViewport);
    observer.observe(el);
    return () => observer.disconnect();
  }, [list, loading, hasMore, loadMore]);

  const initialLoading = loading && list.length === 0;
  const isGrid = variant === 'grid';
  const cardProps = {
    onToggleConnect: handleToggleConnect,
    onDisconnect: handleDisconnectClick,
    // 开关 loading（连接+启停）与断开按钮 loading（仅断开）分离,
    // 启停时不再带亮断开按钮
    busyKeys: switchBusyKeys,
    disconnectBusyKeys,
  };

  return (
    <div
      ref={scrollRef}
      className={cx(
        styles.root,
        isGrid ? styles['root-grid'] : styles['root-list'],
        // simple 紧凑行行间距归零（simple 仅 list 变体生效）
        !isGrid && simple && styles['root-list-simple'],
        className,
      )}
      onScroll={handleScroll}
    >
      {initialLoading ? (
        <div className={cx(styles.state)}>
          <Spin size="large" />
        </div>
      ) : list.length === 0 ? (
        <div className={cx(styles.state)}>
          <Empty description={t('PC.Common.Global.emptyData')} />
        </div>
      ) : (
        <>
          {list.map((item, index) =>
            isGrid ? (
              <ConnectorGridCard
                key={item.key}
                item={item}
                index={index}
                {...cardProps}
              />
            ) : (
              <ConnectorListRow
                key={item.key}
                item={item}
                index={index}
                simple={simple}
                {...cardProps}
              />
            ),
          )}
          {loading && (
            <div className={cx(styles['state-loading'])}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}

      {/* 凭据型连接弹窗（oauth2 走授权窗口，不经过这里） */}
      <ConnectorConnectModal
        open={!!connectCtx}
        record={connectCtx?.record ?? null}
        fields={connectCtx?.fields ?? []}
        spaceId={connectSource === 'team' ? spaceId : undefined}
        onClose={closeConnectModal}
        onConnected={handleConnected}
      />

      {/* 扫码连接（设备码）弹窗：授权成功后就地更新卡片为已连接 */}
      <ConnectorDeviceAuthModal
        open={deviceCtx !== null}
        service={deviceCtx?.item.service || ''}
        spaceId={connectSource === 'team' ? spaceId : undefined}
        onClose={closeDeviceAuthModal}
        onConnected={handleDeviceConnected}
      />
    </div>
  );
};

export default ConnectorListView;
export type {
  ConnectorListItem,
  ConnectorListSourceType,
  ConnectorListVariant,
  ConnectorListViewProps,
} from './types';
