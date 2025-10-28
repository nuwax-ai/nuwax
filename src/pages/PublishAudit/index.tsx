import { apiPassAudit, apiPublishApplyList } from '@/services/publishManage';
import styles from '@/styles/systemManage.less';
import { PublishStatusEnum } from '@/types/enums/common';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishApplyListInfo } from '@/types/interfaces/publishManage';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Select, Table, Tooltip, message } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import RejectAuditModal from './components/RejectAuditModal';
const cx = classNames.bind(styles);

const selectOptions = [
  { value: '', label: '全部' },
  { value: SquareAgentTypeEnum.Agent, label: '智能体' },
  { value: SquareAgentTypeEnum.Plugin, label: '插件' },
  { value: SquareAgentTypeEnum.Workflow, label: '工作流' },
];

const selectPublishOptions = [
  { value: '', label: '全部' },
  { value: PublishStatusEnum.Applying, label: '待审核' },
  { value: PublishStatusEnum.Published, label: '通过' },
  { value: PublishStatusEnum.Rejected, label: '拒绝' },
];

const PublishAudit: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState('');
  const [selectedPublishStatusValue, setSelectedPublishStatusValue] = useState(
    PublishStatusEnum.Applying,
  );
  const [inputValue, setInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [passLoadingMap, setPassLoadingMap] = useState<Record<number, boolean>>(
    {},
  );

  const { data, run, refresh, loading } = useRequest(apiPublishApplyList, {
    debounceWait: 300,
    defaultParams: [
      {
        pageNo: currentPage,
        pageSize: 10,
        queryFilter: {
          targetType: selectedValue || undefined,
          publishStatus: selectedPublishStatusValue || undefined,
          kw: inputValue,
        },
      },
    ],
  });

  const getParams = (
    page: number,
    targetType: string | undefined,
    publishStatus: string | undefined,
    kw: string,
  ) => {
    return {
      pageNo: page,
      pageSize: 10,
      queryFilter: {
        targetType: targetType || undefined,
        publishStatus: publishStatus || undefined,
        kw,
      },
    };
  };

  const handleSelectChange = (value: string) => {
    setSelectedValue(value);
    setCurrentPage(1);
    const params = getParams(1, value, selectedPublishStatusValue, inputValue);
    run(params);
  };

  const handlePublishStatusSelectChange = (value: string) => {
    setSelectedPublishStatusValue(value as PublishStatusEnum);
    setCurrentPage(1);
    const params = getParams(1, selectedValue, value, inputValue);
    run(params);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setCurrentPage(1);
    const params = getParams(
      1,
      selectedValue,
      selectedPublishStatusValue,
      value,
    );
    run(params);
  };

  const handleTableChange = (page: number) => {
    setCurrentPage(page);
    const params = getParams(
      page,
      selectedValue,
      selectedPublishStatusValue,
      inputValue,
    );
    run(params);
  };

  const { run: runPassAudit } = useRequest(apiPassAudit, {
    manual: true,
    loadingDelay: 300,
    onBefore: (params) => {
      setPassLoadingMap((prev) => ({ ...prev, [params[0].id]: true }));
    },
    onSuccess: () => {
      message.success('通过审核成功');
      refresh();
    },
    onFinally: (params) => {
      setPassLoadingMap((prev) => ({ ...prev, [params[0].id]: false }));
    },
  });

  const [openRejectAuditModal, setOpenRejectAuditModal] = useState(false);
  const [rejectAuditId, setRejectAuditId] = useState<number>();

  const handleRejectAudit = (id: number) => {
    setRejectAuditId(id);
    setOpenRejectAuditModal(true);
  };
  const handleView = (record: PublishApplyListInfo) => {
    let url = '';

    if (record.targetType === SquareAgentTypeEnum.Agent) {
      url = `/space/${record.spaceId}/agent/${record.targetId}?applyId=${record.id}`;
    }
    if (record.targetType === SquareAgentTypeEnum.Plugin) {
      if (record.pluginType === 'CODE') {
        url = `/space/${record.spaceId}/plugin/${record.targetId}/cloud-tool?applyId=${record.id}`;
      } else {
        url = `/space/${record.spaceId}/plugin/${record.targetId}?applyId=${record.id}`;
      }
    }
    if (record.targetType === SquareAgentTypeEnum.Workflow) {
      url = `/space/${record.spaceId}/workflow/${record.targetId}?applyId=${record.id}`;
    }
    if (url) {
      // 在新窗口中打开页面
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // 获取类型名称
  const getTargetTypeName = (targetType: SquareAgentTypeEnum) => {
    switch (targetType) {
      case SquareAgentTypeEnum.Agent:
        return '智能体';
      case SquareAgentTypeEnum.Plugin:
        return '插件';
      case SquareAgentTypeEnum.Workflow:
        return '工作流';
    }
  };

  const columns = [
    {
      title: '发布名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      className: styles['table-column-fixed'],
      render: (value: string) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            <span className={cx('text-ellipsis-2')}>{value}</span>
          </div>
        );
      },
    },
    {
      title: '类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (value: SquareAgentTypeEnum) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            {getTargetTypeName(value)}
          </div>
        );
      },
    },
    {
      title: '描述信息',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (value: string) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            <Tooltip title={value} placement="topLeft">
              <div className={cx('text-ellipsis-2')}>{value}</div>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: '版本信息',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      render: (value: string) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            <Tooltip title={value} placement="topLeft">
              <div className={cx('text-ellipsis-2')}>{value}</div>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: '发布者',
      dataIndex: 'applyUser',
      key: 'applyUser',
      width: 200,
      render: (value: any) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            {value?.userName ?? '--'}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'publishStatus',
      key: 'publishStatus',
      width: 100,
      render: (publishStatus: PublishStatusEnum) => {
        let statusText = '';
        let dotStyle = '';
        switch (publishStatus) {
          case PublishStatusEnum.Published:
            statusText = '通过';
            dotStyle = styles['dot-green'];
            break;
          case PublishStatusEnum.Rejected:
            statusText = '拒绝';
            dotStyle = styles['dot-red'];
            break;
          case PublishStatusEnum.Applying:
            statusText = '待审核';
            dotStyle = styles['dot-blue'];
            break;
        }
        return (
          <span>
            <span className={cx(styles.dot, dotStyle)}></span>
            {statusText}
          </span>
        );
      },
    },
    {
      title: '发布时间',
      dataIndex: 'created',
      key: 'created',
      width: 180,
      render: (value: string) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            {dayjs(value).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      align: 'center',
      fixed: 'right',
      className: styles['table-column-fixed'],
      render: (_: null, record: PublishApplyListInfo) => (
        <>
          {record.publishStatus === PublishStatusEnum.Applying ? (
            <>
              <Button
                type="link"
                className={cx(styles['table-action-ant-btn-link'])}
                loading={passLoadingMap[record.id] || false}
                onClick={() => runPassAudit({ id: record.id })}
              >
                通过
              </Button>
              <Button
                type="link"
                className={cx(styles['table-action-ant-btn-link'])}
                onClick={() => handleRejectAudit(record.id)}
              >
                拒绝
              </Button>
            </>
          ) : null}
          <Button type="link" onClick={() => handleView(record)}>
            查看
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className={cx(styles['system-manage-container'], 'scroll-container')}>
      <h3 className={cx(styles['system-manage-title'])}>发布审核</h3>
      <section className={cx('flex', 'content-between')}>
        <div className={cx('flex')}>
          <Select
            className={cx(styles['select-132'], 'mr-16')}
            options={selectOptions}
            defaultValue=""
            onChange={handleSelectChange}
            optionLabelProp="label"
            popupRender={(menu) => <>{menu}</>}
            menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
          />
          <Select
            className={cx(styles['select-132'])}
            options={selectPublishOptions}
            onChange={handlePublishStatusSelectChange}
            optionLabelProp="label"
            popupRender={(menu) => <>{menu}</>}
            defaultValue={PublishStatusEnum.Applying}
            menuItemSelectedIcon={<CheckOutlined style={{ marginRight: 8 }} />}
          />
        </div>
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
        scroll={{ x: 'max-content' }}
        virtual
        pagination={{
          total: data?.data.total,
          onChange: handleTableChange,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <RejectAuditModal
        open={openRejectAuditModal}
        id={rejectAuditId}
        onCancel={() => setOpenRejectAuditModal(false)}
        onConfirm={() => {
          setOpenRejectAuditModal(false);
          refresh();
        }}
      />
    </div>
  );
};

export default PublishAudit;
