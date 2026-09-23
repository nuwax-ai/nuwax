/**
 * 全栈应用页(女娲应用-全栈应用卡片入口 /user-app/:appId)
 * @description 应用页面 iframe(PagePreviewIframe)占满全屏,无 header(刷新/
 * 复制链接能力由侧栏应用标签行承载,经 eventBus 命令本实例执行;原 header
 * 标题与应用详情名称接口已随标题栏一并移除)。iframe 地址取值优先级:三方
 * 应用随标签保存的 homepageUrl(女娲应用页点击时注册,直载不拉域名接口)>
 * GET /api/userapp/domain/list(appId 入参)回包:优先自定义域名(Custom),
 * 无则生产域名(Prod),再回退首条。加载失败或无可用域名时对齐
 * /agent/:agentId(ConversationDetails)口径:错误 toast 由全局请求层弹出,
 * 页面退出 loading 后仅展示空态,无专属错误页。左侧会话区后续按需求迭代。
 *
 * 分层与缓存:实际页面渲染上移 SidebarShell 的 OpenedAppTabsKeepAlive
 * 保活容器(所有已打开标签实例常驻,当前路由命中者可见,切回不重载);本
 * 路由组件为空壳,挂载时把单应用实例渲染器注册进 appTabKeepAlive model
 * (分层禁令:布局层禁止直引 pages,经 model 桥接)。
 */
import { PagePreviewIframe } from '@/components/business-component';
import { USER_APP_PATH_PREFIX } from '@/constants/square.constants';
import type { AppTabInstanceProps } from '@/models/appTabKeepAlive';
import { dict } from '@/services/i18nRuntime';
import { apiUserAppDomainList } from '@/services/userProjectApp';
import {
  UserAppDomainTypeEnum,
  type UserAppDomainInfo,
} from '@/types/interfaces/userProject';
import { LoadingOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import React, { useEffect, useMemo } from 'react';
import { useModel, useRequest } from 'umi';

/** 将裸域名规范为可访问的 https URL(与 AppDevPro normalizeUserAppPreviewUrl 同口径) */
const normalizeDomainUrl = (domain?: string): string => {
  const trimmed = domain?.trim() || '';
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/** 单应用实例实现:appId/homepageUrl 每标签各一份(保活容器按实例隔离渲染) */
const UserAppPage: React.FC<{ appId: number; homepageUrl: string }> = ({
  appId,
  homepageUrl,
}) => {
  // 域名列表:GET /api/userapp/domain/list(appId query);homepageUrl 直载
  // 场景 ready=false,首挂即不请求也不进 loading(应用切换 = 保活容器切
  // 实例,不走 refreshDeps——umi 的 useRequest 底层为 ahooks v2,
  // refreshDeps 触发的 refresh() 不受 ready 拦截,故必须实例隔离)
  const { data, loading, error } = useRequest(
    () => apiUserAppDomainList(appId),
    { ready: !homepageUrl },
  );
  const domainList: UserAppDomainInfo[] = data || [];

  // iframe 域名优先级:homepageUrl(三方应用直载)> 自定义域名(Custom)>
  // 生产域名(Prod)> 首条兜底
  const previewEntry = useMemo(
    () =>
      domainList.find(
        (item) => item.domainType === UserAppDomainTypeEnum.Custom,
      ) ||
      domainList.find(
        (item) => item.domainType === UserAppDomainTypeEnum.Prod,
      ) ||
      domainList[0] ||
      null,
    [domainList],
  );
  const previewUrl = homepageUrl || normalizeDomainUrl(previewEntry?.domain);

  // pagePreviewData 引用必须稳定:PagePreviewIframe 的内容监听 effect 依赖该
  // 对象引用,内联字面量会随任何上层重渲染(点标签刷 lastActiveAt、路由切
  // 换等)产生新引用 → effect 重跑 → iframe.src 重赋值 → 整页重载,保活缓
  // 存失效。useMemo 依赖 previewUrl 字符串,地址不变则引用不变
  const pagePreviewData = useMemo(
    () => ({ uri: previewUrl, params: {} }),
    [previewUrl],
  );

  // 加载中:全屏居中 loading(对齐 ConversationDetails)
  if (loading) {
    return (
      <div className="flex items-center content-center flex-1 h-full w-full">
        <LoadingOutlined />
      </div>
    );
  }

  // 加载失败/无可用域名:仅展示空态(错误 toast 已由全局请求层弹出)
  if (error || !previewUrl) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Empty
          description={dict(
            error
              ? 'PC.Pages.UserApp.loadFailed'
              : 'PC.Pages.UserApp.emptyDomain',
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* 全栈应用页面:iframe 占满全屏无 header(刷新/复制链接由侧栏应用
          标签行经 eventBus 命令触发,commandKey 与标签 routePath 同源) */}
      <PagePreviewIframe
        className="flex-1"
        pagePreviewData={pagePreviewData}
        showHeader={false}
        showCloseButton={false}
        commandKey={`${USER_APP_PATH_PREFIX}/${appId}`}
      />
    </div>
  );
};

/**
 * 单应用实例渲染器:注册给 SidebarShell 保活容器(见 appTabKeepAlive
 * model)。homepageUrl 直载场景 useRequest ready 首值即正确(实例不随
 * 路由参数变化复用,无 refreshDeps 绕过 ready 的旧问题)。
 */
const AppTabInstance: React.FC<AppTabInstanceProps> = ({
  appId,
  homepageUrl,
}) => <UserAppPage appId={appId} homepageUrl={homepageUrl} />;

/**
 * 路由层空壳:/user-app/:appId 的页面渲染已上移 SidebarShell 的
 * OpenedAppTabsKeepAlive 保活容器(跨路由缓存,切回不重载),路由组件仅
 * 负责注册实例渲染器并让位(返回 null,防双实例双请求)。渲染器注册进
 * model 后常驻(路由卸载不清除),后续路由重进无需再注册。
 */
const UserApp: React.FC = () => {
  const { registerRenderer } = useModel('appTabKeepAlive');
  useEffect(() => {
    registerRenderer(AppTabInstance);
  }, [registerRenderer]);
  return null;
};

export default UserApp;
