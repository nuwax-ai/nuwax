/**
 * 连接器「已连接」列表 hook
 * @description 能力弹窗连接器维度的已连接数据源（与
 * /expert-skill-connector 连接器页「已连接」同口径）：
 * GET /api/connector/providers?connected=true 一次性全量返回（无分页；
 * 响应兼容裸数组与 records 分页双壳），关键字过滤在客户端完成。
 * 「已连接」页签可见性判定 + 聚合视图数据；连接/断开成功后由上层调
 * reload 同步（断开最后一项后凭空列表自动回落系统广场）。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiConnectorProviderPageList } from '@/services/systemManage';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CapabilityItem } from '../types';

/** 「已连接」条目归一化（仅页签可见性判定使用，不渲染卡片） */
const mapConnectedItem = (item: ConnectorProviderInfo): CapabilityItem => ({
  key: `connector:connected:${item.service || item.id}`,
  resourceType: 'connector',
  source: 'system',
  rawId: item.service || item.id,
  name: item.displayName || item.service,
  connected: item.connected,
  authType: item.authType,
});

const useConnectedConnectors = (active: boolean) => {
  const [list, setList] = useState<CapabilityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // 首拉完成标记：空列表区分「未加载」（不判定页签可见性）与「确无连接」（隐藏页签）
  const [loaded, setLoaded] = useState<boolean>(false);
  // 进行中的请求标识（过期响应丢弃）
  const requestIdRef = useRef<number>(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await apiConnectorProviderPageList({ connected: 'true' });
      if (requestIdRef.current !== requestId) {
        return;
      }
      if (res?.code !== SUCCESS_CODE) {
        throw new Error('connected connectors failed');
      }
      // 不带分页参数时后端可能直接回数组、也可能仍套 records 分页壳，两者兼容
      const data = res.data;
      const records = Array.isArray(data)
        ? (data as ConnectorProviderInfo[])
        : (data as { records?: ConnectorProviderInfo[] | null } | null)
            ?.records ?? [];
      setList(records.map(mapConnectedItem));
    } catch {
      if (requestIdRef.current === requestId) {
        setList([]);
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoaded(true);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (active) {
      void reload();
    }
  }, [active, reload]);

  return { list, loading, loaded, reload };
};

export default useConnectedConnectors;
