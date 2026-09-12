/**
 * 连接器卡片「连接/断开」流程 Hook（共享层）
 * @description 由专家·技能·连接器广场页与能力弹窗（CapabilityModal）共用，
 * 与管理侧/空间侧连接器详情抽屉（ConnectorProviderDetailDrawer）同口径：
 * - oauth2 → 授权弹窗：GET /api/connector/oauth/authorize 拿授权地址后
 *   window.open 新窗口打开（IdP 授权页带 X-Frame-Options 拒绝 iframe 嵌入），
 *   500ms 轮询弹窗 closed 后回查详情，已连接则就地更新卡片状态
 *   （用户在授权页取消则保持未连接，不提示）
 * - oauth2_device → 扫码连接弹窗 ConnectorDeviceAuthModal（与连接器详情
 *   抽屉同款）：弹窗内部自动 authorize 拿二维码并轮询授权结果，成功回调
 *   就地更新卡片状态（使用方渲染弹窗，透传 deviceCtx）
 * - api_key / bearer / custom → 凭据弹窗 ConnectorConnectModal（表单与提交
 *   POST /api/connector/connections/api-key 同空间侧/管理侧凭据抽屉口径）：
 *   先拉详情接口取凭证字段定义再打开弹窗
 * - no_auth（免鉴权）→ 无凭证概念，直接 POST /api/connector/connections/api-key
 *   建连（无凭证字段；spaceId 取卡片响应自带的所属空间，团队空间维度
 *   （含"全部"页签）透传、系统广场无该字段仅 providerService；不发凭据弹窗）
 * - 断开：连接 id ≠ 连接器 id，先 GET /api/connector/connections 按 service
 *   匹配出连接对象，再 DELETE /api/connector/connections/{id}
 * 团队空间维度带 spaceId、系统广场不带（与详情抽屉 connectSpaceId 一致；
 * 系统广场由后端按管理员/用户上下文处理）。
 * 业务/网络错误由全局 errorHandler 统一提示，此处不重复弹错。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiConnectorConnectionCreate,
  apiConnectorConnectionDelete,
  apiConnectorConnectionList,
  apiConnectorOauthAuthorize,
  apiSystemConnectorProviderDetail,
} from '@/services/systemManage';
import type {
  ConnectorAuthConfigField,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 可发起连接的卡片条目（结构化最小契约）：
 * 广场页 ResourceItem 与能力弹窗 CapabilityItem 均满足
 */
export interface ConnectorConnectItem {
  /** 条目唯一标识（广场页 item.id / 弹窗 item.key） */
  id: string;
  /** 连接器服务标识（连接/断开寻址用） */
  service?: string;
  /** 认证方式：oauth2 / api_key / bearer / custom / no_auth */
  authType?: string;
  /** 当前连接状态 */
  connected?: boolean;
  /**
   * 所属空间 ID（团队空间维度列表响应每条自带；系统广场/已连接的响应无该
   * 字段）——免鉴权直连建连时透传（"全部"页签下无法从选中空间推断，
   * 以卡片数据为准）
   */
  spaceId?: number;
}

/** 数据源：团队空间维度连接/断开带 spaceId，系统广场不带 */
export type ConnectorConnectSource = 'system' | 'team';

/** 凭据弹窗打开上下文（ConnectorConnectModal 渲染所需） */
interface ConnectorConnectContext {
  /** 发起连接的卡片条目（连接成功后就地更新该条状态） */
  item: ConnectorConnectItem;
  /** 详情接口返回的 provider（凭据弹窗顶部名称展示 + 凭证字段来源） */
  record: ConnectorProviderInfo | null;
  /** 凭证字段定义 */
  fields: ConnectorAuthConfigField[];
}

/** 扫码连接（设备码 oauth2_device）弹窗打开上下文（null = 关闭） */
interface DeviceAuthContext {
  /** 发起连接的卡片条目（授权成功后就地更新该条状态） */
  item: ConnectorConnectItem;
}

