import { dict } from '@/services/i18nRuntime';
import { Tooltip } from 'antd';
import React, { useEffect, useState } from 'react';
import { reloadWebPage, subscribeWebUpdate } from './webUpdateService';

/** direct 网页的可选更新入口，不自动刷新或打断正在进行的任务。 */
const WebVersionBadge: React.FC = () => {
  const [available, setAvailable] = useState(false);
  useEffect(() => subscribeWebUpdate(setAvailable), []);

  if (!available) return null;
  return (
    <Tooltip title={dict('PC.Components.WebUpdate.refreshHint')}>
      <button
        type="button"
        aria-label={dict('PC.Components.WebUpdate.update')}
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
          marginLeft: 8,
          background: 'var(--xagi-color-primary-bg)',
          color: 'var(--xagi-color-primary)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        {dict('PC.Components.WebUpdate.update')}
      </button>
    </Tooltip>
  );
};

export default WebVersionBadge;
