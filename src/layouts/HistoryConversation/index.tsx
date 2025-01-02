import { useModel } from '@umijs/max';
import { Modal } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 历史会话弹窗
 */
const HistoryConversation: React.FC = () => {
  const { openHistoryModal, setOpenHistoryModal } = useModel('layout');
  const [loading, setLoading] = useState<boolean>(false);

  // todo 请求历史会话记录
  // const { run, loading } = useRequest(apiHome, {
  //   manual: true,
  //   debounceWait: 300,
  //   onSuccess: (res: RequestResponse<T>) => {
  //     const { data } = res;
  //     if (data) {
  //     }
  //   },
  // });
  //
  useEffect(() => {
    // todo
    setLoading(true);
    // run()
    setLoading(false);
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
