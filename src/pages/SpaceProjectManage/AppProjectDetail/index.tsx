import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  useConversationChanged,
  useProjectChanged,
} from '@/hooks/useDirectorySync';
import useHomePinnedProjectHandoff from '@/hooks/useHomePinnedProjectHandoff';
import { dict } from '@/services/i18nRuntime';
import { apiUserAppGetById } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import {
  UserAppDeployTypeEnum,
  type UserAppInfo,
  type UserProjectConversationInfo,
} from '@/types/interfaces/userProject';
import { copyTextToClipboard } from '@/utils/clipboard';
import { isValidDomain, normalizeDomain } from '@/utils/common';
import { applyConversationChangedToList } from '@/utils/directorySyncEvents';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Result,
  Spin,
  Tabs,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import {
  apiUserAppDomainCreate,
  apiUserAppDomainDelete,
  apiUserAppDomainList,
  UserAppDomainTypeEnum,
  type UserAppDomainInfo,
} from '../../AppDevPro/services/appDomain';
import ConversationPanel from '../components/ConversationPanel';
import { apiUserProjectConversations } from '../services';
import {
  apiPrivateServerList,
  apiPrivateServerSetDeployTarget,
  type PrivateServerInfo,
  type SetDeployTargetParams,
} from '../services/privateServer';
import {
  apiThirdAppOauth2CredentialRegenerate,
  apiThirdAppOauth2SecretGet,
  apiThirdAppOauth2SettingGet,
  apiThirdAppOauth2SettingSave,
  type ThirdAppOauth2CredentialInfo,
  type ThirdAppOauth2Info,
} from '../services/thirdAppOauth2';
import { openProject } from '../type';
import PrivateServerPanel from './components/PrivateServerPanel';
import SelectDeployServerModal from './components/SelectDeployServerModal';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 详情页顶部 Tab：计划 / 资产 / 设置 */
type SettingTabKey = 'plan' | 'asset' | 'setting';

/** 自定义域名 CNAME 指向的平台域名 */
const CNAME_TARGET = 'cname.nuwax.com';

/**
 * 将应用详情的 deployType 映射为详情页部署单选值。
 * 非 private 一律视为平台部署，避免接口大小写或空值导致状态丢失。
 *
 * @param deployType 应用详情 deployType
 * @returns 平台部署或私服部署
 */
const resolveDeployMode = (
  deployType?: UserAppDeployTypeEnum | string,
): UserAppDeployTypeEnum =>
  String(deployType || '').toLowerCase() === UserAppDeployTypeEnum.Private
    ? UserAppDeployTypeEnum.Private
    : UserAppDeployTypeEnum.Platform;

/**
 * 解开 umi request / useRequest 包装，兼容完整 Response 与已解包 data。
 *
 * @param result 接口原始返回
 * @returns 业务 data；失败或无法识别时为 undefined
 */
const pickResponseData = <T,>(
  result?: RequestResponse<T> | T,
): T | undefined => {
  if (result === undefined || result === null) {
    return undefined;
  }
  if (typeof result === 'object' && result !== null && 'code' in result) {
    const wrapped = result as RequestResponse<T>;
    if (wrapped.code && wrapped.code !== SUCCESS_CODE) {
      return undefined;
    }
    return wrapped.data;
  }
  return result as T;
};

/**
 * 全栈应用详情页。
 *
 * 布局：顶栏返回 + 应用名 + 计划/资产/设置 Tab；主体左侧为详情内容，
 * 右侧为相关任务（ConversationPanel）。
 *
 * 数据：
 * - 进页拉 apiUserAppGetById，用 name 填标题、用 deployType 回填平台/私服；
 * - 进页拉项目会话列表，设置 Tab 再拉 OAuth2 与自定义域名；
 * - 选私服时再拉私有服务器列表（进页若已是私服也会拉一次）；
 * - 「设置部署服务器」：平台直接保存；私服弹窗单选后保存。
 *
 * 计划 / 资产 Tab 分别通过 iframe 展示计划文档与资产目录。
 * 路由参数 spaceId、appId 来自 `/space/:spaceId/app-project-detail/:appId`。
 *
 * @returns 全栈应用详情页
 */
