import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import PluginPublish from '@/components/PluginPublish';
import VersionHistory from '@/components/VersionHistory';
import { PARAMS_TYPE_LIST } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import {
  AFFERENT_MODE_LIST,
  REQUEST_CONTENT_FORMAT,
  REQUEST_METHOD,
} from '@/constants/library.constants';
import { PluginModeEnum } from '@/types/enums/library';
import type {
  InputConfigDataType,
  OutputConfigDataType,
} from '@/types/interfaces/library';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Cascader,
  Checkbox,
  Form,
  Input,
  Radio,
  Select,
  Space,
  Switch,
  Table,
} from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import PluginHeader from './PluginHeader';
import TryRunModel from './TryRunModel';

const cx = classNames.bind(styles);

// 入参配置columns
const inputColumns: TableColumnsType<InputConfigDataType>['columns'] = [
  {
    title: <LabelStar label="参数名称" />,
    dataIndex: 'paramName',
    key: 'paramName',
    className: 'flex',
    render: () => <Input placeholder="请输入参数名称，确保含义清晰" />,
  },
  {
    title: <LabelStar label="参数描述" />,
    dataIndex: 'desc',
    key: 'desc',
    render: () => (
      <Input placeholder="请输入参数描述，确保描述详细便于大模型更好的理解" />
    ),
  },
  {
    title: <LabelStar label="参数类型" />,
    dataIndex: 'paramType',
    key: 'paramType',
    width: 120,
    render: () => (
      <Cascader
        rootClassName={styles.select}
        expandTrigger="hover"
        options={PARAMS_TYPE_LIST}
      />
    ),
  },
  {
    title: <LabelStar label="传入方式" />,
    dataIndex: 'afferentMode',
    key: 'afferentMode',
    width: 120,
    render: () => (
      <Select rootClassName={styles.select} options={AFFERENT_MODE_LIST} />
    ),
  },
  {
    title: '是否必须',
    dataIndex: 'mustNot',
    key: 'mustNot',
    width: 100,
    align: 'center',
    render: () => <Checkbox />,
  },
  {
    title: '默认值',
    dataIndex: 'default',
    key: 'default',
    width: 150,
    render: () => <Input placeholder="请输入默认值" />,
  },
  {
    title: '开启',
    dataIndex: 'open',
    key: 'open',
    width: 70,
    align: 'center',
    render: () => <Checkbox />,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'right',
    render: (_, record) => (
      <Space size="middle">
        {record.paramType === 2 && (
          <ICON_ADD_TR className={cx('cursor-pointer')} />
        )}
        <DeleteOutlined onClick={() => console.log(record)} />
      </Space>
    ),
  },
];

// 入参源数据
const inputData: InputConfigDataType[] = [
  {
    key: '1',
    paramName: 'John Brown',
    desc: 'desc',
    paramType: 2,
    afferentMode: 2,
    mustNot: false,
    default: '',
    open: true,
    children: [
      {
        key: '10',
        paramName: 'John Brown',
        desc: 'desc',
        paramType: 2,
        afferentMode: 1,
        mustNot: false,
        default: '',
        open: true,
        children: [
          {
            key: '110',
            paramName: 'John Brown',
            desc: 'desc',
            paramType: 1,
            afferentMode: 1,
            mustNot: false,
            default: '',
            open: true,
          },
          {
            key: '120',
            paramName: 'John Brown',
            desc: 'desc',
            paramType: 2,
            afferentMode: 1,
            mustNot: false,
            default: '',
            open: true,
            children: [
              {
                key: '1110',
                paramName: 'John Brown',
                desc: 'desc',
                paramType: 2,
                afferentMode: 1,
                mustNot: false,
                default: '',
                open: true,
              },
              {
                key: '1120',
                paramName: 'John Brown',
                desc: 'desc',
                paramType: 1,
                afferentMode: 1,
                mustNot: false,
                default: '',
                open: true,
              },
            ],
          },
        ],
      },
      {
        key: '20000',
        paramName: 'John Brown',
        desc: 'desc',
        paramType: 2,
        afferentMode: 1,
        mustNot: false,
        default: '',
        open: true,
      },
    ],
  },
  {
    key: '2',
    paramName: 'John Brown',
    desc: 'desc',
    paramType: 2,
    afferentMode: 1,
    mustNot: false,
    default: '',
    open: true,
  },
];

