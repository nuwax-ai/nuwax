/**
 * 连接器卡片「连接」流程 Hook
 * @description 专家·技能·连接器页连接器卡片「连接」按钮的处理逻辑，
 * 与管理侧/空间侧连接器详情抽屉（ConnectorProviderDetailDrawer）同口径：
 * - oauth2 → 授权弹窗：GET /api/connector/oauth/authorize 拿授权地址后
 *   window.open 新窗口打开（IdP 授权页带 X-Frame-Options 拒绝 iframe 嵌入），
 *   500ms 轮询弹窗 closed 后回查详情，已连接则就地更新卡片状态
 *   （用户在授权页取消则保持未连接，不提示）
 * - api_key / bearer / custom → 凭据弹窗 ConnectorConnectModal（表单与提交
 *   POST /api/connector/connections/api-key 同空间侧/管理侧凭据抽屉口径，
 *   原抽屉保持不变，本页按需求用弹窗交互）：先拉详情接口取凭证字段定义
 *   再打开弹窗
 * 团队空间维度带 spaceId、系统广场不带（与详情抽屉 connectSpaceId 一致；
 * 系统广场由后端按管理员/用户上下文处理）。
 * 业务/网络错误由全局 errorHandler 统一提示，此处不重复弹错。
 */

import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiConnectorOauthAuthorize,
  apiSystemConnectorProviderDetail,
} from '@/services/systemManage';
import type {
  ConnectorAuthConfigField,
  ConnectorProviderInfo,
} from '@/types/interfaces/systemManage';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResourceItem, ResourceSourceEnum } from '../../../types';

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

/** 凭据弹窗打开上下文（ConnectorConnectModal 渲染所需） */
interface ConnectorConnectContext {
  /** 发起连接的卡片条目（连接成功后就地更新该条状态） */
  item: ResourceItem;
  /** 详情接口返回的 provider（凭据弹窗顶部名称展示 + 凭证字段来源） */
  record: ConnectorProviderInfo | null;
  /** 凭证字段定义 */
  fields: ConnectorAuthConfigField[];
}

export interface UseConnectorConnectParams {
  /** 数据源（团队空间带 spaceId 发起连接，系统广场不带） */
  source: ResourceSourceEnum;
  /** 团队空间维度的空间 ID（system 源不依赖） */
  spaceId?: number;
  /** 就地更新卡片连接状态（useResourceList.updateItem） */
  updateItem: (id: string, patch: Partial<ResourceItem>) => void;
}

/**
 * 连接器「连接」读写封装：按认证方式分流两条连接链路
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
  /** 「连接」请求中的条目 id（对应卡片按钮 loading，防重复点击） */
  const [connectingIds, setConnectingIds] = useState<string[]>([]);

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
    async (item: ResourceItem) => {
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
   * oauth2 → 授权弹窗；api_key/bearer/custom → 拉详情取凭证字段后开凭据弹窗
   */
  const handleConnect = useCallback(
    async (item: ResourceItem) => {
      if (!item.service) {
        // 数据异常兜底：缺 service 无法发起连接（正常数据两个维度均有值）
        console.warn(
          '[ExpertSkillConnector] connect skipped: missing service, item =',
          item.id,
        );
        return;
      }
      // 免鉴权无连接动作（卡片本就不渲染按钮，此处防御兜底）
      if (item.authType === 'no_auth' || item.connected) return;
      if (connectingIds.includes(item.id)) return;
      if (item.authType === 'oauth2') {
        await openOauthAuthorize(item);
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
    [connectingIds, openOauthAuthorize, fetchProvider],
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

  return {
    handleConnect,
    connectingIds,
    connectCtx,
    closeConnectModal,
    handleConnected,
  };
};

export default useConnectorConnect;
