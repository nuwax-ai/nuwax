import { InfoCircleOutlined } from '@ant-design/icons';
import { Switch, Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface TriggerContentProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

// 触发器内容文本
const TriggerContent: React.FC<TriggerContentProps> = ({
  checked,
  onChange,
}) => {
  return (
    <div className={cx('flex', 'items-center')}>
      <p className={cx(styles['trigger-text'])}>允许用户在对话中创建定时任务</p>
      <Tooltip title="允许用户在与智能体对话过程中，根据用户所在时区创建定时任务。例如“每天早上八点推送新闻”。每个对话中最多创建 3 条定时任务。">
        <InfoCircleOutlined />
      </Tooltip>
      <Switch
        size="small"
        className={styles.switch}
        checked={checked}
        onChange={onChange}
      />
    </div>
  );
};

export default TriggerContent;
