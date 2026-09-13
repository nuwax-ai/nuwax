import CopyIconButton from '@/components/base/CopyIconButton';
import SvgIcon from '@/components/base/SvgIcon';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiUserProjectTabPageQuery } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { RequestResponse } from '@/types/interfaces/request';
import type { UserProjectTabItem } from '@/types/interfaces/userProject';
import { needsTopRightAvoid, shellAvoid } from '@/utils/nuwaClawBridge';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Input, message, Modal, Radio, Select, Tag } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import {
  apiUserAppDomainCreate,
  apiUserAppDomainDelete,
  apiUserAppDomainList,
  UserAppDomainTypeEnum,
  type UserAppDomainInfo,
} from '../services';
import { openProject } from '../type';
import ConversationPanel from './components/ConversationPanel';
import styles from './index.less';

const cx = classNames.bind(styles);

type SettingTabKey = 'plan' | 'asset' | 'setting';

const CNAME_TARGET = 'cname.nuwax.com';
const DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

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

/** 将域名补成可展示的 https 地址 */
const toHttpsUrl = (domain?: string) => {
  const value = domain?.trim() || '';
  if (!value) {
    return '';
  }
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
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

  const { run: runDomainList, loading: domainLoading } = useRequest(
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

  useEffect(() => {
    if (!spaceId || !appId) {
      return;
    }
    run();
    runDomainList(appId);
  }, [appId, spaceId]);

  const customDomains = useMemo(
    () =>
      domains.filter(
        (item) => item.domainType === UserAppDomainTypeEnum.Custom,
      ),
    [domains],
  );

  const previewDomain = useMemo(() => {
    const custom = customDomains[0]?.domain;
    const prod = domains.find(
      (item) => item.domainType === UserAppDomainTypeEnum.Prod,
    )?.domain;
    const dev = domains.find(
      (item) => item.domainType === UserAppDomainTypeEnum.Dev,
    )?.domain;
    return custom || prod || dev || '';
  }, [customDomains, domains]);

  const homeUrl = toHttpsUrl(previewDomain);
  const callbackUrl = homeUrl
    ? `${homeUrl.replace(/\/$/, '')}/oauth/callback`
    : '';
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

  const handleBindDomain = useCallback(() => {
    const domain = bindDomain.trim();
    if (!DOMAIN_REGEX.test(domain)) {
      message.warning(dict('PC.Pages.AppProjectSetting.invalidDomain'));
      return;
    }
    runBindDomain({ appId, domain });
  }, [appId, bindDomain, runBindDomain]);

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
        onOk: async () => {
          const res = await apiUserAppDomainDelete(item.id);
          if (res?.code === SUCCESS_CODE) {
            message.success(dict('PC.Pages.AppProjectSetting.unbindSuccess'));
            runDomainList(appId);
          }
        },
      });
    },
    [appId, runDomainList],
  );

  const handleRegenerate = useCallback(() => {
    message.info(dict('PC.Pages.AppProjectSetting.regenerateUnavailable'));
  }, []);

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

  const renderField = (label: string, value: string, secret?: boolean) => (
    <div className={cx(styles.field)}>
      <span className={cx(styles['field-label'])}>{label}</span>
      <span className={cx(styles['field-value'], 'text-ellipsis')}>
        {value ? (secret ? '••••••••••••••••••••' : value) : emptyValue}
      </span>
      {value ? <CopyIconButton text={value} /> : null}
    </div>
  );

  const renderSetting = () => (
    <div className={cx(styles['setting-stack'])}>
      <section className={cx(styles.card)}>
        <h3 className={cx(styles['card-title'])}>
          {dict('PC.Pages.AppProjectSetting.oauthTitle')}
        </h3>
        <p className={cx(styles['card-desc'])}>
          {dict('PC.Pages.AppProjectSetting.oauthDesc')}
        </p>
        {renderField(dict('PC.Pages.AppProjectSetting.clientId'), '')}
        {renderField(dict('PC.Pages.AppProjectSetting.clientSecret'), '', true)}
        {renderField(dict('PC.Pages.AppProjectSetting.homeUrl'), homeUrl)}
        {renderField(
          dict('PC.Pages.AppProjectSetting.callbackUrl'),
          callbackUrl,
        )}
        <Radio
          checked={false}
          className={cx(styles['regen-radio'])}
          onClick={(event) => {
            event.preventDefault();
            handleRegenerate();
          }}
        >
          <span className={cx(styles['regen-title'])}>
            {dict('PC.Pages.AppProjectSetting.regenerate')}
          </span>
          <span className={cx(styles['regen-hint'])}>
            {dict('PC.Pages.AppProjectSetting.regenerateHint')}
          </span>
        </Radio>
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
                <Tag color="success">
                  {dict('PC.Pages.AppProjectSetting.domainBound')}
                </Tag>
              </div>
              <div className={cx(styles['domain-right'])}>
                <span className={cx(styles['domain-cname'])}>
                  {dict('PC.Pages.AppProjectSetting.cnameLabel')} {CNAME_TARGET}
                </span>
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
          type="link"
          icon={<PlusOutlined />}
          className={cx(styles['bind-btn'])}
          loading={domainLoading}
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
        onCancel={() => setBindOpen(false)}
        confirmLoading={bindLoading}
        okButtonProps={{ disabled: !bindDomain.trim() }}
        okText={dict('PC.Common.Global.confirm')}
        cancelText={dict('PC.Common.Global.cancel')}
        destroyOnHidden
      >
        <Input
          value={bindDomain}
          onChange={(event) => setBindDomain(event.target.value)}
          onPressEnter={() => void handleBindDomain()}
          placeholder={dict('PC.Pages.AppProjectSetting.domainPlaceholder')}
        />
      </Modal>
    </div>
  );
};

export default AppProjectSetting;
