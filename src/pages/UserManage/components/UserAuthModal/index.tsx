import CustomFormModal from '@/components/CustomFormModal';
import { apiGetRoleList } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { apiGetUserGroupList } from '@/pages/SystemManagement/MenuPermission/services/user-group-manage';
import { RoleInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { UserGroupInfo } from '@/pages/SystemManagement/MenuPermission/types/user-group-manage';
import { UserRoleEnum } from '@/types/enums/systemManage';
import { Button, Checkbox, Empty, Form, Space, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import {
  apiSystemUserBindGroup,
  apiSystemUserBindRole,
  apiSystemUserListGroup,
  apiSystemUserListRole,
} from '../../user-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface UserAuthModalProps {
  open: boolean;
  targetId: number;
  /** 用户名称 */
  userName?: string;
  /** 用户角色，用于判断是否显示角色 tab */
  role?: UserRoleEnum;
  onCancel: () => void;
}

type TabKey = 'role' | 'group';

/**
 * 用户授权弹窗（包含角色和用户组）
 * @param open 是否打开
 * @param targetId 目标用户ID
 * @param onCancel 取消回调
 * @returns
 */
const UserAuthModal: React.FC<UserAuthModalProps> = ({
  open,
  targetId,
  userName,
  role,
  onCancel,
}) => {
  const { hasPermission } = useModel('menuModel');
  // 如果是普通用户，默认显示用户组 tab；否则显示角色 tab
  const [activeTab, setActiveTab] = useState<TabKey>('role');
  // 创建一个空的 Form 实例，用于 CustomFormModal（不使用表单功能）
  const [dummyForm] = Form.useForm();

  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [groupLoading, setGroupLoading] = useState<boolean>(false);

  // 完整的角色列表和用户组列表
  const [roleList, setRoleList] = useState<RoleInfo[]>([]);
  const [groupList, setGroupList] = useState<UserGroupInfo[]>([]);

  // 已选中的角色ID列表和用户组ID列表（用于控制 Checkbox.Group）
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  // 查询用户绑定的角色列表
  const { run: runBindedRoleList } = useRequest(apiSystemUserListRole, {
    manual: true,
    onSuccess: (data: RoleInfo[]) => {
      if (data?.length > 0) {
        setSelectedRoleIds(data.map((item) => item.id));
      } else {
        setSelectedRoleIds([]);
      }
    },
  });

  // 查询角色列表
  const { run: runGetRoleList } = useRequest(apiGetRoleList, {
    manual: true,
    onSuccess: (data: RoleInfo[]) => {
      setRoleList(data || []);
    },
  });

  // 绑定角色
  const { run: runBindRole } = useRequest(apiSystemUserBindRole, {
    manual: true,
  });

  // 查询用户绑定的组列表
  const { run: runBindedGroupList } = useRequest(apiSystemUserListGroup, {
    manual: true,
    onSuccess: (data: UserGroupInfo[]) => {
      if (data?.length > 0) {
        setSelectedGroupIds(data.map((item) => item.id));
      } else {
        setSelectedGroupIds([]);
      }
    },
  });

  // 查询用户组列表
  const { run: runGetGroupList } = useRequest(apiGetUserGroupList, {
    manual: true,
    onSuccess: (data: UserGroupInfo[]) => {
      setGroupList(data || []);
    },
  });

  // 绑定组
  const { run: runBindGroup } = useRequest(apiSystemUserBindGroup, {
    manual: true,
  });

  useEffect(() => {
    if (open) {
      setActiveTab(role === UserRoleEnum.User ? 'group' : 'role');
      // 如果不是普通用户，才查询角色列表
      if (role !== UserRoleEnum.User) {
        // 查询角色列表
        runGetRoleList();
        // 查询用户绑定的角色列表
        runBindedRoleList(targetId);
      }

      // 查询用户组列表
      runGetGroupList();
      // 查询用户绑定的组列表
      runBindedGroupList(targetId);
    } else {
      setRoleList([]);
      setGroupList([]);
      setSelectedRoleIds([]);
      setSelectedGroupIds([]);
      setActiveTab('role');
      setGroupLoading(false);
      setRoleLoading(false);
    }
  }, [open, targetId, role]);

  // 处理角色选择变化
  const handleRoleChange = (checkedValues: number[]) => {
    setSelectedRoleIds(checkedValues);
  };

  // 处理用户组选择变化
  const handleGroupChange = (checkedValues: number[]) => {
    setSelectedGroupIds(checkedValues);
  };

  // 提交数据
  const handlerSubmit = async () => {
    // 如果不是普通用户，需要同时提交角色和用户组
    if (role !== UserRoleEnum.User) {
      setRoleLoading(true);
      await runBindRole({
        userId: targetId,
        roleIds: selectedRoleIds,
      });
      setRoleLoading(false);
    }

    // 用户组总是需要提交
    setGroupLoading(true);
    await runBindGroup({
      userId: targetId,
      groupIds: selectedGroupIds,
    });
    setGroupLoading(false);
    onCancel();
  };

  // 获取所有角色ID
  const allRoleIds = roleList?.map((item: RoleInfo) => item.id) || [];
  // 判断是否全部选中
  const isAllRoleSelected =
    allRoleIds.length > 0 &&
    allRoleIds.every((id: number) => selectedRoleIds.includes(id));

  // 全选/取消全选角色
  const handleRoleSelectAll = () => {
    if (isAllRoleSelected) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(allRoleIds);
    }
  };

  // 获取所有用户组ID
  const allGroupIds = groupList?.map((item: UserGroupInfo) => item.id) || [];
  // 判断是否全部选中
  const isAllGroupSelected =
    allGroupIds.length > 0 &&
    allGroupIds.every((id: number) => selectedGroupIds.includes(id));

  // 全选/取消全选用户组
  const handleGroupSelectAll = () => {
    if (isAllGroupSelected) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(allGroupIds);
    }
  };

  // 获取当前加载状态
  const loading = roleLoading || groupLoading;

  // 根据当前 tab 获取对应的全选状态和操作函数
  const getSelectAllConfig = () => {
    if (activeTab === 'role' && role !== UserRoleEnum.User) {
      return {
        isAllSelected: isAllRoleSelected,
        hasData: roleList && roleList.length > 0,
        onSelectAll: handleRoleSelectAll,
      };
    } else {
      return {
        isAllSelected: isAllGroupSelected,
        hasData: groupList && groupList.length > 0,
        onSelectAll: handleGroupSelectAll,
      };
    }
  };

  const selectAllConfig = getSelectAllConfig();

  const tabItems = [
    // 如果是普通用户，不显示角色 tab
    ...(role !== UserRoleEnum.User
      ? [
          {
            key: 'role',
            label: '角色',
            children: (
              <div className={cx(styles.tabContent)}>
                {roleList && roleList.length > 0 ? (
                  <Checkbox.Group
                    className={cx(styles.checkboxGroup)}
                    value={selectedRoleIds}
                    onChange={handleRoleChange}
                  >
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: '100%' }}
                    >
                      {roleList.map((item: RoleInfo) => (
                        <Checkbox key={item.id} value={item.id}>
                          {item.name}
                        </Checkbox>
                      ))}
                    </Space>
                  </Checkbox.Group>
                ) : (
                  <div className={cx('py-16')}>
                    <Empty description="暂无数据" />
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'group',
      label: '用户组',
      children: (
        <div className={cx(styles.tabContent)}>
          {groupList && groupList.length > 0 ? (
            <Checkbox.Group
              className={cx(styles.checkboxGroup)}
              value={selectedGroupIds}
              onChange={handleGroupChange}
            >
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {groupList.map((item: UserGroupInfo) => (
                  <Checkbox key={item.id} value={item.id}>
                    {item.name}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          ) : (
            <div className={cx('py-16')}>
              <Empty description="暂无数据" />
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <CustomFormModal
      form={dummyForm}
      title={`授权 - ${userName}`}
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      okDisabled={
        activeTab === 'role'
          ? !hasPermission('user_manage_bind_role')
          : !hasPermission('user_manage_bind_group')
      }
      width={500}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <div className={cx(styles.tabsContainer)}>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={(key) => {
            setActiveTab(key as TabKey);
          }}
          className={cx(styles.tabs)}
        />
        {selectAllConfig.hasData && (
          <Button
            className={cx(styles.selectAllButtonInHeader)}
            type="link"
            size="small"
            onClick={selectAllConfig.onSelectAll}
          >
            {selectAllConfig.isAllSelected ? '取消全选' : '全选'}
          </Button>
        )}
      </div>
    </CustomFormModal>
  );
};

export default UserAuthModal;
