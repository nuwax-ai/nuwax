import SelectList from '@/components/SelectList';
import { ParamsSettingDefaultOptions } from '@/constants/common.constants';
import { BindValueType } from '@/types/enums/agent';
import type { BindConfigWithSub } from '@/types/interfaces/common';
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
import { cloneDeep } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ParamsSettingProps {
  inputArgBindConfigs: BindConfigWithSub[];
  variables: BindConfigWithSub[];
  onSaveSet: (attr: string, value: BindConfigWithSub[]) => void;
  style?: React.CSSProperties;
  scroll?: { y: number };
}
/**
 * 插件参数设置
 */
const ParamsSetting: React.FC<ParamsSettingProps> = ({
  inputArgBindConfigs,
  variables,
  onSaveSet,
  style = {},
  scroll = { y: 480 },
}) => {
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  // 入参配置
  const [configArgs, setConfigArgs] = useState<BindConfigWithSub[]>([]);
  // 是否禁用button
  const [disabled, setDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (!!inputArgBindConfigs?.length) {
      setDisabled(false);
      setConfigArgs(inputArgBindConfigs);
      // 默认展开的入参配置key
      const _expandedRowKeys = getActiveKeys(inputArgBindConfigs || []);
      setExpandedRowKeys(_expandedRowKeys);
    } else {
      setDisabled(true);
      setConfigArgs([]);
      setExpandedRowKeys([]);
    }
  }, [inputArgBindConfigs]);

  // 缓存变量列表
  const variableList = useMemo(() => {
    return (
      variables?.map((item) => {
        return {
          label: item.name,
          value: item.name,
        };
      }) || []
    );
  }, [variables]);

  // 更新数据
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: React.Key | boolean,
  ) => {
    const cloneArr = cloneDeep(configArgs) || [];
    const _configArgs = updateNodeField(cloneArr, key, attr, value);
    setConfigArgs(_configArgs);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center table-params-name-td',
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
        <div className={cx('h-full', 'flex', 'items-center')}>{value}</div>
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
      width: 232,
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Space.Compact block>
            <SelectList
              className={cx(styles.select)}
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
                value={record.bindValue || null}
                onChange={(value) =>
                  handleInputValue(record.key, 'bindValue', value)
                }
                options={variableList}
              />
            )}
          </Space.Compact>
        </div>
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
            styles={{
              body: { width: '300px' },
            }}
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
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Tooltip
            title={
              record.require &&
              !record.bindValue &&
              '此参数是必填参数，填写默认值后，此开关可用'
            }
          >
            <Switch
              disabled={record.require && !record.bindValue}
              checked={record.enable}
              onChange={(checked) =>
                handleInputValue(record.key, 'enable', checked)
              }
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')} style={style}>
      <Table<BindConfigWithSub>
        className={cx('mb-16', 'flex-1')}
        columns={inputColumns}
        dataSource={configArgs}
        pagination={false}
        virtual
        scroll={scroll}
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
          onClick={() => onSaveSet('inputArgBindConfigs', configArgs)}
          className={cx({ [styles['btn-disabled']]: disabled })}
          disabled={disabled}
        >
          保存
        </Button>
      </footer>
    </div>
  );
};

export default ParamsSetting;
