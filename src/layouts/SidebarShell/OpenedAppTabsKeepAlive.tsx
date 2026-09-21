/**
 * 女娲应用多开标签保活容器(SidebarShell 内容区常驻)
 * @description 标签页缓存:把所有已打开的 /user-app/:appId 与 /agent/:agentId
 * 标签实例常驻渲染在内容区(与路由出口并列),当前路由命中的实例可见、其余
 * display:none 保活——iframe/DOM 不销毁即不重载,标签互切/切走再切回即时
 * 恢复(域名/详情数据随实例保留,切回不重拉)。当前路由不在任何标签上时容器
 * 整体隐藏,占位让给路由出口(正常页面不受影响)。
 * 实例渲染器由 UserApp / AgentDetails 页模块经 appTabKeepAlive model 注册
 * (分层:布局层 non-pages-not-to-pages 禁止直引 pages);未注册(未加载过
 * 对应页面)时容器渲染空。
 * /agent/:id 标签渲染 ConversationDetails 会话发起页:实例经 instanceScoped
 * 自持预览/付费弹窗等状态(全局单槽会被并存实例互踩),active 由本容器下发,
 * 控制实例内激活沿重同步与失活收尾。
 * 直连兜底:无标签的 /user-app/:appId 与 /agent/:agentId(广场等入口直开、
 * 刷新后标签内存态丢失)渲染不缓存的临时实例,路由切走即随 key 消失卸载,
 * 与历史行为一致;/agent 直开带 skillId/skillName query 时由 direct 实例接管
 * 显示(同路径标签实例让位保持挂载不可见,防技能 query 被标签实例静默丢弃)。
 */
import { USER_APP_PATH_PREFIX } from '@/constants/square.constants';
import type { AppTabInstanceProps } from '@/models/appTabKeepAlive';
import React from 'react';
import { useLocation, useModel } from 'umi';

/** /user-app/:appId 路由形态(捕获 appId 段;前缀与 USER_APP_PATH_PREFIX 同源) */
const USER_APP_ROUTE_RE = new RegExp(`^${USER_APP_PATH_PREFIX}/(\\d+)$`);

/** /agent/:agentId 路由形态(捕获 agentId 段) */
const AGENT_ROUTE_RE = /^\/agent\/(\d+)$/;

/** 保活实例描述(标签实例或直连兜底实例) */
interface KeepAliveInstance extends AppTabInstanceProps {
  /** React key:标签实例 = routePath(标签关闭时随之卸载销毁 iframe) */
  key: string;
  /** 是否当前激活(激活实例可见,其余保活隐藏) */
  active: boolean;
}

/** agent 保活实例描述(标签缓存实例或直开临时实例) */
interface AgentKeepAliveInstance {
  /** React key:标签实例 = routePath(标签关闭随之卸载);直开 = direct 前缀 */
  key: string;
  /** 智能体ID(/agent/:agentId 路由参数) */
  agentId: number;
  /** 是否当前激活(激活实例可见,其余保活隐藏) */
  active: boolean;
  /** tab = 标签缓存实例;direct = 无标签/skill query 直开临时实例 */
  kind: 'tab' | 'direct';
}

const OpenedAppTabsKeepAlive: React.FC = () => {
  const { openedAppTabs } = useModel('openedAppTabs');
  const { renderer, agentRenderer } = useModel('appTabKeepAlive');
  const location = useLocation();

  if (!renderer && !agentRenderer) return null;

  const pathname = location.pathname;
  // 广场技能入口带 skillId/skillName query:标签实例不消化 query,同路径时
  // 让位 direct 实例(保持挂载不可见)
  const searchParams = new URLSearchParams(location.search);
  const skillEntry =
    !!searchParams.get('skillId') && !!searchParams.get('skillName');

  const instances: KeepAliveInstance[] = [];
  // 标签实例:routePath 即缓存 key;active 精确匹配当前路由
  for (const tab of openedAppTabs) {
    const match = tab.routePath.match(USER_APP_ROUTE_RE);
    if (!match) continue;
    instances.push({
      key: tab.routePath,
      appId: Number(match[1]),
      homepageUrl: tab.homepageUrl?.trim() || '',
      active: tab.routePath === pathname,
    });
  }
  // 直连兜底:当前路由是 user-app 但无对应标签——追加不缓存的临时实例
  // (homepageUrl 直载 query 仅在此场景从 URL 读,标签实例以 tab 数据为准)
  const directMatch = pathname.match(USER_APP_ROUTE_RE);
  if (directMatch && !instances.some((ins) => ins.active)) {
    const homepageUrl =
      new URLSearchParams(location.search).get('homepageUrl')?.trim() || '';
    instances.push({
      key: `direct:${pathname}:${homepageUrl}`,
      appId: Number(directMatch[1]),
      homepageUrl,
      active: true,
    });
  }

  const agentInstances: AgentKeepAliveInstance[] = [];
  // agent 标签实例:同 user-app 语义;skill query 入口让位(见 skillEntry)
  for (const tab of openedAppTabs) {
    const match = tab.routePath.match(AGENT_ROUTE_RE);
    if (!match) continue;
    agentInstances.push({
      key: tab.routePath,
      agentId: Number(match[1]),
      active: tab.routePath === pathname && !skillEntry,
      kind: 'tab',
    });
  }
  // agent 直连兜底:无标签,或带 skill query(标签实例不消化 query,由 direct
  // 实例接管)。key 不含 search:同路径换 query 不重挂(与原路由形态一致),
  // skillInfo 由 direct 渲染器响应式消化
  const agentDirectMatch = pathname.match(AGENT_ROUTE_RE);
  if (
    agentDirectMatch &&
    (skillEntry || !agentInstances.some((ins) => ins.active))
  ) {
    agentInstances.push({
      key: `agent-direct:${pathname}`,
      agentId: Number(agentDirectMatch[1]),
      active: true,
      kind: 'direct',
    });
  }

  if (instances.length === 0 && agentInstances.length === 0) return null;

  // 容器占位条件:任一类实例激活(当前路由命中标签或直连);否则整体隐藏保活
  const containerVisible =
    instances.some((ins) => ins.active) ||
    agentInstances.some((ins) => ins.active);
  const Renderer = renderer;
  return (
    <div
      className="h-full w-full"
      style={{ display: containerVisible ? 'block' : 'none' }}
      aria-hidden={!containerVisible}
    >
      {Renderer &&
        instances.map((ins) => (
          <div
            key={ins.key}
            className="h-full w-full"
            style={{ display: ins.active ? 'block' : 'none' }}
          >
            <Renderer appId={ins.appId} homepageUrl={ins.homepageUrl} />
          </div>
        ))}
      {agentRenderer &&
        agentInstances.map((ins) => (
          <div
            key={ins.key}
            className="h-full w-full"
            style={{ display: ins.active ? 'block' : 'none' }}
          >
            {ins.kind === 'tab' ? (
              <agentRenderer.tab agentId={ins.agentId} active={ins.active} />
            ) : (
              <agentRenderer.direct agentId={ins.agentId} />
            )}
          </div>
        ))}
    </div>
  );
};

export default OpenedAppTabsKeepAlive;
