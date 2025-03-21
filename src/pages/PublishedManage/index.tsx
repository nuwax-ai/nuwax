import { apiOffShelf, apiPublishList } from '@/services/publishManage';
import styles from '@/styles/systemManage.less';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishListInfo } from '@/types/interfaces/publishManage';
import { transformTDate } from '@/utils/getTime';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Modal, Select, Space, Table, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { history } from 'umi';

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
  const [discardLoadingMap, setDiscardLoadingMap] = useState<
    Record<number, boolean>
  >({});

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

  const { run: runOffShelf } = useRequest(apiOffShelf, {
    manual: true,
    loadingDelay: 300,
    onBefore: (params) => {
      setDiscardLoadingMap((prev) => ({ ...prev, [params[0].id]: true }));
    },
    onSuccess: () => {
      message.success('下架成功');
      refresh();
    },
    onFinally: (params) => {
      setDiscardLoadingMap((prev) => ({ ...prev, [params[0].id]: false }));
    },
  });

  const discard = async (id: number) => {
    Modal.confirm({
      title: '确认下架',
      content: '您确定要下架吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: runOffShelf.bind(null, { id }),
      onCancel: () => {},
    });
  };

  const handleView = (record: PublishListInfo) => {
    if (record.targetType === SquareAgentTypeEnum.Agent) {
      history.push(
        `/space/${record.spaceId}/agent/${record.targetId}?publishId=${record.id}`,
      );
      return;
    }
    if (record.targetType === SquareAgentTypeEnum.Plugin) {
      history.push(
        `/space/${record.spaceId}/plugin/${record.targetId}?publishId=${record.id}`,
      );
      return;
    }
    if (record.targetType === SquareAgentTypeEnum.Workflow) {
      history.push(`/workflow/${record.targetId}?publishId=${record.id}`);
      return;
    }
  };

  const columns = [
    {
      title: '发布名称',
      dataIndex: 'name',
      key: 'name',
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
    },
    {
      title: '发布者',
      dataIndex: 'applyUser.userName',
      key: 'applyUser.userName',
      width: '100px',
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
      render: (_, record: PublishListInfo) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleView(record)}>
            查看
          </Button>
          <Button
            type="link"
            loading={discardLoadingMap[record.id] || false}
            onClick={() => discard(record.id)}
          >
            下架
          </Button>
        </Space>
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
        className={cx('mt-22')}
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
    </div>
  );
};

export default PublishManage;
