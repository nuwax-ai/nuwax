/**
 * 应用标签保活渲染器注册(model)
 * @description 女娲应用标签页缓存的分层桥:保活容器常驻 SidebarShell(layouts
 * 层),但分层禁令 non-pages-not-to-pages 禁止布局直引 pages——由 UserApp /
 * AgentDetails 页模块挂载时把「单应用实例」渲染器注册进本 model,SidebarShell
 * 的 OpenedAppTabsKeepAlive 容器消费 model 取组件引用渲染实例(pages→models
 * 方向合法,布局侧零 pages 依赖)。注册发生在对应路由 chunk 首次加载后,
 * 此前无缓存实例可渲染,容器自然为空,行为与未启用缓存一致。
 */
import React, { useCallback, useState } from 'react';

/** 单应用实例渲染入参(appId + 三方直载地址,与 UserAppPage props 对齐) */
export interface AppTabInstanceProps {
  /** 全栈应用 appId(/user-app/:appId 路由参数) */
  appId: number;
  /** 三方应用主页直载地址(空串 = 全栈应用,走域名接口) */
  homepageUrl: string;
}

/** agent 标签缓存实例渲染入参(/agent/:agentId 会话发起页) */
export interface AgentTabInstanceProps {
  /** 智能体ID(/agent/:agentId 路由参数) */
  agentId: number;
  /** 是否当前激活实例(激活可见/其余保活隐藏;驱动实例内激活沿副作用) */
  active: boolean;
}

/** agent 直开实例渲染入参(query 由渲染器内部 useSkillInfo 响应式消化) */
export interface AgentDirectInstanceProps {
  /** 智能体ID(/agent/:agentId 路由参数) */
  agentId: number;
}

/** agent 实例渲染器对:tab = 标签缓存实例;direct = 无标签直开临时实例 */
export interface AgentTabRendererPair {
  tab: React.FC<AgentTabInstanceProps>;
  direct: React.FC<AgentDirectInstanceProps>;
}

export default function AppTabKeepAliveModel() {
  /** 单应用实例渲染器(UserApp 页注册;组件引用入 state,注册即触发容器渲染) */
  const [renderer, setRenderer] =
    useState<React.FC<AppTabInstanceProps> | null>(null);
  /** agent 实例渲染器对(AgentDetails 页注册) */
  const [agentRenderer, setAgentRenderer] =
    useState<AgentTabRendererPair | null>(null);
  /** 注册渲染器:先注册者优先(路由组件重挂载不覆盖同一实现、不触发多余渲染) */
  const registerRenderer = useCallback(
    (next: React.FC<AppTabInstanceProps>) => {
      setRenderer((prev: React.FC<AppTabInstanceProps> | null) => prev ?? next);
    },
    [],
  );
  /** 注册 agent 渲染器对(同先注册者优先语义) */
  const registerAgentTabRenderer = useCallback((next: AgentTabRendererPair) => {
    setAgentRenderer((prev: AgentTabRendererPair | null) => prev ?? next);
  }, []);
  return {
    renderer,
    registerRenderer,
    agentRenderer,
    registerAgentTabRenderer,
  };
}
