import CustomPopover from '@/components/CustomPopover';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { IMPlatformEnum } from '@/constants/imChannel.constants';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { CustomPopoverItem } from '@/types/interfaces/common';
import { IMChannelInfo, IMChannelTypeEnum } from '@/types/interfaces/imChannel';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Input, Space } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useParams } from 'umi';
import CreateIMChannel from './components/CreateIMChannel';
import IMChannelCardList, {
  IMChannelCardListRef,
} from './components/IMChannelCardList';
import PlatformList, { PlatformType } from './components/PlatformList';
import styles from './index.less';

const cx = classNames.bind(styles);

// 新增资源列表
const IM_CHANNEL_ADD_RESOURCES = [
  {
    label: '新增机器人',
    value: IMChannelTypeEnum.Bot,
  },
  {
    label: '新增应用',
    value: IMChannelTypeEnum.App,
  },
];

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiIMConfigChannelList } from '@/services/imChannel';

const IMChannel: React.FC = () => {
  const params = useParams() as any;
  const location = useLocation();
  const spaceId = params.spaceId ? Number(params.spaceId) : undefined;

  // 平台过滤
  const [platform, setPlatform] = useState<PlatformType>(IMPlatformEnum.Feishu);
  const [counts, setCounts] = useState<Record<string, number>>({
    [IMPlatformEnum.Dingtalk]: 0,
    [IMPlatformEnum.Feishu]: 0,
    [IMPlatformEnum.Wework]: 0,
  });
  const [keyword, setKeyword] = useState('');

  const fetchCounts = useCallback(async () => {
    if (!spaceId) return;

    const platforms = [
      IMPlatformEnum.Feishu,
      IMPlatformEnum.Dingtalk,
      IMPlatformEnum.Wework,
    ];

    try {
      const results = await Promise.all(
        platforms.map((p) => apiIMConfigChannelList({ channel: p, spaceId })),
      );

      const newCounts: Record<string, number> = {};
      results.forEach((res, index) => {
        if (res?.code === SUCCESS_CODE) {
          newCounts[platforms[index]] = res.data?.length || 0;
        }
      });

      setCounts((prev) => ({ ...prev, ...newCounts }));
    } catch (error) {
      console.error('Fetch counts failed:', error);
    }
  }, [spaceId]);
  // 列表引用
  const listRef = useRef<IMChannelCardListRef>(null);
  useEffect(() => {
    setPlatform(IMPlatformEnum.Feishu);
    setKeyword('');
    fetchCounts();
    listRef.current?.reload();
  }, [fetchCounts, location]);

  // 弹窗控制
  const [openModal, setOpenModal] = useState(false);
  const [currentInfo, setCurrentInfo] = useState<IMChannelInfo | null>(null);
  const [mode, setMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );
  const [initialCreateType, setInitialCreateType] = useState<
    IMChannelTypeEnum | undefined
  >();

  const handleCreate = (type?: IMChannelTypeEnum) => {
    setMode(CreateUpdateModeEnum.Create);
    setInitialCreateType(type);
    setCurrentInfo(null);
    setOpenModal(true);
  };

  const handleEdit = (info: IMChannelInfo) => {
    setMode(CreateUpdateModeEnum.Update);
    setCurrentInfo(info);
    setOpenModal(true);
  };

  const handleSuccess = () => {
    setOpenModal(false);
    listRef.current?.reload();
    fetchCounts(); // Update counts
  };

  const handleClickPopoverItem = (item: CustomPopoverItem) => {
    handleCreate(item.value as IMChannelTypeEnum);
  };

  return (
    <WorkspaceLayout
      title="IM 机器人"
      hideScroll={true}
      rightSlot={
        <Space size={12}>
          <Input.Search
            placeholder="搜索智能体名称"
            value={keyword}
            allowClear
            onSearch={setKeyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
          />
          {platform ? (
            platform === IMPlatformEnum.Wework ? (
              <CustomPopover
                list={IM_CHANNEL_ADD_RESOURCES}
                onClick={handleClickPopoverItem}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  新增
                </Button>
              </CustomPopover>
            ) : (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreate(IMChannelTypeEnum.Bot)}
              >
                新增机器人
              </Button>
            )
          ) : null}
        </Space>
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
          <IMChannelCardList
            ref={listRef}
            onEdit={handleEdit}
            onDeleteSuccess={fetchCounts}
            platform={platform}
            spaceId={spaceId}
            keyword={keyword}
          />
        </div>
      </div>

      <CreateIMChannel
        open={openModal}
        mode={mode}
        info={currentInfo}
        platform={platform as any}
        initialType={initialCreateType}
        spaceId={spaceId}
        onCancel={() => setOpenModal(false)}
        onSuccess={handleSuccess}
      />
    </WorkspaceLayout>
  );
};

export default IMChannel;
