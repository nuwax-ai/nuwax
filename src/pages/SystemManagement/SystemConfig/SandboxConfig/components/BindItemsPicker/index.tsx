import { t } from '@/services/i18nRuntime';
import {
  apiSystemResourceSpaceList,
  apiSystemUserList,
} from '@/services/systemManage';
import { SandboxBindTypeEnum } from '@/types/enums/systemManage';
import {
  SandboxBindItem,
  SystemSpaceInfo,
  SystemUserListInfo,
} from '@/types/interfaces/systemManage';
import { Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import ResourcePicker from '../ResourcePicker';
import styles from './index.less';

const cx = classNames.bind(styles);

interface BindItemsPickerProps {
  value?: SandboxBindItem[];
  onChange?: (value: SandboxBindItem[]) => void;
}

const BindItemsPicker: React.FC<BindItemsPickerProps> = ({
  value = [],
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<SandboxBindTypeEnum>(
    SandboxBindTypeEnum.User,
  );

  // User state
  const [userList, setUserList] = useState<SystemUserListInfo[]>([]);
  const [userSearchKw, setUserSearchKw] = useState('');
  const [userLoading, setUserLoading] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [userHasMore, setUserHasMore] = useState(false);

  // Space state
  const [spaceList, setSpaceList] = useState<SystemSpaceInfo[]>([]);
  const [spaceSearchKw, setSpaceSearchKw] = useState('');
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [spacePage, setSpacePage] = useState(1);
  const [spaceHasMore, setSpaceHasMore] = useState(false);

  // Fetch users
  const fetchUsers = async (page = 1, kw = userSearchKw) => {
    setUserLoading(true);
    try {
      const res = await apiSystemUserList({
        pageNo: page,
        pageSize: 15,
        queryFilter: { userName: kw },
      });
      if (res.success && res.data) {
        const records = res.data.records || [];
        setUserList(page === 1 ? records : [...userList, ...records]);
        setUserHasMore(res.data.current < res.data.pages);
        setUserPage(res.data.current);
      }
    } finally {
      setUserLoading(false);
    }
  };

  // Fetch spaces
  const fetchSpaces = async (page = 1, kw = spaceSearchKw) => {
    setSpaceLoading(true);
    try {
      const res = await apiSystemResourceSpaceList({
        pageNo: page,
        pageSize: 15,
        name: kw,
      });
      if (res.success && res.data) {
        const records = res.data.records || [];
        setSpaceList(page === 1 ? records : [...spaceList, ...records]);
        // SystemSpacePage uses total, pageNo, pageSize
        const total = res.data.total || 0;
        setSpaceHasMore(page * 15 < total);
        setSpacePage(page);
      }
    } finally {
      setSpaceLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, '');
    fetchSpaces(1, '');
  }, []);

  const handleToggle = (
    targetId: number,
    targetType: SandboxBindTypeEnum,
    item: any,
  ) => {
    const isExist = value.some(
      (v) => v.targetId === targetId && v.targetType === targetType,
    );
    if (isExist) {
      onChange?.(
        value.filter(
          (v) => !(v.targetId === targetId && v.targetType === targetType),
        ),
      );
    } else {
      let targetName = '';
      if (targetType === SandboxBindTypeEnum.Space) {
        // 空间名称规则：名称-创建人
        targetName = item.creatorName
          ? `${item.name} (${item.creatorName})`
          : item.name;
      } else {
        // 用户名称规则：姓名nickName（没有时展示用户名userName）- 手机号（没有时展示邮箱，都没有时不展示）
        const namePart = item.nickName || item.userName;
        const contactPart = item.phone || item.email || '';
        targetName = contactPart ? `${namePart} (${contactPart})` : namePart;
      }
      onChange?.([...value, { targetId, targetType, targetName }]);
    }
  };

  const selectedUsers = useMemo(
    () => value.filter((v) => v.targetType === SandboxBindTypeEnum.User),
    [value],
  );
  const selectedSpaces = useMemo(
    () => value.filter((v) => v.targetType === SandboxBindTypeEnum.Space),
    [value],
  );

  const mappedUserList = useMemo(() => {
    return userList.map((item) => {
      const namePart = item.nickName || item.userName;
      const contactPart = item.phone || item.email || '';
      return {
        id: item.id,
        name: contactPart ? `${namePart} (${contactPart})` : namePart,
      };
    });
  }, [userList]);

  const mappedSpaceList = useMemo(() => {
    return spaceList.map((item) => ({
      id: item.id,
      name: item.creatorName ? `${item.name} (${item.creatorName})` : item.name,
    }));
  }, [spaceList]);

  const selectedUserList = useMemo(() => {
    return selectedUsers.map((v) => ({ id: v.targetId, name: v.targetName }));
  }, [selectedUsers]);

  const selectedSpaceList = useMemo(() => {
    return selectedSpaces.map((v) => ({ id: v.targetId, name: v.targetName }));
  }, [selectedSpaces]);

  return (
    <div className={cx(styles['bind-items-wrapper'])}>
      <Tabs
        activeKey={activeTab}
        onChange={(key: any) => setActiveTab(key)}
        items={[
          {
            key: SandboxBindTypeEnum.User,
            label: t('PC.Pages.SystemConfigSandboxModal.tabUser'),
            children: (
              <ResourcePicker
                scrollId="sandbox-user-scroll"
                searchKw={userSearchKw}
                onSearchKwChange={setUserSearchKw}
                onSearch={(v) => fetchUsers(1, v)}
                loading={userLoading}
                list={mappedUserList}
                hasMore={userHasMore}
                onLoadMore={() => fetchUsers(userPage + 1)}
                selectedIds={selectedUsers.map((u) => u.targetId)}
                selectedList={selectedUserList}
                onToggle={(id) =>
                  handleToggle(
                    id,
                    SandboxBindTypeEnum.User,
                    userList.find((u) => u.id === id),
                  )
                }
                onRemove={(id) =>
                  handleToggle(id, SandboxBindTypeEnum.User, null)
                }
                renderItem={(item) => item}
                searchPlaceholder={t(
                  'PC.Pages.SystemConfigSandboxModal.searchPlaceholder',
                )}
                emptyText={t(
                  'PC.Pages.SystemConfigSandboxModal.noSelectedItems',
                )}
                className={cx(styles['picker-container'])}
              />
            ),
          },
          {
            key: SandboxBindTypeEnum.Space,
            label: t('PC.Pages.SystemConfigSandboxModal.tabSpace'),
            children: (
              <ResourcePicker
                scrollId="sandbox-space-scroll"
                searchKw={spaceSearchKw}
                onSearchKwChange={setSpaceSearchKw}
                onSearch={(v) => fetchSpaces(1, v)}
                loading={spaceLoading}
                list={mappedSpaceList}
                hasMore={spaceHasMore}
                onLoadMore={() => fetchSpaces(spacePage + 1)}
                selectedIds={selectedSpaces.map((s) => s.targetId)}
                selectedList={selectedSpaceList}
                onToggle={(id) =>
                  handleToggle(
                    id,
                    SandboxBindTypeEnum.Space,
                    spaceList.find((s) => s.id === id),
                  )
                }
                onRemove={(id) =>
                  handleToggle(id, SandboxBindTypeEnum.Space, null)
                }
                renderItem={(item) => item}
                searchPlaceholder={t(
                  'PC.Pages.SystemConfigSandboxModal.searchPlaceholder',
                )}
                emptyText={t(
                  'PC.Pages.SystemConfigSandboxModal.noSelectedItems',
                )}
                className={cx(styles['picker-container'])}
              />
            ),
          },
        ]}
      />
    </div>
  );
};

export default BindItemsPicker;
