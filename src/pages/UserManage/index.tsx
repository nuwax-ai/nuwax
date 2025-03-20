import { CheckOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Select, Table } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const selectOptions = [
  { value: 'all', label: '全部' },
  { value: 'admin', label: '管理员' },
  { value: 'member', label: '成员' },
];

const columns = [
  {
    title: '昵称',
    dataIndex: 'nickname',
    key: 'nickname',
  },
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
  },
];

const getTableData = (params) => {
  const { current, pageSize, selectedValue, inputValue } = params;
  console.log(current, pageSize, { selectedValue, inputValue });
  return Promise.resolve({
    total: 100,
    list: Array.from({ length: 10 }).map((_, index) => ({
      key: index,
      nickname: `昵称${index}`,
      username: '用户名',
    })),
  });
};

const UserManage: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState('all');
  const [inputValue, setInputValue] = useState('');

  const { data, run } = useRequest(getTableData, {
    debounceWait: 300,
    defaultParams: [
      {
        current: 1, // 假设当前页码为 1
        pageSize: 10, // 假设每页显示 10 条数据
        selectedValue,
        inputValue,
      },
    ],
  });

  const handleSelectChange = (value: string) => {
    console.log('Selected value:', value);
    setSelectedValue(value);
    const params = {
      current: 1,
      pageSize: 10,
      selectedValue: value,
      inputValue,
    };
    run(params);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    const params = {
      current: 1,
      pageSize: 10,
      selectedValue,
      inputValue: value,
    };
    run(params);
  };

  return (
    <div className={cx(styles.container)}>
      <h3 className={cx(styles.title)}>用户管理</h3>
      <section className={cx('flex', 'content-between', styles.header)}>
        <Select
          className={cx(styles.select)}
          options={selectOptions}
          defaultValue="all"
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
        rowKey="key"
        columns={columns}
        dataSource={data?.list}
        pagination={{ total: data?.total }}
      />
    </div>
  );
};

export default UserManage;
