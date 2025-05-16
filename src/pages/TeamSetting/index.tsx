import teamImage from '@/assets/images/team_image.png';
import { SPACE_ID } from '@/constants/home.constants';
import { apiGetSpaceDetail } from '@/services/teamSetting';
import styles from '@/styles/teamSetting.less';
import { SpaceTypeEnum } from '@/types/enums/space';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import { SpaceInfo } from '@/types/interfaces/workspace';
import { FormOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { ConfigProvider, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel, useParams } from 'umi';
import MemberManageTab from './components/MemberManageTab';
import ModifyTeam from './components/ModifyTeam';
import SpaceSettingTab from './components/SpaceSettingTab';

const cx = classNames.bind(styles);

const getStatusName = (status: string | undefined) => {
  if (!status) return '--';

  switch (status) {
    case TeamStatusEnum.Owner:
      return '创建人';
    case TeamStatusEnum.Admin:
      return '管理员';
    default:
      return '成员';
  }
};

const TeamSetting: React.FC = () => {
  const { spaceId } = useParams();
  const [openModifyTeamModal, setOpenModifyTeamModal] =
    useState<boolean>(false);
  const { spaceList, setSpaceList, setCurrentSpaceInfo } =
    useModel('spaceModel');

  const { data, run } = useRequest(apiGetSpaceDetail, {
    manual: true,
  });

  // 删除、转移团队成功后，删除本地缓存的spaceId和spaceUrl，并且跳转到个人类型空间或第一个空间
  const handleTransferSuccess = async () => {
    localStorage.removeItem('SPACE_ID');
    localStorage.removeItem('SPACE_URL');
    // 删除空间后，默认跳转到第一个空间
    const newSpaceList =
      spaceList?.filter((item: SpaceInfo) => item.id !== Number(spaceId)) || [];
    setSpaceList(newSpaceList);
    const defaultSpace = newSpaceList?.find(
      (item: SpaceInfo) => item.type === SpaceTypeEnum.Personal,
    );
    setCurrentSpaceInfo(defaultSpace);
    // 保存spaceId
    const id = defaultSpace?.id || newSpaceList?.[0]?.id;
    localStorage.setItem(SPACE_ID, String(id));
    history.push(`/space/${id}/develop`);
  };

  const tabs: TabsProps['items'] = [
    {
      key: 'MemberManage',
      label: '成员管理',
      children: (
        <MemberManageTab spaceId={spaceId} role={data?.data?.currentUserRole} />
      ),
    },
    ...(data?.data?.currentUserRole === TeamStatusEnum.Owner
      ? [
          {
            key: 'SpaceSetting',
            label: '空间设置',
            children: (
              <SpaceSettingTab
                spaceId={spaceId}
                name={data?.data.name}
                onTransferSuccess={handleTransferSuccess}
              />
            ),
          },
        ]
      : []),
  ];

  const handlerConfirmModifyTeam = () => {
    setOpenModifyTeamModal(false);
    run({ spaceId });
  };

  const editTeam = () => {
    setOpenModifyTeamModal(true);
  };

  useEffect(() => {
    run({ spaceId });
  }, [spaceId]);

  return (
    <div className={cx(styles['team-setting-container'], 'overflow-y')}>
      <section
        className={cx('flex', 'items-center', styles['team-summary-info'])}
      >
        <img src={data?.data?.icon || teamImage} alt="" />
        <section>
          <h1 className={cx('flex', 'items-center', 'font-16')}>
            {data?.data?.name}{' '}
            {data?.data?.currentUserRole !== TeamStatusEnum.User && (
              <FormOutlined className="ml-10" onClick={editTeam} />
            )}
          </h1>
          <p className={cx('font-14')}>
            我的状态：{getStatusName(data?.data.currentUserRole)}
          </p>
        </section>
      </section>
      <ConfigProvider
        theme={{
          components: {
            Tabs: {
              itemActiveColor: '#5147FF',
              inkBarColor: '#5147FF',
              itemSelectedColor: '#5147FF',
              itemHoverColor: '#5147FF',
            },
          },
        }}
      >
        <Tabs defaultActiveKey="MemberManage" items={tabs} />
      </ConfigProvider>
      <ModifyTeam
        spaceData={data?.data}
        spaceId={spaceId}
        open={openModifyTeamModal}
        onCancel={() => setOpenModifyTeamModal(false)}
        onConfirmEdit={handlerConfirmModifyTeam}
      />
    </div>
  );
};

export type TabKey = 'MemberManage' | 'SpaceSetting';

export default TeamSetting;