export interface UseConnectorConnectParams {
  /** 数据源（团队空间带 spaceId 发起连接，系统广场不带） */
  source: ConnectorConnectSource;
  /** 团队空间维度的空间 ID（system 源不依赖） */
  spaceId?: number;
  /** 就地更新卡片连接状态（连接/断开成功后调用，不整页重拉） */
  updateItem: (id: string, patch: { connected?: boolean }) => void;
}

/**
 * 凭据抽屉的凭证字段定义（与详情抽屉 connectFields 同口径）：
 * - 自定义认证（custom）：authConfig.fields 数组直接驱动（如 clientId / apiKey）
 * - API Key 认证：authConfig 无 fields 时按 keyName 生成单个凭证字段
 * - Bearer 认证：fields 缺失时兜底生成 token 字段（提交键 token）
 */
const getConnectFields = (
  provider: ConnectorProviderInfo | null | undefined,
): ConnectorAuthConfigField[] => {
  const authType = provider?.authType;
  const authConfig = provider?.authConfig as
    | Record<string, unknown>
    | undefined;
  if (Array.isArray(authConfig?.fields)) {
    return authConfig.fields as ConnectorAuthConfigField[];
  }
  if (authType === 'api_key') {
    const keyName =
      typeof authConfig?.keyName === 'string' && authConfig.keyName
        ? authConfig.keyName
        : 'apiKey';
    return [
      {
        name: keyName,
        label: keyName,
        placeholder: '粘贴 API Key',
        secret: true,
      },
    ];
  }
  if (authType === 'bearer') {
    return [
      {
        name: 'token',
        label: 'token',
        placeholder: '粘贴 Token',
        secret: true,
      },
    ];
  }
  return [];
};

/**
 * 连接器「连接/断开」读写封装：按认证方式分流两条连接链路，
 * 断开经连接列表按 service 寻址（连接 id ≠ 连接器 id）
 */
