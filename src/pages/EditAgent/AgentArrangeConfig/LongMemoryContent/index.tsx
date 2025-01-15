import TooltipIcon from '@/components/TooltipIcon';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Checkbox } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const LongMemoryContent: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <p>总结聊天对话的内容，并用于更好的响应用户的消息。</p>
      <div className={cx('flex')}>
        <Checkbox disabled={true}>支持在Prompt中调用</Checkbox>
        <TooltipIcon
          icon={<InfoCircleOutlined />}
          title="默认支持在Prompt中调用，取消勾选后将不支持在Prompt中调用（仅能在Workflow中调用）"
        />
      </div>
    </div>
  );
};

export default LongMemoryContent;
