import styles from '@/styles/teamSetting.less';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import RemoveSpace from './RemoveSpace';
import TransferSpace from './TransferSpace';

const cx = classNames.bind(styles);

interface SpaceSettingTabProps {
  spaceId: number;
  name: string | undefined;
  onTransferSuccess: () => void;
}

const SpaceSettingTab: React.FC<SpaceSettingTabProps> = ({
  spaceId,
  name,
  onTransferSuccess,
}) => {
  const [openRemoveModal, setOpenRemoveModal] = useState<boolean>(false);
  const [openTransferModal, setOpenTransferModal] = useState<boolean>(false);

  const transferSpace = () => {
    setOpenTransferModal(true);
  };
  const removeSpace = () => {
    setOpenRemoveModal(true);
  };

  // 确认删除空间
  const handlerConfirmRemove = async () => {
    setOpenRemoveModal(false);
    onTransferSuccess?.();
  };

  const handlerConfirmTransfer = () => {
    setOpenTransferModal(false);
    onTransferSuccess?.();
  };

  return (
    <>
      <h3 className={cx('font-weight', 'mb-6')}>转让空间</h3>
      <p className={cx('mb-6')}>
        将空间所有权转移给其他成员，转让后将成为管理员身份
      </p>
      <Button type="primary" className={cx('mb-16')} onClick={transferSpace}>
        转让空间
      </Button>
      <h3 className={cx('font-weight', 'mb-6')}>删除空间</h3>
      <p className={cx('mb-6')}>空间删除后所有资产将无法恢复，请谨慎操作</p>
      <Button type="primary" onClick={removeSpace}>
        删除空间
      </Button>
      <RemoveSpace
        spaceId={spaceId}
        name={name}
        open={openRemoveModal}
        onCancel={() => setOpenRemoveModal(false)}
        onConfirmRemove={handlerConfirmRemove}
      />
      <TransferSpace
        spaceId={spaceId}
        open={openTransferModal}
        onCancel={() => setOpenTransferModal(false)}
        onConfirmTransfer={handlerConfirmTransfer}
      />
    </>
  );
};

export default SpaceSettingTab;
