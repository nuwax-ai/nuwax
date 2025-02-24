import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import PluginPublish from '@/components/PluginPublish';
import VersionHistory from '@/components/VersionHistory';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import { AFFERENT_MODE_LIST } from '@/constants/library.constants';
import usePluginConfig from '@/hooks/usePluginConfig';
import { CreateUpdateModeEnum, DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type {
  InputConfigCloudDataType,
  InputConfigDataType,
  OutputConfigDataType,
} from '@/types/interfaces/library';
import type { PluginInfo } from '@/types/interfaces/plugin';
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

const cx = classNames.bind(styles);
const { RangePicker } = DatePicker;

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

  const {
    pluginId,
    pluginInfo,
    inputConfigArgs,
    outputConfigArgs,
    handleInputValue,
    handleOutputValue,
    handleInputAddChild,
    handleOutputAddChild,
    handleOutputDel,
    handleConfirmUpdate,
  } = usePluginConfig();

  // 入参配置columns
  const inputColumns: TableColumnsType<InputConfigDataType>['columns'] = [
    {
      title: <LabelStar label="参数名称" />,
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (value, record, index) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={value}
          onChange={(e) =>
            handleInputValue(index, record, 'name', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (value, record, index) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          value={value}
          onChange={(e) =>
            handleInputValue(index, record, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="参数类型" />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (value, record, index) => (
        <Select
          rootClassName={styles.select}
          value={value}
          onChange={(value) =>
            handleInputValue(index, record, 'dataType', value)
          }
          options={VARIABLE_TYPE_LIST}
        />
      ),
    },
    {
      title: <LabelStar label="传入方式" />,
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
      render: (value, record, index) => (
        <Select
          rootClassName={styles.select}
          options={AFFERENT_MODE_LIST}
          onChange={(value) =>
            handleInputValue(index, record, 'inputType', value)
          }
          value={value}
        />
      ),
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (value, record, index) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleInputValue(index, record, 'require', e.target.checked)
          }
        />
      ),
    },
    {
      title: '默认值',
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (value, record, index) => (
        <Input
          placeholder="请输入默认值"
          onChange={(e) =>
            handleInputValue(index, record, 'bindValue', e.target.value)
          }
          value={value}
        />
      ),
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value, record, index) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleInputValue(index, record, 'enable', e.target.checked)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record, index) => (
        <Space size="middle">
          {record.dataType === DataTypeEnum.Object &&
            inputConfigArgs?.[index]?.key === record.key && (
              <ICON_ADD_TR
                className={cx('cursor-pointer')}
                onClick={() => handleInputAddChild(index)}
              />
            )}
          <DeleteOutlined onClick={() => console.log(record)} />
        </Space>
      ),
    },
  ];

  // 出参配置columns
  const outputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
    {
      title: <LabelStar label="参数名称" />,
      dataIndex: 'name',
      key: 'name',
      width: 430,
      className: 'flex items-center',
      render: (value, record, index) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={value}
          onChange={(e) =>
            handleOutputValue(index, record, 'name', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (value, record, index) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          onChange={(e) =>
            handleOutputValue(index, record, 'description', e.target.value)
          }
          value={value}
        />
      ),
    },
    {
      title: <LabelStar label="参数类型" />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (value, record, index) => (
        <Select
          rootClassName={styles.select}
          value={value}
          onChange={(value) =>
            handleOutputValue(index, record, 'dataType', value)
          }
          options={VARIABLE_TYPE_LIST}
        />
      ),
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value, record, index) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleOutputValue(index, record, 'enable', e.target.checked)
          }
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record, index) => (
        <Space size="middle">
          {record.dataType === DataTypeEnum.Object &&
            outputConfigArgs?.[index]?.key === record.key && (
              <ICON_ADD_TR
                className={cx('cursor-pointer')}
                onClick={() => handleOutputAddChild(index)}
              />
            )}
          <DeleteOutlined onClick={() => handleOutputDel(index, record)} />
        </Space>
      ),
    },
  ];

  // 试运行
  const handleSave = () => {};
  const handleTryRun = () => {};
  const handlePublish = () => {};

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
        <PluginHeader
          value={value}
          pluginInfo={pluginInfo as PluginInfo}
          onEdit={() => setOpenPlugin(true)}
          onChange={setValue}
          onToggleHistory={() => setVisible(!visible)}
          onSave={handleSave}
          onTryRun={handleTryRun}
          onPublish={handlePublish}
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
              dataSource={inputConfigArgs}
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
              dataSource={outputConfigArgs}
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
        pluginId={pluginId}
        open={openModal}
        onCancel={() => setOpenModal(false)}
      />
      {/*版本历史*/}
      <VersionHistory
        list={[]}
        visible={visible}
        onClose={() => setVisible(false)}
      />
      {/*修改插件弹窗*/}
      <CreateNewPlugin
        open={openPlugin}
        id={pluginInfo?.id}
        icon={pluginInfo?.icon}
        name={pluginInfo?.name}
        description={pluginInfo?.description}
        mode={CreateUpdateModeEnum.Update}
        onCancel={() => setOpenPlugin(false)}
        onConfirm={handleConfirmUpdate}
      />
    </div>
  );
};

export default SpacePluginCloudTool;
