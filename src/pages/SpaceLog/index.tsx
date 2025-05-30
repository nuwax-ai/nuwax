import { apiAgentConfigInfo } from '@/services/agentConfig';
import { apiAgentLogList } from '@/services/agentDev';
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
  const [total, setTotal] = useState<number>(0);
  const [dataSource, setDataSource] = useState<logInfo[]>([]);
  const [visible, setVisible] = useState<boolean>(false);
  const [currentLog, setCurrentLog] = useState<logInfo | null>(null);

  // 知识库分段配置 - 数据列表查询
  const { run: runLogList } = useRequest(apiAgentLogList, {
    manual: true,
    debounceWait: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    onSuccess: (result: Page<logInfo>) => {
      const { total, records } = result;
      setTotal(total);
      const list = records?.map((item) => ({
        ...item,
        key: uuidv4(),
      }));
      setDataSource(list);
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
  const handleQuery = (queryFilter: LogQueryFilter, current: number = 1) => {
    runLogList({
      queryFilter,
      current,
      pageSize: 20,
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

  const handleDataSearch = (values: AgentLogFormProps, current: number = 1) => {
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
    handleQuery(queryFilter, current);
  };

  // 关闭详情
  const handleClose = () => {
    setVisible(false);
    setCurrentLog(null);
  };

  // 分页
  const handlePaginationChange = (page: number) => {
    const values = form.getFieldsValue();
    handleDataSearch(values, page);
  };

  const onFinish: FormProps<AgentLogFormProps>['onFinish'] = (values) => {
    handleClose();
    handleDataSearch(values);
  };

  // 重置
  const handleReset = () => {
    handleClose();
    handleQuery({ agentId });
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<logInfo> = [
    {
      title: '消息ID',
      dataIndex: 'messageId',
      key: 'messageId',
      width: 100,
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
      render: (text: string) => {
        return <div className={'text-ellipsis-2'}>{text}</div>;
      },
    },
    {
      title: '输出',
      dataIndex: 'output',
      key: 'output',
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
    },
  ];

  // 点击行
  const handleClick = (record: logInfo) => {
    setCurrentLog(record);
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
            <Row gutter={24}>
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
                  <RangePicker className="w-full" />
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
        {/* table列表区域 */}
        <Table<logInfo>
          columns={inputColumns}
          dataSource={dataSource}
          virtual
          scroll={{ y: 480, x: 'max-content' }}
          onRow={(record) => {
            return {
              onClick: () => handleClick(record), // 点击行
            };
          }}
          pagination={{
            total: total,
            onChange: handlePaginationChange,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </div>
      <LogDetails
        visible={visible}
        requestId={currentLog?.requestId}
        executeResult={currentLog?.executeResult}
        onClose={handleClose}
      />
    </div>
  );
};

export default SpaceLog;
