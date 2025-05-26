import CodeEditor from '@/components/CodeEditor';
import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import PluginAutoAnalysis from '@/components/PluginAutoAnalysis';
import PluginConfigTitle from '@/components/PluginConfigTitle';
import PluginPublish from '@/components/PluginPublish';
import PluginTryRunModel from '@/components/PluginTryRunModel';
import VersionHistory from '@/components/VersionHistory';
import { ICON_ADD_TR } from '@/constants/images.constants';
import usePluginConfig from '@/hooks/usePluginConfig';
import { dataTypes } from '@/pages/Antv-X6/params';
import { apiPluginCodeUpdate, apiPluginInfo } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, DataTypeEnum } from '@/types/enums/common';
import { PluginCodeModeEnum } from '@/types/enums/plugin';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginInfo } from '@/types/interfaces/plugin';
import { CascaderChange, CascaderValue } from '@/utils';
import { getActiveKeys } from '@/utils/deepNode';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Cascader,
  Checkbox,
  Input,
  message,
  Space,
  Table,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import PluginCodeHeader from './PluginCodeHeader';

const cx = classNames.bind(styles);

/**
 * 工作空间-组件库-测试插件组件（基于云端代码js、python创建）
 */
const SpacePluginCloudTool: React.FC = () => {
  const [codeMode, setCodeMode] = useState<PluginCodeModeEnum>(
    PluginCodeModeEnum.Metadata,
  );
  // 代码
  const [code, setCode] = useState<string>('');

  const {
    isModalOpen,
    setIsModalOpen,
    autoAnalysisOpen,
    setAutoAnalysisOpen,
    visible,
    setVisible,
    openModal,
    setOpenModal,
    pluginId,
    pluginInfo,
    setPluginInfo,
    openPlugin,
    setOpenPlugin,
    inputConfigArgs,
    setInputConfigArgs,
    outputConfigArgs,
    expandedRowKeys,
    setExpandedRowKeys,
    outputExpandedRowKeys,
    handleInputValue,
    handleOutputValue,
    handleInputAddChild,
    handleOutputAddChild,
    handleInputDel,
    handleOutputDel,
    handleConfirmUpdate,
    handleInputConfigAdd,
    handleOutputConfigAdd,
    handleOutputConfigArgs,
    handleConfirmPublishPlugin,
  } = usePluginConfig();

  const isClickSaveBtnRef = useRef<boolean>(false);

  useEffect(() => {
    setCode(pluginInfo?.config?.code as string);
  }, [pluginInfo]);

  // 查询插件信息
  const { run: runPluginInfo } = useRequest(apiPluginInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PluginInfo) => {
      setPluginInfo(result);
      if (result.config) {
        const { inputArgs, outputArgs } = result.config;
        // 默认展开的入参配置key
        const _expandedRowKeys = getActiveKeys(inputArgs);
        setExpandedRowKeys(_expandedRowKeys);
        setInputConfigArgs(inputArgs);
        // 设置出参配置以及展开key值
        handleOutputConfigArgs(outputArgs);
      }
    },
  });

  // 更新代码插件配置接口
  const { run: runUpdate } = useRequest(apiPluginCodeUpdate, {
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
  }, [pluginId]);

  // Just show the latest item.
  const displayRender = (labels: string[]) => labels[labels.length - 1];

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
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
        <Cascader
          rootClassName={styles.select}
          allowClear={false}
          options={dataTypes}
          expandTrigger="hover"
          displayRender={displayRender}
          defaultValue={CascaderValue(value)}
          onChange={(value) => {
            handleInputValue(record.key, 'dataType', CascaderChange(value));
          }}
          placeholder="请选择数据类型"
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
            DataTypeEnum.Object === record.dataType ||
            DataTypeEnum.Array_Object === record.dataType ||
            record.dataType?.includes('Array') ||
            !record.enable
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
      render: (value: boolean, record) => (
        <Tooltip
          title={
            record.require &&
            !record.bindValue &&
            '此参数是必填参数，填写默认值后，此开关可用'
          }
        >
          <Checkbox
            disabled={record.require && !record.bindValue}
            checked={value}
            onChange={(e) =>
              handleInputValue(record.key, 'enable', e.target.checked)
            }
          />
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'right',
      render: (_, record) => (
        <Space size="middle">
          {(DataTypeEnum.Object === record.dataType ||
            DataTypeEnum.Array_Object === record.dataType) && (
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
  const outputColumns: TableColumnsType<BindConfigWithSub> = [
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
        <Cascader
          allowClear={false}
          rootClassName={styles.select}
          options={dataTypes}
          expandTrigger="hover"
          displayRender={displayRender}
          defaultValue={CascaderValue(value)}
          onChange={(value) => {
            handleOutputValue(record.key, 'dataType', CascaderChange(value));
          }}
          placeholder="请选择数据类型"
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
          {(DataTypeEnum.Object === record.dataType ||
            DataTypeEnum.Array_Object === record.dataType) && (
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
  const handleSave = () => {
    runUpdate({
      id: pluginId,
      config: {
        inputArgs: inputConfigArgs,
        outputArgs: outputConfigArgs,
        code,
      },
    });
  };

  // 单独点击保存按钮，提示保存成功
  const handleSaveConfig = () => {
    isClickSaveBtnRef.current = true;
    handleSave();
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

  const handleAutoResolve = () => {
    handleSave();
    setAutoAnalysisOpen(true);
  };

  const handleChangeSegmented = (value: string | number) => {
    const _value = value as PluginCodeModeEnum;
    setCodeMode(_value);
  };

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
        <PluginCodeHeader
          codeMode={codeMode}
          pluginInfo={pluginInfo as PluginInfo}
          onEdit={() => setOpenPlugin(true)}
          onChange={handleChangeSegmented}
          onToggleHistory={() => setVisible(!visible)}
          onSave={handleSaveConfig}
          onTryRun={handleTryRun}
          onPublish={handlePublish}
        />
        {codeMode === PluginCodeModeEnum.Metadata ? (
          <div className={cx(styles['main-container'], 'overflow-y', 'flex-1')}>
            <PluginConfigTitle
              title="入参配置"
              onClick={handleInputConfigAdd}
            />
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
          </div>
        ) : (
          <div
            className={cx(
              styles['main-container'],
              styles['code-wrap'],
              'overflow-y',
              'flex-1',
            )}
          >
            <CodeEditor
              value={code}
              height={'100%'}
              onChange={setCode}
              codeLanguage={pluginInfo?.config?.codeLang}
            />
          </div>
        )}
      </div>
      {/*试运行弹窗*/}
      <PluginTryRunModel
        inputConfigArgs={inputConfigArgs}
        inputExpandedRowKeys={expandedRowKeys}
        pluginId={pluginId}
        pluginName={pluginInfo?.name as string}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
      />
      {/*自动解析弹窗组件*/}
      <PluginAutoAnalysis
        inputConfigArgs={inputConfigArgs}
        inputExpandedRowKeys={expandedRowKeys}
        pluginId={pluginId}
        pluginName={pluginInfo?.name as string}
        open={autoAnalysisOpen}
        onCancel={() => setAutoAnalysisOpen(false)}
        onConfirm={handleOutputConfigArgs}
      />
      <PluginPublish
        pluginId={pluginId}
        scope={pluginInfo?.scope}
        open={openModal}
        onCancel={() => setOpenModal(false)}
        onConfirm={handleConfirmPublishPlugin}
      />
      {/*版本历史*/}
      <VersionHistory
        targetId={pluginId}
        targetName={pluginInfo?.name}
        targetType={AgentComponentTypeEnum.Plugin}
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
