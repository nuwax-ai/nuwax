import { apiAgentConfigInfo } from '@/services/agentConfig';
import { apiAgentLogList } from '@/services/agentDev';
import {
  AgentConfigInfo,
  logInfo,
  LogQueryFilter,
} from '@/types/interfaces/agent';
import { Page } from '@/types/interfaces/request';
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
import styles from './index.less';
import LogHeader from './LogHeader';

const cx = classNames.bind(styles);

const { RangePicker } = DatePicker;

interface AgentLogFormProps {
  messageId: string;
  userUid: string;
  conversationId: string;
  timeRange?: Date[];
  outputString: string;
  userInputString: string;
}

// 日志
const HomeLog: React.FC = () => {
  const params = useParams();
  const agentId = Number(params.agentId);
  const [form] = Form.useForm();
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
  const [total, setTotal] = useState<number>(0);
  const [dataSource, setDataSource] = useState<logInfo[]>([]);

  // 知识库分段配置 - 数据列表查询
  const { run: runLogList } = useRequest(apiAgentLogList, {
    manual: true,
    debounceWait: 300,
    // 设置显示 loading 的延迟时间，避免闪烁
    loadingDelay: 300,
    onSuccess: (result: Page<logInfo>) => {
      const { total, records } = result;
      setTotal(total);
      setDataSource(records);
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

  // 分页
  const handlePaginationChange = (page: number) => {
    const values = form.getFieldsValue();
    handleDataSearch(values, page);
  };

  const onFinish: FormProps<AgentLogFormProps>['onFinish'] = (values) => {
    handleDataSearch(values);
  };

  const handleReset = () => {
    handleQuery({ agentId });
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<logInfo> = [
    {
      title: '消息ID',
      dataIndex: 'messageId',
      key: 'messageId',
    },
    {
      title: '会话ID',
      dataIndex: 'conversationId',
      key: 'conversationId',
    },
    {
      title: '用户UID',
      dataIndex: 'userUid',
      key: 'userUid',
    },
    {
      title: '用户昵称（用户名）',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
    },
    {
      title: '用户输入',
      dataIndex: 'userInput',
      key: 'userInput',
    },
    {
      title: '输出',
      dataIndex: 'output',
      key: 'output',
    },
    {
      title: '输入token',
      dataIndex: 'inputToken',
      key: 'inputToken',
    },
    {
      title: '输出token',
      dataIndex: 'outputToken',
      key: 'outputToken',
    },
    {
      title: '请求时间',
      dataIndex: 'requestStartTime',
      key: 'requestStartTime',
    },
    {
      title: '整体耗时',
      dataIndex: 'elapsedTimeMs',
      key: 'elapsedTimeMs',
    },
  ];

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
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
        className={cx('flex-1')}
        columns={inputColumns}
        dataSource={dataSource}
        virtual
        scroll={{ y: 480 }}
        pagination={{
          total: total,
          onChange: handlePaginationChange,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </div>
  );
};

export default HomeLog;
