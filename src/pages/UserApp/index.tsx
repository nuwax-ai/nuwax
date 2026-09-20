/**
 * 全栈应用页(女娲应用-全栈应用卡片入口 /user-app/:appId)
 * @description 应用页面 iframe(PagePreviewIframe)占满全屏。header 左侧展示
 * 应用详情名称(应用域名与宿主跨域,iframe 文档标题读不到:contentDocument
 * 为 null,组件内 querySelector('head > title') 不会执行,故由本页显式传入
 * title)。iframe 地址取值优先级:三方应用随跳转附带的 homepageUrl query
 * (女娲应用页点击时下发,直载不拉域名接口)> GET /api/userapp/domain/list
 * (appId 入参)回包:优先自定义域名(Custom),无则生产域名(Prod),再回退
 * 首条。加载失败或无可用域名时对齐 /agent/:agentId(ConversationDetails)
 * 口径:错误 toast 由全局请求层弹出,页面退出 loading 后仅展示空态,无专属
 * 错误页。左侧会话区后续按需求迭代。
 */
import { PagePreviewIframe } from '@/components/business-component';
import { USER_APP_PATH_PREFIX } from '@/constants/square.constants';
import type { OpenedAppTabInfo } from '@/models/openedAppTabs';
import { dict } from '@/services/i18nRuntime';
import {
  apiUserAppDomainList,
  apiUserAppGetById,
} from '@/services/userProjectApp';
import {
  UserAppDomainTypeEnum,
  type UserAppDomainInfo,
} from '@/types/interfaces/userProject';
import { LoadingOutlined } from '@ant-design/icons';
import { Empty } from 'antd';
import React, { useMemo } from 'react';
import { useLocation, useModel, useParams, useRequest } from 'umi';

/** 将裸域名规范为可访问的 https URL(与 AppDevPro normalizeUserAppPreviewUrl 同口径) */
const normalizeDomainUrl = (domain?: string): string => {
  const trimmed = domain?.trim() || '';
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

/** 内层实现:单应用实例,appId/homepageUrl 由外层按 key 重挂载保证不变 */
const UserAppPage: React.FC<{ appId: number; homepageUrl: string }> = ({
  appId,
  homepageUrl,
}) => {
  // 域名列表:GET /api/userapp/domain/list(appId query);homepageUrl 直载
  // 场景 ready=false,首挂即不请求也不进 loading(appId 变化由外层 key
  // 重挂载处理,不走 refreshDeps——umi 的 useRequest 底层为 ahooks v2,
  // refreshDeps 触发的 refresh() 不受 ready 拦截,见文件尾外层注释)
  const { data, loading, error } = useRequest(
    () => apiUserAppDomainList(appId),
    { ready: !homepageUrl },
  );
  const domainList: UserAppDomainInfo[] = data || [];

  // 应用详情:GET /api/userapp/get/:id,仅取 name 作 header 标题;
  // 失败时全局请求层已 toast,标题缺省不影响 iframe 展示。三方应用
  // (homepageUrl 直载)该接口无回包,ready=false 一并跳过,标题改从
  // 多开标签兜底
  const { data: appInfo } = useRequest(() => apiUserAppGetById(appId), {
    ready: !homepageUrl,
  });

  // 标题兜底:多开标签存有应用名(女娲应用页点击时注册),三方应用
  // 详情接口无回包时从这里取;直连本页(无标签)时缺省,与现状一致
  const { openedAppTabs } = useModel('openedAppTabs');
  const tabTitle = openedAppTabs.find(
    (tab: OpenedAppTabInfo) =>
      tab.routePath === `${USER_APP_PATH_PREFIX}/${appId}`,
  )?.name;

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
      {/* 全栈应用页面:iframe 占满全屏,跨域读不到文档标题,header 显式传应用名 */}
      <PagePreviewIframe
        className="flex-1"
        pagePreviewData={{ uri: previewUrl, params: {} }}
        showHeader={true}
        showCloseButton={false}
        title={appInfo?.name || tabTitle}
      />
    </div>
  );
};

/**
 * 路由层薄壳:解析路由参数,按 appId+homepageUrl 加 key 强制重挂内层页面。
 * /user-app/:appId 之间切换时组件实例被复用,而 umi 的 useRequest 底层是
 * @ahooksjs/use-request v2,其 refreshDeps 变化触发的 refresh() 不受 ready
 * 拦截——全栈(ready=true)切三方(homepageUrl 直载,ready 变 false)时
 * 依旧会发出 domain/list 与 get 请求。任一参数变化即整体重挂载:
 * useRequest 全新实例、ready 首值即正确,同时消除旧应用 data/loading
 * 残留串台。
 */
const UserApp: React.FC = () => {
  // 路由参数:全栈应用 appId(发布对象 targetId)
  const params = useParams();
  const appId = Number(params.appId);
  // 三方应用主页地址:女娲应用页点击时随跳转附带(query),有值时直接
  // iframe 该地址,不拉域名列表(三方应用无域名数据,接口返回空)。
  // react-router v6 无 location.query,用 URLSearchParams 读(同 OpenIframePage)
  const location = useLocation();
  const homepageUrl =
    new URLSearchParams(location.search).get('homepageUrl')?.trim() || '';
  return (
    <UserAppPage
      key={`${appId}-${homepageUrl}`}
      appId={appId}
      homepageUrl={homepageUrl}
    />
  );
};

export default UserApp;
