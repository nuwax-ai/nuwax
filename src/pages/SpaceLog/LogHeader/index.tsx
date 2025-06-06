import agentImage from '@/assets/images/agent_image.png';
import teamImage from '@/assets/images/team_image.png';
import { LogHeaderProps } from '@/types/interfaces/space';
import { LeftOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import { history, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 日志头部组件
const LogHeader: React.FC<LogHeaderProps> = ({ agentConfigInfo }) => {
  const { spaceId } = useParams();
  // 返回上一页，如果没有referrer，则跳转到工作空间（智能体开发）页面
  const handleBack = () => {
    const referrer = document.referrer;
    if (!referrer || window.history.length <= 1) {
      history.push(`/space/${spaceId}/develop`);
    } else {
      history.back();
    }
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
        {/* 空间信息 */}
        <div className={cx('flex', 'items-center', styles['user-info'])}>
          <img
            className={cx(styles.avatar)}
            src={agentConfigInfo?.space?.icon || teamImage}
            alt=""
          />
          <span className={cx(styles.name, 'text-ellipsis')}>
            {agentConfigInfo?.space?.name}
          </span>
        </div>
      </div>
    </header>
  );
};

export default LogHeader;
