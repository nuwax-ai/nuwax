import {
  apiDeleteSpaceUser,
  apiGetSpaceUserList,
} from '@/services/teamSetting';
import systemManageStyles from '@/styles/systemManage.less';
import styles from '@/styles/teamSetting.less';
import { TeamStatusEnum } from '@/types/enums/teamSetting';
import type { SpaceUserInfo } from '@/types/interfaces/teamSetting';
import { CheckOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, message, Modal, Select, Table } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import AddMember from './AddMember';

const cx = classNames.bind(styles);

const selectOptions = [
  { value: '', label: '全部' },
  { value: TeamStatusEnum.Owner, label: '创建人' },
  { value: TeamStatusEnum.Admin, label: '管理员' },
  { value: TeamStatusEnum.User, label: '成员' },
];

interface MemberManageTabProps {
  spaceId: number;
  role: TeamStatusEnum | undefined;
}

const MemberManageTab: React.FC<MemberManageTabProps> = ({ spaceId, role }) => {
  const [selectedValue, setSelectedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [removeLoadingMap, setRemoveLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [openAddMemberModal, setOpenAddMemberModal] = useState<boolean>(false);

  const { data, run, refresh, loading } = useRequest(apiGetSpaceUserList, {
    debounceWait: 300,
    loadingDelay: 300,
  });

  const getParams = (role: string, kw: string) => {
    return {
      role: role || undefined,
      kw,
      spaceId,
    };
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const params = getParams(selectedValue, value);
    run(params);
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    const params = getParams(value, inputValue);
    run(params);
  };

  const { run: runRemoveUser } = useRequest(apiDeleteSpaceUser, {
    manual: true,
    loadingDelay: 300,
    onBefore: (params) => {
      setRemoveLoadingMap((prev) => ({ ...prev, [params[0].userId]: true }));
    },
    onSuccess: () => {
      message.success('删除成功');
      refresh();
    },
    onFinally: (params) => {
      setRemoveLoadingMap((prev) => ({ ...prev, [params[0].userId]: false }));
    },
  });

  const removeUser = async (userId: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除该用户吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: runRemoveUser.bind(null, { userId, spaceId }),
      onCancel: () => {},
    });
  };

  const addUser = () => {
    setOpenAddMemberModal(true);
  };

  const handlerConfirmAddMember = () => {
    setOpenAddMemberModal(false);
    run(getParams(selectedValue, inputValue));
  };

  const columns = [
    {
      title: '昵称',
      dataIndex: 'nickName',
      key: 'nickName',
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: TeamStatusEnum) => {
        switch (role) {
          case TeamStatusEnum.Owner:
            return '创建人';
          case TeamStatusEnum.Admin:
            return '管理员';
          default:
            return '成员';
        }
      },
    },
    {
      title: '加入时间',
      dataIndex: 'created',
      key: 'created',
      width: '180px',
      render: (created: string) => {
        return dayjs(created).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    ...(role !== TeamStatusEnum.User
      ? [
          {
            title: '操作',
            key: 'action',
            align: 'center',
            width: '160px',
            render: (_: null, record: SpaceUserInfo) => (
              <>
                <Button
                  type="link"
                  className={cx(
                    systemManageStyles['table-action-ant-btn-link'],
                  )}
                  loading={removeLoadingMap[record.userId] || false}
                  onClick={() => removeUser(record.userId)}
                >
                  删除
                </Button>
              </>
            ),
          },
        ]
      : []),
  ];

  useEffect(() => {
    run({ spaceId, role: undefined, kw: inputValue });
  }, [spaceId]);

  return (
    <>
      <section className={cx('flex', 'content-between')}>
        <Select
          className={cx(systemManageStyles['select-132'])}
          options={selectOptions}
          defaultValue=""
          onChange={handleSelectChange}
          optionLabelProp="label"
          popupRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
        <div>
          <Input
            className={cx(systemManageStyles['search-input-255'])}
            placeholder="搜索"
            prefix={<SearchOutlined />}
            onPressEnter={(event) => {
              if (event.key === 'Enter') {
                handleInputChange(
                  (event.currentTarget as HTMLInputElement).value,
                );
              }
            }}
          />
          {role !== TeamStatusEnum.User && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className={cx('ml-12')}
              onClick={addUser}
            >
              添加成员
            </Button>
          )}
        </div>
      </section>
      <Table
        rowClassName={cx(systemManageStyles['table-row-divider'])}
        className={cx('mt-22')}
        rowKey="userId"
        loading={loading}
        columns={columns}
        dataSource={data?.data}
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
