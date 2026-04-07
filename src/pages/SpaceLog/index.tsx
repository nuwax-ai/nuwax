import { apiAgentConfigInfo } from '@/services/agentConfig';
import { apiAgentLogDetail, apiAgentLogList } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import {
  AgentConfigInfo,
  logInfo,
  LogQueryFilter,
} from '@/types/interfaces/agent';
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
import LogHeader from './LogHeader';

const cx = classNames.bind(styles);

const { RangePicker } = DatePicker;

// 日志
const SpaceLog: React.FC = () => {
  const params = useParams();
  const agentId = Number(params.agentId);
  const [form] = Form.useForm();
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
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

  // 查询智能体配置信息
  const { run } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentConfigInfo) => {
      setAgentConfigInfo(result);
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
    // 查询智能体配置信息
    run(agentId);
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
      title: dict('PC.Pages.SpaceLog.colMessageId'),
      dataIndex: 'messageId',
      key: 'messageId',
      width: 150,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceLog.colConversationId'),
      dataIndex: 'conversationId',
      key: 'conversationId',
      width: 100,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceLog.colUserUid'),
      dataIndex: 'userUid',
      key: 'userUid',
      width: 100,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceLog.colUserName'),
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      ellipsis: true,
    },
    {
      title: dict('PC.Pages.SpaceLog.colUserInput'),
      dataIndex: 'userInput',
      key: 'userInput',
      minWidth: 150,
      width: 200,
      render: (text: string) => {
        return <div className={cx('text-ellipsis-2')}>{text}</div>;
      },
    },
    {
      title: dict('PC.Pages.SpaceLog.colOutput'),
      dataIndex: 'output',
      key: 'output',
      minWidth: 150,
      width: 200,
      render: (text: string) => {
        return <div className={'text-ellipsis-2'}>{text}</div>;
      },
    },
    {
      title: dict('PC.Pages.SpaceLog.colInputToken'),
      dataIndex: 'inputToken',
      key: 'inputToken',
      width: 100,
      align: 'center',
    },
    {
      title: dict('PC.Pages.SpaceLog.colOutputToken'),
      dataIndex: 'outputToken',
      key: 'outputToken',
      width: 100,
      align: 'center',
    },
    {
      title: dict('PC.Pages.SpaceLog.colRequestTime'),
      dataIndex: 'requestStartTime',
      key: 'requestStartTime',
      width: 160,
      render: (text: string) => {
        return <span>{new Date(text).toLocaleString()}</span>;
      },
    },
    {
      title: dict('PC.Pages.SpaceLog.colElapsedTime'),
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
        {/* 头部区域 */}
        <LogHeader agentConfigInfo={agentConfigInfo} />
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
                  label={dict('PC.Pages.SpaceLog.lblMessageId')}
                  labelCol={{ flex: '70px' }}
                >
                  <Input placeholder={dict('PC.Pages.SpaceLog.phMessageId')} />
                </Form.Item>
                <Form.Item
                  name="userUid"
                  label={dict('PC.Pages.SpaceLog.lblUserUid')}
                  labelCol={{ flex: '70px' }}
                  className={cx('mb-0')}
                >
                  <Input placeholder={dict('PC.Pages.SpaceLog.phUserUid')} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="conversationId"
                  label={dict('PC.Pages.SpaceLog.lblConversationId')}
                  labelCol={{ flex: '70px' }}
                >
                  <Input
                    placeholder={dict('PC.Pages.SpaceLog.phConversationId')}
                  />
                </Form.Item>
                <Form.Item
                  name="userInputString"
                  label={dict('PC.Pages.SpaceLog.lblUserInput')}
                  labelCol={{ flex: '70px' }}
                  className={cx('mb-0')}
                >
                  <Input placeholder={dict('PC.Pages.SpaceLog.phUserInput')} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="timeRange"
                  label={dict('PC.Pages.SpaceLog.lblTimeRange')}
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
                  label={dict('PC.Pages.SpaceLog.lblOutput')}
                  labelCol={{ flex: '70px' }}
                  className={cx('mb-0')}
                >
                  <Input placeholder={dict('PC.Pages.SpaceLog.phOutput')} />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>
          <div className={cx(styles.line)} />
          <div className={cx('flex', 'flex-col', 'content-between')}>
            <Button type="primary" htmlType="submit">
              {dict('PC.Pages.SpaceLog.btnSearch')}
            </Button>
            <Button htmlType="reset" onClick={handleReset}>
              {dict('PC.Pages.SpaceLog.btnReset')}
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
              showTotal: (total) =>
                dict('PC.Pages.SpaceLog.paginationTotal', total),
              locale: {
                items_per_page: dict('PC.Pages.SpaceLog.itemsPerPage'),
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
