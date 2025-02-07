import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface IntranetServerCommandProps {
  visible: boolean;
  onCancel: () => void;
}

const IntranetServerCommand: React.FC<IntranetServerCommandProps> = ({
  visible,
  onCancel,
}) => {
  return (
    <Modal
      title="内网服务器执行命令"
      open={visible}
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
      }}
      footer={null}
      onCancel={onCancel}
    >
      <div className={cx('flex')}>
        <p>Windows（在CMD窗口中执行）</p>
        <span>Windows 64位 客户端下载</span>
      </div>
      <div>
        client_windows_amd64.exe -s 47.109.49.58 -p 4993 -k
        dec539fc0bfc4963b4331ee5 -ssl true
      </div>
      <div className={cx('flex')}>
        <p>Mac（在终端命令行中执行）</p>
        <span>Mac OS 64位 客户下载</span>
      </div>
      <div>
        nohup ./client_darwin_amd64 -s 47.109.49.58 -p 4993 -k
        dec539fc331ee5381af3e0 -ssl true &
      </div>
      <div className={cx('flex')}>
        <p>Linux（在终端命令行中执行）</p>
        <span>Linux 64位 客户端下载</span>
      </div>
      <div>
        nohup ./client_linux_amd64 -s 47.109.49.58 -p 4993 -k
        dec539fc0bfc31ee5381af3e0 -ssl true &
      </div>
    </Modal>
  );
};

export default IntranetServerCommand;
