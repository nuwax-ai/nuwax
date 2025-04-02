import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import PluginConfigTitle from '@/components/PluginConfigTitle';
import PluginPublish from '@/components/PluginPublish';
import PluginTryRunModel from '@/components/PluginTryRunModel';
import VersionHistory from '@/components/VersionHistory';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import {
  AFFERENT_MODE_LIST,
  REQUEST_CONTENT_FORMAT,
  REQUEST_METHOD,
} from '@/constants/library.constants';
import usePluginConfig from '@/hooks/usePluginConfig';
import { apiPluginHttpUpdate, apiPluginInfo } from '@/services/plugin';
import {
  CreateUpdateModeEnum,
  DataTypeEnum,
  HttpContentTypeEnum,
  HttpMethodEnum,
} from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginInfo } from '@/types/interfaces/plugin';
import { getActiveKeys, getNodeDepth } from '@/utils/deepNode';
import { customizeRequiredMark } from '@/utils/form';
import { DeleteOutlined } from '@ant-design/icons';
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
import React, { useEffect, useRef } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import PluginHeader from './PluginHeader';

const cx = classNames.bind(styles);

/**
 * 工作空间-组件库-测试插件组件（基于已有服务http接口创建）
 */
const SpacePluginTool: React.FC = () => {
  const [form] = Form.useForm();
  const {
    isModalOpen,
    setIsModalOpen,
    visible,
    setVisible,
    openModal,
    setOpenModal,
    runHistory,
    pluginId,
    pluginInfo,
    setPluginInfo,
    openPlugin,
    setOpenPlugin,
    historyData,
    inputConfigArgs,
    setInputConfigArgs,
    outputConfigArgs,
    setOutputConfigArgs,
    expandedRowKeys,
    setExpandedRowKeys,
    outputExpandedRowKeys,
    setOutputExpandedRowKeys,
    handleInputValue,
    handleOutputValue,
    handleInputAddChild,
    handleOutputAddChild,
    handleInputDel,
    handleOutputDel,
    handleConfirmUpdate,
    handleInputConfigAdd,
    handleOutputConfigAdd,
    runPluginAnalysis,
  } = usePluginConfig();

  const isClickSaveBtnRef = useRef<boolean>(false);

  // 查询插件信息
  const { run: runPluginInfo } = useRequest(apiPluginInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PluginInfo) => {
      setPluginInfo(result);
      if (result.config) {
        const { method, url, contentType, timeout, inputArgs, outputArgs } =
          result.config;
        // 初始化form
        form.setFieldsValue({
          method: method || HttpMethodEnum.GET,
          url,
          contentType: contentType || HttpContentTypeEnum.JSON,
          timeout: timeout || 10,
        });
        // 默认展开的入参配置key
        const _expandedRowKeys = getActiveKeys(inputArgs);
        setExpandedRowKeys(_expandedRowKeys);
        // 默认展开的出参配置key
        const _outputExpandedRowKeys = getActiveKeys(outputArgs);
        setOutputExpandedRowKeys(_outputExpandedRowKeys);
        setInputConfigArgs(inputArgs);
        setOutputConfigArgs(outputArgs);
      }
    },
  });

  // 更新HTTP插件配置接口
  const { run: runUpdate } = useRequest(apiPluginHttpUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      if (isClickSaveBtnRef.current) {
        message.success('插件保存成功');
        isClickSaveBtnRef.current = false;
      }
    },
  });

  useEffect(() => {
    runPluginInfo(pluginId);
    runHistory(pluginId);
  }, [pluginId]);

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
    {
      title: <LabelStar label="参数名称" />,
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (value, record) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={value}
          onChange={(e) => handleInputValue(record.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          value={value}
          onChange={(e) =>
            handleInputValue(record.key, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="参数类型" />,
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (value, record) => (
        <Select
          rootClassName={styles.select}
          value={value}
          onChange={(value) => handleInputValue(record.key, 'dataType', value)}
          options={VARIABLE_TYPE_LIST}
        />
      ),
    },
    {
      title: <LabelStar label="传入方式" />,
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
      render: (value, record) =>
        getNodeDepth(inputConfigArgs, record.key) === 1 && (
          <Select
            rootClassName={styles.select}
            options={AFFERENT_MODE_LIST}
            value={value}
            onChange={(value) =>
              handleInputValue(record.key, 'inputType', value)
            }
          />
        ),
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleInputValue(record.key, 'require', e.target.checked)
          }
        />
      ),
    },
    {
      title: '默认值',
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (value, record) => (
        <Input
          placeholder="请输入默认值"
          disabled={
            [DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(
              record.dataType,
            ) || record.dataType.includes('Array')
          }
          value={value}
          onChange={(e) =>
            handleInputValue(record.key, 'bindValue', e.target.value)
          }
        />
      ),
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleInputValue(record.key, 'enable', e.target.checked)
          }
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
          {[DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(
            record.dataType,
          ) && (
            <ICON_ADD_TR
              className={cx('cursor-pointer')}
              onClick={() => handleInputAddChild(record.key)}
            />
          )}
          <DeleteOutlined onClick={() => handleInputDel(record.key)} />
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
      render: (value, record) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={value}
          onChange={(e) =>
            handleOutputValue(record.key, 'name', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          onChange={(e) =>
            handleOutputValue(record.key, 'description', e.target.value)
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
      render: (value, record) => (
        <Select
          rootClassName={styles.select}
          value={value}
          onChange={(value) => handleOutputValue(record.key, 'dataType', value)}
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
      render: (value, record) => (
        <Checkbox
          checked={value}
          onChange={(e) =>
            handleOutputValue(record.key, 'enable', e.target.checked)
          }
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
          {[DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(
            record.dataType,
          ) && (
            <ICON_ADD_TR
              className={cx('cursor-pointer')}
              onClick={() => handleOutputAddChild(record.key)}
            />
          )}
          <DeleteOutlined onClick={() => handleOutputDel(record.key)} />
        </Space>
      ),
    },
  ];

  // 保存插件信息
  const handleSave = async () => {
    const values = await form.validateFields();
    runUpdate({
      id: pluginId,
      config: {
        ...values,
        inputArgs: inputConfigArgs,
        outputArgs: outputConfigArgs,
      },
    });
  };

  // 单独点击保存按钮，提示保存成功
  const handleSaveConfig = async () => {
    isClickSaveBtnRef.current = true;
    await handleSave();
  };

  // 试运行
  const handleTryRun = async () => {
    await handleSave();
    setIsModalOpen(true);
  };

  // 发布事件
  const handlePublish = async () => {
    await handleSave();
    setOpenModal(true);
  };

  // 自动解析
  const handleAutoResolve = async () => {
    // 插件http模式下， 先保存配置，否则自动解析可能会因为url地址未填写或者未保存报错
    await handleSave();
    runPluginAnalysis({
      pluginId,
    });
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
          onSave={handleSaveConfig}
          onTryRun={handleTryRun}
          onPublish={handlePublish}
        />
        <div className={cx(styles['main-container'], 'overflow-y')}>
          <h3 className={cx(styles.title, 'mb-12')}>请求配置</h3>
          <Form
            form={form}
            initialValues={{
              method: HttpMethodEnum.GET,
              contentType: HttpContentTypeEnum.JSON,
              timeout: 10,
            }}
            layout="vertical"
            requiredMark={customizeRequiredMark}
          >
            <Form.Item label={<LabelStar label="请求方法与路径" />}>
              <div className={cx('flex')}>
                <Form.Item name="method" noStyle>
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
          <PluginConfigTitle title="入参配置" onClick={handleInputConfigAdd} />
          <Table<BindConfigWithSub>
            className={cx(
              styles['table-wrap'],
              styles['mb-24'],
              'overflow-hide',
            )}
            columns={inputColumns}
            dataSource={inputConfigArgs}
            pagination={false}
            expandable={{
              childrenColumnName: 'subArgs',
              defaultExpandAllRows: true,
              expandedRowKeys: expandedRowKeys,
              expandIcon: () => null,
            }}
          />
          <PluginConfigTitle
            title="出参配置"
            onClick={handleOutputConfigAdd}
            extra={<Button onClick={handleAutoResolve}>自动解析</Button>}
          />
          <Table<BindConfigWithSub>
            className={cx(styles['table-wrap'], 'overflow-hide')}
            columns={outputColumns}
            dataSource={outputConfigArgs}
            pagination={false}
            expandable={{
              childrenColumnName: 'subArgs',
              // 初始时，是否展开所有行
              defaultExpandAllRows: true,
              expandedRowKeys: outputExpandedRowKeys,
              expandIcon: () => null,
            }}
          />
          {/*试运行弹窗*/}
          <PluginTryRunModel
            inputConfigArgs={inputConfigArgs}
            inputExpandedRowKeys={expandedRowKeys}
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
