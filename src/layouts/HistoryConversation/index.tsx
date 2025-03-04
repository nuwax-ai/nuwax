import { apiAgentConversationList } from '@/services/agentConfig';
import type { AgentConversationInfo } from '@/types/interfaces/agent';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');
  const [todayConversationList, setTodayConversationList] = useState<
    AgentConversationInfo[]
  >([]);
  const [weekConversationList, setWeekConversationList] = useState<
    AgentConversationInfo[]
  >([]);
  const [yearConversationList, setYearConversationList] = useState<
    AgentConversationInfo[]
  >([]);

  // todo 请求历史会话记录
  const { run, loading } = useRequest(apiAgentConversationList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentConversationInfo[]) => {
      console.log(result, 88);
      const _todayConversationList = [];
      const _weekConversationList = [];
      const _yearConversationList = [];
      result?.forEach((item) => {
        console.log(item);
      });

      setTodayConversationList(_todayConversationList);
      setWeekConversationList(_weekConversationList);
      setYearConversationList(_yearConversationList);
    },
  });

  console.log(
    todayConversationList,
    weekConversationList,
    yearConversationList,
    run,
  );
  useEffect(() => {
    // todo
    // const agentId = 26;
    // run(agentId);
  }, []);

  return (
    <Modal
      title={<p>历史会话</p>}
      loading={loading}
      width={600}
      footer={null}
      maskClosable
      destroyOnClose
      open={openHistoryModal}
      onCancel={() => setOpenHistoryModal(false)}
    >
      <h3 className={cx(styles.title)}>今天</h3>
      <ul>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>考研注意事项</p>
          <span>10:53</span>
        </li>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>数学问题：1+1=？</p>
          <span>09:53</span>
        </li>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>数学问题：1+1=？</p>
          <span>09:53</span>
        </li>
      </ul>
      <h3 className={cx(styles.title)}>本周</h3>
      <ul>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>考研注意事项</p>
          <span>10:53</span>
        </li>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>数学问题：1+1=？</p>
          <span>09:53</span>
        </li>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>数学问题：1+1=？</p>
          <span>09:53</span>
        </li>
      </ul>
      <h3 className={cx(styles.title)}>本年</h3>
      <ul>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>考研注意事项</p>
          <span>10:53</span>
        </li>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>数学问题：1+1=？</p>
          <span>09:53</span>
        </li>
        <li className={cx('flex', 'items-center', styles.row)}>
          <p className={cx('flex-1')}>数学问题：1+1=？</p>
          <span>09:53</span>
        </li>
      </ul>
    </Modal>
  );
};

export default HistoryConversation;