const AppProjectDetail: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const appId = Number(params.appId);
  const { pin } = useHomePinnedProjectHandoff();

  const [activeTab, setActiveTab] = useState<SettingTabKey>('plan');
  const [conversations, setConversations] = useState<
    UserProjectConversationInfo[]
  >([]);
  const [projectInfo, setProjectInfo] = useState<UserAppInfo>();
  const [projectName, setProjectName] = useState<string>('');
  const [domains, setDomains] = useState<UserAppDomainInfo[]>([]);
  const [deployMode, setDeployMode] = useState<UserAppDeployTypeEnum>(
    UserAppDeployTypeEnum.Platform,
  );
  const [bindOpen, setBindOpen] = useState<boolean>(false);
  const [bindDomain, setBindDomain] = useState<string>('');
  const [oauthInfo, setOauthInfo] = useState<ThirdAppOauth2Info>();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [secretVisible, setSecretVisible] = useState<boolean>(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [homepageUrl, setHomepageUrl] = useState<string>('');
  const [redirectUri, setRedirectUri] = useState<string>('');
  const [privateServers, setPrivateServers] = useState<PrivateServerInfo[]>([]);
  const [deployServerId, setDeployServerId] = useState<number>();
  const [deployTargetOpen, setDeployTargetOpen] = useState<boolean>(false);
  const [selectedDeployServerId, setSelectedDeployServerId] =
    useState<number>();
  const [conversationPanelVisible, setConversationPanelVisible] =
    useState<boolean>(true);
  const [iframeLoadFailed, setIframeLoadFailed] = useState<boolean>(false);

  useProjectChanged((event) => {
    if (
      event.project.projectType !== AgentComponentTypeEnum.UserApp ||
      event.project.projectId !== String(appId) ||
      (event.project.spaceId !== undefined &&
        event.project.spaceId !== String(spaceId))
    ) {
      return;
    }
    if (event.operation === 'deleted') {
      history.replace(`/space/${spaceId}/project-manage`);
      return;
    }
    if (event.operation !== 'updated' || !event.patch) return;
    setProjectInfo((previous) =>
      previous
        ? {
            ...previous,
            ...(event.patch?.name !== undefined
              ? { name: event.patch.name }
              : {}),
            ...(event.patch?.description !== undefined
              ? { description: event.patch.description }
              : {}),
            ...(event.patch?.icon !== undefined
              ? { icon: event.patch.icon ?? '' }
              : {}),
          }
        : previous,
    );
    if (event.patch.name !== undefined) setProjectName(event.patch.name);
  });

  /** 项目下全部用户会话，供右侧任务列表展示 */
  const { run: runConversations, loading } = useRequest(
    () => apiUserProjectConversations(appId, AgentComponentTypeEnum.UserApp),
    {
      manual: true,
      onSuccess: (
        result:
          | UserProjectConversationInfo[]
          | RequestResponse<UserProjectConversationInfo[]>,
      ) => {
        const list = Array.isArray(result) ? result : pickResponseData(result);
        const records = Array.isArray(list) ? list : [];
        setConversations(records);
        setProjectName(
          (prev) =>
            prev || records.find((item) => item.agent?.name)?.agent?.name || '',
        );
      },
      onError: () => {
        setConversations([]);
      },
    },
  );

  useConversationChanged((event) => {
    if (
      !event.project ||
      event.project.projectType !== AgentComponentTypeEnum.UserApp ||
      event.project.projectId !== String(appId)
    ) {
      return;
    }
    setConversations((previous) =>
      applyConversationChangedToList(previous, event),
    );
    if (event.operation === 'created' || event.operation === 'deleted') {
      runConversations();
    }
  });

  /** 应用已绑定的自定义域名列表 */
  const { run: runDomainList } = useRequest(apiUserAppDomainList, {
    manual: true,
    onSuccess: (
      result: UserAppDomainInfo[] | { data?: UserAppDomainInfo[] },
    ) => {
      const list = Array.isArray(result)
        ? result
        : Array.isArray((result as { data?: UserAppDomainInfo[] })?.data)
        ? (result as { data: UserAppDomainInfo[] }).data
        : [];
      setDomains(list);
    },
    onError: () => {
      setDomains([]);
    },
  });

  /** 绑定自定义域名，成功后刷新列表 */
  const { run: runBindDomain, loading: bindLoading } = useRequest(
    apiUserAppDomainCreate,
    {
      manual: true,
      onSuccess: () => {
        message.success(dict('PC.Pages.AppProjectDetail.bindSuccess'));
        setBindOpen(false);
        setBindDomain('');
        runDomainList(appId);
      },
    },
  );

  /** 私有服务器列表：仅在选中私服部署时请求，避免进页就打接口 */
  const { run: runPrivateServerList, loading: privateServerLoading } =
    useRequest(apiPrivateServerList, {
      manual: true,
      onSuccess: (
        result: PrivateServerInfo[] | RequestResponse<PrivateServerInfo[]>,
      ) => {
        const list = Array.isArray(result) ? result : pickResponseData(result);
        setPrivateServers(Array.isArray(list) ? list : []);
      },
      onError: () => {
        setPrivateServers([]);
      },
    });

  /** 应用详情：回填名称与部署方式；私服部署时顺带拉服务器列表 */
  const { run: runGetUserApp, loading: appLoading } = useRequest(
    () => apiUserAppGetById(appId),
    {
      manual: true,
      onSuccess: (result: UserAppInfo | RequestResponse<UserAppInfo>) => {
        const info = pickResponseData(result);
        if (!info?.id) {
          return;
        }
        setProjectInfo(info);
        if (info.name) {
          setProjectName(info.name);
        }
        const mode = resolveDeployMode(info.deployType);
        setDeployMode(mode);
        setDeployServerId(info.deployServerId);
        if (mode === UserAppDeployTypeEnum.Private) {
          runPrivateServerList();
        }
      },
    },
  );

  /** 解绑自定义域名 */
  const { run: runUnbindDomain } = useRequest(apiUserAppDomainDelete, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Pages.AppProjectDetail.unbindSuccess'));
      runDomainList(appId);
    },
  });

  /** 重新生成 OAuth2 Client ID / Secret */
  const { run: runRegenerate, loading: regenerateLoading } = useRequest(
    () => apiThirdAppOauth2CredentialRegenerate(String(appId)),
    {
      manual: true,
      onSuccess: (
        result:
          | RequestResponse<ThirdAppOauth2CredentialInfo>
          | ThirdAppOauth2CredentialInfo,
      ) => {
        const credential = pickResponseData(result);
        if (!credential?.clientId) {
          return;
        }
        setOauthInfo((prev) => ({
          projectId: prev?.projectId ?? appId,
          clientId: credential.clientId,
          hasClientSecret: true,
          homepageUrl: prev?.homepageUrl ?? homepageUrl,
          redirectUri: prev?.redirectUri ?? redirectUri,
          scopes: prev?.scopes ?? [],
          enabled: prev?.enabled ?? true,
        }));
        setClientSecret(credential.clientSecret || '');
        setSecretVisible(true);
        message.success(dict('PC.Pages.AppProjectDetail.regenerateSuccess'));
      },
    },
  );

  /** 保存发布部署目标：平台不传 deployServerId，私服必须带选中的服务器 ID */
  const { run: runSetDeployTarget, loading: setDeployLoading } = useRequest(
    apiPrivateServerSetDeployTarget,
    {
      manual: true,
      onSuccess: (_result: unknown, params: SetDeployTargetParams[]) => {
        const payload = params[0];
        if (payload?.deployType === UserAppDeployTypeEnum.Private) {
          setDeployServerId(payload.deployServerId);
        } else {
          setDeployServerId(undefined);
        }
        setDeployTargetOpen(false);
        message.success(dict('PC.Common.Global.saveSuccess'));
      },
    },
  );

  /** 保存 OAuth2 主页地址与回调地址 */
  const { run: runSaveOauthSetting, loading: saveOauthLoading } = useRequest(
    apiThirdAppOauth2SettingSave,
    {
      manual: true,
      onSuccess: (
        result: ThirdAppOauth2Info | RequestResponse<ThirdAppOauth2Info>,
      ) => {
        const info = pickResponseData(result);
        if (info) {
          setOauthInfo(info);
          setHomepageUrl(info.homepageUrl || '');
          setRedirectUri(info.redirectUri || '');
        }
        message.success(dict('PC.Common.Global.saveSuccess'));
      },
    },
  );

  /**
   * 进入设置 Tab 后拉 OAuth2 配置；已生成 Secret 再取明文。
   */
  const loadOauthSetting = useCallback(async () => {
    if (!appId) {
      return;
    }
    setOauthLoading(true);
    setSecretVisible(false);
    try {
      const settingRes = await apiThirdAppOauth2SettingGet(appId, AgentComponentTypeEnum.UserApp);
      const info = pickResponseData(settingRes);
      setOauthInfo(info);
      setHomepageUrl(info?.homepageUrl || '');
      setRedirectUri(info?.redirectUri || '');
      if (!info?.hasClientSecret) {
        setClientSecret('');
        return;
      }
      try {
        const secretRes = await apiThirdAppOauth2SecretGet(appId, AgentComponentTypeEnum.UserApp);
        const secret = pickResponseData(secretRes);
        setClientSecret(typeof secret === 'string' ? secret : '');
      } catch (error) {
        console.error('Failed to load oauth secret:', error);
        setClientSecret('');
      }
    } catch (error) {
      console.error('Failed to load oauth setting:', error);
      setOauthInfo(undefined);
      setClientSecret('');
      setHomepageUrl('');
      setRedirectUri('');
    } finally {
      setOauthLoading(false);
    }
  }, [appId]);

  // 进页拉应用详情与当前应用的会话列表，与当前 Tab 无关
  useEffect(() => {
    if (!appId) {
      return;
    }
    runGetUserApp();
    runConversations();
  }, [appId, runConversations, runGetUserApp]);

  // 切到设置 Tab 时再拉 OAuth2 与域名列表，避免进页空跑设置接口
  useEffect(() => {
    if (activeTab !== 'setting' || !appId) {
      return;
    }
    void loadOauthSetting();
    runDomainList(appId);
  }, [activeTab, appId, loadOauthSetting, runDomainList]);

  /**
   * 切换发布位置；选私有服务器时再拉私服列表。
   *
   * @param mode 平台部署或私服部署
   */
  const handleSelectDeployMode = useCallback(
    (mode: UserAppDeployTypeEnum) => {
      setDeployMode(mode);
      if (mode === UserAppDeployTypeEnum.Private) {
        runPrivateServerList();
      }
    },
    [runPrivateServerList],
  );

  /** 仅展示用户绑定的自定义域名，过滤平台默认域名 */
  const customDomains = useMemo(
    () =>
      domains.filter(
        (item) => item.domainType === UserAppDomainTypeEnum.Custom,
      ),
    [domains],
  );

  /** 顶部 Tab 仅负责切换状态，内容由页面主体区域统一渲染 */
  const tabItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'plan',
        label: dict('PC.Pages.AppProjectDetail.tabPlan'),
        children: null,
      },
      {
        key: 'asset',
        label: dict('PC.Pages.AppProjectDetail.tabAsset'),
        children: null,
      },
      {
        key: 'setting',
        label: dict('PC.Pages.AppProjectDetail.tabSetting'),
        children: null,
      },
    ],
    [],
  );

  /** 切换顶部 Tab */
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as SettingTabKey);
  }, []);

  const emptyValue = dict('PC.Pages.AppProjectDetail.emptyValue');

  /** 返回全栈应用列表 */
  const handleBack = useCallback(() => {
    history.push(`/space/${spaceId}/userapp-project`);
  }, [spaceId]);

  /** 切换右侧相关任务列表显隐 */
  const handleToggleConversationPanel = useCallback(() => {
    setConversationPanelVisible((visible) => !visible);
  }, []);

  /**
   * 打开右侧任务对应的全栈 IDE 会话。
   *
   * @param item 会话
   */
  const handleOpenConversation = useCallback(
    (item: UserProjectConversationInfo) => {
      openProject(
        spaceId,
        { id: appId, projectType: AgentComponentTypeEnum.UserApp },
        item.id,
      );
    },
    [appId, spaceId],
  );

  /** 新建任务：将当前全栈项目上框后进入首页（同 ProjectPanel「+ 新建会话」） */
  const handleCreateConversation = useCallback(() => {
    pin({
      projectId: appId,
      spaceId,
      projectType: AgentComponentTypeEnum.UserApp,
      name: projectInfo?.name || projectName,
      icon: projectInfo?.icon,
      sandboxId: projectInfo?.sandboxId,
      devAgentId: projectInfo?.devAgentId,
    });
  }, [appId, pin, projectInfo, projectName, spaceId]);

  /** 绑定弹窗中的规范化域名 */
  const bindDomainValue = useMemo(
    () => normalizeDomain(bindDomain),
    [bindDomain],
  );
  /** 域名格式校验文案；空输入不报错，交给按钮 disabled */
  const bindDomainError = useMemo(() => {
    if (!bindDomain.trim()) {
      return '';
    }
    if (!isValidDomain(bindDomain)) {
      return dict('PC.Pages.AppProjectDetail.invalidDomain');
    }
    return '';
  }, [bindDomain, bindDomainValue]);

  /** 提交绑定自定义域名 */
  const handleBindDomain = useCallback(() => {
    if (!bindDomain.trim() || bindDomainError || !bindDomainValue) {
      return;
    }
    runBindDomain({ appId, domain: bindDomainValue });
  }, [appId, bindDomain, bindDomainError, bindDomainValue, runBindDomain]);

  /** 关闭绑定弹窗并清空输入 */
  const handleCloseBindModal = useCallback(() => {
    setBindOpen(false);
    setBindDomain('');
  }, []);

  /**
   * 解绑自定义域名，二次确认后调删除接口。
   *
   * @param item 已绑定域名
   */
  const handleUnbindDomain = useCallback(
    (item: UserAppDomainInfo) => {
      Modal.confirm({
        title: dict('PC.Pages.AppProjectDetail.unbindConfirmTitle'),
        content: dict(
          'PC.Pages.AppProjectDetail.unbindConfirmContent',
          item.domain,
        ),
        okButtonProps: { danger: true },
        okText: dict('PC.Common.Global.delete'),
        cancelText: dict('PC.Common.Global.cancel'),
        onOk: () => runUnbindDomain(item.id),
      });
    },
    [runUnbindDomain],
  );

  /**
   * 重新生成 Client ID / Secret，二次确认后请求并回显明文。
   */
  const handleRegenerate = useCallback(() => {
    if (!appId) {
      return;
    }
    Modal.confirm({
      title: dict('PC.Pages.AppProjectDetail.regenerateConfirmTitle'),
      content: dict('PC.Pages.AppProjectDetail.regenerateHint'),
      okText: dict('PC.Pages.AppProjectDetail.regenerate'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: () => runRegenerate(),
    });
  }, [appId, runRegenerate]);

  /**
   * 保存主页地址与回调地址；空字符串按接口约定视为不修改。
   */
  const handleSaveOauthSetting = useCallback(() => {
    if (!appId) {
      return;
    }
    runSaveOauthSetting({
      projectId: appId,
      homepageUrl: homepageUrl.trim() || undefined,
      redirectUri: redirectUri.trim() || undefined,
    });
  }, [appId, homepageUrl, redirectUri, runSaveOauthSetting]);

  /**
   * 设置部署服务器。
   * 平台服务直接保存；私有服务器打开单选弹窗，必须选中一台后再保存。
   */
  const handleSetDeployServer = useCallback(() => {
    if (!appId) {
      return;
    }
    if (deployMode === UserAppDeployTypeEnum.Platform) {
      runSetDeployTarget({
        appId,
        deployType: UserAppDeployTypeEnum.Platform,
      });
      return;
    }
    setSelectedDeployServerId(deployServerId);
    setDeployTargetOpen(true);
    if (!privateServers.length) {
      runPrivateServerList();
    }
  }, [
    appId,
    deployMode,
    deployServerId,
    privateServers.length,
    runPrivateServerList,
    runSetDeployTarget,
  ]);

  /** 关闭选择私服弹窗 */
  const handleCloseDeployTargetModal = useCallback(() => {
    setDeployTargetOpen(false);
  }, []);

  /**
   * 保存私服部署目标；未选中时拦截。
   */
  const handleSavePrivateDeployTarget = useCallback(() => {
    if (!appId) {
      return;
    }
    if (
      !selectedDeployServerId ||
      !privateServers.some((item) => item.id === selectedDeployServerId)
    ) {
      message.warning(
        dict('PC.Pages.AppProjectDetail.selectPrivateServerRequired'),
      );
      return;
    }
    runSetDeployTarget({
      appId,
      deployType: UserAppDeployTypeEnum.Private,
      deployServerId: selectedDeployServerId,
    });
  }, [appId, privateServers, runSetDeployTarget, selectedDeployServerId]);

  /**
   * 主页 / 回调地址：有值回填 Input，无值显示空输入框。
   *
   * @param label 字段名
   * @param value 输入值
   * @param onChange 变更回调
   * @param placeholder 空态占位
   * @returns 字段行
   */
  const renderUrlField = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    placeholder: string,
  ) => (
    <div className={cx(styles.field)}>
      <span className={cx(styles['field-label'])}>{label}</span>
      <Input
        className={cx(styles['field-input'])}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        suffix={
          value ? (
            <span
              className={cx(styles['field-icon'])}
              onClick={() => void copyTextToClipboard(value, undefined, true)}
            >
              <SvgIcon name="icons-chat-copy" style={{ fontSize: 12 }} />
            </span>
          ) : undefined
        }
      />
    </div>
  );

  /**
   * 认证信息行：文案后紧跟显隐 / 复制图标。
   *
   * @param label 字段名
   * @param value 原始值
   * @param secret 是否按密钥遮罩
   * @returns 字段行
   */
  const renderField = (label: string, value: string, secret?: boolean) => {
    const display = !value
      ? emptyValue
      : secret && !secretVisible
      ? '•'.repeat(value.length)
      : value;
    return (
      <div className={cx(styles.field)}>
        <span className={cx(styles['field-label'])}>{label}</span>
        <div className={cx(styles['field-content'])}>
          <span className={cx(styles['field-value'], 'text-ellipsis')}>
            {display}
          </span>
          {secret && value ? (
            <span
              className={cx(styles['field-icon'])}
              onClick={() => setSecretVisible((visible) => !visible)}
            >
              {secretVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            </span>
          ) : null}
          {value ? (
            <span
              className={cx(styles['field-icon'])}
              onClick={() => void copyTextToClipboard(value, undefined, true)}
            >
              <SvgIcon name="icons-chat-copy" style={{ fontSize: 12 }} />
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  /**
   * 设置 Tab：OAuth2、自定义域名、发布部署位置。
   *
   * @returns 设置内容
   */
  const renderSetting = () => (
    <div className={cx(styles['setting-stack'])}>
      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectDetail.oauthTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectDetail.oauthDesc')}
        </p>
        <Spin spinning={oauthLoading}>
          {renderField(
            dict('PC.Pages.AppProjectDetail.clientId'),
            oauthInfo?.clientId || '',
          )}
          {renderField(
            dict('PC.Pages.AppProjectDetail.clientSecret'),
            clientSecret,
            true,
          )}
          {renderUrlField(
            dict('PC.Pages.AppProjectDetail.homeUrl'),
            homepageUrl,
            setHomepageUrl,
            dict('PC.Pages.AppProjectDetail.homeUrlPlaceholder'),
          )}
          {renderUrlField(
            dict('PC.Pages.AppProjectDetail.callbackUrl'),
            redirectUri,
            setRedirectUri,
            dict('PC.Pages.AppProjectDetail.callbackUrlPlaceholder'),
          )}
          <div className={cx(styles['regen-row'])}>
            <Button
              type="primary"
              loading={saveOauthLoading}
              onClick={handleSaveOauthSetting}
            >
              {dict('PC.Common.Global.save')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              className={cx(styles['action-btn'])}
              loading={regenerateLoading}
              onClick={handleRegenerate}
            >
              {dict('PC.Pages.AppProjectDetail.regenerate')}
            </Button>
            <span className={cx(styles['regen-hint'])}>
              {dict('PC.Pages.AppProjectDetail.regenerateHint')}
            </span>
          </div>
        </Spin>
      </section>

      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectDetail.domainTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectDetail.domainDesc', CNAME_TARGET)}
        </p>
        <div className={cx(styles['domain-list'])}>
          {customDomains.map((item) => (
            <div key={item.id} className={cx(styles['domain-row'])}>
              <div className={cx(styles['domain-left'])}>
                <span className={cx(styles['domain-name'])}>{item.domain}</span>
              </div>
              <div className={cx(styles['domain-right'])}>
                <span className={cx(styles['domain-cname'])}>
                  <span className={cx(styles['domain-cname-label'])}>
                    {dict('PC.Pages.AppProjectDetail.cnameLabel')}
                  </span>
                  <span className={cx(styles['domain-cname-value'])}>
                    {CNAME_TARGET}
                  </span>
                </span>
                <Button
                  size="small"
                  className={cx(styles['copy-cname-btn'])}
                  onClick={() =>
                    void copyTextToClipboard(CNAME_TARGET, undefined, true)
                  }
                >
                  {dict('PC.Pages.AppProjectDetail.copyCname')}
                </Button>
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => handleUnbindDomain(item)}
                >
                  {dict('PC.Common.Global.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          icon={<PlusOutlined />}
          className={cx(styles['bind-btn'], styles['action-btn'])}
          onClick={() => setBindOpen(true)}
        >
          {dict('PC.Pages.AppProjectDetail.bindDomain')}
        </Button>
      </section>

      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectDetail.deployTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectDetail.deployDesc')}
        </p>

        {/* 平台服务或者私有服务器部署选择区域 */}
        <Radio.Group
          className={cx(styles['deploy-options'])}
          value={deployMode}
        >
          <div
            className={cx(styles['deploy-card'], {
              [styles.active]: deployMode === UserAppDeployTypeEnum.Platform,
            })}
            onClick={() =>
              handleSelectDeployMode(UserAppDeployTypeEnum.Platform)
            }
          >
            <Radio value={UserAppDeployTypeEnum.Platform} />
            <div className={cx(styles['deploy-card-body'])}>
              <span className={cx(styles['deploy-title'])}>
                {dict('PC.Pages.AppProjectDetail.platformService')}
              </span>
              <span className={cx(styles['deploy-hint'])}>
                {dict('PC.Pages.AppProjectDetail.platformServiceDesc')}
              </span>
            </div>
          </div>
          <div
            className={cx(styles['deploy-card'], {
              [styles.active]: deployMode === UserAppDeployTypeEnum.Private,
            })}
            onClick={() =>
              handleSelectDeployMode(UserAppDeployTypeEnum.Private)
            }
          >
            <Radio value={UserAppDeployTypeEnum.Private} />
            <div className={cx(styles['deploy-card-body'])}>
              <span className={cx(styles['deploy-title'])}>
                {dict('PC.Pages.AppProjectDetail.privateServer')}
              </span>
              <span className={cx(styles['deploy-hint'])}>
                {dict('PC.Pages.AppProjectDetail.privateServerDesc')}
              </span>
            </div>
          </div>
        </Radio.Group>

        {/* 平台服务部署提示 */}
        {deployMode === UserAppDeployTypeEnum.Platform ? (
          <p className={cx(styles['deploy-footer'])}>
            {dict('PC.Pages.AppProjectDetail.platformHint')}
          </p>
        ) : (
          // 私有服务器部署区域，私有服务器列表
          <PrivateServerPanel
            servers={privateServers}
            loading={privateServerLoading}
            onRefresh={runPrivateServerList}
          />
        )}
        <Button
          type="primary"
          className={cx(styles['set-deploy-btn'])}
          loading={setDeployLoading && !deployTargetOpen}
          onClick={handleSetDeployServer}
        >
          {dict('PC.Pages.AppProjectDetail.setDeployServer')}
        </Button>
      </section>
    </div>
  );

  /** 当前计划或资产 Tab 对应的仓库页面地址 */
  const repositoryPageUrl = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    // 仓库页面会读取父窗口的嵌入配置，必须与父页面保持同源。
    const domain = window.location.origin;
    if (activeTab === 'plan' && projectInfo?.planSlugId) {
      return `${domain}/repo/doc/${encodeURIComponent(
        projectInfo.planSlugId,
      )}?just_show_content=true&hide_sheet=true`;
    }
    if (activeTab === 'asset' && projectInfo?.repoSlugId) {
      return `${domain}/repo/folder/${encodeURIComponent(
        projectInfo.repoSlugId,
      )}`;
    }
    return '';
  }, [activeTab, projectInfo?.planSlugId, projectInfo?.repoSlugId]);

  /** iframe 地址变化时清除上一个页面的失败状态 */
  useEffect(() => {
    setIframeLoadFailed(false);
  }, [repositoryPageUrl]);

  /** 重新挂载 iframe，触发页面再次加载 */
  const handleReloadIframe = useCallback(() => {
    setIframeLoadFailed(false);
  }, []);

  /** 渲染计划或资产仓库页面 */
  const renderRepositoryPage = () => {
    if (iframeLoadFailed || !repositoryPageUrl) {
      return (
        <Result
          className={cx(styles['repository-error'])}
          status="error"
          title={dict('PC.Pages.AppProjectDetail.repositoryLoadFailed')}
          extra={
            repositoryPageUrl ? (
              <Button type="primary" onClick={handleReloadIframe}>
                {dict('PC.Common.Global.refresh')}
              </Button>
            ) : null
          }
        />
      );
    }
    return (
      <iframe
        className={cx(styles['repository-iframe'])}
        src={repositoryPageUrl}
        onError={() => setIframeLoadFailed(true)}
        title={
          activeTab === 'plan'
            ? dict('PC.Pages.AppProjectDetail.tabPlan')
            : dict('PC.Pages.AppProjectDetail.tabAsset')
        }
      />
    );
  };

  return (
    <div className={cx(styles.page, 'h-full', 'flex', 'flex-col')}>
      <header
        className={cx(styles.header)}
        style={{
          paddingRight: needsTopRightAvoid() ? shellAvoid.RIGHT : undefined,
        }}
      >
        <Button
          type="text"
          className={cx(styles.back)}
          onClick={handleBack}
          icon={<SvgIcon className={cx('flex')} name="icons-nav-backward" />}
        />
        <h3 className={cx(styles['project-name'], 'text-ellipsis')}>
          {projectName || dict('PC.Pages.AppProjectDetail.untitled')}
        </h3>
        <Tabs
          className={cx(styles.tabs)}
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />
        <div className={cx(styles['header-actions'])}>
          <TooltipIcon
            title={
              conversationPanelVisible
                ? dict('PC.Pages.AppProjectDetail.hideConversationPanel')
                : dict('PC.Pages.AppProjectDetail.showConversationPanel')
            }
            className={cx(styles['panel-toggle'], {
              [styles.active]: conversationPanelVisible,
            })}
            icon={<SvgIcon name="icons-nav-sidebar" style={{ fontSize: 16 }} />}
            onClick={handleToggleConversationPanel}
          />
        </div>
      </header>

      {appLoading && !projectName ? (
        <Loading />
      ) : (
        <div className={cx(styles.body, 'flex-1')}>
          <div className={cx(styles.main, 'flex-1', 'flex', 'flex-col')}>
            <div
              className={cx(
                styles['main-scroll'],
                {
                  [styles['repository-content']]: activeTab !== 'setting',
                },
                'flex-1',
                'scroll-container-hide',
              )}
            >
              {activeTab === 'setting'
                ? renderSetting()
                : renderRepositoryPage()}
            </div>
          </div>
          {conversationPanelVisible ? (
            <ConversationPanel
              conversations={conversations}
              loading={loading}
              onSelect={handleOpenConversation}
              onCreate={handleCreateConversation}
            />
          ) : null}
        </div>
      )}

      {/* 私有服务器部署选择弹窗 */}
      <SelectDeployServerModal
        open={deployTargetOpen}
        servers={privateServers}
        selectedId={selectedDeployServerId}
        loading={privateServerLoading}
        confirmLoading={setDeployLoading}
        onSelect={setSelectedDeployServerId}
        onSave={handleSavePrivateDeployTarget}
        onCancel={handleCloseDeployTargetModal}
      />

      {/* 绑定域名弹窗 */}
      <Modal
        title={dict('PC.Pages.AppProjectDetail.bindDomain')}
        open={bindOpen}
        onOk={() => void handleBindDomain()}
        onCancel={handleCloseBindModal}
        confirmLoading={bindLoading}
        okButtonProps={{ disabled: !bindDomain.trim() || !!bindDomainError }}
        okText={dict('PC.Common.Global.confirm')}
        cancelText={dict('PC.Common.Global.cancel')}
        destroyOnHidden
      >
        <Form.Item
          validateStatus={bindDomainError ? 'error' : undefined}
          help={bindDomainError || undefined}
        >
          <Input
            value={bindDomain}
            status={bindDomainError ? 'error' : undefined}
            onChange={(event) => setBindDomain(event.target.value)}
            onPressEnter={() => void handleBindDomain()}
            placeholder={dict('PC.Pages.AppProjectDetail.domainPlaceholder')}
          />
        </Form.Item>
      </Modal>
    </div>
  );
};

export default AppProjectDetail;
