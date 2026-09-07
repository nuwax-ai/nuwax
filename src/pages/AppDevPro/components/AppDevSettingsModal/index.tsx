import { t } from '@/services/i18nRuntime';
import { copyTextToClipboard } from '@/utils/clipboard';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Input, Modal, Space, Spin, message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiUserAppDomainCreate,
  apiUserAppDomainDelete,
  UserAppDomainTypeEnum,
  type UserAppDomainInfo,
} from '../../services/appDomain';
import styles from './index.less';

const cx = classNames.bind(styles);

const DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/** 设置弹窗所需的应用字段（不含域名，域名由独立列表传入） */
export interface AppDevSettingsProjectInfo {
  projectId: number;
  name: string;
}

export interface AppDevSettingsModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 当前应用详情 */
  projectInfo?: AppDevSettingsProjectInfo | null;
  /** 应用绑定的域名列表 */
  domains?: UserAppDomainInfo[];
  /** 域名列表加载中 */
  domainListLoading?: boolean;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 域名变更成功后的回调 */
  onSuccess?: () => void;
}

/**
 * AppDevPro 项目设置弹窗：域名绑定。
 */
const AppDevSettingsModal: React.FC<AppDevSettingsModalProps> = ({
  open,
  projectInfo,
  domains = [],
  domainListLoading = false,
  onCancel,
  onSuccess,
}) => {
  const [domainInput, setDomainInput] = useState('');
  const [bindLoading, setBindLoading] = useState(false);

  const projectId = projectInfo?.projectId;

  const defaultDomain = useMemo(
    () =>
      domains.find((item) => item.domainType === UserAppDomainTypeEnum.Default)
        ?.domain || '',
    [domains],
  );

  const customDomains = useMemo(
    () =>
      domains.filter(
        (item) => item.domainType === UserAppDomainTypeEnum.Custom,
      ),
    [domains],
  );

  const { run: runAddDomain } = useRequest(apiUserAppDomainCreate, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevSettingsModal.bindSuccess'));
      setDomainInput('');
      setBindLoading(false);
      onSuccess?.();
    },
    onError: () => {
      setBindLoading(false);
    },
  });

  const { run: runDeleteDomain } = useRequest(apiUserAppDomainDelete, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevSettingsModal.unbindSuccess'));
      onSuccess?.();
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    setDomainInput('');
  }, [open]);

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
    runAddDomain({ appId: projectId, domain });
  }, [domainInput, projectId, runAddDomain]);

  /**
   * 解绑自定义域名。
   */
  const handleUnbindDomain = useCallback(
    (domain: UserAppDomainInfo) => {
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
        onOk: () => runDeleteDomain(domain.id),
      });
    },
    [runDeleteDomain],
  );

  return (
    <Modal
      title={t('PC.Pages.AppDevSettingsModal.title')}
      open={open}
      onCancel={onCancel}
      width={520}
      destroyOnHidden
      footer={null}
    >
      <div className={cx('settingsModal')}>
        <div className={cx('sectionTitle')}>
          {t('PC.Pages.AppDevSettingsModal.domainBinding')}
        </div>

        {defaultDomain ? (
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
        ) : null}

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

        <Spin spinning={domainListLoading}>
          <div className={cx('domainList')}>
            {customDomains.map((domain) => (
              <div key={domain.id} className={cx('domainItem')}>
                <span className={cx('domainName')}>{domain.domain}</span>
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
