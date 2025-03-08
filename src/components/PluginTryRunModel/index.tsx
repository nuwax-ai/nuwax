import { ICON_ADD_TR } from '@/constants/images.constants';
import { PLUGIN_INPUT_CONFIG } from '@/constants/space.constants';
import { apiPluginTest } from '@/services/plugin';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginTryRunModelProps } from '@/types/interfaces/library';
import {
  PluginTestResult,
  PluginTestResultObject,
} from '@/types/interfaces/plugin';
import { addChildNode, deleteNode, updateNodeField } from '@/utils/deepNode';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Input, message, Modal, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import ParamsNameLabel from './ParamsNameLabel';

const cx = classNames.bind(styles);

const ARRAY_ITEM = '[Array_Item]';

// 试运行弹窗组件
const PluginTryRunModel: React.FC<PluginTryRunModelProps> = ({
  inputConfigArgs,
  inputExpandedRowKeys,
  pluginId,
  pluginName,
  open,
  onCancel,
}) => {
  const [dataSource, setDataSource] = useState<BindConfigWithSub[]>([]);
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<PluginTestResultObject>();

  // 插件试运行接口
  const { run: runTest } = useRequest(apiPluginTest, {
    manual: true,
    debounceWait: 300,
    onSuccess: (res: PluginTestResult) => {
      console.log(res);
      if (!res.success) {
        message.warning(res.error);
      } else {
        setTestResult(res.result);
      }
    },
  });

  useEffect(() => {
    setExpandedRowKeys(inputExpandedRowKeys);
    if (inputConfigArgs?.length > 0) {
      setDataSource(inputConfigArgs);
    }
  }, [inputConfigArgs, inputExpandedRowKeys]);

  // 入参配置 - changeValue
  const handleInputValue = (
    key: string,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _dataSource = updateNodeField(dataSource, key, attr, value);
    setDataSource(_dataSource);
  };

  // 入参配置 - 新增参数
  const handleInputAddChild = (key: string, dataType: DataTypeEnum) => {
    const addDataType = dataType.split('_')[1] as DataTypeEnum;
    const newNode = {
      ...PLUGIN_INPUT_CONFIG,
      key: Math.random(),
      name: ARRAY_ITEM,
      dataType: addDataType,
    };

    const _dataSource = addChildNode(dataSource, key, newNode);
    setDataSource(_dataSource);

    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(key)) {
      _expandedRowKeys.push(key);
      setExpandedRowKeys(_expandedRowKeys);
    }
  };

  // 配置删除操作
  const handleInputDel = (key: string) => {
    const _dataSource = deleteNode(dataSource, key);
    setDataSource(_dataSource);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      render: (_, record) => (
        <ParamsNameLabel
          require={record.require}
          paramName={record.name}
          paramType={record.dataType}
        />
      ),
    },
    {
      title: '参数值',
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <>
          {[DataTypeEnum.Object, DataTypeEnum.Array_Object].includes(
            record?.dataType,
          ) || record?.dataType.includes('Array') ? null : (
            <Input
              value={record.bindValue}
              onChange={(e) =>
                handleInputValue(record.key, 'bindValue', e.target.value)
              }
              placeholder="请输入参数值"
            />
          )}
          <p className={cx(styles['param-desc'])}>{record.description}</p>
        </>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          {record.dataType.includes('Array') ? (
            <ICON_ADD_TR
              className={cx('cursor-pointer')}
              onClick={() => handleInputAddChild(record.key, record.dataType)}
            />
          ) : record.name === ARRAY_ITEM ? (
            <DeleteOutlined onClick={() => handleInputDel(record.key)} />
          ) : null}
        </Space>
      ),
    },
  ];

  // todo 待完善
  const handleRunTest = () => {
    const _dataSource = dataSource.map((item) => {
      const { dataType } = item;
      if (!dataType?.includes('Array') && dataType !== DataTypeEnum.Object) {
        return item;
      }
      if (item.subArgs?.length > 0) {
        const bindValue = item.subArgs?.map((item) => item.bindValue);
        // omit(item, ['subArgs']);
        item.subArgs = undefined;
        return {
          ...item,
          bindValue,
        };
      }
      return item;
    });
    const params = {};
    for (let item of _dataSource) {
      params[item.name] = item.bindValue;
    }
    runTest({
      pluginId,
      params,
    });
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div
          className={cx(
            styles['inner-container'],
            'flex',
            'flex-col',
            'overflow-hide',
          )}
        >
          {/*header*/}
          <header
            className={cx(
              'flex',
              'content-between',
              'items-center',
              styles.header,
            )}
          >
            <h3>试运行</h3>
            <CloseOutlined
              className={cx('cursor-pointer')}
              onClick={onCancel}
            />
          </header>
          {/*内容区*/}
          <section
            className={cx('flex', 'flex-1', 'overflow-hide', styles.section)}
          >
            {/*左侧内容*/}
            <div className={cx('flex-1', 'flex', 'flex-col')}>
              <h3 className={cx(styles['p-title'])}>{pluginName} 输入参数</h3>
              <Table<BindConfigWithSub>
                className={cx(styles['table-wrap'])}
                columns={inputColumns}
                dataSource={dataSource}
                pagination={false}
                virtual
                expandable={{
                  childrenColumnName: 'subArgs',
                  defaultExpandAllRows: true,
                  expandedRowKeys,
                  expandIcon: () => null,
                }}
                scroll={{
                  y: 450,
                }}
                footer={() => (
                  <div className={cx('text-right')}>
                    <Button type="primary" onClick={handleRunTest}>
                      运行
                    </Button>
                  </div>
                )}
              />
            </div>
            {/*右侧内容*/}
            <div className={cx('flex-1', 'flex', 'flex-col')}>
              <h3 className={cx(styles['p-title'])}>{pluginName} 调试结果</h3>
              <div className={cx('flex-1', 'radius-6', styles['result-wrap'])}>
                {testResult ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'flex-col',
                      'px-16',
                      'py-16',
                    )}
                  >
                    <h3>http_status</h3>
                    <span>{testResult.HTTP_STATUS_CODE}</span>
                    <h3>header</h3>
                    <span>{testResult.HTTP_HEADERS}</span>
                    <h3>body</h3>
                    <span>{testResult.HTTP_BODY}</span>
                  </div>
                ) : (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'items-center',
                      'content-center',
                    )}
                  >
                    调试结果将展示在此处，调试通过后，即可进入下一步
                  </div>
                )}
              </div>
            </div>
          </section>
          {/*footer*/}
          {/*<div*/}
          {/*  className={cx('flex', 'items-center', 'content-end', styles.footer)}*/}
          {/*>*/}
          {/*  <Checkbox>保存调试结果为工具使用示例</Checkbox>*/}
          {/*  <div className={cx(styles['divider-vertical'])} />*/}
          {/*  <Button type="primary" onClick={onCancel}>*/}
          {/*    完成*/}
          {/*  </Button>*/}
          {/*</div>*/}
        </div>
      )}
    ></Modal>
  );
};

export default PluginTryRunModel;
