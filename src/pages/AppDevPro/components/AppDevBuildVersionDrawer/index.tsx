import CopyButton from '@/components/base/CopyButton';
import Loading from '@/components/custom/Loading';
import ToggleWrap from '@/components/ToggleWrap';
import { dict } from '@/services/i18nRuntime';
import { copyTextToClipboard } from '@/utils/clipboard';
import { Button, Empty, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useRequest } from 'umi';
import { apiUserAppBuildVersions } from '../../services/appDevPro';
import type { BuildVersionDto } from '../../type';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevBuildVersionDrawerProps {
  /** 是否显示历史构建包版本侧栏 */
  visible: boolean;
  /** 应用 ID，用于拉取构建版本列表 */
  appId?: number;
  /** 当前生产部署版本号，用于标记「当前」 */
  currentReleaseId?: string;
  /** 是否已部署到生产环境；未部署时不展示「当前」标记 */
  prodDeployed?: boolean;
  /** 部署指定版本（releaseId 取 version 字段） */
  onDeployVersion?: (version: string) => void;
  /** 当前正在部署的版本号 */
  deployingVersion?: string;
  /** 关闭侧栏 */
  onClose: () => void;
}

/**
 * 把接口返回规范成版本数组。umi 可能直接给 data，也可能包一层。
 *
 * @param result 接口成功回调入参
 * @returns 构建版本列表
 */
const normalizeBuildVersions = (result: unknown): BuildVersionDto[] => {
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data;
    }
  }
  return [];
};

/**
 * 格式化构建时间；无效日期原样返回。
 *
 * @param buildTime 接口 date-time 字符串
 * @returns 展示文案
 */
const formatBuildTime = (buildTime?: string): string => {
  if (!buildTime) {
    return '';
  }
  const parsed = dayjs(buildTime);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : buildTime;
};

/**
 * 缩短 Git 提交哈希，方便列表阅读。
 *
 * @param gitCommit 完整提交哈希
 * @returns 短哈希
 */
const shortGitCommit = (gitCommit?: string): string => {
  if (!gitCommit) {
    return '';
  }
  return gitCommit.length > 8 ? gitCommit.slice(0, 8) : gitCommit;
};

/**
 * AppDevPro 线上环境历史构建包版本侧栏。
 * 打开时调用 /api/userapp/build-versions（appId 作 query 参数）拉取构建包列表。
 *
 * @param props.visible 是否显示
 * @param props.appId 应用 ID
 * @param props.currentReleaseId 当前生产部署版本
 * @param props.prodDeployed 是否已部署到生产环境
 * @param props.onDeployVersion 部署指定版本
 * @param props.deployingVersion 当前部署中的版本
 * @param props.onClose 关闭回调
 * @returns 历史构建包版本侧栏
 */
const AppDevBuildVersionDrawer: React.FC<AppDevBuildVersionDrawerProps> = ({
  visible,
  appId,
  currentReleaseId,
  prodDeployed = false,
  onDeployVersion,
  deployingVersion = '',
  onClose,
}) => {
  const { data, loading } = useRequest(
    () => apiUserAppBuildVersions(appId as number),
    {
      ready: visible && !!appId,
      refreshDeps: [appId, visible],
    },
  );

  const versions = useMemo(() => {
    const list = normalizeBuildVersions(data);
    return [...list].sort((left, right) => {
      if (left.latest !== right.latest) {
        return left.latest ? -1 : 1;
      }
      return dayjs(right.buildTime).valueOf() - dayjs(left.buildTime).valueOf();
    });
  }, [data]);

  const content = loading ? (
    <Loading className="h-full" />
  ) : versions.length ? (
    <div className={cx(styles.list)}>
      {versions.map((item) => {
        const isCurrent =
          prodDeployed &&
          !!currentReleaseId &&
          item.version === currentReleaseId;
        const isDeploying = deployingVersion === item.version;
        return (
          <div
            key={`${item.version}-${item.gitCommit}-${item.buildTime}`}
            className={cx(styles.item)}
          >
            <div className={cx(styles.itemHeader)}>
              <div className={cx(styles.versionRow)}>
                <span className={cx(styles.version)}>{item.version}</span>
                <CopyButton
                  text={item.version}
                  className={cx(styles.versionCopy)}
                  tooltipText={dict('PC.Common.Global.copy')}
                  showSuccessMsg
                  successMessage={dict('PC.Utils.Clipboard.copySuccess')}
                >
                  {''}
                </CopyButton>
              </div>
              {item.latest || isCurrent ? (
                <div className={cx(styles.tags)}>
                  {item.latest ? (
                    <Tag color="blue">
                      {dict('PC.Pages.AppDevPro.buildVersionLatest')}
                    </Tag>
                  ) : null}
                  {isCurrent ? (
                    <Tag color="green">
                      {dict('PC.Pages.AppDevPro.buildVersionCurrent')}
                    </Tag>
                  ) : null}
                </div>
              ) : null}
            </div>
            {item.gitCommit ? (
              <div className={cx(styles.meta)}>
                <span className={cx(styles.metaLabel)}>
                  {dict('PC.Pages.AppDevPro.buildVersionCommit')}
                </span>
                <button
                  type="button"
                  className={cx(styles.metaValue, styles.copyable)}
                  title={item.gitCommit}
                  onClick={() => {
                    void copyTextToClipboard(item.gitCommit);
                  }}
                >
                  {shortGitCommit(item.gitCommit)}
                </button>
              </div>
            ) : null}
            {item.buildTime ? (
              <div className={cx(styles.meta)}>
                <span className={cx(styles.metaLabel)}>
                  {dict('PC.Pages.AppDevPro.buildVersionTime')}
                </span>
                <span className={cx(styles.metaValue)}>
                  {formatBuildTime(item.buildTime)}
                </span>
              </div>
            ) : null}
            {item.packageUrl ? (
              <div className={cx(styles.meta)}>
                <span className={cx(styles.metaLabel)}>
                  {dict('PC.Pages.AppDevPro.buildVersionPackage')}
                </span>
                <button
                  type="button"
                  className={cx(styles.metaValue, styles.copyable)}
                  title={item.packageUrl}
                  onClick={() => {
                    void copyTextToClipboard(item.packageUrl);
                  }}
                >
                  {item.packageUrl}
                </button>
              </div>
            ) : null}
            {!isCurrent ? (
              <Button
                type="primary"
                className={cx(styles.deployBtn, 'w-full')}
                loading={isDeploying}
                disabled={!!deployingVersion && !isDeploying}
                onClick={() => onDeployVersion?.(item.version)}
              >
                {dict('PC.Pages.AppDevPro.deployThisVersion')}
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  ) : (
    <div className={cx(styles.empty)}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={dict('PC.Pages.AppDevPro.buildVersionsEmpty')}
      />
    </div>
  );

  return (
    <ToggleWrap
      title={dict('PC.Pages.AppDevPro.buildVersionRecords')}
      visible={visible}
      onClose={onClose}
      className={cx(styles.panel)}
    >
      <div className={cx(styles.content)}>{content}</div>
    </ToggleWrap>
  );
};

export default AppDevBuildVersionDrawer;
