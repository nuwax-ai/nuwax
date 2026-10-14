import { dict } from '@/services/i18nRuntime';
import { Button, Popover } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  isAvailable as isClientUpdateAvailable,
  subscribe as subscribeClientUpdate,
} from './clientUpdateService';
import { getPageBuildInfo } from './pageBuildInfo';
import {
  getLatestWebBuildInfo,
  reloadWebPage,
  subscribeWebUpdate,
} from './webUpdateService';

/** 浏览器及 direct 网页的可选更新入口，客户端版本更新优先。 */
const WebVersionBadge: React.FC = () => {
  const [available, setAvailable] = useState(false);
  const [clientState, setClientState] = useState<ClientUpdateState | null>(
    null,
  );
  const [latestBuildInfo, setLatestBuildInfo] = useState(getLatestWebBuildInfo);
  useEffect(
    () =>
      subscribeWebUpdate((next) => {
        setAvailable(next);
        setLatestBuildInfo(getLatestWebBuildInfo());
      }),
    [],
  );
  useEffect(() => subscribeClientUpdate(setClientState), []);

  // 客户端下载、安装与已知版本的重试优先；普通检查失败不遮住网页更新。
  const hasClientUpdate =
    isClientUpdateAvailable() &&
    clientState?.hostVersion &&
    (clientState.status === 'available' ||
      clientState.status === 'downloading' ||
      clientState.status === 'downloaded' ||
      (clientState.status === 'error' && !!clientState.version));

  if (!available || hasClientUpdate) return null;
  const updateLabel = dict('PC.Components.ClientUpdate.update');
  const currentBuildInfo = getPageBuildInfo();
  const formatTime = (value?: string) =>
    value
      ? new Date(value).toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      : '—';
  const rows = [
    {
      label: dict('PC.Components.WebUpdate.current'),
      info: currentBuildInfo,
    },
    {
      label: dict('PC.Components.WebUpdate.latest'),
      info: latestBuildInfo,
    },
  ];
  return (
    <Popover
      content={
        <div style={{ width: 260 }}>
          <dl
            style={{
              display: 'grid',
              gridTemplateColumns: '36px minmax(0, 1fr)',
              columnGap: 12,
              rowGap: 10,
              margin: 0,
              fontSize: 12,
              lineHeight: '20px',
            }}
          >
            {rows.map((row) => (
              <React.Fragment key={row.label}>
                <dt style={{ color: 'var(--xagi-color-text-secondary)' }}>
                  {row.label}
                </dt>
                <dd style={{ margin: 0 }}>
                  <div
                    style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}
                  >
                    <span style={{ fontWeight: 500, overflowWrap: 'anywhere' }}>
                      {row.info?.appVersion ? `v${row.info.appVersion}` : '—'}
                    </span>
                    <span style={{ color: 'var(--xagi-color-text-tertiary)' }}>
                      ·
                    </span>
                    <span
                      title={row.info?.gitHash}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 11,
                        flexShrink: 0,
                        color: 'var(--xagi-color-text-secondary)',
                      }}
                    >
                      {row.info?.gitHash?.slice(0, 10) || '—'}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      lineHeight: '18px',
                      color: 'var(--xagi-color-text-tertiary)',
                    }}
                  >
                    {row.info?.buildAt ? (
                      <time
                        dateTime={row.info.buildAt}
                        title={row.info.buildAt}
                      >
                        {formatTime(row.info.buildAt)}
                      </time>
                    ) : (
                      '—'
                    )}
                  </div>
                </dd>
              </React.Fragment>
            ))}
          </dl>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid var(--xagi-color-border-secondary)',
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 11,
                color: 'var(--xagi-color-text-tertiary)',
              }}
            >
              {dict('PC.Components.WebUpdate.refreshHint')}
            </span>
            <Button
              size="small"
              type="primary"
              aria-label={updateLabel}
              autoInsertSpace={false}
              onClick={reloadWebPage}
            >
              {updateLabel}
            </Button>
          </div>
        </div>
      }
      // 顶部是客户端宿主菜单层，网页弹层无法覆盖它；固定向下避免文字重叠。
      placement="bottomLeft"
      autoAdjustOverflow={false}
      trigger="hover"
      mouseEnterDelay={0.3}
      arrow={false}
      destroyOnHidden
    >
      <button
        type="button"
        aria-label={updateLabel}
        onClick={reloadWebPage}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          height: 24,
          padding: '0 8px',
          border: 0,
          borderRadius: 12,
          marginLeft: 10,
          background: 'var(--xagi-color-primary-bg)',
          color: 'var(--xagi-color-primary)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {updateLabel}
      </button>
    </Popover>
  );
};

export default WebVersionBadge;
