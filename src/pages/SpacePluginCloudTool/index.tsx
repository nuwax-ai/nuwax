import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import VersionHistory from '@/components/VersionHistory';
import { PARAMS_TYPE_LIST } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import { PluginModeEnum } from '@/types/enums/library';
import type {
  InputConfigCloudDataType,
  OutputConfigDataType,
} from '@/types/interfaces/library';
import {
  CloseOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Cascader,
  Checkbox,
  DatePicker,
  Input,
  Select,
  Space,
  Switch,
  Table,
} from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';
import PluginHeader from './PluginHeader';
import PluginPublish from './PluginPublish';

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;

// 入参配置columns
const inputColumns: TableColumnsType<InputConfigCloudDataType>['columns'] = [
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
const inputData: InputConfigCloudDataType[] = [
  {
    key: '1',
    paramName: 'John Brown',
    desc: 'desc',
    paramType: 2,
    mustNot: false,
    default: '',
    open: true,
    children: [
      {
        key: '10',
        paramName: 'John Brown',
        desc: 'desc',
        paramType: 2,
        mustNot: false,
        default: '',
        open: true,
        children: [
          {
            key: '110',
            paramName: 'John Brown',
            desc: 'desc',
            paramType: 1,
            mustNot: false,
            default: '',
            open: true,
          },
          {
            key: '120',
            paramName: 'John Brown',
            desc: 'desc',
            paramType: 2,
            mustNot: false,
            default: '',
            open: true,
            children: [
              {
                key: '1110',
                paramName: 'John Brown',
                desc: 'desc',
                paramType: 2,
                mustNot: false,
                default: '',
                open: true,
              },
              {
                key: '1120',
                paramName: 'John Brown',
                desc: 'desc',
                paramType: 1,
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
 * 工作空间-组件库-测试插件组件（基于云端代码js、python创建）
 */
const SpacePluginCloudTool: React.FC = () => {
  const [value, setValue] = useState<number>(1);
  const [visible, setVisible] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  // 修改插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');
  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  // 试运行
  const handleTryRun = () => {};

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
        <PluginHeader
          value={value}
          onEdit={() => setOpenPlugin(true)}
          onChange={setValue}
          onToggleHistory={() => setVisible(!visible)}
          onTryRun={handleTryRun}
          onPublish={() => setOpenModal(true)}
        />
        {/*todo*/}
        {value === 1 ? (
          <div className={cx(styles['main-container'], 'overflow-y', 'flex-1')}>
            <h3 className={cx(styles.title, 'mb-12')}>插件启用状态</h3>
            <Switch className={cx('mb-16')} />
            <div
              className={cx('flex', 'content-between', 'items-center', 'mb-12')}
            >
              <h3 className={styles.title}>入参配置</h3>
              <Button icon={<PlusOutlined />}>新增参数</Button>
            </div>
            <Table<InputConfigCloudDataType>
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
          </div>
        ) : (
          <div
            className={cx(
              styles['main-container'],
              styles['code-mode'],
              'overflow-y',
              'flex-1',
              'flex',
            )}
          >
            <div className={cx(styles['code-wrap'], 'flex-1')}>
              <Editor
                height={600}
                defaultLanguage="javascript"
                theme="light"
                value={code} // 使用 value 而不是 defaultValue，使编辑器成为受控组件
                onChange={handleCodeChange}
                options={{
                  selectOnLineNumbers: true,
                  folding: true,
                  automaticLayout: true,
                }}
              />
            </div>
            <div
              className={cx(styles['line-log'], 'radius-6', 'flex', 'flex-col')}
            >
              <div
                className={cx(
                  styles['log-header'],
                  'flex',
                  'content-between',
                  'items-center',
                )}
              >
                <span className={cx(styles['log-title'])}>
                  线上日志 <InfoCircleOutlined />
                </span>
                <CloseOutlined />
              </div>
              <div className={cx(styles['log-box'])}>
                <Input
                  rootClassName={cx('mb-12')}
                  prefix={<SearchOutlined />}
                  placeholder="按回车键搜索"
                />
                <Select
                  style={{ width: '100%', marginBottom: '12px' }}
                  options={[
                    { value: '1', label: '自定义时间范围' },
                    { value: '2', label: '其他' },
                  ]}
                />
                <RangePicker />
              </div>
              <div className={cx('flex-1', styles['log-history'])}>
                暂无日志
              </div>
            </div>
          </div>
        )}
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

export default SpacePluginCloudTool;
