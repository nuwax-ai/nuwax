import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Message: React.FC = () => {
  const { openMessage, setOpenMessage } = useModel('layout');
  return (
    <Modal
      classNames={styles.container}
      title={null}
      width={113}
      footer={null}
      closeIcon={false}
      mask={false}
      maskClosable
      destroyOnClose
      open={openMessage}
      onCancel={() => setOpenMessage(false)}
    >
      <div>header</div>
      <div>content</div>
    </Modal>
    // <div className={cx([styles.container, { [styles.visible]: openMessage }])}>
    //   <div>header</div>
    //   <div>content</div>
    // </div>
  );
};

export default Message;
