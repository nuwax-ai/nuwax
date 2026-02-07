import CustomFormModal from '@/components/CustomFormModal';
import { apiGetRoleList } from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import { apiGetUserGroupList } from '@/pages/SystemManagement/MenuPermission/services/user-group-manage';
import { RoleInfo } from '@/pages/SystemManagement/MenuPermission/types/role-manage';
import { UserGroupInfo } from '@/pages/SystemManagement/MenuPermission/types/user-group-manage';
import { Button, Checkbox, Form, FormProps, Space, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
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
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('role');
  const [roleForm] = Form.useForm();
  const [groupForm] = Form.useForm();
  // 标记用户组列表是否已加载
  const [groupListLoaded, setGroupListLoaded] = useState<boolean>(false);

  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [groupLoading, setGroupLoading] = useState<boolean>(false);

  // 已绑定的角色ID列表
  const [bindedRoleIds, setBindedRoleIds] = useState<number[]>([]);
  // 已绑定的组ID列表
  const [bindedGroupIds, setBindedGroupIds] = useState<number[]>([]);

  // 查询用户绑定的角色列表
  const { run: runBindedRoleList } = useRequest(apiSystemUserListRole, {
    manual: true,
    onSuccess: (data: RoleInfo[]) => {
      if (data?.length > 0) {
        setBindedRoleIds(data.map((item) => item.id));
      }
    },
  });

  // 查询角色列表
  const { run: runGetRoleList, data: roleList } = useRequest(apiGetRoleList, {
    manual: true,
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
        setBindedGroupIds(data.map((item) => item.id));
      }
    },
  });

  // 根据条件查询组列表
  const { run: runGetGroupList, data: groupList } = useRequest(
    apiGetUserGroupList,
    {
      manual: true,
    },
  );

  // 绑定组
  const { run: runBindGroup } = useRequest(apiSystemUserBindGroup, {
    manual: true,
  });

  useEffect(() => {
    if (open) {
      // 查询角色列表
      runGetRoleList();
      // 查询用户绑定的角色列表
      runBindedRoleList(targetId);
    } else {
      roleForm.resetFields();
      groupForm.resetFields();
      setBindedRoleIds([]);
      setBindedGroupIds([]);
      setActiveTab('role');
      setGroupListLoaded(false);
      setGroupLoading(false);
      setRoleLoading(false);
    }
  }, [open, targetId]);

  useEffect(() => {
    // 回显角色列表
    if (roleList?.length > 0 && bindedRoleIds.length > 0) {
      roleForm.setFieldsValue({
        roleIds: bindedRoleIds,
      });
    }
  }, [roleList, bindedRoleIds]);

  useEffect(() => {
    // 回显组列表
    if (groupList?.length > 0 && bindedGroupIds.length > 0) {
      groupForm.setFieldsValue({
        groupIds: bindedGroupIds,
      });
    }
  }, [groupList, bindedGroupIds]);

  // 绑定角色
  const onRoleFinish: FormProps<any>['onFinish'] = async (values) => {
    const roleIds = values.roleIds || [];
    setRoleLoading(true);
    await runBindRole({
      userId: targetId,
      roleIds,
    });
    setRoleLoading(false);
    onCancel();
  };

  // 绑定组
  const onGroupFinish: FormProps<any>['onFinish'] = async (values) => {
    const groupIds = values.groupIds || [];
    setGroupLoading(true);
    await runBindGroup({
      userId: targetId,
      groupIds,
    });
    setGroupLoading(false);
    onCancel();
  };

  // 提交表单
  const handlerSubmit = () => {
    roleForm.submit();
    groupForm.submit();
  };

  // 获取当前选中的角色ID
  const selectedRoleIds = Form.useWatch('roleIds', roleForm) || [];
  // 获取所有角色ID
  const allRoleIds = roleList?.map((item: RoleInfo) => item.id) || [];
  // 判断是否全部选中
  const isAllRoleSelected =
    allRoleIds.length > 0 &&
    allRoleIds.every((id: number) => selectedRoleIds.includes(id));

  // 全选/取消全选角色
  const handleRoleSelectAll = () => {
    if (isAllRoleSelected) {
      roleForm.setFieldsValue({
        roleIds: [],
      });
    } else {
      roleForm.setFieldsValue({
        roleIds: allRoleIds,
      });
    }
  };

  // 获取当前选中的用户组ID
  const selectedGroupIds = Form.useWatch('groupIds', groupForm) || [];
  // 获取所有用户组ID
  const allGroupIds = groupList?.map((item: UserGroupInfo) => item.id) || [];
  // 判断是否全部选中
  const isAllGroupSelected =
    allGroupIds.length > 0 &&
    allGroupIds.every((id: number) => selectedGroupIds.includes(id));

  // 全选/取消全选用户组
  const handleGroupSelectAll = () => {
    if (isAllGroupSelected) {
      groupForm.setFieldsValue({
        groupIds: [],
      });
    } else {
      groupForm.setFieldsValue({
        groupIds: allGroupIds,
      });
    }
  };

  // 获取当前加载状态
  const loading = roleLoading || groupLoading;

  const tabItems = [
    {
      key: 'role',
      label: '角色',
      children: (
        <div className={cx(styles.tabContent)}>
          <Form
            form={roleForm}
            layout="vertical"
            onFinish={onRoleFinish}
            autoComplete="off"
          >
            <Form.Item
              name="roleIds"
              label={
                <Button
                  type="link"
                  size="small"
                  onClick={handleRoleSelectAll}
                  style={{ padding: 0, height: 'auto' }}
                >
                  {isAllRoleSelected ? '取消全选' : '全选'}
                </Button>
              }
            >
              <Checkbox.Group className={cx(styles.checkboxGroup)}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {roleList?.map((item: RoleInfo) => (
                    <Checkbox key={item.id} value={item.id}>
                      {item.name}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'group',
      label: '用户组',
      children: (
        <div className={cx(styles.tabContent)}>
          <Form
            form={groupForm}
            layout="vertical"
            onFinish={onGroupFinish}
            autoComplete="off"
          >
            <Form.Item
              name="groupIds"
              label={
                <Button
                  type="link"
                  size="small"
                  onClick={handleGroupSelectAll}
                  style={{ padding: 0, height: 'auto' }}
                >
                  {isAllGroupSelected ? '取消全选' : '全选'}
                </Button>
              }
            >
              <Checkbox.Group className={cx(styles.checkboxGroup)}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {groupList?.map((item: UserGroupInfo) => (
                    <Checkbox key={item.id} value={item.id}>
                      {item.name}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          </Form>
        </div>
      ),
    },
  ];

  return (
    <CustomFormModal
      form={activeTab === 'role' ? roleForm : groupForm}
      title="授权"
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      width={500}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => {
          setActiveTab(key as TabKey);
          // 切换到用户组tab时，如果是第一次点击，则加载数据
          if (key === 'group' && !groupListLoaded) {
            // 根据条件查询组列表
            runGetGroupList();
            // 查询用户绑定的组列表
            runBindedGroupList(targetId);
            // 标记为已加载
            setGroupListLoaded(true);
          }
        }}
      />
    </CustomFormModal>
  );
};

export default UserAuthModal;
