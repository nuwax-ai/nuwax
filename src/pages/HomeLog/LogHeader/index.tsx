import agentImage from '@/assets/images/agent_image.png';
import avatarImage from '@/assets/images/avatar.png';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { LeftOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface LogHeaderProps {
  agentConfigInfo?: AgentConfigInfo;
}

const LogHeader: React.FC<LogHeaderProps> = ({ agentConfigInfo }) => {
  const handleBack = () => {
    history.back();
  };

  return (
    <header
      className={cx(
        'flex',
        'items-center',
        'px-16',
        'py-16',
        'relative',
        styles.header,
      )}
    >
      <LeftOutlined className={cx('hover-box')} onClick={handleBack} />
      {/* 智能体图标 */}
      <img
        className={cx('radius-6', styles['agent-logo'])}
        src={agentConfigInfo?.icon || agentImage}
        alt=""
      />
      <div className={cx('flex', 'flex-col', styles['header-info'])}>
        {/* 智能体名称 */}
        <h3 className={cx(styles['agent-name'])}>{agentConfigInfo?.name}</h3>
        {/* 用户信息 */}
        <div className={cx('flex', 'items-center', styles['user-info'])}>
          <img
            className={cx(styles.avatar)}
            src={agentConfigInfo?.creator?.avatar || avatarImage}
            alt=""
          />
          <span className={cx(styles.name, 'text-ellipsis')}>
            {agentConfigInfo?.creator?.nickName ||
              agentConfigInfo?.creator?.userName}
          </span>
        </div>
      </div>
    </header>
  );
};

export default LogHeader;
