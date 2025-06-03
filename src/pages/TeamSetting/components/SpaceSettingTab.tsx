import TooltipIcon from '@/components/TooltipIcon';
import styles from '@/styles/teamSetting.less';
import { AllowDevelopEnum, ReceivePublishEnum } from '@/types/enums/space';
import { TeamDetailInfo } from '@/types/interfaces/teamSetting';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Button, Switch } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import RemoveSpace from './RemoveSpace';
import TransferSpace from './TransferSpace';

const cx = classNames.bind(styles);

interface SpaceSettingTabProps {
  spaceId: number;
  spaceDetailInfo?: TeamDetailInfo;
  onTransferSuccess: () => void;
  onChange: (attr: string, checked: boolean) => void;
}

const SpaceSettingTab: React.FC<SpaceSettingTabProps> = ({
  spaceId,
  spaceDetailInfo,
  onTransferSuccess,
  onChange,
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
      <Button type="primary" className={cx('mb-16')} onClick={removeSpace}>
        删除空间
      </Button>
      <h3 className={cx('font-weight', 'mb-6', 'flex', 'items-center')}>
        开发者功能
        <TooltipIcon
          icon={<InfoCircleOutlined />}
          title="关闭后，用户将无法看见“智能体开发”和“组件库”，创建者和管理员不受影响"
        />
      </h3>
      <Switch
        checked={spaceDetailInfo?.allowDevelop === AllowDevelopEnum.Allow}
        className={cx('mb-16')}
        onChange={(checked) => onChange('allowDevelop', checked)}
      />
      <h3 className={cx('font-weight', 'mb-6', 'flex', 'items-center')}>
        接受来自外部空间的发布
        <TooltipIcon
          icon={<InfoCircleOutlined />}
          title="打开后，拥有该空间权限的用户在其他空间完成开发的智能体、插件、工作流，可以发布到该空间的广场上"
        />
      </h3>
      <Switch
        checked={spaceDetailInfo?.receivePublish === ReceivePublishEnum.Receive}
        onChange={(checked) => onChange('receivePublish', checked)}
      />
      <RemoveSpace
        spaceId={spaceId}
        name={spaceDetailInfo?.name}
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
