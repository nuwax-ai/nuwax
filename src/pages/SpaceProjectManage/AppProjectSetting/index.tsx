import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { RequestResponse } from '@/types/interfaces/request';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import { copyTextToClipboard } from '@/utils/clipboard';
import { isValidDomain, normalizeDomain } from '@/utils/common';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import {
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Spin,
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
import {
  apiThirdAppOauth2CredentialRegenerate,
  apiThirdAppOauth2SecretGet,
  apiThirdAppOauth2SettingGet,
  type ThirdAppOauth2CredentialInfo,
  type ThirdAppOauth2Info,
} from '../services/thirdAppOauth2';
import { openProject } from '../type';
import ConversationPanel from './components/ConversationPanel';
import styles from './index.less';

const cx = classNames.bind(styles);

type SettingTabKey = 'plan' | 'asset' | 'setting';

const CNAME_TARGET = 'cname.nuwax.com';

/** 从分页结果中取出 records */
const pickRecords = (
  result?: RequestResponse<{ records?: UserProjectTabItem[] }> & {
    records?: UserProjectTabItem[];
  },
): UserProjectTabItem[] => {
  if (Array.isArray(result?.records)) {
    return result.records;
  }
  if (Array.isArray(result?.data?.records)) {
    return result.data.records;
  }
  return [];
};

/** 解开 request 包装，兼容直接返回 data 的情况 */
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
 * 全栈应用设置页：顶部返回 + 计划 / 资产 / 设置，
 * 详情走 tab/page-query，右侧展示项目会话列表。
 */
const AppProjectSetting: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const appId = Number(params.appId);

  const [activeTab, setActiveTab] = useState<SettingTabKey>('setting');
  const [project, setProject] = useState<UserProjectTabItem>();
  const [domains, setDomains] = useState<UserAppDomainInfo[]>([]);
  const [deployMode, setDeployMode] = useState<'platform' | 'private'>(
    'platform',
  );
  const [protocol, setProtocol] = useState<'http' | 'https'>('https');
  const [serverIp, setServerIp] = useState('');
  const [appPort, setAppPort] = useState('');
  const [managePort, setManagePort] = useState('');
  const [bindOpen, setBindOpen] = useState(false);
  const [bindDomain, setBindDomain] = useState('');
  const [oauthInfo, setOauthInfo] = useState<ThirdAppOauth2Info>();
  const [clientSecret, setClientSecret] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [homepageUrl, setHomepageUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');

  const { run, loading } = useRequest(
    () =>
      apiUserProjectTabPageQuery({
        queryFilter: {
          spaceId,
          projectType: AgentComponentTypeEnum.UserApp,
        },
        current: 1,
        pageSize: 100,
        orders: [],
        filters: [],
        columns: [],
      }),
    {
      manual: true,
      onSuccess: (
        result: RequestResponse<{ records?: UserProjectTabItem[] }> & {
          records?: UserProjectTabItem[];
        },
      ) => {
        const records = pickRecords(result);
        const current = records.find(
          (item) => Number(item.projectId) === appId,
        );
        setProject(current);
      },
      onError: () => {
        setProject(undefined);
      },
    },
  );

  const { run: runDomainList } = useRequest(
    apiUserAppDomainList,
    {
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
    },
  );

  const { run: runBindDomain, loading: bindLoading } = useRequest(
    apiUserAppDomainCreate,
    {
      manual: true,
      onSuccess: () => {
        message.success(dict('PC.Pages.AppProjectSetting.bindSuccess'));
        setBindOpen(false);
        setBindDomain('');
        runDomainList(appId);
      },
    },
  );

  const { run: runUnbindDomain } = useRequest(apiUserAppDomainDelete, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Pages.AppProjectSetting.unbindSuccess'));
      runDomainList(appId);
    },
  });

  const { run: runRegenerate, loading: regenerateLoading } = useRequest(
    () => apiThirdAppOauth2CredentialRegenerate(String(appId)),
    {
      manual: true,
      onSuccess: (
        result: RequestResponse<ThirdAppOauth2CredentialInfo> | ThirdAppOauth2CredentialInfo,
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
        message.success(dict('PC.Pages.AppProjectSetting.regenerateSuccess'));
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
      const settingRes = await apiThirdAppOauth2SettingGet(String(appId));
      const info = pickResponseData(settingRes);
      setOauthInfo(info);
      setHomepageUrl(info?.homepageUrl || '');
      setRedirectUri(info?.redirectUri || '');
      if (!info?.hasClientSecret) {
        setClientSecret('');
        return;
      }
      try {
        const secretRes = await apiThirdAppOauth2SecretGet(String(appId));
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

  useEffect(() => {
    if (!spaceId || !appId) {
      return;
    }
    run();
    runDomainList(appId);
  }, [appId, spaceId]);

  useEffect(() => {
    if (activeTab !== 'setting' || !appId) {
      return;
    }
    void loadOauthSetting();
  }, [activeTab, appId, loadOauthSetting]);

  const customDomains = useMemo(
    () =>
      domains.filter(
        (item) => item.domainType === UserAppDomainTypeEnum.Custom,
      ),
    [domains],
  );

  const emptyValue = dict('PC.Pages.AppProjectSetting.emptyValue');

  const handleBack = useCallback(() => {
    history.push(`/space/${spaceId}/userapp-project`);
  }, [spaceId]);

  const handleOpenConversation = useCallback(
    (item: ConversationInfo) => {
      openProject(
        spaceId,
        { id: appId, projectType: AgentComponentTypeEnum.UserApp },
        item.id,
      );
    },
    [appId, spaceId],
  );

  const handleCreateConversation = useCallback(() => {
    openProject(spaceId, {
      id: appId,
      projectType: AgentComponentTypeEnum.UserApp,
    });
  }, [appId, spaceId]);

  const bindDomainValue = useMemo(
    () => normalizeDomain(bindDomain),
    [bindDomain],
  );
  const bindDomainError = useMemo(() => {
    if (!bindDomain.trim()) {
      return '';
    }
    if (!isValidDomain(bindDomain)) {
      return dict('PC.Pages.AppProjectSetting.invalidDomain');
    }
    return '';
  }, [bindDomain, bindDomainValue]);

  const handleBindDomain = useCallback(() => {
    if (!bindDomain.trim() || bindDomainError || !bindDomainValue) {
      return;
    }
    runBindDomain({ appId, domain: bindDomainValue });
  }, [appId, bindDomain, bindDomainError, bindDomainValue, runBindDomain]);

  const handleCloseBindModal = useCallback(() => {
    setBindOpen(false);
    setBindDomain('');
  }, []);

  const handleUnbindDomain = useCallback(
    (item: UserAppDomainInfo) => {
      Modal.confirm({
        title: dict('PC.Pages.AppProjectSetting.unbindConfirmTitle'),
        content: dict(
          'PC.Pages.AppProjectSetting.unbindConfirmContent',
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

  /** 重新生成 Client ID / Secret，并回显明文 */
  const handleRegenerate = useCallback(() => {
    if (!appId) {
      return;
    }
    Modal.confirm({
      title: dict('PC.Pages.AppProjectSetting.regenerateConfirmTitle'),
      content: dict('PC.Pages.AppProjectSetting.regenerateHint'),
      okText: dict('PC.Pages.AppProjectSetting.regenerate'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: () => runRegenerate(),
    });
  }, [appId, runRegenerate]);

  /** 保存设置：发布配置接口未就绪，先回写本地并提示 */
  const handleSaveSettings = useCallback(() => {
    message.success(dict('PC.Common.Global.saveSuccess'));
  }, []);

  /** 恢复默认：平台服务，清空私有服务器表单 */
  const handleRestoreDefaults = useCallback(() => {
    setDeployMode('platform');
    setProtocol('https');
    setServerIp('');
    setAppPort('');
    setManagePort('');
    message.success(dict('PC.Pages.AppProjectSetting.restoreSuccess'));
  }, []);

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
      ? '••••••••••••••••••••'
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

  const renderSetting = () => (
    <div className={cx(styles['setting-stack'])}>
      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectSetting.oauthTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectSetting.oauthDesc')}
        </p>
        <Spin spinning={oauthLoading}>
          {renderField(
            dict('PC.Pages.AppProjectSetting.clientId'),
            oauthInfo?.clientId || '',
          )}
          {renderField(
            dict('PC.Pages.AppProjectSetting.clientSecret'),
            clientSecret,
            true,
          )}
          {renderUrlField(
            dict('PC.Pages.AppProjectSetting.homeUrl'),
            homepageUrl,
            setHomepageUrl,
            dict('PC.Pages.AppProjectSetting.homeUrlPlaceholder'),
          )}
          {renderUrlField(
            dict('PC.Pages.AppProjectSetting.callbackUrl'),
            redirectUri,
            setRedirectUri,
            dict('PC.Pages.AppProjectSetting.callbackUrlPlaceholder'),
          )}
        </Spin>
        <div className={cx(styles['regen-row'])}>
          <Button
            icon={<ReloadOutlined />}
            loading={regenerateLoading}
            onClick={handleRegenerate}
          >
            {dict('PC.Pages.AppProjectSetting.regenerate')}
          </Button>
          <span className={cx(styles['regen-hint'])}>
            {dict('PC.Pages.AppProjectSetting.regenerateHint')}
          </span>
        </div>
      </section>

      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectSetting.domainTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectSetting.domainDesc', CNAME_TARGET)}
        </p>
        <div className={cx(styles['domain-list'])}>
          {customDomains.map((item) => (
            <div key={item.id} className={cx(styles['domain-row'])}>
              <div className={cx(styles['domain-left'])}>
                <span className={cx(styles['domain-name'])}>{item.domain}</span>
              </div>
              <div className={cx(styles['domain-right'])}>
                <span className={cx(styles['domain-cname'])}>
                  {dict('PC.Pages.AppProjectSetting.cnameLabel')} {CNAME_TARGET}
                </span>
                <Button
                  size="small"
                  onClick={() =>
                    void copyTextToClipboard(CNAME_TARGET, undefined, true)
                  }
                >
                  {dict('PC.Pages.AppProjectSetting.copyCname')}
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
          className={cx(styles['bind-btn'])}
          onClick={() => setBindOpen(true)}
        >
          {dict('PC.Pages.AppProjectSetting.bindDomain')}
        </Button>
      </section>

      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectSetting.deployTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectSetting.deployDesc')}
        </p>
        <Radio.Group
          className={cx(styles['deploy-options'])}
          value={deployMode}
          onChange={(event) => setDeployMode(event.target.value)}
        >
          <div
            className={cx(styles['deploy-card'], {
              [styles.active]: deployMode === 'platform',
            })}
            onClick={() => setDeployMode('platform')}
          >
            <Radio value="platform" />
            <div className={cx(styles['deploy-card-body'])}>
              <span className={cx(styles['deploy-title'])}>
                {dict('PC.Pages.AppProjectSetting.platformService')}
              </span>
              <span className={cx(styles['deploy-hint'])}>
                {dict('PC.Pages.AppProjectSetting.platformServiceDesc')}
              </span>
            </div>
          </div>
          <div
            className={cx(styles['deploy-card'], {
              [styles.active]: deployMode === 'private',
            })}
            onClick={() => setDeployMode('private')}
          >
            <Radio value="private" />
            <div className={cx(styles['deploy-card-body'])}>
              <span className={cx(styles['deploy-title'])}>
                {dict('PC.Pages.AppProjectSetting.privateServer')}
              </span>
              <span className={cx(styles['deploy-hint'])}>
                {dict('PC.Pages.AppProjectSetting.privateServerDesc')}
              </span>
            </div>
          </div>
        </Radio.Group>
        {deployMode === 'platform' ? (
          <p className={cx(styles['deploy-footer'])}>
            {dict('PC.Pages.AppProjectSetting.platformHint')}
          </p>
        ) : (
          <>
            <div className={cx(styles['deploy-fields'])}>
              <div className={cx(styles['deploy-field'])}>
                <label className={cx(styles['deploy-field-label'])}>
                  {dict('PC.Pages.AppProjectSetting.protocol')}
                </label>
                <Select
                  value={protocol}
                  onChange={setProtocol}
                  options={[
                    {
                      value: 'http',
                      label: dict('PC.Pages.AppProjectSetting.protocolHttp'),
                    },
                    {
                      value: 'https',
                      label: dict('PC.Pages.AppProjectSetting.protocolHttps'),
                    },
                  ]}
                />
              </div>
              <div className={cx(styles['deploy-field'])}>
                <label className={cx(styles['deploy-field-label'])}>
                  {dict('PC.Pages.AppProjectSetting.serverIp')}
                </label>
                <Input
                  value={serverIp}
                  onChange={(event) => setServerIp(event.target.value)}
                  placeholder={dict(
                    'PC.Pages.AppProjectSetting.serverIpPlaceholder',
                  )}
                />
              </div>
              <div className={cx(styles['deploy-field'])}>
                <label className={cx(styles['deploy-field-label'])}>
                  {dict('PC.Pages.AppProjectSetting.appPort')}
                </label>
                <Input
                  value={appPort}
                  onChange={(event) => setAppPort(event.target.value)}
                  placeholder={dict(
                    'PC.Pages.AppProjectSetting.appPortPlaceholder',
                  )}
                />
              </div>
              <div className={cx(styles['deploy-field'])}>
                <label className={cx(styles['deploy-field-label'])}>
                  {dict('PC.Pages.AppProjectSetting.managePort')}
                </label>
                <Input
                  value={managePort}
                  onChange={(event) => setManagePort(event.target.value)}
                  placeholder={dict(
                    'PC.Pages.AppProjectSetting.managePortPlaceholder',
                  )}
                />
              </div>
            </div>
            <p className={cx(styles['deploy-footer'])}>
              {dict('PC.Pages.AppProjectSetting.privateHint')}
            </p>
          </>
        )}
      </section>
    </div>
  );

  const renderComingSoon = () => (
    <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
      <Empty description={dict('PC.Pages.AppProjectSetting.comingSoon')} />
    </div>
  );

  return (
    <div className={cx(styles.page, 'h-full', 'flex', 'flex-col')}>
      <header
        className={cx(styles.header)}
        style={{
          paddingRight: needsTopRightAvoid() ? shellAvoid.RIGHT : undefined,
        }}
      >
        <SvgIcon
          name="icons-nav-backward"
          className={cx(styles.back)}
          onClick={handleBack}
        />
        <h3 className={cx(styles['project-name'], 'text-ellipsis')}>
          {project?.name || dict('PC.Pages.AppProjectSetting.untitled')}
        </h3>
        <div className={cx(styles.tabs)}>
          {(
            [
              ['plan', 'PC.Pages.AppProjectSetting.tabPlan'],
              ['asset', 'PC.Pages.AppProjectSetting.tabAsset'],
              ['setting', 'PC.Pages.AppProjectSetting.tabSetting'],
            ] as const
          ).map(([key, labelKey]) => (
            <button
              key={key}
              type="button"
              className={cx(styles.tab, { [styles.active]: activeTab === key })}
              onClick={() => setActiveTab(key)}
            >
              {dict(labelKey)}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <Loading />
      ) : !project ? (
        <div className={cx('flex', 'items-center', 'content-center', 'h-full')}>
          <Empty description={dict('PC.Pages.AppProjectSetting.notFound')} />
        </div>
      ) : (
        <div className={cx(styles.body, 'flex-1')}>
          <div className={cx(styles.main, 'flex-1', 'flex', 'flex-col')}>
            <div
              className={cx(
                styles['main-scroll'],
                'flex-1',
                'scroll-container-hide',
              )}
            >
              {activeTab === 'setting' ? renderSetting() : renderComingSoon()}
            </div>
            {activeTab === 'setting' ? (
              <footer className={cx(styles['action-bar'])}>
                <Button type="primary" onClick={handleSaveSettings}>
                  {dict('PC.Pages.AppProjectSetting.saveSettings')}
                </Button>
                <Button onClick={handleRestoreDefaults}>
                  {dict('PC.Pages.AppProjectSetting.restoreDefaults')}
                </Button>
              </footer>
            ) : null}
          </div>
          <ConversationPanel
            conversations={project.conversations || []}
            onSelect={handleOpenConversation}
            onCreate={handleCreateConversation}
          />
        </div>
      )}

      <Modal
        title={dict('PC.Pages.AppProjectSetting.bindDomain')}
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
            placeholder={dict('PC.Pages.AppProjectSetting.domainPlaceholder')}
          />
        </Form.Item>
      </Modal>
    </div>
  );
};

export default AppProjectSetting;