const useConnectorConnect = ({
  source,
  spaceId,
  updateItem,
}: UseConnectorConnectParams) => {
  /** 凭据弹窗打开上下文（null = 关闭） */
  const [connectCtx, setConnectCtx] = useState<ConnectorConnectContext | null>(
    null,
  );
  /** 扫码连接（设备码 oauth2_device）弹窗打开上下文（null = 关闭） */
  const [deviceCtx, setDeviceCtx] = useState<DeviceAuthContext | null>(null);
  /** 「连接」请求中的条目 id（对应卡片按钮 loading，防重复点击） */
  const [connectingIds, setConnectingIds] = useState<string[]>([]);
  /** 「断开」请求中的条目 id（对应卡片按钮 loading，防重复点击） */
  const [disconnectingIds, setDisconnectingIds] = useState<string[]>([]);

  /**
   * 发起连接的卡片条目 id 缓存：凭据弹窗 onConnected 回调时弹窗已先 onClose
   * （connectCtx 已清空），用 ref 保证成功后仍能定位到待更新的卡片
   */
  const connectItemRef = useRef<string | null>(null);

  /** 授权弹窗引用：重复点击时聚焦已有弹窗；轮询其 closed 判断授权流程结束 */
  const oauthWinRef = useRef<Window | null>(null);
  /** 授权弹窗关闭轮询定时器（卸载时清理） */
  const oauthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** 连接发起用的空间 ID：团队空间带，系统广场不带（与详情抽屉一致） */
  const connectSpaceId = source === 'team' ? spaceId : undefined;

  // 卸载清理授权弹窗轮询定时器（页面切换时停止轮询）
  useEffect(
    () => () => {
      if (oauthPollRef.current) {
        clearInterval(oauthPollRef.current);
        oauthPollRef.current = null;
      }
    },
    [],
  );

  /** 回查连接器详情：授权弹窗关闭后据此判断是否已连接 */
  const fetchProvider = useCallback(
    async (service: string): Promise<ConnectorProviderInfo | null> => {
      try {
        const res = await apiSystemConnectorProviderDetail({
          service,
          spaceId: connectSpaceId,
        });
        if (res?.code !== SUCCESS_CODE) return null;
        return res.data?.provider ?? null;
      } catch {
        // 业务/网络错误：全局 errorHandler 已提示后端报错，此处不再重复弹错
        return null;
      }
    },
    [connectSpaceId],
  );

  /** oauth2 授权弹窗流程（与详情抽屉 handleOauthAuthorize 同口径） */
  const openOauthAuthorize = useCallback(
    async (item: ConnectorConnectItem) => {
      const service = item.service as string;
      // 已有授权弹窗在打开：聚焦既有弹窗即可，不重复发起
      if (oauthWinRef.current && !oauthWinRef.current.closed) {
        oauthWinRef.current.focus();
        return;
      }
      setConnectingIds((prev) => [...prev, item.id]);
      try {
        const response = await apiConnectorOauthAuthorize({
          service,
          spaceId: connectSpaceId,
        });
        if (response?.code !== SUCCESS_CODE || !response.data?.authorizeUrl) {
          message.error(response?.message || '获取授权地址失败');
          return;
        }
        // 保持 window 引用（不加 noopener），后续要轮询它的 closed 状态
        const win = window.open(response.data.authorizeUrl, '_blank');
        if (!win) {
          message.warning('授权窗口被浏览器拦截，请允许弹窗后重试');
          return;
        }
        oauthWinRef.current = win;
        win.focus();
        oauthPollRef.current = setInterval(() => {
          if (oauthWinRef.current?.closed) {
            if (oauthPollRef.current) {
              clearInterval(oauthPollRef.current);
              oauthPollRef.current = null;
            }
            oauthWinRef.current = null;
            // 弹窗关闭即回查详情：授权成功则就地更新卡片（取消授权保持未连接）
            void fetchProvider(service).then((provider) => {
              if (provider?.connected) {
                updateItem(item.id, { connected: true });
                message.success('连接成功');
              }
            });
          }
        }, 500);
      } finally {
        setConnectingIds((prev) => prev.filter((id) => id !== item.id));
      }
    },
    [connectSpaceId, fetchProvider, updateItem],
  );

  /**
   * 连接器卡片「连接」入口：按认证方式分流——
   * oauth2 → 授权弹窗；oauth2_device → 扫码连接弹窗（授权成功回调就地更新）；
   * api_key/bearer/custom → 拉详情取凭证字段后开凭据弹窗；
   * no_auth（免鉴权）→ 直接建连（POST api-key 仅传 providerService，无凭证）
   */
  const handleConnect = useCallback(
    async (item: ConnectorConnectItem) => {
      if (!item.service) {
        // 数据异常兜底：缺 service 无法发起连接（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] connect skipped: missing service, item =',
          item.id,
        );
        return;
      }
      if (item.connected) return;
      if (connectingIds.includes(item.id)) return;
      if (item.authType === 'no_auth') {
        // 免鉴权：无凭证概念，直接建连（无凭证字段；spaceId 取卡片响应
        // 自带的所属空间——团队空间维度（含"全部"页签）每条都有，系统
        // 广场无该字段仅传 providerService），成功后就地更新卡片为已连接
        setConnectingIds((prev) => [...prev, item.id]);
        try {
          const res = await apiConnectorConnectionCreate({
            providerService: item.service,
            spaceId: item.spaceId,
          });
          if (res?.code === SUCCESS_CODE) {
            updateItem(item.id, { connected: true });
            message.success('连接成功');
          }
        } catch {
          // 业务/网络错误：全局 errorHandler 已提示后端报错，此处不再重复弹错
        } finally {
          setConnectingIds((prev) => prev.filter((id) => id !== item.id));
        }
        return;
      }
      if (item.authType === 'oauth2') {
        await openOauthAuthorize(item);
        return;
      }
      if (item.authType === 'oauth2_device') {
        // 扫描授权（设备码）：开扫码连接弹窗（ConnectorDeviceAuthModal），
        // 弹窗内部自动 authorize 拿二维码并轮询授权结果，成功后经
        // handleDeviceConnected 就地更新卡片为已连接（成功提示弹窗内完成）
        setDeviceCtx({ item });
        return;
      }
      setConnectingIds((prev) => [...prev, item.id]);
      try {
        // 拉详情取权威 provider（凭证字段定义在 authConfig.fields 里）
        const record = await fetchProvider(item.service);
        const fields = getConnectFields(record);
        if (fields.length === 0) {
          message.error('凭证字段缺失，无法建立连接');
          return;
        }
        connectItemRef.current = item.id;
        setConnectCtx({ item, record, fields });
      } finally {
        setConnectingIds((prev) => prev.filter((id) => id !== item.id));
      }
    },
    [connectingIds, openOauthAuthorize, fetchProvider, updateItem],
  );

  /** 凭据弹窗关闭（连接成功 / 手动取消均会关闭） */
  const closeConnectModal = useCallback(() => setConnectCtx(null), []);

  /**
   * 凭据弹窗连接成功回调：就地更新卡片为已连接
   * （成功提示由 ConnectorConnectModal 内部完成，不重复提示）
   */
  const handleConnected = useCallback(() => {
    const itemId = connectItemRef.current;
    if (itemId) {
      updateItem(itemId, { connected: true });
    }
  }, [updateItem]);

  /** 扫码连接（设备码）弹窗关闭（授权成功 / 手动取消均会关闭） */
  const closeDeviceAuthModal = useCallback(() => setDeviceCtx(null), []);

  /**
   * 扫码连接（设备码）授权成功回调：就地更新卡片为已连接
   * （成功提示由 ConnectorDeviceAuthModal 内部完成，不重复提示；
   * 组件触发本回调前已先 onClose，两者同批执行 deviceCtx 仍可读）
   */
  const handleDeviceConnected = useCallback(() => {
    const itemId = deviceCtx?.item.id;
    if (itemId) {
      updateItem(itemId, { connected: true });
    }
  }, [deviceCtx, updateItem]);

  /**
   * 连接器卡片「断开」：已连接状态下断开用户连接并就地更新卡片状态。
   * 连接 id ≠ 连接器 id：先 GET /api/connector/connections 按 service 匹配
   * （团队空间维度带 spaceId，系统广场不带，与连接器详情抽屉同口径），
   * 再 DELETE /api/connector/connections/{id}；成功后本地 updateItem 置
   * connected: false（不整页重拉，保留滚动加载位置）。
   * 业务/网络错误由全局 errorHandler 统一提示，此处不重复弹错
   */
  const handleDisconnect = useCallback(
    async (item: ConnectorConnectItem) => {
      if (!item.service) {
        // 数据异常兜底：缺 service 无法匹配连接 id（正常数据两个维度均有值）
        console.warn(
          '[useConnectorConnect] disconnect skipped: missing service, item =',
          item.id,
        );
        return;
      }
      if (disconnectingIds.includes(item.id)) return;
      setDisconnectingIds((prev) => [...prev, item.id]);
      try {
        const connRes = await apiConnectorConnectionList({
          spaceId: source === 'team' ? spaceId : undefined,
        });
        const connections = Array.isArray(connRes?.data) ? connRes.data : [];
        const matched = connections.find(
          (conn) => (conn.providerService ?? conn.service) === item.service,
        );
        if (!matched) {
          // 与连接器详情抽屉同口径：列表无匹配连接时无法寻址断开
          message.error('连接 id 缺失，无法断开连接');
          return;
        }
        const res = await apiConnectorConnectionDelete(matched.id);
        if (res?.code === SUCCESS_CODE) {
          updateItem(item.id, { connected: false });
          message.success('已断开连接');
        }
        // 非成功码理论上会被全局拦截器 reject，不会 resolve 到这里
      } catch {
        // 业务/网络错误：全局 errorHandler 已提示后端报错，此处不再重复弹错
      } finally {
        setDisconnectingIds((prev) => prev.filter((id) => id !== item.id));
      }
    },
    [disconnectingIds, source, spaceId, updateItem],
  );

  return {
    handleConnect,
    connectingIds,
    handleDisconnect,
    disconnectingIds,
    connectCtx,
    closeConnectModal,
    handleConnected,
    /** 扫码连接（设备码 oauth2_device）弹窗打开上下文（渲染 ConnectorDeviceAuthModal 用） */
    deviceCtx,
    closeDeviceAuthModal,
    handleDeviceConnected,
  };
};

export default useConnectorConnect;
