import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import PluginPublish from '@/components/PluginPublish';
import VersionHistory from '@/components/VersionHistory';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import {
  AFFERENT_MODE_LIST,
  REQUEST_CONTENT_FORMAT,
  REQUEST_METHOD,
} from '@/constants/library.constants';
import {
  apiPluginConfigHistoryList,
  apiPluginHttpUpdate,
  apiPluginInfo,
} from '@/services/plugin';
import { InputTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type {
  InputConfigDataType,
  OutputConfigDataType,
} from '@/types/interfaces/library';
import type { PluginInfo } from '@/types/interfaces/plugin';
import type { HistoryData } from '@/types/interfaces/space';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Checkbox,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Table,
} from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { useMatch, useRequest } from 'umi';
import styles from './index.less';
import PluginHeader from './PluginHeader';
import TryRunModel from './TryRunModel';

const cx = classNames.bind(styles);

/**
 * 工作空间-组件库-测试插件组件（基于已有服务http接口创建）
 */
const SpacePluginTool: React.FC = () => {
  const [form] = Form.useForm();
  const match = useMatch('/space/:spaceId/plugin/:pluginId');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  // 修改插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  const [pluginInfo, setPluginInfo] = useState<PluginInfo>();
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [inputConfigArgs, setInputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );
  const [outputConfigArgs, setOutputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );

  // 查询插件信息
  const { run: runPluginInfo } = useRequest(apiPluginInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: PluginInfo) => {
      setPluginInfo(result);
      if (result.config) {
        const { method, url, contentType, timeout, inputArgs, outputArgs } =
          result.config;
        form.setFieldValues({
          method,
          url,
          contentType,
          timeout,
        });
        setInputConfigArgs(inputArgs);
        setOutputConfigArgs(outputArgs);
      }
    },
  });

  // 查询插件历史配置信息接口
  const { run: runHistory } = useRequest(apiPluginConfigHistoryList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: HistoryData[]) => {
      setHistoryData(result);
    },
  });

  // 更新HTTP插件配置接口
  const { run: runUpdate } = useRequest(apiPluginHttpUpdate, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('插件更新成功');
    },
  });

  useEffect(() => {
    const { pluginId } = match.params;
    runPluginInfo(pluginId);
    runHistory(pluginId);
  }, []);

  const handleInputValue = (
    index: number,
    attr: string,
    value: string | boolean,
  ) => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    _inputConfigArgs[index][attr] = value;
    setInputConfigArgs(_inputConfigArgs);
  };

  const handleOutputValue = (
    index: number,
    attr: string,
    value: string | boolean,
  ) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    _outputConfigArgs[index][attr] = value;
    setOutputConfigArgs(_outputConfigArgs);
  };

  const handleOutputAddChild = (index: number) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    if (!_outputConfigArgs[index]?.children) {
      _outputConfigArgs[index].children = [];
    }
    _outputConfigArgs[index].children.push({
      key: Math.random(),
      name: '',
      description: '',
      dataType: DataTypeEnum.String,
      enable: false,
    });
    setOutputConfigArgs(_outputConfigArgs);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<InputConfigDataType>['columns'] = [
    {
      title: <LabelStar label="参数名称" />,
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      render: (_, record, index) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={record.name}
          onChange={(e) => handleInputValue(index, 'name', e.target.value)}
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (_, record, index) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          value={record.description}
          onChange={(e) =>
            handleInputValue(index, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="参数类型" />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (_, record, index) => (
        <Select
          rootClassName={styles.select}
          value={record.dataType}
          onChange={(value) => handleInputValue(index, 'dataType', value)}
          options={VARIABLE_TYPE_LIST}
        />
      ),
    },
    {
      title: <LabelStar label="传入方式" />,
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
      render: (_, record, index) => (
        <Select
          rootClassName={styles.select}
          options={AFFERENT_MODE_LIST}
          onChange={(value) => handleInputValue(index, 'inputType', value)}
          value={record.inputType}
        />
      ),
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (_, record, index) => (
        <Checkbox
          checked={record.require}
          onChange={(e) => handleInputValue(index, 'require', e.target.checked)}
        />
      ),
    },
    {
      title: '默认值',
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (_, record, index) => (
        <Input
          placeholder="请输入默认值"
          onChange={(e) => handleInputValue(index, 'bindValue', e.target.value)}
          value={record.bindValue}
        />
      ),
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (_, record, index) => (
        <Checkbox
          checked={record.enable}
          onChange={(e) => handleInputValue(index, 'enable', e.target.checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          {record.dataType === DataTypeEnum.Object && (
            <ICON_ADD_TR className={cx('cursor-pointer')} />
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
      className: 'flex',
      render: (_, record, index) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={record.name}
          onChange={(e) => handleOutputValue(index, 'name', e.target.value)}
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (_, record, index) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          onChange={(e) =>
            handleOutputValue(index, 'description', e.target.value)
          }
          value={record.description}
        />
      ),
    },
    {
      title: <LabelStar label="参数类型" />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (_, record, index) => (
        <Select
          rootClassName={styles.select}
          value={record.dataType}
          onChange={(value) => handleOutputValue(index, 'dataType', value)}
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
      render: (_, record, index) => (
        <Checkbox
          checked={record.enable}
          onChange={(e) => handleOutputValue(index, 'enable', e.target.checked)}
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
          {record.dataType === DataTypeEnum.Object && (
            <ICON_ADD_TR
              className={cx('cursor-pointer')}
              onClick={() => handleOutputAddChild(index)}
            />
          )}
          <DeleteOutlined onClick={() => console.log(record)} />
        </Space>
      ),
    },
  ];

  // 保存插件信息
  const handleSave = () => {
    form.validateFields().then((values) => {
      runUpdate({
        ...values,
        inputArgs: inputConfigArgs,
        outputArgs: outputConfigArgs,
      });
    });
  };

  // 试运行
  const handleTryRun = () => {
    handleSave();
    setIsModalOpen(true);
  };

  // 修改插件，更新信息
  const handleConfirmUpdate = (info: PluginInfo) => {
    const { icon, name, description } = info;
    const _pluginInfo = cloneDeep(pluginInfo);
    _pluginInfo.icon = icon;
    _pluginInfo.name = name;
    _pluginInfo.description = description;
    setPluginInfo(_pluginInfo);
    setOpenPlugin(false);
  };

  // 入参配置新增操作
  const handleInputConfigAdd = () => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    _inputConfigArgs.push({
      key: Math.random(),
      name: '',
      description: '',
      dataType: DataTypeEnum.String,
      inputType: InputTypeEnum.Query,
      require: false,
      enable: false,
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置新增操作
  const handleOutputConfigAdd = () => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    _outputConfigArgs.push({
      key: Math.random(),
      name: '',
      description: '',
      dataType: DataTypeEnum.String,
      enable: false,
    });
    setOutputConfigArgs(_outputConfigArgs);
  };

  return (
    <div className={cx('flex', 'h-full')}>
      <div
        className={cx(styles.container, 'flex', 'flex-col', 'flex-1', 'h-full')}
      >
        <PluginHeader
          pluginInfo={pluginInfo as PluginInfo}
          onEdit={() => setOpenPlugin(true)}
          onToggleHistory={() => setVisible(!visible)}
          onSave={handleSave}
          onTryRun={handleTryRun}
          onPublish={() => setOpenModal(true)}
        />
        <div className={cx(styles['main-container'], 'overflow-y')}>
          <h3 className={cx(styles.title, 'mb-12')}>请求配置</h3>
          <Form
            form={form}
            layout="vertical"
            requiredMark={customizeRequiredMark}
          >
            <Form.Item label={<LabelStar label="请求方法与路径" />}>
              <div className={cx('flex')}>
                <Form.Item
                  name="method"
                  rules={[{ required: true, message: '请选择请求方法' }]}
                  noStyle
                >
                  <Select
                    rootClassName={cx(styles['request-select'])}
                    options={REQUEST_METHOD}
                    placeholder="请选择请求方法"
                  />
                </Form.Item>
                <Form.Item
                  name="url"
                  rules={[{ required: true, message: '请输入请求路径' }]}
                  noStyle
                >
                  <Input placeholder="请输入请求路径" />
                </Form.Item>
              </div>
            </Form.Item>
            <Form.Item
              name="contentType"
              label="请求内容格式"
              rules={[{ required: true, message: '请选择请求内容格式' }]}
            >
              <Radio.Group options={REQUEST_CONTENT_FORMAT} />
            </Form.Item>
            <Form.Item
              name="timeout"
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
            <Button icon={<PlusOutlined />} onClick={handleInputConfigAdd}>
              新增参数
            </Button>
          </div>
          <Table<InputConfigDataType>
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
            <Button icon={<PlusOutlined />} onClick={handleOutputConfigAdd}>
              新增参数
            </Button>
          </div>
          <Table<OutputConfigDataType>
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={outputColumns}
            dataSource={outputConfigArgs}
            pagination={false}
            expandable={{
              // 初始时，是否展开所有行
              defaultExpandAllRows: true,
              // showExpandColumn: false,
              // expandIcon: () => null,
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
      <VersionHistory
        list={historyData}
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

export default SpacePluginTool;
