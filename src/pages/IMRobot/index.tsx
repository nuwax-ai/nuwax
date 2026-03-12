import WorkspaceLayout from '@/components/WorkspaceLayout';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { IMRobotInfo } from '@/types/interfaces/imRobot';
import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'umi';
import CreateIMRobot from './components/CreateIMRobot';
import IMRobotCardList, {
  IMRobotCardListRef,
} from './components/IMRobotCardList';
import PlatformList, { PlatformType } from './components/PlatformList';
import styles from './index.less';

const cx = classNames.bind(styles);

const IMRobot: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 平台过滤
  const [platform, setPlatform] = useState<PlatformType>('dingtalk');
  const [counts, setCounts] = useState<Record<string, number>>({
    dingtalk: 9,
    lark: 9,
    wechat: 7,
    slack: 0,
    teams: 0,
    telegram: 0,
    discord: 0,
    whatsapp: 0,
    wechat_personal: 0,
    line: 0,
    kakaotalk: 0,
    zoom: 0,
    rcs: 0,
  });

  const fetchCounts = useCallback(async () => {
    if (!spaceId) return;

    // 模拟获取数量，暂不调用正式接口，预设一些数据以匹配设计图
    setCounts({
      dingtalk: 9,
      lark: 9,
      wechat: 7,
      slack: 0,
      teams: 0,
      telegram: 0,
      discord: 0,
      whatsapp: 0,
      wechat_personal: 0,
      line: 0,
      kakaotalk: 0,
      zoom: 0,
      rcs: 0,
    });
  }, [spaceId]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // 列表引用
  const listRef = useRef<IMRobotCardListRef>(null);

  // 弹窗控制
  const [openModal, setOpenModal] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<IMRobotInfo | null>(null);
  const [mode, setMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );

  const handleCreate = () => {
    setMode(CreateUpdateModeEnum.Create);
    setCurrentInfo(null);
    setOpenModal(true);
  };

  const handleEdit = (info: IMRobotInfo) => {
    setMode(CreateUpdateModeEnum.Update);
    setCurrentInfo(info);
    setOpenModal(true);
  };

  const handleSuccess = () => {
    setOpenModal(false);
    listRef.current?.reload();
    fetchCounts(); // Update counts
  };

  return (
    <WorkspaceLayout
      title="IM 机器人"
      tips="管理您的即时通讯平台机器人连接与智能体绑定"
      hideScroll={true}
      rightSlot={
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增机器人
        </Button>
      }
      contentPadding={0}
    >
      <div className={cx(styles.mainContainer)}>
        <div className={cx(styles.sidebar)}>
          <PlatformList
            value={platform}
            onChange={setPlatform}
            counts={counts}
          />
        </div>
        <div className={cx(styles.content)}>
          <IMRobotCardList
            ref={listRef}
            spaceId={spaceId}
            onEdit={handleEdit}
            platform={platform}
          />
        </div>
      </div>

      <CreateIMRobot
        open={openModal}
        mode={mode}
        info={currentInfo}
        spaceId={spaceId}
        onCancel={() => setOpenModal(false)}
        onSuccess={handleSuccess}
      />
    </WorkspaceLayout>
  );
};

export default IMRobot;
