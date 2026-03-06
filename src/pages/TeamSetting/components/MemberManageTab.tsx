import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiDeleteSpaceUser,
  apiGetSpaceUserList,
} from '@/services/teamSetting';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type { SpaceUserInfo } from '@/types/interfaces/teamSetting';
import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message } from 'antd'; // Added Tag
import React, { useRef, useState } from 'react';
import AddMember from './AddMember';

interface MemberManageTabProps {
  spaceId: number;
  role: TeamStatusEnum | undefined;
}

const MemberManageTab: React.FC<MemberManageTabProps> = ({ spaceId, role }) => {
  const actionRef = useRef<ActionType>();
  const [openAddMemberModal, setOpenAddMemberModal] = useState<boolean>(false);

  const handlerConfirmAddMember = () => {
    setOpenAddMemberModal(false);
    actionRef.current?.reload();
  };

  const request = async (params: any) => {
    const { current = 1, pageSize = 10, role, kw } = params;
    try {
      const res = await apiGetSpaceUserList({
        spaceId,
        role: role || undefined, // empty string to undefined
        kw,
      });

      if (res.code === SUCCESS_CODE) {
        const allList = res.data || [];
        // Manual pagination
        const start = (current - 1) * pageSize;
        const end = start + pageSize;
        const pageList = allList.slice(start, end);
        return {
          data: pageList,
          total: allList.length,
          success: true,
        };
      }
      return { data: [], total: 0, success: false };
    } catch (e) {
      return { data: [], total: 0, success: false };
    }
  };

  const removeUser = async (userId: number) => {
    const resp = await apiDeleteSpaceUser({ userId, spaceId });
    if (resp.code === SUCCESS_CODE) {
      message.success('删除成功');
      actionRef.current?.reload();
    }
  };

  const columns: ProColumns<SpaceUserInfo>[] = [
    {
      title: '关键字',
      dataIndex: 'kw',
      hideInTable: true,
      fieldProps: {
        placeholder: '搜索',
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      search: false,
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      search: false,
    },
    {
      title: '角色',
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        [TeamStatusEnum.Owner]: { text: '创建人' },
        [TeamStatusEnum.Admin]: { text: '管理员' },
        [TeamStatusEnum.User]: { text: '成员' },
      },
      render: (_: any, record: SpaceUserInfo) => {
        const role = record.role;
        let text = '成员';
        if (role === TeamStatusEnum.Owner) text = '创建人';
        if (role === TeamStatusEnum.Admin) text = '管理员';
        return text;
      },
    },
    {
      title: '加入时间',
      dataIndex: 'created',
      search: false,
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      align: 'center',
      width: 160,
      hideInTable: role === TeamStatusEnum.User, // Hide column if current user is just a member
      render: (_: any, record: SpaceUserInfo) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'delete',
              label: '删除',
              confirm: {
                title: '确认删除',
                description: '你确定要删除该用户吗？',
              },
              onClick: () => removeUser(record.userId),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <XProTable<SpaceUserInfo>
        actionRef={actionRef}
        rowKey="userId"
        columns={columns}
        request={request}
        toolBarRender={() => [
          role !== TeamStatusEnum.User && (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenAddMemberModal(true)}
            >
              添加成员
            </Button>
          ),
        ]}
      />
      <AddMember
        spaceId={spaceId}
        open={openAddMemberModal}
        onCancel={() => setOpenAddMemberModal(false)}
        onConfirmAdd={handlerConfirmAddMember}
      />
    </>
  );
};

export default MemberManageTab;