// 出参配置columns
const outputColumns: TableColumnsType<OutputConfigDataType>['columns'] = [
  {
    title: <LabelStar label="参数名称" />,
    dataIndex: 'paramName',
    key: 'paramName',
    width: 430,
    className: 'flex',
    render: () => <Input placeholder="请输入参数名称，确保含义清晰" />,
  },
  {
    title: <LabelStar label="参数描述" />,
    dataIndex: 'desc',
    key: 'desc',
    render: () => (
      <Input placeholder="请输入参数描述，确保描述详细便于大模型更好的理解" />
    ),
  },
  {
    title: <LabelStar label="参数类型" />,
    dataIndex: 'paramType',
    key: 'paramType',
    width: 120,
    render: () => (
      <Cascader
        rootClassName={styles.select}
        expandTrigger="hover"
        options={PARAMS_TYPE_LIST}
      />
    ),
  },
  {
    title: '开启',
    dataIndex: 'open',
    key: 'open',
    width: 70,
    align: 'center',
    render: () => <Checkbox />,
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    align: 'right',
    render: (_, record) => (
      <Space size="middle">
        {record.paramType === 2 && (
          <ICON_ADD_TR className={cx('cursor-pointer')} />
        )}
        <DeleteOutlined onClick={() => console.log(record)} />
      </Space>
    ),
  },
];

// 出参源数据
const outputData: OutputConfigDataType[] = [
  {
    key: '1',
    paramName: 'John Brown',
    desc: 'desc',
    paramType: 2,
    open: true,
    children: [
      {
        key: '10',
        paramName: 'John Brown',
        desc: 'desc',
        paramType: 2,
        open: true,
      },
      {
        key: '20',
        paramName: 'John Brown',
        desc: 'desc',
        paramType: 1,
        open: true,
      },
    ],
  },
  {
    key: '2',
    paramName: 'John Brown',
    desc: 'desc',
    paramType: 2,
    open: true,
  },
];

/**
 * 工作空间-组件库-测试插件组件（基于已有服务http接口创建）
 */
const SpacePluginTool: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  // 修改插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);

  // 试运行
  const handleTryRun = () => {
    setIsModalOpen(true);
  };

  return (
    <div className={cx('flex', 'h-full')}>
      <div
        className={cx(styles.container, 'flex', 'flex-col', 'flex-1', 'h-full')}
      >
        <PluginHeader
          onEdit={() => setOpenPlugin(true)}
          onToggleHistory={() => setVisible(!visible)}
          onTryRun={handleTryRun}
          onPublish={() => setOpenModal(true)}
        />
        <div className={cx(styles['main-container'], 'overflow-y')}>
          <h3 className={cx(styles.title, 'mb-12')}>插件启用状态</h3>
          <Switch className={cx('mb-16')} />
          <h3 className={cx(styles.title, 'mb-12')}>请求配置</h3>
          <Form
            form={form}
            layout="vertical"
            requiredMark={customizeRequiredMark}
          >
            <Form.Item
              name="requestMethodAndPath"
              label="请求方法与路径"
              rules={[{ required: true, message: '请选择请求方法与路径' }]}
            >
              <div className={cx('flex')}>
                <Select
                  rootClassName={cx(styles['request-select'])}
                  options={REQUEST_METHOD}
                />
                <Input placeholder="请输入请求路径" />
              </div>
            </Form.Item>
            <Form.Item
              name="contentFormat"
              label="请求内容格式"
              rules={[{ required: true, message: '请选择请求内容格式' }]}
            >
              <Radio.Group options={REQUEST_CONTENT_FORMAT} />
            </Form.Item>
            <Form.Item
              name="requestTimeout"
              label="请求超时配置"
              rules={[{ required: true, message: '请输入超时配置' }]}
            >
              <Input placeholder="请求超时配置，以秒为单位" />
            </Form.Item>
          </Form>
          <div
            className={cx('flex', 'content-between', 'items-center', 'mb-12')}
          >
            <h3 className={styles.title}>入参配置</h3>
            <Button icon={<PlusOutlined />}>新增参数</Button>
          </div>
          <Table<InputConfigDataType>
            className={cx(
              styles['table-wrap'],
              styles['mb-24'],
              'overflow-hide',
            )}
            columns={inputColumns}
            dataSource={inputData}
            pagination={false}
            expandable={{
              defaultExpandAllRows: true,
              expandIcon: () => null,
            }}
          />
          <div
            className={cx('flex', 'content-between', 'items-center', 'mb-12')}
          >
            <h3 className={cx(styles.title)}>出参配置</h3>
            <Button icon={<PlusOutlined />}>新增参数</Button>
          </div>
          <Table<OutputConfigDataType>
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={outputColumns}
            dataSource={outputData}
            pagination={false}
            expandable={{
              defaultExpandAllRows: true,
              expandIcon: () => null,
            }}
          />
          {/*试运行弹窗*/}
          <TryRunModel
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      </div>
      <PluginPublish
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onConfirm={() => setOpenModal(false)}
      />
      {/*版本历史*/}
      <VersionHistory visible={visible} onClose={() => setVisible(false)} />
      {/*修改插件弹窗*/}
      <CreateNewPlugin
        open={openPlugin}
        pluginId={'110110'}
        pluginName="测试插件"
        desc={'测试插件的描述信息'}
        type={PluginModeEnum.Update}
        onCancel={() => setOpenPlugin(false)}
      />
    </div>
  );
};

export default SpacePluginTool;
