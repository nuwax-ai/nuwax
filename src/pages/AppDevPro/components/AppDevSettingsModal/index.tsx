import { t } from '@/services/i18nRuntime';
import {
  apiCustomPageCreateDomain,
  apiCustomPageDeleteDomain,
  apiCustomPageGetDomainList,
  apiPageUpdateProject,
} from '@/services/pageDev';
import type { ProjectDetailData } from '@/types/interfaces/appDev';
import type { DomainInfo, PageUpdateParams } from '@/types/interfaces/pageDev';
import { copyTextToClipboard } from '@/utils/clipboard';
import { ExclamationCircleFilled, InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Tag,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export interface AppDevSettingsModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 当前项目详情 */
  projectInfo?: ProjectDetailData | null;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 保存认证配置成功后的回调 */
  onSuccess?: () => void;
}

/**
 * 从站点地址或当前页面解析主机名。
 */
const resolveSiteHost = (siteUrl?: string): string => {
  try {
    if (siteUrl) {
      return new URL(siteUrl).host;
    }
  } catch {
    // ignore invalid siteUrl
  }
  return window.location.host;
};

/**
 * 计算平台默认分配的二级域名展示文案。
 */
const getDefaultDomain = (
  projectInfo?: ProjectDetailData | null,
  siteUrl?: string,
): string => {
  const pageUrl = projectInfo?.pageUrl?.trim();
  if (pageUrl) {
    if (/^https?:\/\//i.test(pageUrl)) {
      try {
        return new URL(pageUrl).host;
      } catch {
        return pageUrl.replace(/^https?:\/\//i, '').split('/')[0];
      }
    }
    if (!pageUrl.startsWith('/') && pageUrl.includes('.')) {
      return pageUrl.split('/')[0];
    }
  }

  const slug =
    (projectInfo?.name || 'app')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'app';
  return `${slug}.${resolveSiteHost(siteUrl)}`;
};

/**
 * AppDevPro 项目设置弹窗：复用平台认证 + 域名绑定。
 */
const AppDevSettingsModal: React.FC<AppDevSettingsModalProps> = ({
  open,
  projectInfo,
  onCancel,
  onSuccess,
}) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [reusePlatformAuth, setReusePlatformAuth] = useState(false);
  const [domains, setDomains] = useState<DomainInfo[]>([]);
  const [domainInput, setDomainInput] = useState('');
  const [listLoading, setListLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [bindLoading, setBindLoading] = useState(false);

  const projectId = projectInfo?.projectId;
  const defaultDomain = useMemo(
    () => getDefaultDomain(projectInfo, tenantConfigInfo?.siteUrl),
    [projectInfo, tenantConfigInfo?.siteUrl],
  );

  const { run: runGetDomains } = useRequest(apiCustomPageGetDomainList, {
    manual: true,
    onSuccess: (result: DomainInfo[]) => {
      setDomains(result || []);
      setListLoading(false);
    },
    onError: () => {
      setListLoading(false);
    },
  });

  const { run: runAddDomain } = useRequest(apiCustomPageCreateDomain, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevSettingsModal.bindSuccess'));
      setDomainInput('');
      setBindLoading(false);
      if (projectId) {
        runGetDomains(projectId);
      }
    },
    onError: () => {
      setBindLoading(false);
    },
  });

  const { run: runDeleteDomain } = useRequest(apiCustomPageDeleteDomain, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevSettingsModal.unbindSuccess'));
      if (projectId) {
        runGetDomains(projectId);
      }
    },
  });

  const { run: runUpdatePage } = useRequest(apiPageUpdateProject, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevSettingsModal.saveSuccess'));
      setSaveLoading(false);
      onSuccess?.();
      onCancel();
    },
    onError: () => {
      setSaveLoading(false);
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setReusePlatformAuth(!!projectInfo?.needLogin);
    setDomainInput('');
    if (projectId) {
      setListLoading(true);
      runGetDomains(projectId);
    } else {
      setDomains([]);
    }
  }, [open, projectId, projectInfo?.needLogin, runGetDomains]);

  /**
   * 复制平台默认二级域名。
   */
  const handleCopyDefaultDomain = useCallback(() => {
    if (!defaultDomain) {
      return;
    }
    copyTextToClipboard(defaultDomain, undefined, true);
  }, [defaultDomain]);

  /**
   * 绑定自定义域名。
   */
  const handleBindDomain = useCallback(() => {
    const domain = domainInput.trim();
    if (!projectId) {
      message.error(t('PC.Pages.AppDevSettingsModal.projectIdMissing'));
      return;
    }
    if (!domain) {
      message.warning(t('PC.Pages.AppDevSettingsModal.pleaseEnterDomain'));
      return;
    }
    if (!DOMAIN_REGEX.test(domain)) {
      message.warning(t('PC.Pages.AppDevSettingsModal.invalidDomainFormat'));
      return;
    }
    setBindLoading(true);
    runAddDomain({ projectId, domain });
  }, [domainInput, projectId, runAddDomain]);

  /**
   * 解绑自定义域名。
   */
  const handleUnbindDomain = useCallback(
    (domain: DomainInfo) => {
      Modal.confirm({
        title: t('PC.Pages.AppDevSettingsModal.unbindConfirmTitle'),
        icon: <ExclamationCircleFilled />,
        content: t(
          'PC.Pages.AppDevSettingsModal.unbindConfirmContent',
          domain.domain,
        ),
        okText: t('PC.Pages.AppDevSettingsModal.unbind'),
        okType: 'danger',
        cancelText: t('PC.Common.Global.cancel'),
        onOk: () => runDeleteDomain({ id: domain.id }),
      });
    },
    [runDeleteDomain],
  );

  /**
   * 保存复用平台认证开关。
   */
  const handleSave = useCallback(() => {
    if (!projectId || !projectInfo?.name) {
      message.error(t('PC.Pages.AppDevSettingsModal.projectIdMissing'));
      return;
    }
    setSaveLoading(true);
    const data: PageUpdateParams = {
      projectId,
      projectName: projectInfo.name,
      needLogin: reusePlatformAuth,
    } as PageUpdateParams;
    runUpdatePage(data);
  }, [projectId, projectInfo?.name, reusePlatformAuth, runUpdatePage]);

  const customDomains = useMemo(
    () => domains.filter((item) => item.domain !== defaultDomain),
    [domains, defaultDomain],
  );

  return (
    <Modal
      title={t('PC.Pages.AppDevSettingsModal.title')}
      open={open}
      onCancel={onCancel}
      width={520}
      destroyOnHidden
      footer={
        <Space>
          <Button onClick={onCancel}>{t('PC.Common.Global.cancel')}</Button>
          <Button type="primary" loading={saveLoading} onClick={handleSave}>
            {t('PC.Common.Global.save')}
          </Button>
        </Space>
      }
    >
      <div className={cx('settingsModal')}>
        <div className={cx('authRow')}>
          <div className={cx('authLabel')}>
            {t('PC.Pages.AppDevSettingsModal.reusePlatformAuth')}
          </div>
          <Switch checked={reusePlatformAuth} onChange={setReusePlatformAuth} />
        </div>
        <div className={cx('authDesc')}>
          <InfoCircleOutlined className={cx('authDescIcon')} />
          <span>{t('PC.Pages.AppDevSettingsModal.reusePlatformAuthDesc')}</span>
        </div>

        <Divider className={cx('sectionDivider')} />

        <div className={cx('sectionTitle')}>
          {t('PC.Pages.AppDevSettingsModal.domainBinding')}
        </div>

        <div className={cx('defaultDomain')}>
          <div className={cx('defaultDomainInfo')}>
            <div className={cx('defaultDomainLabel')}>
              {t('PC.Pages.AppDevSettingsModal.defaultDomain')}
            </div>
            <div className={cx('defaultDomainValue')}>{defaultDomain}</div>
          </div>
          <Button onClick={handleCopyDefaultDomain}>
            {t('PC.Common.Global.copy')}
          </Button>
        </div>

        <Space.Compact className={cx('bindRow')}>
          <Input
            placeholder={t('PC.Pages.AppDevSettingsModal.domainPlaceholder')}
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onPressEnter={handleBindDomain}
            autoComplete="off"
          />
          <Button
            type="primary"
            loading={bindLoading}
            onClick={handleBindDomain}
          >
            {t('PC.Pages.AppDevSettingsModal.bind')}
          </Button>
        </Space.Compact>

        <Spin spinning={listLoading}>
          <div className={cx('domainList')}>
            {customDomains.map((domain) => (
              <div key={domain.id} className={cx('domainItem')}>
                <span className={cx('domainName')}>{domain.domain}</span>
                <Tag
                  color={domain.status === 'pending' ? 'warning' : 'success'}
                >
                  {domain.status === 'pending'
                    ? t('PC.Pages.AppDevSettingsModal.pending')
                    : t('PC.Pages.AppDevSettingsModal.verified')}
                </Tag>
                <Button
                  type="text"
                  className={cx('unbindBtn')}
                  onClick={() => handleUnbindDomain(domain)}
                >
                  {t('PC.Pages.AppDevSettingsModal.unbind')}
                </Button>
              </div>
            ))}
          </div>
        </Spin>
      </div>
    </Modal>
  );
};

export default AppDevSettingsModal;
