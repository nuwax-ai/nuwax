import SvgIcon from '@/components/base/SvgIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { RequestResponse } from '@/types/interfaces/request';
import { copyTextToClipboard } from '@/utils/clipboard';
import { needsTopRightAvoid, shellAvoid } from '@/utils/hostBridge';
import {
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
 * 页面仅保留设置 Tab 和 OAuth2 认证信息，不请求任务、域名或部署数据。
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
          setHomepageUrl(info.homepageUrl || '');
          setRedirectUri(info.redirectUri || '');
        }
        message.success(dict('PC.Common.Global.saveSuccess'));
      },
    },
  );

  /** 查询应用完整信息，并在已生成密钥时查询 Client Secret 明文 */
  const loadAppInfo = useCallback(async () => {
    if (!projectId) {
      return;
    }
    setOauthLoading(true);
    setSecretVisible(false);
    try {
      const infoResponse = await apiThirdAppOauth2InfoGet(projectId);
      const info = pickResponseData(infoResponse);
      setAppInfo(info);
      setOauthInfo(info);
      setHomepageUrl(info?.homepageUrl || '');
      setRedirectUri(info?.redirectUri || '');
      if (!info?.hasClientSecret) {
        setClientSecret('');
        return;
      }
      const secretResponse = await apiThirdAppOauth2SecretGet(projectId);
      const secret = pickResponseData(secretResponse);
      setClientSecret(typeof secret === 'string' ? secret : '');
    } catch (error) {
      console.error('Failed to load third app OAuth2 info:', error);
      setAppInfo(undefined);
      setOauthInfo(undefined);
      setClientSecret('');
      setHomepageUrl('');
      setRedirectUri('');
    } finally {
      setOauthLoading(false);
    }
  }, [projectId]);

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

  /** 保存主页地址与回调地址 */
  const handleSaveOauthSetting = useCallback(() => {
    if (!projectId) {
      return;
    }
    runSaveOauthSetting({
      projectId,
      homepageUrl: homepageUrl.trim() || undefined,
      redirectUri: redirectUri.trim() || undefined,
    });
  }, [homepageUrl, projectId, redirectUri, runSaveOauthSetting]);

  /**
   * 渲染可编辑 URL 字段。
   *
   * @param label 字段名
   * @param value 当前值
   * @param onChange 变更回调
   * @param placeholder 占位文案
   * @returns URL 输入行
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
      </header>

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
            )}
            {renderUrlField(
              dict('PC.Pages.ThirdAppDetail.callbackUrl'),
              redirectUri,
              setRedirectUri,
              dict('PC.Pages.ThirdAppDetail.callbackUrlPlaceholder'),
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
    </div>
  );
};

export default ThirdAppDetail;
