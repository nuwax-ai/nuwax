import { apiPublishList } from '@/services/publishManage';
import styles from '@/styles/systemManage.less';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishListInfo } from '@/types/interfaces/publishManage';
import { transformTDate } from '@/utils/getTime';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Select, Table } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history } from 'umi';
import OffshelfModal from './components/OffshelfModal';

const cx = classNames.bind(styles);

const selectOptions = [
  { value: '', label: '全部' },
  { value: SquareAgentTypeEnum.Agent, label: '智能体' },
  { value: SquareAgentTypeEnum.Plugin, label: '插件' },
  { value: SquareAgentTypeEnum.Workflow, label: '工作流' },
];

const PublishManage: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openOffshelfModal, setOpenOffshelfModal] = useState(false);
  const [offshelfId, setOffshelfId] = useState<number>();

  const { data, run, refresh, loading } = useRequest(apiPublishList, {
    debounceWait: 300,
    defaultParams: [
      {
        pageNo: currentPage,
        pageSize: 10,
        queryFilter: {
          targetType: selectedValue || undefined,
          kw: inputValue,
        },
      },
    ],
  });

  const getParams = (
    page: number,
    targetType: string | undefined,
    kw: string,
  ) => {
    return {
      pageNo: page,
      pageSize: 10,
      queryFilter: {
        targetType: targetType || undefined,
        kw,
      },
    };
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    setCurrentPage(1);
    const params = getParams(1, value, inputValue);
    run(params);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setCurrentPage(1);
    const params = getParams(1, selectedValue, value);
    run(params);
  };

  const handleTableChange = (page: number) => {
    setCurrentPage(page);
    const params = getParams(page, selectedValue, inputValue);
    run(params);
  };

  const discard = (id: number) => {
    setOffshelfId(id);
    setOpenOffshelfModal(true);
  };

  const handleView = (record: PublishListInfo) => {
    if (record.targetType === SquareAgentTypeEnum.Agent) {
      history.push(
        `/space/${record.spaceId}/agent/${record.targetId}?publishId=${record.id}`,
      );
      return;
    }
    if (record.targetType === SquareAgentTypeEnum.Plugin) {
      if (record.pluginType === 'CODE') {
        history.push(
          `/space/${record.spaceId}/plugin/${record.targetId}/cloud-tool?applyId=${record.id}`,
        );
        return;
      }
      history.push(
        `/space/${record.spaceId}/plugin/${record.targetId}?publishId=${record.id}`,
      );
      return;
    }
    if (record.targetType === SquareAgentTypeEnum.Workflow) {
      history.push(
        `/space/${record.spaceId}/workflow/${record.targetId}?publishId=${record.id}`,
      );
      return;
    }
  };

  const columns = [
    {
      title: '发布名称',
      dataIndex: 'name',
      key: 'name',
      minWidth: '200px',
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: '100px',
      render: (targetType: SquareAgentTypeEnum) => {
        switch (targetType) {
          case SquareAgentTypeEnum.Agent:
            return '智能体';
          case SquareAgentTypeEnum.Plugin:
            return '插件';
          case SquareAgentTypeEnum.Workflow:
            return '工作流';
        }
      },
    },
    {
      title: '描述信息',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '版本信息',
      dataIndex: 'remark',
      key: 'remark',
      width: '150px',
    },
    {
      title: '发布者',
      dataIndex: 'publishUser',
      key: 'publishUser',
      width: '200px',
      render: (publishUser: any) => {
        return publishUser ? publishUser.userName ?? '--' : '--';
      },
    },
    {
      title: '发布时间',
      dataIndex: 'created',
      key: 'created',
      width: '180px',
      render: (created: string) => {
        return transformTDate(created);
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: '160px',
      render: (_, record: PublishListInfo) => (
        <>
          <Button
            type="link"
            className={cx(styles['table-action-ant-btn-link'])}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            className={cx(styles['table-action-ant-btn-link'])}
            onClick={() => discard(record.id)}
          >
            下架
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className={cx(styles['system-manage-container'])}>
      <h3 className={cx(styles['system-manage-title'])}>已发布管理</h3>
      <section className={cx('flex', 'content-between')}>
        <Select
          className={cx(styles['select-132'])}
          options={selectOptions}
          defaultValue=""
          onChange={handleSelectChange}
          optionLabelProp="label"
          dropdownRender={(menu) => <>{menu}</>}
          menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
        />
        <Input
          className={cx(styles['search-input-255'])}
          placeholder="请输入插件工作流或智能体名称"
          prefix={<SearchOutlined />}
          onPressEnter={(event) => {
            if (event.key === 'Enter') {
              handleInputChange(
                (event.currentTarget as HTMLInputElement).value,
              );
            }
          }}
        />
      </section>

      <Table
        rowClassName={cx(styles['table-row-divider'])}
        className={cx('mt-30')}
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data?.data.records}
        pagination={{
          total: data?.data.total,
          onChange: handleTableChange,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <OffshelfModal
        open={openOffshelfModal}
        id={offshelfId}
        onCancel={() => setOpenOffshelfModal(false)}
        onConfirm={() => {
          setOpenOffshelfModal(false);
          refresh();
        }}
      />
    </div>
  );
};

export default PublishManage;
