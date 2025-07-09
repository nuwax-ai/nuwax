import { apiPublishList } from '@/services/publishManage';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import type { PublishListInfo } from '@/types/interfaces/publishManage';
import { CheckOutlined, SearchOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Button, Input, Pagination, Select, Table, Tooltip } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import OffshelfModal from './components/OffshelfModal';
import styles from './index.less';

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
  const [currentPageSize, setCurrentPageSize] = useState<number>(10);
  const [openOffshelfModal, setOpenOffshelfModal] = useState(false);
  const [offshelfId, setOffshelfId] = useState<number>();
  // 表格高度
  const [tableBoxHeight, setTableBoxHeight] = useState<number>(0);

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

  // 监听窗口大小变化，动态更新表格高度
  useEffect(() => {
    const updateTableHeight = () => {
      const _tableBoxHeight =
        (window.innerHeight ||
          document.documentElement.clientHeight ||
          document.body.clientHeight) - 250;
      setTableBoxHeight(_tableBoxHeight);
    };

    // 初始化时获取一次高度
    updateTableHeight();

    // 监听窗口大小变化
    window.addEventListener('resize', updateTableHeight);

    // 监听浏览器开发者工具打开/关闭（可能影响视口高度）
    const handleOrientationChange = () => {
      // 延迟执行，确保布局完成
      setTimeout(updateTableHeight, 100);
    };
    window.addEventListener('orientationchange', handleOrientationChange);

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', updateTableHeight);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const getParams = (
    page: number,
    targetType: string | undefined,
    kw: string,
    pageSize: number = currentPageSize,
  ) => {
    return {
      pageNo: page,
      pageSize,
      queryFilter: {
        targetType: targetType || undefined,
        kw,
      },
    };
  };

  // 选择类型
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

  const handleTableChange = (page: number, pageSize: number) => {
    setCurrentPage(page);
    setCurrentPageSize(pageSize);
    const params = getParams(page, selectedValue, inputValue, pageSize);
    run(params);
  };

  const discard = (id: number) => {
    setOffshelfId(id);
    setOpenOffshelfModal(true);
  };

  const handleView = (record: PublishListInfo) => {
    let url = '';

    if (record.targetType === SquareAgentTypeEnum.Agent) {
      url = `/space/${record.spaceId}/agent/${record.targetId}?publishId=${record.id}`;
    } else if (record.targetType === SquareAgentTypeEnum.Plugin) {
      if (record.pluginType === 'CODE') {
        url = `/space/${record.spaceId}/plugin/${record.targetId}/cloud-tool?applyId=${record.id}`;
      } else {
        url = `/space/${record.spaceId}/plugin/${record.targetId}?publishId=${record.id}`;
      }
    } else if (record.targetType === SquareAgentTypeEnum.Workflow) {
      url = `/space/${record.spaceId}/workflow/${record.targetId}?publishId=${record.id}`;
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
      dataIndex: 'publishUser',
      key: 'publishUser',
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
      title: '发布时间',
      dataIndex: 'created',
      key: 'created',
      width: 170,
      render: (value: string) => {
        return (
          <div className={cx('flex', 'items-center', 'h-full')}>
            {moment(value).format('YYYY-MM-DD HH:mm:ss')}
          </div>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 120,
      fixed: 'right',
      className: styles['table-column-fixed'],
      render: (_: null, record: PublishListInfo) => (
        <div className={cx('flex', 'items-center', 'h-full', 'content-center')}>
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
        </div>
      ),
    },
  ];

  return (
    <div
      className={cx(
        styles['system-manage-container'],
        'flex',
        'flex-col',
        'h-full',
        'overflow-hide',
      )}
    >
      <h3 className={cx(styles['system-manage-title'])}>已发布管理</h3>
      <section
        className={cx('flex', 'content-between', styles['search-section'])}
      >
        <Select
          className={cx(styles['select-132'])}
          options={selectOptions}
          defaultValue={''}
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
      <div className={cx('flex-1')}>
        <Table
          rowClassName={cx(styles['table-row-divider'], 'h-full')}
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data?.data.records}
          scroll={{ x: 'max-content', y: tableBoxHeight }}
          virtual
          pagination={false}
        />
      </div>
      <footer
        className={cx('flex', 'content-end', 'items-center', styles.footer)}
      >
        <Pagination
          current={currentPage}
          pageSize={currentPageSize}
          showSizeChanger
          total={data?.data.total}
          showTotal={(total) => `共 ${total} 条`}
          onChange={handleTableChange}
        />
      </footer>
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
