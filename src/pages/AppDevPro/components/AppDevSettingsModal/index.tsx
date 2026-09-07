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

/** 自定义域名格式校验：主机名分段 + 顶级域名 */
const DOMAIN_REGEX =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

/** 设置弹窗所需的应用字段（不含域名，域名由独立列表传入） */
export interface AppDevSettingsProjectInfo {
  /** 应用 ID（即 appId） */
  projectId: number;
  /** 应用名称 */
  name: string;
}

export interface AppDevSettingsModalProps {
  /** 是否显示弹窗 */
  open: boolean;
  /** 当前应用详情，绑定域名时使用 projectId */
  projectInfo?: AppDevSettingsProjectInfo | null;
  /** 应用绑定的域名列表（Dev / Prod / Custom） */
  domains?: UserAppDomainInfo[];
  /** 域名列表加载中 */
  domainListLoading?: boolean;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 绑定或解绑成功后刷新域名列表 */
  onSuccess?: () => void;
}

/**
 * AppDevPro 项目设置弹窗：域名绑定。
 *
 * Dev、Prod 以平台默认域名卡片展示（可复制）；Custom 为用户自有域名，支持绑定与解绑。
 *
 * @param props 弹窗属性
 * @param props.open 是否显示
 * @param props.projectInfo 当前应用详情
 * @param props.domains 域名列表
 * @param props.domainListLoading 列表加载中
 * @param props.onCancel 关闭回调
 * @param props.onSuccess 域名变更成功回调
 * @returns 域名绑定设置弹窗
 */
const AppDevSettingsModal: React.FC<AppDevSettingsModalProps> = ({
  open,
  projectInfo,
  domains = [],
  domainListLoading = false,
  onCancel,
  onSuccess,
}) => {
  /** 自定义域名输入 */
  const [domainInput, setDomainInput] = useState<string>('');
  /** 绑定请求进行中 */
  const [bindLoading, setBindLoading] = useState<boolean>(false);

  const projectId = projectInfo?.projectId;

  /** 开发环境默认域名 */
  const devDomain = useMemo(
    () =>
      domains.find((item) => item.domainType === UserAppDomainTypeEnum.Dev)
        ?.domain || '',
    [domains],
  );

  /** 生产环境默认域名 */
  const prodDomain = useMemo(
    () =>
      domains.find((item) => item.domainType === UserAppDomainTypeEnum.Prod)
        ?.domain || '',
    [domains],
  );

  /** 用户自定义域名列表 */
  const customDomains = useMemo(
    () =>
      domains.filter(
        (item) => item.domainType === UserAppDomainTypeEnum.Custom,
      ),
    [domains],
  );

  /** 有值的平台默认域名（Dev / Prod），用于卡片展示 */
  const platformDomains = useMemo(
    () =>
      [
        {
          type: UserAppDomainTypeEnum.Dev,
          domain: devDomain,
          label: t('PC.Pages.AppDevSettingsModal.devDomain'),
        },
        {
          type: UserAppDomainTypeEnum.Prod,
          domain: prodDomain,
          label: t('PC.Pages.AppDevSettingsModal.prodDomain'),
        },
      ].filter((item) => !!item.domain),
    [devDomain, prodDomain],
  );

  // 绑定自有域名
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

  // 解绑自有域名
  const { run: runDeleteDomain } = useRequest(apiUserAppDomainDelete, {
    manual: true,
    onSuccess: () => {
      message.success(t('PC.Pages.AppDevSettingsModal.unbindSuccess'));
      onSuccess?.();
    },
  });

  // 打开弹窗时清空输入，避免沿用上次未绑定内容
  useEffect(() => {
    if (!open) {
      return;
    }
    setDomainInput('');
  }, [open]);

  /**
   * 复制平台分配的开发 / 生产域名。
   *
   * @param domain 待复制的域名
   */
  const handleCopyDomain = useCallback((domain: string) => {
    if (!domain) {
      return;
    }
    copyTextToClipboard(domain, undefined, true);
  }, []);

  /**
   * 绑定自定义域名：校验应用 ID 与域名格式后调用创建接口。
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
   * 解绑自定义域名：二次确认后调用删除接口。
   *
   * @param domain 待解绑的域名记录
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
      <div className={cx(styles.settingsModal)}>
        <div className={cx(styles.sectionTitle)}>
          {t('PC.Pages.AppDevSettingsModal.domainBinding')}
        </div>

        {platformDomains.length > 0 ? (
          <div className={cx(styles.platformDomainList)}>
            {platformDomains.map((item) => (
              <div key={item.type} className={cx(styles.defaultDomain)}>
                <div className={cx(styles.defaultDomainInfo)}>
                  <div className={cx(styles.defaultDomainLabel)}>
                    {item.label}
                  </div>
                  <div className={cx(styles.defaultDomainValue)}>
                    {item.domain}
                  </div>
                </div>
                <Button
                  type="text"
                  className={cx(styles.copyBtn)}
                  onClick={() => handleCopyDomain(item.domain)}
                >
                  {t('PC.Common.Global.copy')}
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <Space.Compact className={cx(styles.bindRow)}>
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
          <div className={cx(styles.domainList)}>
            {customDomains.map((domain) => (
              <div key={domain.id} className={cx(styles.domainItem)}>
                <span className={cx(styles.domainName)}>{domain.domain}</span>
                <Button
                  type="text"
                  className={cx(styles.unbindBtn)}
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
