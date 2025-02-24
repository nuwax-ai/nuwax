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
  PLUGIN_INPUT_CONFIG,
  PLUGIN_OUTPUT_CONFIG,
} from '@/constants/space.contants';
import ConfigHeader from '@/pages/SpacePluginTool/ConfigHeader';
import {
  apiPluginConfigHistoryList,
  apiPluginHttpUpdate,
  apiPluginInfo,
} from '@/services/plugin';
import {
  CreateUpdateModeEnum,
  DataTypeEnum,
  HttpMethodEnum,
} from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type {
  InputConfigDataType,
  OutputConfigDataType,
} from '@/types/interfaces/library';
import type { PluginInfo } from '@/types/interfaces/plugin';
import type { HistoryData } from '@/types/interfaces/space';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
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
  const { pluginId } = match.params;
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  // 弹窗modal
  const [openModal, setOpenModal] = useState<boolean>(false);
  // 修改插件弹窗
  const [openPlugin, setOpenPlugin] = useState<boolean>(false);
  // 插件信息
  const [pluginInfo, setPluginInfo] = useState<PluginInfo>();
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  // 出参配置 - 展开的行，控制属性
  const [outputExpandedRowKeys, setOutputExpandedRowKeys] = useState<string[]>(
    [],
  );
  // 历史版本数据
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  // 入参配置
  const [inputConfigArgs, setInputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );
  // 出参配置
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
        form.setFieldsValue({
          method,
          url,
          contentType,
          timeout,
        });
        // 默认展开的入参配置key
        const _expandedRowKeys =
          inputArgs
            ?.filter((item) => item?.children?.length > 0)
            ?.map((item) => item.key) || [];
        setExpandedRowKeys(_expandedRowKeys);
        // 默认展开的出参配置key
        const _outputExpandedRowKeys =
          outputArgs
            ?.filter((item) => item?.children?.length > 0)
            ?.map((item) => item.key) || [];
        setOutputExpandedRowKeys(_outputExpandedRowKeys);
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
      message.success('插件保存成功');
    },
  });

  useEffect(() => {
    runPluginInfo(pluginId);
    runHistory(pluginId);
  }, [pluginId]);

  // 入参配置 - changeValue
  const handleInputValue = (
    index: number,
    record: BindConfigWithSub,
    attr: string,
    value: string | boolean,
  ) => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    // 第一级
    if (_inputConfigArgs[index]?.key === record.key) {
      _inputConfigArgs[index][attr] = value;
    } else {
      // 子级
      const f_index = _inputConfigArgs.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _inputConfigArgs[f_index].children[index][attr] = value;
    }
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置 - changeValue
  const handleOutputValue = (
    index: number,
    record: BindConfigWithSub,
    attr: string,
    value: string | boolean,
  ) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    // 第一级
    if (_outputConfigArgs[index]?.key === record.key) {
      _outputConfigArgs[index][attr] = value;
    } else {
      // 子级
      const f_index = _outputConfigArgs.findIndex((item) => {
        const childIndex = item.children?.findIndex(
          (childItem) => childItem?.key === record.key,
        );
        return childIndex > -1;
      });
      _outputConfigArgs[f_index].children[index][attr] = value;
    }
    setOutputConfigArgs(_outputConfigArgs);
  };

  // 入参配置 - 新增参数
  const handleInputAddChild = (index: number) => {
    const _inputConfigArgs = cloneDeep(inputConfigArgs);
    if (!_inputConfigArgs[index]?.children) {
      _inputConfigArgs[index].children = [];
    }
    _inputConfigArgs[index].children.push({
      key: Math.random(),
      ...PLUGIN_INPUT_CONFIG,
    });
    setInputConfigArgs(_inputConfigArgs);
    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(_inputConfigArgs[index].key)) {
      _expandedRowKeys.push(_inputConfigArgs[index].key as string);
      setExpandedRowKeys(_expandedRowKeys);
    }
  };

  // 出参配置 - 新增参数
  const handleOutputAddChild = (index: number) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    if (!_outputConfigArgs[index]?.children) {
      _outputConfigArgs[index].children = [];
    }
    _outputConfigArgs[index].children.push({
      key: Math.random(),
      ...PLUGIN_OUTPUT_CONFIG,
    });
    setOutputConfigArgs(_outputConfigArgs);
    // 设置默认展开行
    const _outputExpandedRowKeys = [...outputExpandedRowKeys];
    if (!_outputExpandedRowKeys.includes(_outputConfigArgs[index].key)) {
      _outputExpandedRowKeys.push(_outputConfigArgs[index].key as string);
      setOutputExpandedRowKeys(_outputExpandedRowKeys);
    }
  };

  // 出参配置删除操作
  const handleOutputDel = (index: number, record: BindConfigWithSub) => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    console.log(index, record, _outputConfigArgs);
  };

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

  // 保存插件信息
  const handleSave = () => {
    form.validateFields().then((values) => {
      runUpdate({
        id: pluginId,
        config: {
          ...values,
          inputArgs: inputConfigArgs,
          outputArgs: outputConfigArgs,
        },
      });
    });
  };

  // 试运行
  const handleTryRun = () => {
    handleSave();
    setIsModalOpen(true);
  };

  // 发布事件
  const handlePublish = () => {
    handleSave();
    setOpenModal(true);
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
      ...PLUGIN_INPUT_CONFIG,
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 出参配置新增操作
  const handleOutputConfigAdd = () => {
    const _outputConfigArgs = cloneDeep(outputConfigArgs);
    _outputConfigArgs.push({
      key: Math.random(),
      ...PLUGIN_OUTPUT_CONFIG,
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
          onPublish={handlePublish}
        />
        <div className={cx(styles['main-container'], 'overflow-y')}>
          <h3 className={cx(styles.title, 'mb-12')}>请求配置</h3>
          <Form
            form={form}
            initialValues={{
              method: HttpMethodEnum.GET,
            }}
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
          <ConfigHeader title="入参配置" onClick={handleInputConfigAdd} />
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
              expandedRowKeys: expandedRowKeys,
              expandIcon: () => null,
            }}
          />
          <ConfigHeader title="出参配置" onClick={handleOutputConfigAdd} />
          <Table<OutputConfigDataType>
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={outputColumns}
            dataSource={outputConfigArgs}
            pagination={false}
            expandable={{
              // 初始时，是否展开所有行
              defaultExpandAllRows: true,
              expandedRowKeys: outputExpandedRowKeys,
              expandIcon: () => null,
            }}
          />
          {/*试运行弹窗*/}
          <TryRunModel
            inputConfigArgs={inputConfigArgs}
            pluginId={pluginId}
            pluginName={pluginInfo?.name as string}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      </div>
      <PluginPublish
        pluginId={pluginId}
        open={openModal}
        onCancel={() => setOpenModal(false)}
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
