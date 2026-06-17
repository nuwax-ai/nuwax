import { apiGetRoleList } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { apiGetUserGroupList } from '@/pages/SystemManagement/MenuPermission/services/user-group-manage';
import { RoleInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { UserGroupInfo } from '@/pages/SystemManagement/MenuPermission/types/user-group-manage';
import { t } from '@/services/i18nRuntime';
import { Button, Checkbox, Empty, message, Modal, Space, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import {
  AccessibleRoleInfo,
  AccessibleUserGroupInfo,
  apiAgentBindRestrictionTargets,
  apiAgentRestrictionTargets,
  apiKnowledgeBindRestrictionTargets,
  apiKnowledgeRestrictionTargets,
  apiModelBindRestrictionTargets,
  apiModelRestrictionTargets,
  apiPageAgentBindRestrictionTargets,
  apiPageAgentRestrictionTargets,
} from '../../content-manage';
import styles from './index.less';

const cx = classNames.bind(styles);

interface TargetAuthModalProps {
  /** Whether modal is open. */
  open: boolean;
  /** Agent/Page/Model ID. */
  targetId: number;
  /** Target display name. */
  targetName?: string;
  /** 目标类型 */
  targetType: 'agent' | 'page' | 'model' | 'knowledge';
  /** 取消回调 */
  onCancel: () => void;
}

type TabKey = 'role' | 'group';

/**
 * Restriction target authorization modal.
 */
const TargetAuthModal: React.FC<TargetAuthModalProps> = ({
  open,
  targetId,
  targetName,
  targetType,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('role');
  // Full role and user-group lists.
  const [roleList, setRoleList] = useState<RoleInfo[]>([]);
  const [groupList, setGroupList] = useState<UserGroupInfo[]>([]);
  // Authorized role/group IDs for selection echo.
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Query accessible roles and groups.
  const apiQueryRestrictionTargets =
    targetType === 'agent'
      ? apiAgentRestrictionTargets
      : targetType === 'page'
      ? apiPageAgentRestrictionTargets
      : targetType === 'knowledge'
      ? apiKnowledgeRestrictionTargets
      : apiModelRestrictionTargets;

  // Bind restriction targets.
  const apiBindRestrictionTargets =
    targetType === 'agent'
      ? apiAgentBindRestrictionTargets
      : targetType === 'page'
      ? apiPageAgentBindRestrictionTargets
      : targetType === 'knowledge'
      ? apiKnowledgeBindRestrictionTargets
      : apiModelBindRestrictionTargets;

  // Query all roles.
  const { run: runGetRoleList } = useRequest(apiGetRoleList, {
    manual: true,
    onSuccess: (data: RoleInfo[]) => {
      setRoleList(data || []);
    },
  });

  // Query all user groups.
  const { run: runGetGroupList } = useRequest(apiGetUserGroupList, {
    manual: true,
    onSuccess: (data: UserGroupInfo[]) => {
      setGroupList(data || []);
    },
  });

  // Query currently authorized roles and groups.
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
        // Echo backend-authorized targets as selected.
        setSelectedRoleIds(roles.map((role) => role.id));
        setSelectedGroupIds(groups.map((group) => group.id));
      },
    },
  );

  // Bind restriction targets.
  const { run: runBindRestrictionTargets } = useRequest(
    apiBindRestrictionTargets,
    {
      manual: true,
      onSuccess: () => {
        message.success(t('PC.Toast.SystemTargetAuthModal.authorized'));
        setLoading(false);
        onCancel();
      },
      onError: () => {
        setLoading(false);
      },
    },
  );

  // Load data when modal opens.
  useEffect(() => {
    if (open && targetId) {
      // Load full role/group options.
      runGetRoleList();
      runGetGroupList();
      // Load selected role/group IDs.
      runGetRestrictionTargets(targetId);
    } else {
      setRoleList([]);
      setGroupList([]);
      setSelectedRoleIds([]);
      setSelectedGroupIds([]);
      setActiveTab('role');
    }
  }, [open, targetId]);

  // Submit bindings.
  const handleSubmit = () => {
    setLoading(true);
    runBindRestrictionTargets({
      subjectId: targetId,
      roleIds: selectedRoleIds,
      groupIds: selectedGroupIds,
    });
  };

  // Handle role selection change.
  const handleRoleChange = (checkedValues: number[]) => {
    setSelectedRoleIds(checkedValues);
  };

  // Handle group selection change.
  const handleGroupChange = (checkedValues: number[]) => {
    setSelectedGroupIds(checkedValues);
  };

  // All role IDs.
  const allRoleIds = roleList?.map((item) => item.id) || [];
  // Whether all roles are selected.
  const isAllRoleSelected =
    allRoleIds.length > 0 &&
    allRoleIds.every((id: number) => selectedRoleIds.includes(id));

  // Select all / clear all roles.
  const handleRoleSelectAll = () => {
    if (isAllRoleSelected) {
      setSelectedRoleIds([]);
    } else {
      setSelectedRoleIds(allRoleIds);
    }
  };

  // All user-group IDs.
  const allGroupIds = groupList?.map((item) => item.id) || [];
  // Whether all groups are selected.
  const isAllGroupSelected =
    allGroupIds.length > 0 &&
    allGroupIds.every((id: number) => selectedGroupIds.includes(id));

  // Select all / clear all groups.
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
      label: t('PC.Pages.SystemTargetAuthModal.roleTab'),
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
                    {t('PC.Pages.SystemTargetAuthModal.emptyPrefix')}{' '}
                    <Button
                      type="link"
                      size="small"
                      style={{ padding: 0, height: 'auto' }}
                      onClick={() => {
                        history.push('/system/menu-permission/role-manage');
                        onCancel();
                      }}
                    >
                      {t('PC.Pages.SystemTargetAuthModal.roleManagement')}
                    </Button>{' '}
                    {t('PC.Pages.SystemTargetAuthModal.createRole')}
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
      label: t('PC.Pages.SystemTargetAuthModal.userGroupTab'),
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
                    {t('PC.Pages.SystemTargetAuthModal.emptyPrefix')}{' '}
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
                      {t('PC.Pages.SystemTargetAuthModal.userGroupManagement')}
                    </Button>{' '}
                    {t('PC.Pages.SystemTargetAuthModal.createUserGroup')}
                  </span>
                }
              />
            </div>
          )}
        </div>
      ),
    },
  ];

  // Build select-all state for current tab.
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
      title={
        targetName
          ? t('PC.Pages.SystemTargetAuthModal.authorizeWithName', targetName)
          : t('PC.Pages.SystemTargetAuthModal.authorize')
      }
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
            {selectAllConfig.isAllSelected
              ? t('PC.Pages.SystemTargetAuthModal.clearAll')
              : t('PC.Pages.SystemTargetAuthModal.selectAll')}
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default TargetAuthModal;
