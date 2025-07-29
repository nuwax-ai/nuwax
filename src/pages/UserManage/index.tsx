import {
  apiDisableSystemUser,
  apiEnableSystemUser,
  apiSystemUserList,
} from '@/services/systemManage';
import styles from '@/styles/systemManage.less';
import { UserRoleEnum, UserStatusEnum } from '@/types/enums/systemManage';
import type { SystemUserListInfo } from '@/types/interfaces/systemManage';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Select, Table, message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import CreateModifyUser from './components/createModifyUser';
import MessageSendModal from './MessageSendModal';

const cx = classNames.bind(styles);

const selectOptions = [
  { value: '', label: '全部' },
  { value: UserRoleEnum.Admin, label: '管理员' },
  { value: UserRoleEnum.User, label: '成员' },
];

const UserManage: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [enableLoadingMap, setEnableLoadingMap] = useState<
    Record<number, boolean>
  >({});
  const [disableLoadingMap, setDisableLoadingMap] = useState<
    Record<number, boolean>
  >({});
  // 消息发送弹窗是否打开
  const [messageSendOpen, setMessageSendOpen] = useState<boolean>(false);

  const { data, run, refresh, loading } = useRequest(apiSystemUserList, {
    debounceWait: 300,
    defaultParams: [
      {
        pageNo: currentPage,
        pageSize: 10,
        queryFilter: {
          role: selectedValue || undefined,
          userName: inputValue,
        },
      },
    ],
  });

  const { run: runEnable } = useRequest(apiEnableSystemUser, {
    manual: true,
    loadingDelay: 300,
    onBefore: (params) => {
      setEnableLoadingMap((prev) => ({ ...prev, [params[0].id]: true }));
    },
    onSuccess: () => {
      message.success('启用成功');
      refresh();
    },
    onFinally: (params) => {
      setEnableLoadingMap((prev) => ({ ...prev, [params[0].id]: false }));
    },
  });

  const { run: runDisable } = useRequest(apiDisableSystemUser, {
    manual: true,
    loadingDelay: 300,
    onBefore: (params) => {
      setDisableLoadingMap((prev) => ({ ...prev, [params[0].id]: true }));
    },
    onSuccess: () => {
      message.success('禁用成功');
      refresh();
    },
    onFinally: (params) => {
      setDisableLoadingMap((prev) => ({ ...prev, [params[0].id]: false }));
    },
  });

  const getParams = (
    page: number,
    role: UserRoleEnum | undefined,
    keyword: string,
  ) => {
    return {
      pageNo: page,
      pageSize: 10,
      queryFilter: {
        role: role || undefined,
        userName: keyword,
      },
    };
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    setCurrentPage(1);
    const params = getParams(1, value as UserRoleEnum, inputValue);
    run(params);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setCurrentPage(1);
    const params = getParams(1, selectedValue as UserRoleEnum, value);
    run(params);
  };

  const handleTableChange = (page: number) => {
    setCurrentPage(page); // 更新当前页码
    const params = getParams(page, selectedValue as UserRoleEnum, inputValue);
    run(params);
  };

  const handleSuccess = (isEdit: boolean) => {
    if (isEdit) {
      refresh();
      return;
    }
    setSelectedValue('');
    setInputValue('');
    setCurrentPage(1);
    const params = getParams(1, selectedValue as UserRoleEnum, inputValue);
    run(params);
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'userName',
      key: 'userName',
      width: 160,
      render: (text: string) => {
        return text ? text : '--';
      },
    },
    {
      title: '昵称',
      dataIndex: 'nickName',
      key: 'nickName',
      width: 100,
    },
    {
      title: '手机号码',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (text: string) => {
        return text ? text : '--';
      },
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: UserRoleEnum) => {
        switch (role) {
          case UserRoleEnum.Admin:
            return '管理员';
          case UserRoleEnum.User:
            return '成员';
          default:
            return '--';
        }
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: UserStatusEnum) => {
        let statusText = '';
        let dotStyle = '';
        switch (status) {
          case UserStatusEnum.Disabled:
            statusText = '禁用';
            dotStyle = styles['dot-red'];
            break;
          case UserStatusEnum.Enabled:
            statusText = '正常';
            dotStyle = styles['dot-green'];
            break;
        }
        return (
          <span>
            <span className={cx(styles['dot-circle'], dotStyle)}></span>
            {statusText}
          </span>
        );
      },
    },
    {
      title: '加入时间',
      dataIndex: 'created',
      key: 'created',
      width: 180,
      render: (created: string) => {
        return dayjs(created).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_: null, record: SystemUserListInfo) => (
        <>
          {record.status === UserStatusEnum.Enabled ? (
            <Button
              type="link"
              className={cx(styles['table-action-ant-btn-link'])}
              loading={disableLoadingMap[record.id] || false}
              onClick={() => runDisable({ id: record.id })}
            >
              禁用
            </Button>
          ) : (
            <Button
              type="link"
              className={cx(styles['table-action-ant-btn-link'])}
              loading={enableLoadingMap[record.id] || false}
              onClick={() => runEnable({ id: record.id })}
            >
              启用
            </Button>
          )}
          <CreateModifyUser
            isEdit={true}
            record={record}
            onSuccess={handleSuccess}
          />
        </>
      ),
    },
  ];

  return (
    <div className={cx(styles['system-manage-container'], 'overflow-y')}>
      <h3 className={cx(styles['system-manage-title'])}>用户管理</h3>
      <section className={cx('flex', 'content-between', 'flex-wrap', 'gap-10')}>
        <Select
          className={cx(styles['select-132'])}
          options={selectOptions}
          defaultValue=""
          onChange={handleSelectChange}
          optionLabelProp="label"
          dropdownRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
        <div className={cx('flex', 'gap-10', 'flex-wrap')}>
          <Input
            className={cx(styles['search-input-225'])}
            placeholder="请输入手机号码邮箱或昵称"
            prefix={<SearchOutlined />}
            onPressEnter={(event) => {
              if (event.key === 'Enter') {
                handleInputChange(
                  (event.currentTarget as HTMLInputElement).value,
                );
              }
            }}
          />
          <CreateModifyUser isEdit={false} onSuccess={handleSuccess} />
          <Button type="primary" onClick={() => setMessageSendOpen(true)}>
            消息发送
          </Button>
        </div>
      </section>

      <Table
        rowClassName={cx(styles['table-row-divider'])}
        className={cx('mt-30')}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.data.records}
        scroll={{ x: 'max-content' }}
        pagination={{
          total: data?.data.total,
          showSizeChanger: true,
          onChange: handleTableChange,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <MessageSendModal
        open={messageSendOpen}
        onCancel={() => setMessageSendOpen(false)}
      />
    </div>
  );
};

export default UserManage;
