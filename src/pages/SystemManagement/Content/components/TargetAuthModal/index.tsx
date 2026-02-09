import { apiGetRoleList } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { apiGetUserGroupList } from '@/pages/SystemManagement/MenuPermission/services/user-group-manage';
import { RoleInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { UserGroupInfo } from '@/pages/SystemManagement/MenuPermission/types/user-group-manage';
import { Button, Checkbox, Empty, message, Modal, Space, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import {
  AccessibleRoleInfo,
  AccessibleUserGroupInfo,
  apiAgentBindRestrictionTargets,
  apiAgentRestrictionTargets,
  apiModelBindRestrictionTargets,
  apiModelRestrictionTargets,
  apiPageAgentBindRestrictionTargets,
  apiPageAgentRestrictionTargets,
} from '../../content-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TargetAuthModalProps {
  /** 是否打开 */
  open: boolean;
  /** 智能体ID、网页应用ID、模型ID */
  targetId: number;
  /** 目标类型 */
  targetType: 'agent' | 'page' | 'model';
  /** 取消回调 */
  onCancel: () => void;
}

type TabKey = 'role' | 'group';

/**
 * 目标对象授权弹窗
 * @param open 是否打开
 * @param targetId 目标对象ID
 * @param targetType 目标类型
 * @param onCancel 取消回调
 * @returns
 */
const TargetAuthModal: React.FC<TargetAuthModalProps> = ({
  open,
  targetId,
  targetType,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('role');
  // 完整的角色列表和用户组列表
  const [roleList, setRoleList] = useState<RoleInfo[]>([]);
  const [groupList, setGroupList] = useState<UserGroupInfo[]>([]);
  // 已授权的角色和用户组ID列表（用于回显）
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 查询可访问的角色和用户组列表接口
  const apiQueryRestrictionTargets =
    targetType === 'agent'
      ? apiAgentRestrictionTargets
      : targetType === 'page'
      ? apiPageAgentRestrictionTargets
      : apiModelRestrictionTargets;

  // 绑定限制访问对象接口
  const apiBindRestrictionTargets =
    targetType === 'agent'
      ? apiAgentBindRestrictionTargets
      : targetType === 'page'
      ? apiPageAgentBindRestrictionTargets
      : apiModelBindRestrictionTargets;

  // 查询完整的角色列表
  const { run: runGetRoleList } = useRequest(apiGetRoleList, {
    manual: true,
    onSuccess: (data: RoleInfo[]) => {
      setRoleList(data || []);
    },
  });

  // 查询完整的用户组列表
  const { run: runGetGroupList } = useRequest(apiGetUserGroupList, {
    manual: true,
    onSuccess: (data: UserGroupInfo[]) => {
      setGroupList(data || []);
    },
  });

  // 查询已授权的角色和用户组列表（用于回显选中状态）
  const { run: runGetRestrictionTargets } = useRequest(
    apiQueryRestrictionTargets,
    {
      manual: true,
      onSuccess: (data: {
        roles: AccessibleRoleInfo[];
        groups: AccessibleUserGroupInfo[];
      }) => {
        const roles = data?.roles || [];
        const groups = data?.groups || [];
        // 将返回的角色和用户组ID设置为已选中状态（接口返回的就是已授权的列表）
        setSelectedRoleIds(roles.map((role) => role.id));
        setSelectedGroupIds(groups.map((group) => group.id));
      },
    },
  );

  // 绑定限制访问对象
  const { run: runBindRestrictionTargets } = useRequest(
    apiBindRestrictionTargets,
    {
      manual: true,
      onSuccess: () => {
        message.success('授权成功');
        setLoading(false);
        onCancel();
      },
      onError: () => {
        setLoading(false);
      },
    },
  );

  // 打开弹窗时加载数据
  useEffect(() => {
    if (open && targetId) {
      // 查询完整的角色列表和用户组列表
      runGetRoleList();
      runGetGroupList();
      // 查询已授权的角色和用户组列表（用于回显）
      runGetRestrictionTargets(targetId);
    } else {
      setRoleList([]);
      setGroupList([]);
      setSelectedRoleIds([]);
      setSelectedGroupIds([]);
      setActiveTab('role');
    }
  }, [open, targetId]);

  // 提交数据
  const handleSubmit = () => {
    setLoading(true);
    runBindRestrictionTargets({
      subjectId: targetId,
      roleIds: selectedRoleIds,
      groupIds: selectedGroupIds,
    });
  };

  // 处理角色选择变化
  const handleRoleChange = (checkedValues: number[]) => {
    setSelectedRoleIds(checkedValues);
  };

  // 处理用户组选择变化
  const handleGroupChange = (checkedValues: number[]) => {
    setSelectedGroupIds(checkedValues);
  };

  // 获取所有角色ID
  const allRoleIds = roleList?.map((item) => item.id) || [];
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
  const allGroupIds = groupList?.map((item) => item.id) || [];
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

  const tabItems = [
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
              <Space direction="vertical" size={8} className={cx('w-full')}>
                {roleList.map((item: RoleInfo) => (
                  <Checkbox key={item.id} value={item.id}>
                    {item.name}
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          ) : (
            <div className={cx('py-16')}>
              <Empty
                description={
                  <span>
                    暂无数据，请前往{' '}
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => {
                        history.push('/system/menu-permission/role-manage');
                        onCancel();
                      }}
                    >
                      角色管理
                    </Button>{' '}
                    新建角色
                  </span>
                }
              />
            </div>
          )}
        </div>
      ),
    },
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
              <Empty
                description={
                  <span>
                    暂无数据，请前往{' '}
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => {
                        history.push(
                          '/system/menu-permission/user-group-manage',
                        );
                        onCancel();
                      }}
                    >
                      用户组管理
                    </Button>{' '}
                    新建用户组
                  </span>
                }
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  // 根据当前 tab 获取对应的全选状态和操作函数
  const getSelectAllConfig = () => {
    if (activeTab === 'role') {
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

  return (
    <Modal
      title="授权"
      open={open}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={500}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <div className={cx(styles.tabsContainer)}>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={(key) => setActiveTab(key as TabKey)}
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
    </Modal>
  );
};

export default TargetAuthModal;
