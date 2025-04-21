import TooltipIcon from '@/components/TooltipIcon';
import { CopyOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const CopyUrl: React.FC = () => {
  return (
    <div className={cx('px-16', 'py-12', 'radius-6', styles['mode-box'])}>
      <div className={cx('flex', 'items-center', styles['mode-title'])}>
        <h3>复制url到你的应用</h3>
        <TooltipIcon
          title="复制"
          icon={<CopyOutlined className={cx(styles['copy-icon'])} />}
          onClick={() => {}}
        />
      </div>
      <Tooltip
        title={
          'https://api.coze.cn/api/trigger/v1/webhook/biz_id/bot_platform/hook/1000000000201990658'
        }
      >
        <p className={cx('text-ellipsis')}>
          https://api.coze.cn/api/trigger/v1/webhook/biz_id/bot_platform/hook/1000000000201990658
        </p>
      </Tooltip>
    </div>
  );
};

export default CopyUrl;
