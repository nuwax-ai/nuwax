import CustomPopover from '@/components/CustomPopover';
import { SPACE_ID } from '@/constants/home.constants';
import { history, useModel } from '@@/exports';
import { EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

// 开发收藏
const DevCollect: React.FC = () => {
  const { runCancelCollect, runDevCollect, devCollectAgentList } = useModel(
    'devCollectAgent',
    (model) => ({
      runCancelCollect: model.runCancelCollect,
      runDevCollect: model.runDevCollect,
      devCollectAgentList: model.devCollectAgentList,
    }),
  );

  const { agentList, handlerCollect } = useModel('applicationDev', (model) => ({
    agentList: model.agentList,
    handlerCollect: model.handlerCollect,
  }));

  useEffect(() => {
    runDevCollect({
      page: 1,
      size: 50,
    });
  }, []);

  // 点击开发收藏的智能体
  const handleDevCollect = (agentId: number) => {
    const spaceId = localStorage.getItem(SPACE_ID);
    history.push(`/space/${spaceId}/agent/${agentId}`);
  };

  // 取消收藏
  const handleCancelCollect = async (agentId: number) => {
    await runCancelCollect(agentId);
    const index = agentList?.findIndex((item) => item.id === agentId);
    if (index > -1) {
      handlerCollect(index, false);
    }
  };

  return devCollectAgentList?.length > 0 ? (
    <ul>
      {devCollectAgentList?.map((item) => (
        <li
          key={item.id}
          onClick={() => handleDevCollect(item.agentId)}
          className={cx(
            styles.row,
            'flex',
            'items-center',
            'cursor-pointer',
            'hover-box',
          )}
        >
          <img src={item.icon} alt="" />
          <span className={cx(styles.name, 'flex-1', 'text-ellipsis')}>
            {item.name}
          </span>
          <CustomPopover
            list={[{ label: '取消收藏' }]}
            onClick={() => handleCancelCollect(item.agentId)}
          >
            <EllipsisOutlined className={cx(styles.icon)} />
          </CustomPopover>
        </li>
      ))}
    </ul>
  ) : (
    <>
      <div className={cx(styles['no-dev-collect'])}>还没有收藏任何内容</div>
      <div className={cx(styles['no-dev-collect'])}>
        点击⭐️按钮可将内容添加到这里~
      </div>
    </>
  );
};

export default DevCollect;
