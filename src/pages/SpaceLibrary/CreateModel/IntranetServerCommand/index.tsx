import { dict } from '@/services/i18nRuntime';
import { Button, Modal } from 'antd';
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
      title={dict('PC.Pages.SpaceLibrary.IntranetServerCommand.modalTitle')}
      open={visible}
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
        body: cx(styles.body),
      }}
      footer={() => (
        <Button onClick={onCancel}>{dict('PC.Common.Global.cancel')}</Button>
      )}
      onCancel={onCancel}
    >
      <div className={cx('flex')}>
        <p>
          {dict('PC.Pages.SpaceLibrary.IntranetServerCommand.windowsTitle')}
        </p>
        <span className={cx(styles['sub-title'])}>
          {dict('PC.Pages.SpaceLibrary.IntranetServerCommand.windowsDownload')}
        </span>
      </div>
      <div className={cx(styles.box)}>
        client_windows_amd64.exe -s 47.109.49.58 -p 4993 -k
        dec539fc0bfc4963b4331ee5 -ssl true
      </div>
      <div className={cx('flex')}>
        <p>{dict('PC.Pages.SpaceLibrary.IntranetServerCommand.macTitle')}</p>
        <span className={cx(styles['sub-title'])}>
          {dict('PC.Pages.SpaceLibrary.IntranetServerCommand.macDownload')}
        </span>
      </div>
      <div className={cx(styles.box)}>
        nohup ./client_darwin_amd64 -s 47.109.49.58 -p 4993 -k
        dec539fc331ee5381af3e0 -ssl true &
      </div>
      <div className={cx('flex')}>
        <p>{dict('PC.Pages.SpaceLibrary.IntranetServerCommand.linuxTitle')}</p>
        <span className={cx(styles['sub-title'])}>
          {dict('PC.Pages.SpaceLibrary.IntranetServerCommand.linuxDownload')}
        </span>
      </div>
      <div className={cx(styles.box)}>
        nohup ./client_linux_amd64 -s 47.109.49.58 -p 4993 -k
        dec539fc0bfc31ee5381af3e0 -ssl true &
      </div>
    </Modal>
  );
};

export default IntranetServerCommand;
