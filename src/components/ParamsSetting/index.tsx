import SelectList from '@/components/custom/SelectList';
import { ParamsSettingDefaultOptions } from '@/constants/common.constants';
import { BindValueType } from '@/types/enums/agent';
import { DataTypeEnum } from '@/types/enums/common';
import {
  ParamsSaveParams,
  ParamsSettingProps,
} from '@/types/interfaces/agentConfig';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import { getActiveKeys, updateNodeField } from '@/utils/deepNode';
import { ExclamationCircleOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState<boolean>(false);

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

  /**
   * 判断是否为复杂类型（对象或数组类型）
   * @param record - 参数配置记录
   * @returns 是否为对象或数组类型
   */
  const isComplexType = (record: BindConfigWithSub): boolean => {
    return (
      DataTypeEnum.Object === record.dataType ||
      DataTypeEnum.Array_Object === record.dataType ||
      !!record.dataType?.includes('Array')
    );
  };

  /**
   * 判断是否有下级参数
   * @param record - 参数配置记录
   * @returns 是否有下级参数（subArgs 存在且长度大于 0）
   */
  const hasSubArgs = (record: BindConfigWithSub): boolean => {
    return !!(record.subArgs && record.subArgs.length > 0);
  };

  // 是否禁用默认值
  // 智能体中插件、工作流参数变量引用，数组和对象没有下级参数时（有下级时保持现状），允许引用（不允许输入）
  const isDefaultValueDisabled = (record: BindConfigWithSub) => {
    // return (
    //   DataTypeEnum.Object === record.dataType ||
    //   DataTypeEnum.Array_Object === record.dataType ||
    //   record.dataType?.includes('Array') ||
    //   !record.enable
    // );

    // 数组和对象没有下级参数时（有下级时保持现状），允许引用（不允许输入）
    if (isComplexType(record)) {
      return hasSubArgs(record);
    }

    // 其他类型保持现状
    return !record.enable;
  };

  // 获取参数值设置默认下拉选项
  const getOptions = (record: BindConfigWithSub) => {
    if (isComplexType(record)) {
      // 数组和对象没有下级参数时，只允许引用（不允许输入），所以只显示引用选项
      if (!hasSubArgs(record)) {
        return ParamsSettingDefaultOptions.filter(
          (item) => item.value === BindValueType.Reference,
        );
      }
      return ParamsSettingDefaultOptions;
    }

    return ParamsSettingDefaultOptions;
  };

  // 获取参数默认值
  const getDefaultValue = (record: BindConfigWithSub) => {
    // 对象或数组类型
    if (isComplexType(record)) {
      // 数组和对象没有下级参数时，允许引用（不允许输入）
      if (!hasSubArgs(record)) {
        return BindValueType.Reference;
      }
      // 存在下级时，显示默认值
      return record.bindValueType;
    }
    // 其他类型
    return record.bindValueType;
  };

  /**
   * 是否显示输入框
   * 规则：
   * 1. 数组和对象类型：没有下级参数时，不允许输入（只显示引用选择框）
   * 2. 数组和对象类型：有下级参数时，允许输入
   * 3. 其他类型：根据 bindValueType 是否为 Input 来决定
   * @param record - 参数配置记录
   * @returns 是否显示输入框
   */
  const isShowInput = (record: BindConfigWithSub) => {
    // 判断是否为复杂类型（对象或数组）
    if (isComplexType(record)) {
      // 如果没有下级参数（subArgs 为空或长度为 0），则不显示输入框
      // 此时只能通过引用选择框选择变量，不能直接输入值
      if (!hasSubArgs(record)) {
        return false;
      }
      // 有下级参数时，允许输入
      return true;
    }
    // 其他类型：只有当 bindValueType 为 Input 时才显示输入框
    return record.bindValueType === BindValueType.Input;
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
              disabled={isDefaultValueDisabled(record)}
              // 获取参数默认值, 默认值为record.bindValueType, 但是数组和对象没有下级参数时，允许引用（不允许输入）
              value={getDefaultValue(record)}
              onChange={(value) =>
                handleInputValue(record.key, 'bindValueType', value)
              }
              // 获取参数值设置默认下拉选项, 数组和对象没有下级参数时，允许引用（不允许输入）
              options={getOptions(record)}
            />
            {/* 是否显示输入框，数组和对象没有下级参数时，不允许输入，只显示下拉选择框, 其他类型，根据record.bindValueType === BindValueType.Input显示输入框或下拉选择框 */}
            {isShowInput(record) ? (
              <Input
                rootClassName={cx(styles.select)}
                placeholder="请填写"
                disabled={isDefaultValueDisabled(record)}
                value={record.bindValue}
                onChange={(e) =>
                  handleInputValue(record.key, 'bindValue', e.target.value)
                }
              />
            ) : (
              <Select
                placeholder="请选择"
                disabled={isDefaultValueDisabled(record)}
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
            <ExclamationCircleOutlined className="ml-12" />
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

  // 保存
  const handleSave = async () => {
    const data: ParamsSaveParams = {
      inputArgBindConfigs: configArgs,
    };
    setLoading(true);
    await onSaveSet(data);
    setLoading(false);
  };

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
          onClick={handleSave}
          loading={loading}
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
