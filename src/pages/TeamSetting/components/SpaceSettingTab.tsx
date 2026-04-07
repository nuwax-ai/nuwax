import TooltipIcon from '@/components/custom/TooltipIcon';
import { dict } from '@/services/i18nRuntime';
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
      <h3 className={cx('font-weight', 'mb-6')}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.transferSpace')}
      </h3>
      <p className={cx('mb-6')}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.transferSpaceDescription')}
      </p>
      <Button type="primary" className={cx('mb-16')} onClick={transferSpace}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.transferSpaceBtn')}
      </Button>
      <h3 className={cx('font-weight', 'mb-6')}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.deleteSpace')}
      </h3>
      <p className={cx('mb-6')}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.deleteSpaceDescription')}
      </p>
      <Button type="primary" className={cx('mb-16')} onClick={removeSpace}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.deleteSpaceBtn')}
      </Button>
      <h3 className={cx('font-weight', 'mb-6', 'flex', 'items-center')}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.developerFeatures')}
        <TooltipIcon
          icon={<InfoCircleOutlined />}
          title={dict(
            'PC.Pages.TeamSetting.SpaceSettingTab.developerFeaturesTooltip',
          )}
        />
      </h3>
      <Switch
        checked={spaceDetailInfo?.allowDevelop === AllowDevelopEnum.Allow}
        className={cx('mb-16')}
        onChange={(checked) => onChange('allowDevelop', checked)}
      />
      <h3 className={cx('font-weight', 'mb-6', 'flex', 'items-center')}>
        {dict('PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublish')}
        <TooltipIcon
          icon={<InfoCircleOutlined />}
          title={dict(
            'PC.Pages.TeamSetting.SpaceSettingTab.receiveExternalPublishTooltip',
          )}
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
