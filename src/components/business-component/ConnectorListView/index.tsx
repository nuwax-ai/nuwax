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
import useConnectorConnect from '@/hooks/useConnectorConnect';
import { t } from '@/services/i18nRuntime';
import { Empty, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef } from 'react';
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
  className,
}) => {
  const { list, loading, hasMore, loadMore, updateItem } = useConnectorList({
    type,
    keyword,
    category,
    spaceId,
    pageSize,
  });

  // ---- 连接/断开（共享 hook,oauth2/扫码/凭据/断开寻址分流）----
  // team 视图带 spaceId 发起；connected/search/system 视图按系统口径不带。
  // listRef 镜像最新列表：连接态变更时就地回写 + 通知宿主（同步「已连接」页签）
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
      updateItem(key, patch);
      if (patch.connected !== undefined) {
        const item = listRef.current.find((entry) => entry.key === key);
        if (item) {
          onConnectedChange?.(
            { ...item, connected: patch.connected },
            patch.connected,
          );
        }
      }
    },
  });
  const busyKeys = [...connectingIds, ...disconnectingIds];

  /** 开关切换：未连接→连接（按 authType 分流）；已连接→断开 */
  const handleToggleConnect = useCallback(
    (item: ConnectorListItem) => {
      if (item.connected) {
        void handleDisconnect({
          id: item.key,
          service: item.rawId !== undefined ? String(item.rawId) : undefined,
          authType: item.authType,
          connected: item.connected,
        });
        return;
      }
      void handleConnect({
        id: item.key,
        service: item.rawId !== undefined ? String(item.rawId) : undefined,
        authType: item.authType,
        connected: item.connected,
      });
    },
    [handleConnect, handleDisconnect],
  );

  /** 「断开」按钮：已连接态直接断开 */
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
    if (!el || loading || !hasMore || list.length === 0) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight) {
      loadMore();
    }
  }, [list, loading, hasMore, loadMore]);

  const initialLoading = loading && list.length === 0;
  const isGrid = variant === 'grid';
  const cardProps = {
    onToggleConnect: handleToggleConnect,
    onDisconnect: handleDisconnectClick,
    busyKeys,
  };

  return (
    <div
      ref={scrollRef}
      className={cx(
        styles.root,
        isGrid ? styles['root-grid'] : styles['root-list'],
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
