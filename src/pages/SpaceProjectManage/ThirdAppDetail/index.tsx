import SvgIcon from '@/components/base/SvgIcon';
import PublishComponentModal from '@/components/PublishComponentModal';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import AppDevPublishVersionRecords from '@/pages/AppDevPro/components/AppDevPublishVersionRecords';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PublishStatusEnum } from '@/types/enums/common';
import type { RequestResponse } from '@/types/interfaces/request';
import { copyTextToClipboard } from '@/utils/clipboard';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import {
  ClockCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { TabsProps } from 'antd';
import { Button, Input, message, Modal, Spin, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import {
  apiThirdAppOauth2CredentialRegenerate,
  apiThirdAppOauth2InfoGet,
  apiThirdAppOauth2SecretGet,
  apiThirdAppOauth2SettingSave,
  type ThirdAppOauth2AppInfo,
  type ThirdAppOauth2CredentialInfo,
  type ThirdAppOauth2Info,
} from '../services/thirdAppOauth2';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 解开 umi request / useRequest 包装，兼容完整响应与已解包 data。
 *
 * @param result 接口原始返回
 * @returns 业务数据；失败时返回 undefined
 */
const pickResponseData = <T,>(
  result?: RequestResponse<T> | T,
): T | undefined => {
  if (result === undefined || result === null) {
    return undefined;
  }
  if (typeof result === 'object' && 'code' in result) {
    const wrapped = result as RequestResponse<T>;
    if (wrapped.code && wrapped.code !== SUCCESS_CODE) {
      return undefined;
    }
    return wrapped.data;
  }
  return result as T;
};

/**
 * 三方应用详情页。
 *
 * 页面仅保留设置 Tab 和 OAuth2 认证信息；是否已发布以 oauth2/info 的 publishStatus 为准。
 *
 * @returns 三方应用详情页面
 */
const ThirdAppDetail: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const projectId = Number(params.projectId);

  const [appInfo, setAppInfo] = useState<ThirdAppOauth2AppInfo>();
  const [oauthInfo, setOauthInfo] = useState<ThirdAppOauth2Info>();
  const [clientSecret, setClientSecret] = useState('');
  const [secretVisible, setSecretVisible] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [homepageUrl, setHomepageUrl] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [openPublishModal, setOpenPublishModal] = useState<boolean>(false);
  const [publishVersionRecordsOpen, setPublishVersionRecordsOpen] =
    useState<boolean>(false);

  /** 是否已发布：以 oauth2/info 回包 publishStatus 为准 */
  const isPublished =
    appInfo?.publishStatus === PublishStatusEnum.Published;

  /** 发布前须已配置 OAuth2 主页地址（以 info 回包为准） */
  const canPublish = Boolean(appInfo?.homepageUrl?.trim());

  /** 单一设置 Tab，内容由下方主体区域渲染 */
  const tabItems = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'setting',
        label: dict('PC.Pages.ThirdAppDetail.tabSetting'),
        children: null,
      },
    ],
    [],
  );

  /** 重新生成 OAuth2 Client ID / Secret */
  const { run: runRegenerate, loading: regenerateLoading } = useRequest(
    () => apiThirdAppOauth2CredentialRegenerate(String(projectId)),
    {
      manual: true,
      onSuccess: (
        result:
          | ThirdAppOauth2CredentialInfo
          | RequestResponse<ThirdAppOauth2CredentialInfo>,
      ) => {
        const credential = pickResponseData(result);
        if (!credential?.clientId) {
          return;
        }
        setOauthInfo((previous) => ({
          projectId: previous?.projectId ?? projectId,
          clientId: credential.clientId,
          hasClientSecret: true,
          homepageUrl: previous?.homepageUrl ?? homepageUrl,
          redirectUri: previous?.redirectUri ?? redirectUri,
          scopes: previous?.scopes ?? [],
          enabled: previous?.enabled ?? true,
        }));
        setClientSecret(credential.clientSecret || '');
        setSecretVisible(true);
        message.success(dict('PC.Pages.ThirdAppDetail.regenerateSuccess'));
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
          setAppInfo((previous) =>
            previous ? { ...previous, ...info } : previous,
          );
          setHomepageUrl(info.homepageUrl || '');
          setRedirectUri(info.redirectUri || '');
        }
        message.success(dict('PC.Common.Global.saveSuccess'));
      },
    },
  );

  /** 应用 info 回包写入页面状态（不含 Secret 拉取） */
  const applyAppInfo = useCallback((info?: ThirdAppOauth2AppInfo) => {
    setAppInfo(info);
    setOauthInfo(info);
    setHomepageUrl(info?.homepageUrl || '');
    setRedirectUri(info?.redirectUri || '');
  }, []);

  /** 仅刷新 oauth2/info，用于发布成功后更新 publishStatus，不拉 Secret */
  const refreshAppInfo = useCallback(async () => {
    if (!projectId) {
      return;
    }
    try {
      const infoResponse = await apiThirdAppOauth2InfoGet(projectId, AgentComponentTypeEnum.ThirdApp);
      const info = pickResponseData(infoResponse);
      if (info) {
        applyAppInfo(info);
      }
    } catch (error) {
      console.error('Failed to refresh third app OAuth2 info:', error);
    }
  }, [applyAppInfo, projectId]);

  /** 进页加载：info + 按需拉取 Client Secret 明文 */
  const loadAppInfo = useCallback(async () => {
    if (!projectId) {
      return;
    }
    setOauthLoading(true);
    setSecretVisible(false);
    try {
      const infoResponse = await apiThirdAppOauth2InfoGet(projectId, AgentComponentTypeEnum.ThirdApp);
      const info = pickResponseData(infoResponse);
      applyAppInfo(info);
      if (!info?.hasClientSecret) {
        setClientSecret('');
        return;
      }
      const secretResponse = await apiThirdAppOauth2SecretGet(projectId, AgentComponentTypeEnum.ThirdApp);
      const secret = pickResponseData(secretResponse);
      setClientSecret(typeof secret === 'string' ? secret : '');
    } catch (error) {
      console.error('Failed to load third app OAuth2 info:', error);
      applyAppInfo(undefined);
      setClientSecret('');
    } finally {
      setOauthLoading(false);
    }
  }, [applyAppInfo, projectId]);

  /** 进入页面时按项目 ID 加载应用及 OAuth2 认证信息 */
  useEffect(() => {
    if (!spaceId || !projectId) {
      return;
    }
    void loadAppInfo();
  }, [loadAppInfo, projectId, spaceId]);

  /** 返回三方应用列表 */
  const handleBack = useCallback(() => {
    history.push(`/space/${spaceId}/third-app-integration`);
  }, [spaceId]);

  /** 打开发布弹窗 */
  const handleOpenPublish = useCallback(() => {
    setOpenPublishModal(true);
  }, []);

  /** 切换发布版本记录侧栏 */
  const handleTogglePublishVersionRecords = useCallback(() => {
    setPublishVersionRecordsOpen((prev) => !prev);
  }, []);

  /** 发布申请提交成功后仅刷新 info，更新 publishStatus */
  const handlePublishConfirm = useCallback(() => {
    setOpenPublishModal(false);
    void refreshAppInfo();
  }, [refreshAppInfo]);

  /** 确认重新生成凭证 */
  const handleRegenerate = useCallback(() => {
    if (!projectId) {
      return;
    }
    Modal.confirm({
      title: dict('PC.Pages.ThirdAppDetail.regenerateConfirmTitle'),
      content: dict('PC.Pages.ThirdAppDetail.regenerateHint'),
      okText: dict('PC.Pages.ThirdAppDetail.regenerate'),
      cancelText: dict('PC.Common.Global.cancel'),
      onOk: () => runRegenerate(),
    });
  }, [projectId, runRegenerate]);

  /** 保存主页地址与回调地址（主页地址必填） */
  const handleSaveOauthSetting = useCallback(() => {
    if (!projectId) {
      return;
    }
    const trimmedHomepageUrl = homepageUrl.trim();
    const trimmedRedirectUri = redirectUri.trim();
    if (!trimmedHomepageUrl) {
      message.warning(dict('PC.Pages.ThirdAppDetail.homeUrlRequired'));
      return;
    }
    if (!trimmedRedirectUri) {
      message.warning(dict('PC.Pages.ThirdAppDetail.callbackUrlRequired'));
      return;
    }
    runSaveOauthSetting({
      projectId,
      projectType: AgentComponentTypeEnum.ThirdApp,
      homepageUrl: trimmedHomepageUrl,
      redirectUri: trimmedRedirectUri,
    });
  }, [homepageUrl, projectId, redirectUri, runSaveOauthSetting]);

  /**
   * 渲染可编辑 URL 字段。
   *
   * @param label 字段名
   * @param value 当前值
   * @param onChange 变更回调
   * @param placeholder 占位文案
   * @param required 是否在 label 后展示必填星号
   * @returns URL 输入行
   */
  const renderUrlField = (
    label: string,
    value: string,
    onChange: (next: string) => void,
    placeholder: string,
    required?: boolean,
  ) => (
    <div className={cx(styles.field)}>
      <span className={cx(styles['field-label'])}>
        {label}
        {required ? (
          <span className={cx(styles['field-required'])} aria-hidden>
            *
          </span>
        ) : null}
      </span>
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
   * 渲染只读认证字段。
   *
   * @param label 字段名
   * @param value 原始值
   * @param secret 是否遮罩
   * @returns 认证信息行
   */
  const renderField = (label: string, value: string, secret?: boolean) => {
    const display = !value
      ? dict('PC.Pages.ThirdAppDetail.emptyValue')
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
          {appInfo?.name}
        </h3>
        <Tabs
          className={cx(styles.tabs)}
          activeKey="setting"
          items={tabItems}
        />

        {/* 头部操作区域 */}
        <div className={cx(styles['header-actions'], 'flex', 'items-center')}>
          {isPublished ? (
            <TooltipIcon
              title={dict('PC.Pages.ThirdAppDetail.publishVersionRecords')}
              ariaLabel={dict('PC.Pages.ThirdAppDetail.publishVersionRecords')}
              className={cx(styles['history-btn'], {
                [styles.active]: publishVersionRecordsOpen,
              })}
              icon={<ClockCircleOutlined style={{ fontSize: 16 }} />}
              onClick={handleTogglePublishVersionRecords}
            />
          ) : null}
          <TooltipIcon
            title={
              canPublish
                ? undefined
                : dict('PC.Pages.ThirdAppDetail.publishDisabledHomepageHint')
            }
          >
            <span>
              <Button
                type="primary"
                disabled={!canPublish}
                onClick={handleOpenPublish}
              >
                {dict('PC.Pages.ThirdAppDetail.publish')}
              </Button>
            </span>
          </TooltipIcon>
        </div>
      </header>

      {/* 主体区域 */}
      <div
        className={cx(styles.body, 'flex', 'flex-1', 'min-h-0', {
          [styles['body-with-records']]: publishVersionRecordsOpen,
        })}
      >
        <main className={cx(styles.main, 'flex-1', 'scroll-container-hide')}>
          <section className={cx(styles.card)}>
            <h3 className={cx(styles['card-title'])}>
              {dict('PC.Pages.ThirdAppDetail.oauthTitle')}
            </h3>
            <p className={cx(styles['card-desc'])}>
              {dict('PC.Pages.ThirdAppDetail.oauthDesc')}
            </p>
            <Spin spinning={oauthLoading}>
              {renderField(
                dict('PC.Pages.ThirdAppDetail.clientId'),
                oauthInfo?.clientId || '',
              )}
              {renderField(
                dict('PC.Pages.ThirdAppDetail.clientSecret'),
                clientSecret,
                true,
              )}
              {renderUrlField(
                dict('PC.Pages.ThirdAppDetail.homeUrl'),
                homepageUrl,
                setHomepageUrl,
                dict('PC.Pages.ThirdAppDetail.homeUrlPlaceholder'),
                true,
              )}
              {renderUrlField(
                dict('PC.Pages.ThirdAppDetail.callbackUrl'),
                redirectUri,
                setRedirectUri,
                dict('PC.Pages.ThirdAppDetail.callbackUrlPlaceholder'),
                true,
              )}
              <div className={cx(styles['action-row'])}>
                <Button
                  type="primary"
                  loading={saveOauthLoading}
                  onClick={handleSaveOauthSetting}
                >
                  {dict('PC.Common.Global.save')}
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  className={cx(styles['regenerate-btn'])}
                  loading={regenerateLoading}
                  onClick={handleRegenerate}
                >
                  {dict('PC.Pages.ThirdAppDetail.regenerate')}
                </Button>
                <span className={cx(styles['regenerate-hint'])}>
                  {dict('PC.Pages.ThirdAppDetail.regenerateHint')}
                </span>
              </div>
            </Spin>
          </section>
        </main>

        {/* 发布版本记录侧栏 */}
        {projectId ? (
          <AppDevPublishVersionRecords
            appId={projectId}
            targetType={AgentComponentTypeEnum.ThirdApp}
            appName={appInfo?.name}
            visible={publishVersionRecordsOpen}
            className={styles['publish-records-panel']}
            onClose={() => setPublishVersionRecordsOpen(false)}
          />
        ) : null}
      </div>

      {/* 发布申请弹窗 */}
      <PublishComponentModal
        mode={AgentComponentTypeEnum.ThirdApp}
        targetId={projectId}
        open={openPublishModal}
        spaceId={spaceId}
        onCancel={() => setOpenPublishModal(false)}
        onConfirm={handlePublishConfirm}
      />
    </div>
  );
};

export default ThirdAppDetail;
