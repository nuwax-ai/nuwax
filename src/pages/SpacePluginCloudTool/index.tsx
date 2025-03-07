import CreateNewPlugin from '@/components/CreateNewPlugin';
import LabelStar from '@/components/LabelStar';
import PluginConfigTitle from '@/components/PluginConfigTitle';
import PluginPublish from '@/components/PluginPublish';
import VersionHistory from '@/components/VersionHistory';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import usePluginConfig from '@/hooks/usePluginConfig';
import { apiPluginCodeUpdate, apiPluginInfo } from '@/services/plugin';
import { CreateUpdateModeEnum, DataTypeEnum } from '@/types/enums/common';
import { PluginCodeModeEnum } from '@/types/enums/plugin';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginInfo } from '@/types/interfaces/plugin';
import { DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Checkbox, Input, message, Select, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import PluginHeader from './PluginCodeHeader';
import CodeEditor from '@/components/CodeEditor';

const cx = classNames.bind(styles);

/**
 * 工作空间-组件库-测试插件组件（基于云端代码js、python创建）
 */
const SpacePluginCloudTool: React.FC = () => {
  const [codeMode, setCodeMode] = useState<PluginCodeModeEnum>(
    PluginCodeModeEnum.Metadata,
  );
  const [visible, setVisible] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [code, setCode] = useState<string>('');

  const {
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
  } = usePluginConfig();

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  useEffect(() => {
    setCode(pluginInfo?.config?.code as string);
  }, [pluginInfo]);

  // 查询插件信息
  const { run: runPluginInfo } = useRequest(apiPluginInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: PluginInfo) => {
      setPluginInfo(result);
      if (result.config) {
        const { inputArgs, outputArgs } = result.config;
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

  // 更新代码插件配置接口
  const { run: runUpdate } = useRequest(apiPluginCodeUpdate, {
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

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
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
          <DeleteOutlined onClick={() => handleInputDel(index, record)} />
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
    runUpdate({
      id: pluginId,
      config: {
        inputArgs: inputConfigArgs,
        outputArgs: outputConfigArgs,
        code,
      },
    });
  };

  // 试运行
  const handleTryRun = () => {};

  // 发布事件
  const handlePublish = () => {};

  return (
    <div className={cx('flex', 'h-full')}>
      <div className={cx(styles.container, 'flex', 'flex-col', 'flex-1')}>
        <PluginHeader
          codeMode={codeMode}
          pluginInfo={pluginInfo as PluginInfo}
          onEdit={() => setOpenPlugin(true)}
          onChange={setCodeMode}
          onToggleHistory={() => setVisible(!visible)}
          onSave={handleSave}
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
                defaultExpandAllRows: true,
                expandedRowKeys: expandedRowKeys,
                expandIcon: () => null,
              }}
            />
            <PluginConfigTitle
              title="出参配置"
              onClick={handleOutputConfigAdd}
            />
            <Table<BindConfigWithSub>
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
            <CodeEditor value={code} height={'600px'} changeCode={handleCodeChange} codeLanguage={pluginInfo?.config?.codeLang} />
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

export default SpacePluginCloudTool;
