import LabelStar from '@/components/LabelStar';
import SelectList from '@/components/SelectList';
import {
  ParamsSettingDefaultOptions,
  VARIABLE_TYPE_LIST,
} from '@/constants/common.constants';
import { apiAgentComponentPluginUpdate } from '@/services/agentConfig';
import { BindValueType } from '@/types/enums/agent';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { ParamsSettingProps } from '@/types/interfaces/agentConfig';
import { getActiveKeys, updateNodeField } from '@/utils/deepNode';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Input,
  message,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 插件参数设置
 */
const ParamsSetting: React.FC<ParamsSettingProps> = ({
  id,
  inputConfigArgs,
  variables,
}) => {
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  // 入参配置
  const [configArgs, setConfigArgs] = useState<BindConfigWithSub[]>([]);
  const { setCurrentComponentInfo, setAgentComponentList } =
    useModel('spaceAgent');

  // 更新插件组件配置
  const { run: runPluginUpdate } = useRequest(apiAgentComponentPluginUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('保存成功');
      if (inputConfigArgs?.length > 0) {
        // 更新当前组件信息
        setCurrentComponentInfo((info) => {
          info.bindConfig.inputArgBindConfigs = configArgs;
          return info;
        });
        // 更新智能体模型组件列表
        setAgentComponentList((list) => {
          return list.map((item) => {
            if (item.id === id) {
              item.bindConfig.inputArgBindConfigs = configArgs;
            }
            return item;
          });
        });
      }
    },
  });

  useEffect(() => {
    if (!!inputConfigArgs?.length) {
      // 默认值：输入
      const _inputConfigArgs = inputConfigArgs.map((info) => {
        if (!info.bindValueType) {
          info.bindValueType = BindValueType.Input;
        }
        return info;
      });
      setConfigArgs(_inputConfigArgs);

      // 默认展开的入参配置key
      const _expandedRowKeys = getActiveKeys(inputConfigArgs || []);
      setExpandedRowKeys(_expandedRowKeys);
    } else {
      setConfigArgs([]);
      setExpandedRowKeys([]);
    }
  }, [inputConfigArgs]);

  // 缓存变量列表
  const variableList = useMemo(() => {
    return variables?.map(
      (item) =>
        ({
          label: item.description,
          value: item.name,
        } || []),
    );
  }, [variables]);

  // 更新数据
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: React.Key | boolean,
  ) => {
    const _configArgs = updateNodeField(configArgs, key, attr, value);
    setConfigArgs(_configArgs);
  };

  const handleSave = () => {
    runPluginUpdate({
      id,
      bindConfig: {
        inputArgBindConfigs: configArgs,
      },
    });
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
    {
      title: <LabelStar label="参数名称" />,
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (_, record) => (
        <div className={cx('flex', 'flex-col', styles['params-td'])}>
          <span className={cx(styles['params-name'])}>{record.name}</span>
          <Tooltip
            title={record.description?.length > 10 ? record.description : ''}
            placement={'top'}
          >
            <span className={cx('text-ellipsis', styles['desc'])}>
              {record.description}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '参数类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (value) => (
        <>{VARIABLE_TYPE_LIST.find((item) => item.value === value)?.label}</>
      ),
    },
    {
      title: '必填',
      dataIndex: 'require',
      key: 'require',
      width: 80,
      render: (value) => <span>{value ? '必填' : '非必填'}</span>,
    },
    {
      title: '默认值',
      key: 'default',
      render: (_, record) => (
        <>
          <Space.Compact block>
            <SelectList
              rootClassName={cx(styles.select)}
              disabled={!record.enable}
              value={record.bindValueType}
              onChange={(value) =>
                handleInputValue(record.key, 'bindValueType', value)
              }
              options={ParamsSettingDefaultOptions}
            />
            {record.bindValueType === BindValueType.Input ? (
              <Input
                rootClassName={cx(styles.select)}
                placeholder="请填写"
                disabled={!record.enable}
                value={record.bindValue}
                onChange={(e) =>
                  handleInputValue(record.key, 'bindValue', e.target.value)
                }
              />
            ) : (
              <Select
                placeholder="请选择"
                disabled={!record.enable}
                rootClassName={cx(styles.select)}
                popupMatchSelectWidth={false}
                value={record.bindValue}
                onChange={(value) =>
                  handleInputValue(record.key, 'bindValue', value)
                }
                options={variableList}
              />
            )}
          </Space.Compact>
        </>
      ),
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={record.enable}
          onChange={(checked) =>
            handleInputValue(record.key, 'enable', checked)
          }
        />
      ),
    },
  ];

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <Table<BindConfigWithSub>
        className={cx('mb-16', 'flex-1', 'overflow-hide')}
        columns={inputColumns}
        dataSource={configArgs}
        pagination={false}
        expandable={{
          childrenColumnName: 'subArgs',
          defaultExpandAllRows: true,
          expandedRowKeys: expandedRowKeys,
          expandIcon: () => null,
        }}
      />
      <footer className={cx(styles.footer)}>
        <Button
          type="primary"
          onClick={handleSave}
          disabled={!configArgs?.length}
        >
          保存
        </Button>
      </footer>
    </div>
  );
};

export default ParamsSetting;
