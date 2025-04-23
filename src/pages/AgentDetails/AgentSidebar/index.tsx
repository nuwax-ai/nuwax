import Loading from '@/components/Loading';
import { ICON_SHARE } from '@/constants/images.constants';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import styles from './index.less';
import StatisticsInfo from './StatisticsInfo';

const cx = classNames.bind(styles);

const AgentSidebar: React.FC = () => {
  const { agentId } = useParams();
  const [collect, setCollect] = useState<boolean>(false);

  const {
    run: runDetail,
    data: agentDetail,
    loading,
  } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
  });

  useEffect(() => {
    runDetail(agentId);
  }, []);

  const handleClose = () => {
    setCollect(!collect);
  };

  return (
    <div className={cx(styles.container)}>
      {loading ? (
        <Loading />
      ) : (
        <>
          <StatisticsInfo
            statistics={agentDetail?.statistics}
            onClose={handleClose}
          />
          <div
            className={cx(
              styles['sidebar-content'],
              'flex',
              'flex-col',
              'items-center',
            )}
          >
            <img className={styles.avatar} src={agentDetail?.icon} alt="" />
            <span className={styles.title}>{agentDetail?.name}</span>
            <p className={cx(styles.content)}>{agentDetail?.description}</p>
            <div className={cx(styles.from, 'text-ellipsis', 'w-full')}>
              来自于
              {agentDetail?.publishUser?.nickName ||
                agentDetail?.publishUser?.userName}
            </div>
            <span
              className={cx(
                styles['action-box'],
                'flex',
                'items-center',
                'content-center',
              )}
            >
              {collect ? (
                <StarFilled className={cx(styles.collected)} />
              ) : (
                <StarOutlined className={cx(styles['un-collect'])} />
              )}
              <ICON_SHARE />
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default AgentSidebar;
