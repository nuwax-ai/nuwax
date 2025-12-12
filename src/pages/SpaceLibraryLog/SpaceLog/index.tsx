import { apiAgentLogDetail, apiAgentLogList } from '@/services/agentDev';
import { logInfo, LogQueryFilter } from '@/types/interfaces/agent';
import { Page } from '@/types/interfaces/request';
import { AgentLogFormProps } from '@/types/interfaces/space';
import {
  Button,
  Col,
  DatePicker,
  Form,
  FormProps,
  Input,
  Row,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';
import LogDetails from './LogDetails';

const cx = classNames.bind(styles);

const { RangePicker } = DatePicker;

// 日志
const SpaceLog: React.FC = () => {
  const params = useParams();
  const agentId = Number(params.agentId);
  const [form] = Form.useForm();
  const [dataSource, setDataSource] = useState<logInfo[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [currentLog, setCurrentLog] = useState<logInfo | null>(null);
  const [loadingLogList, setLoadingLogList] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  // 当前分页的数据
  const [pagination, setPagination] = useState({
    total: 0,
    pageSize: 10,
    current: 1,
  });

  // 日志查询
  const { run: runLogList } = useRequest(apiAgentLogList, {
    manual: true,
    debounceWait: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    onSuccess: (result: Page<logInfo>) => {
      const { total, current, size, records } = result;
      setPagination({
        total: total,
        current: current,
        pageSize: size,
      });
      const list = records?.map((item) => ({
        ...item,
        key: uuidv4(),
      }));
      setDataSource(list);
      setLoadingLogList(false);
    },
  });

  // 日志详情
  const { run: runLogDetail } = useRequest(apiAgentLogDetail, {
    manual: true,
    debounceWait: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    onSuccess: (result: logInfo) => {
      setCurrentLog(result);
      setLoading(false);
    },
  });

  // 查询日志
  const handleQuery = (
    queryFilter: LogQueryFilter,
    current: number = 1,
    pageSize: number = pagination.pageSize,
  ) => {
    setLoadingLogList(true);
    runLogList({
      queryFilter,
      current,
      pageSize,
    });
  };

  useEffect(() => {
    // 查询日志
    handleQuery({
      agentId,
    });
  }, [agentId]);

  const handleDataSearch = (
    values: AgentLogFormProps,
    current: number = 1,
    pageSize: number = pagination.pageSize,
  ) => {
    const { timeRange, userInputString, outputString, ...info } = values;
    let startTime, endTime;
    if (timeRange?.length) {
      startTime = timeRange[0];
      endTime = timeRange[1];
    }

    // 处理用户输入和输出字符串, 以空格为分隔符
    // \s：匹配任何空白字符，包括空格、制表符（\t）、换行符（\n）等
    // \s+：匹配一个或多个连续的空白字符 => 多个空格会被过滤掉
    // filter(Boolean)：过滤掉空字符串
    const userInput: string[] = userInputString?.split(/\s+/).filter(Boolean);
    const output: string[] = outputString?.split(/\s+/).filter(Boolean);
    const queryFilter = {
      agentId,
      startTime: startTime?.toISOString(),
      endTime: endTime?.toISOString(),
      userInput,
      output,
      ...info,
    };
    handleQuery(queryFilter, current, pageSize);
  };

  // 关闭详情
  const handleClose = () => {
    setVisible(false);
    setCurrentLog(null);
  };

  // 切换页码或者每页显示的条数
  const handlePaginationChange = (page: number, pageSize: number) => {
    const values = form.getFieldsValue();
    handleDataSearch(values, page, pageSize);
  };

  const onFinish: FormProps<AgentLogFormProps>['onFinish'] = (values) => {
    // 关闭详情
    handleClose();
    handleDataSearch(values);
  };

  // 重置
  const handleReset = () => {
    // 关闭详情
    handleClose();
    // 查询日志
    handleQuery({ agentId });
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<logInfo> = [
    {
      title: '消息ID',
      dataIndex: 'messageId',
      key: 'messageId',
      width: 150,
      ellipsis: true,
    },
    {
      title: '会话ID',
      dataIndex: 'conversationId',
      key: 'conversationId',
      width: 100,
      ellipsis: true,
    },
    {
      title: '用户UID',
      dataIndex: 'userUid',
      key: 'userUid',
      width: 100,
      ellipsis: true,
    },
    {
      title: '用户昵称（用户名）',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '用户输入',
      dataIndex: 'userInput',
      key: 'userInput',
      minWidth: 150,
      width: 200,
      render: (text: string) => {
        return <div className={cx('text-ellipsis-2')}>{text}</div>;
      },
    },
    {
      title: '输出',
      dataIndex: 'output',
      key: 'output',
      minWidth: 150,
      width: 200,
      render: (text: string) => {
        return <div className={'text-ellipsis-2'}>{text}</div>;
      },
    },
    {
      title: '输入token',
      dataIndex: 'inputToken',
      key: 'inputToken',
      width: 100,
      align: 'center',
    },
    {
      title: '输出token',
      dataIndex: 'outputToken',
      key: 'outputToken',
      width: 100,
      align: 'center',
    },
    {
      title: '请求时间',
      dataIndex: 'requestStartTime',
      key: 'requestStartTime',
      width: 160,
      render: (text: string) => {
        return <span>{new Date(text).toLocaleString()}</span>;
      },
    },
    {
      title: '整体耗时',
      dataIndex: 'elapsedTimeMs',
      key: 'elapsedTimeMs',
      width: 100,
      align: 'center',
      render: (text: number) => {
        return <span>{text} ms</span>;
      },
    },
  ];

  // 点击行
  const handleClick = (record: logInfo) => {
    setLoading(true);
    const { requestId, agentId } = record;
    const data = {
      requestId,
      agentId,
    };
    // 查询日志详情
    runLogDetail(data);
    setVisible(true);
  };

  return (
    <div className={cx(styles.container, 'flex', 'h-full', 'gap-10')}>
      <div
        className={cx('flex-1', 'flex', 'flex-col', 'h-full', 'overflow-hide')}
      >
        {/* 搜索区域 */}
        <Form
          form={form}
          colon={false}
          onFinish={onFinish}
          labelAlign="left"
          rootClassName={cx(styles['search-area'], 'flex')}
          autoComplete="off"
        >
          <Form.Item className={cx('flex-1', 'mb-0')}>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="messageId"
                  label="消息ID"
                  labelCol={{ flex: '70px' }}
                >
                  <Input placeholder="请输入消息ID" />
                </Form.Item>
                <Form.Item
                  name="userUid"
                  label="用户UID"
                  labelCol={{ flex: '70px' }}
                  className={cx('mb-0')}
                >
                  <Input placeholder="请输入用户UID" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="conversationId"
                  label="会话ID"
                  labelCol={{ flex: '70px' }}
                >
                  <Input placeholder="请输入会话ID" />
                </Form.Item>
                <Form.Item
                  name="userInputString"
                  label="用户输入"
                  labelCol={{ flex: '70px' }}
                  className={cx('mb-0')}
                >
                  <Input placeholder="多个关键字以空格分隔，请输入用户消息" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="timeRange"
                  label="时间范围"
                  labelCol={{ flex: '70px' }}
                >
                  <RangePicker
                    className="w-full"
                    showTime={{
                      hideDisabledOptions: true,
                      defaultValue: [
                        dayjs('00:00:00', 'HH:mm:ss'),
                        dayjs('23:59:59', 'HH:mm:ss'),
                      ],
                    }}
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </Form.Item>
                <Form.Item
                  name="outputString"
                  label="输出"
                  labelCol={{ flex: '70px' }}
                  className={cx('mb-0')}
                >
                  <Input placeholder="多个关键字以空格分隔，请输入要查询的输出消息" />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <div className={cx(styles.line)} />
          <div className={cx('flex', 'flex-col', 'content-between')}>
            <Button type="primary" htmlType="submit">
              查询
            </Button>
            <Button htmlType="reset" onClick={handleReset}>
              重置
            </Button>
          </div>
        </Form>
        <div className={cx('flex-1', 'overflow-y')}>
          {/* table列表区域 */}
          <Table<logInfo>
            className={cx(styles['table-area'])}
            columns={inputColumns}
            dataSource={dataSource}
            tableLayout="fixed"
            sticky
            loading={loadingLogList}
            scroll={{ x: 'max-content' }}
            onRow={(record) => {
              return {
                onClick: () => handleClick(record), // 点击行
              };
            }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              onChange: handlePaginationChange,
              showTotal: (total) => `共 ${total} 条`,
              locale: {
                items_per_page: '条 / 页',
              },
              // 右边距离 20px
              style: {
                marginRight: '10px',
              },
            }}
          />
        </div>
      </div>
      <LogDetails
        loading={loading}
        visible={visible}
        requestId={currentLog?.requestId}
        executeResult={currentLog?.executeResult}
        onClose={handleClose}
      />
    </div>
  );
};

export default SpaceLog;
