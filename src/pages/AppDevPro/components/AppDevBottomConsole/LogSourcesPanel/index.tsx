/**
 * AppDevPro 日志来源列表。
 * 只渲染 /api/userapp/logs/sources/query 的来源数据，不走公共 DevLogPanel。
 */
import { dict } from '@/services/i18nRuntime';
import type { UserAppLogSourceItem } from '@/types/interfaces/userProject';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface LogSourcesPanelProps {
  /** 当前环境的日志来源 */
  sources: UserAppLogSourceItem[];
  /** 首次拉取中 */
  isLoading?: boolean;
}

// 日志来源列表
const LogSourcesPanel: React.FC<LogSourcesPanelProps> = ({
  sources,
  isLoading = false,
}) => {
  if (isLoading && sources.length === 0) {
    return (
      <div className={cx(styles.panel, styles.empty)}>
        <p>{dict('PC.Pages.AppDevDevLogConsole.loadingLogs')}</p>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className={cx(styles.panel, styles.empty)}>
        <p>{dict('PC.Pages.AppDevDevLogConsole.noLogData')}</p>
      </div>
    );
  }

  return (
    <div className={cx(styles.panel)}>
      {sources.map((source) => (
        <div
          key={`${source.service_id}:${source.source_id}`}
          className={cx(styles.row)}
        >
          <div className={cx(styles.head)}>
            <span className={cx(styles.service)}>{source.service_id}</span>
            <span className={cx(styles.source)}>{source.source_id}</span>
            {source.format ? (
              <span className={cx(styles.format)}>{source.format}</span>
            ) : null}
          </div>
          {source.matched_files.length > 0 ? (
            <div className={cx(styles.files)}>
              {source.matched_files.map((file) => (
                <div key={file} className={cx(styles.file)}>
                  {file}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

export default LogSourcesPanel;
