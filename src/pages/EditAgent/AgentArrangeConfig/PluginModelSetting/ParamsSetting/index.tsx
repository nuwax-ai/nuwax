import SelectList from '@/components/SelectList';
import {
  ParamsSettingDefaultOptions,
  VARIABLE_TYPE_LIST,
} from '@/constants/common.constants';
import { AgentComponentTypeEnum, BindValueType } from '@/types/enums/agent';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { ParamsSettingProps } from '@/types/interfaces/agentConfig';
import { getActiveKeys, updateNodeField } from '@/utils/deepNode';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Input,
  Popover,
  Select,
  Space,
  Switch,
  Table,
  Tooltip,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 插件参数设置
 */
const ParamsSetting: React.FC<ParamsSettingProps> = ({ variables }) => {
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  // 入参配置
  const [configArgs, setConfigArgs] = useState<BindConfigWithSub[]>([]);

  const { currentComponentInfo, onSaveSet } = useModel('spaceAgent');

  const inputConfigArgs =
    currentComponentInfo?.type === AgentComponentTypeEnum.Plugin
      ? currentComponentInfo?.bindConfig?.inputArgBindConfigs
      : currentComponentInfo?.bindConfig?.argBindConfigs;

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
          label: item.name,
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
    const attr =
      currentComponentInfo?.type === AgentComponentTypeEnum.Plugin
        ? 'inputArgBindConfigs'
        : 'argBindConfigs';
    onSaveSet(attr, configArgs);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (_, record) => (
        <div className={cx('flex', 'flex-col', styles['params-td'])}>
          <span className={cx(styles['params-name'], 'text-ellipsis-2')}>
            {record.name}
          </span>
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
        <div className={cx('h-full', 'flex', 'items-center')}>
          {VARIABLE_TYPE_LIST.find((item) => item.value === value)?.label}
        </div>
      ),
    },
    {
      title: '必填',
      dataIndex: 'require',
      key: 'require',
      width: 85,
      render: (value: boolean) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          {value ? '必填' : '非必填'}
        </div>
      ),
    },
    {
      title: '默认值',
      key: 'default',
      render: (_, record) => (
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
      ),
    },
    {
      title: (
        <>
          <span>开启</span>
          <Popover
            content={
              '当参数设置为关闭时，大模型将无法看到该参数。如果该参数设置了默认值并且不可见，则在调用时，智能体会默认只使用这个设定值'
            }
            overlayInnerStyle={{ width: '300px' }}
          >
            <InfoCircleOutlined className="ml-12" />
          </Popover>
        </>
      ),
      dataIndex: 'enable',
      key: 'enable',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Switch
          disabled={record.require && !record.bindValue}
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
        className={cx('mb-16', 'flex-1')}
        columns={inputColumns}
        dataSource={configArgs}
        pagination={false}
        virtual
        scroll={{ y: 570 }}
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
