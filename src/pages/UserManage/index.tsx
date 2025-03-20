import { apiSystemUserList } from '@/services/systemManage';
import { CheckOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Select, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const selectOptions = [
  { value: '', label: '全部' },
  { value: 'Admin', label: '管理员' },
  { value: 'User', label: '成员' },
];

const UserManage: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, run } = useRequest(apiSystemUserList, {
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

  const disableUser = (id: number) => {
    console.log('disableUser', id);
    // 调用禁用用户接口
  };

  const enableUser = (id: number) => {
    console.log('enableUser', id);
    // 调用启用用户接口
  };

  const modifyUser = (id: number) => {
    console.log('modifyUser', id);
    // 调用修改用户信息接口
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    const params = {
      pageNo: 1,
      pageSize: 10,
      queryFilter: {
        role: value || undefined,
        userName: inputValue,
      },
    };
    run(params);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const params = {
      pageNo: 1,
      pageSize: 10,
      queryFilter: {
        role: selectedValue || undefined,
        userName: value,
      },
    };
    run(params);
  };

  const handleTableChange = (page: number) => {
    setCurrentPage(page); // 更新当前页码
    const params = {
      pageNo: page,
      pageSize: 10,
      queryFilter: {
        role: selectedValue || undefined,
        userName: inputValue,
      },
    };
    run(params);
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
      title: '手机号码',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: '加入时间',
      dataIndex: 'created',
      key: 'created',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'right',
      render: (_, record: any) => (
        <Space size="middle">
          <span
            className={cx('hover-box')}
            onClick={() => disableUser(record.id)}
          >
            禁用
          </span>
          <span
            className={cx('hover-box')}
            onClick={() => enableUser(record.id)}
          >
            启用
          </span>
          <span
            className={cx('hover-box')}
            onClick={() => modifyUser(record.id)}
          >
            修改
          </span>
        </Space>
      ),
    },
  ];

  return (
    <div className={cx(styles.container)}>
      <h3 className={cx(styles.title)}>用户管理</h3>
      <section className={cx('flex', 'content-between', styles.header)}>
        <Select
          className={cx(styles.select)}
          options={selectOptions}
          defaultValue=""
          onChange={handleSelectChange}
          optionLabelProp="label"
          dropdownRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
        <div className={cx('flex')}>
          <Input
            className={cx(styles['search-input'])}
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            className={cx(styles.btn)}
          >
            添加用户
          </Button>
        </div>
      </section>

      <Table
        className={cx(styles.table)}
        rowKey="id"
        columns={columns}
        dataSource={data?.data.records}
        pagination={{ total: data?.data.total, onChange: handleTableChange }}
      />
    </div>
  );
};

export default UserManage;
