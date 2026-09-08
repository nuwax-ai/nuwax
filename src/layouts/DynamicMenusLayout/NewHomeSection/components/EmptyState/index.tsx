import emptyStateNoFile from '@/assets/images/empty_state_no_file.svg';
import { dict } from '@/services/i18nRuntime';
import { Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface EmptyStateProps {
  keyword: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ keyword }) => {
  const noSearchResultText = dict(
    'PC.Components.HistoryConversationList.noSearchResult',
  );

  return (
    <div className={cx(styles['empty-state'])}>
      {keyword ? (
        <Typography.Text type="secondary">{noSearchResultText}</Typography.Text>
      ) : (
        <div className={cx(styles['empty-state-content'])}>
          <img
            src={emptyStateNoFile}
            alt="empty"
            className={cx(styles['empty-state-img'])}
          />
          <Typography.Text className={cx(styles['empty-state-text'])}>
            {dict('PC.Components.HistoryConversationList.emptySession')}
          </Typography.Text>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
