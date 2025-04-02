import { ARRAY_ITEM } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import { PLUGIN_INPUT_CONFIG } from '@/constants/space.constants';
import { apiPluginAnalysisOutput } from '@/services/plugin';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginAutoAnalysisProps } from '@/types/interfaces/library';
import { addChildNode, deleteNode, updateNodeField } from '@/utils/deepNode';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import ParamsNameLabel from './ParamsNameLabel';

const cx = classNames.bind(styles);

// 自动解析弹窗组件
const PluginAutoAnalysis: React.FC<PluginAutoAnalysisProps> = ({
  inputConfigArgs,
  inputExpandedRowKeys,
  pluginId,
  pluginName,
  open,
  onCancel,
  onConfirm,
}) => {
  // 数据源
  const [dataSource, setDataSource] = useState<BindConfigWithSub[]>([]);
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);

  // 自动解析插件出参
  const { run: runPluginAnalysis, loading: loadingAnalysis } = useRequest(
    apiPluginAnalysisOutput,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: (result: BindConfigWithSub[]) => {
        if (!!result?.length) {
          // 如果配置项key值为null, 添加随机值
          const list = result.map((item) => {
            if (!item.key) {
              item.key = Math.random();
            }
            return item;
          });
          onConfirm(list);
        }
        onCancel();
      },
    },
  );

  // 处理Array_Object类型数据
  const handleArrayObjectArr = (
    treeData: BindConfigWithSub[],
    keys: React.Key[],
  ) => {
    const deepArrayObject = (arr: BindConfigWithSub[]) => {
      return arr.map((node) => {
        const { dataType, subArgs } = node;
        if (dataType === DataTypeEnum.Array_Object) {
          const key = Math.random();
          keys.push(key);
          // 子级数组长度大于0
          if (subArgs && subArgs.length > 0) {
            const _subArgs: BindConfigWithSub[] = [
              {
                ...PLUGIN_INPUT_CONFIG,
                key,
                name: ARRAY_ITEM,
                dataType: DataTypeEnum.Object,
                subArgs: deepArrayObject(subArgs as BindConfigWithSub[]),
              },
            ];

            return {
              ...node,
              subArgs: _subArgs,
            };
          }
        }
        return node;
      });
    };

    return (deepArrayObject(treeData) as BindConfigWithSub[]) || [];
  };

  useEffect(() => {
    if (inputConfigArgs?.length > 0) {
      const keys = [...inputExpandedRowKeys];
      const _inputConfigArgs =
        handleArrayObjectArr(inputConfigArgs, keys) || [];
      setExpandedRowKeys(keys);
      setDataSource(_inputConfigArgs);
    } else {
      setDataSource([]);
    }
  }, [inputConfigArgs, inputExpandedRowKeys]);

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _dataSource = updateNodeField(dataSource, key, attr, value);
    setDataSource(_dataSource);
  };

  // 递归获取子级，以及展开的key值
  const handleChangeSubArgsKey = (
    bindConfig: BindConfigWithSub,
    keys: React.Key[],
  ) => {
    const addKey = (data: BindConfigWithSub) => {
      // 存在下级，递归更新key值
      if (data.subArgs && data.subArgs.length > 0) {
        // 更新下级
        const newSub: BindConfigWithSub[] =
          data.subArgs?.map((item) => {
            const subKey = Math.random();
            // 不存在下级
            if (!item.subArgs?.length) {
              return {
                ...item,
                key: subKey,
                bindValue: '', // 清空默认值
              };
            } else {
              keys.push(subKey);
              return addKey(item);
            }
          }) || [];
        // 更新父级key， 并加入active keys
        const newDataKey = Math.random();
        keys.push(newDataKey);
        return {
          ...data,
          key: newDataKey,
          subArgs: newSub,
        };
      }

      // 不存在subArgs
      return {
        ...data,
        key: Math.random(),
      };
    };

    return addKey(bindConfig);
  };

  // 入参配置 - 新增参数 只有“数组类型（eg: Array_）”才有新增下级按钮
  const handleInputAddChild = (record: BindConfigWithSub) => {
    const { key, dataType } = record;
    let newNode;
    const keys: React.Key[] = [];
    // 数组对象, 必须要有第一项，不认复制的对象不存在name值
    if (dataType === DataTypeEnum.Array_Object) {
      if (record.subArgs && record.subArgs.length > 0) {
        // 取第一行对象数据，作为添加的项，但是需要更新key值，以及它的子级的key值
        const currentSubArgs = record.subArgs?.[0] as BindConfigWithSub;
        newNode = handleChangeSubArgsKey(currentSubArgs, keys);
      }
    } else {
      const addDataType = dataType?.toString()?.split('_')?.[1] as DataTypeEnum;
      newNode = {
        ...PLUGIN_INPUT_CONFIG,
        key: Math.random(),
        name: ARRAY_ITEM,
        dataType: addDataType,
      };
    }

    const _dataSource = addChildNode(
      dataSource,
      key,
      newNode as BindConfigWithSub,
    );
    setDataSource(_dataSource);

    // 设置默认展开行
    const _expandedRowKeys = [...expandedRowKeys];
    if (!_expandedRowKeys.includes(key)) {
      _expandedRowKeys.push(key);
    }
    if (dataType === DataTypeEnum.Array_Object) {
      _expandedRowKeys.push(...keys);
    }
    setExpandedRowKeys(_expandedRowKeys);
  };

  // 配置删除操作
  const handleInputDel = (key: React.Key) => {
    const _dataSource = deleteNode(dataSource, key);
    setDataSource(_dataSource);
  };

  // 入参配置columns
  const inputColumns = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      render: (_: string, record: BindConfigWithSub) => (
        <ParamsNameLabel
          require={record.require}
          paramName={record.name}
          paramType={record.dataType as DataTypeEnum}
        />
      ),
    },
    {
      title: '参数值',
      dataIndex: 'description',
      key: 'description',
      render: (_: string, record: BindConfigWithSub) => (
        <>
          {DataTypeEnum.Object === record.dataType ||
          DataTypeEnum.Array_Object === record.dataType ||
          record.dataType?.includes('Array') ? null : (
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
      width: 60,
      align: 'center',
      render: (_, record: BindConfigWithSub, index: number) => (
        <Space size="middle">
          {record.dataType?.includes('Array') ? (
            <ICON_ADD_TR
              className={cx('cursor-pointer')}
              onClick={() => handleInputAddChild(record)}
            />
          ) : record.name === ARRAY_ITEM && index !== 0 ? (
            // Array_Object时，第一项不能删除
            <DeleteOutlined onClick={() => handleInputDel(record.key)} />
          ) : null}
        </Space>
      ),
    },
  ];

  // 处理Array_Object
  const handleArrayObject = (data: BindConfigWithSub[]) => {
    return data?.map((item) => {
      const { subArgs } = item;
      const _params = {};
      subArgs?.forEach((info) => {
        // 如果是非数组默认名称（Array_Item）对象
        if (info.dataType === DataTypeEnum.Object && info.name !== ARRAY_ITEM) {
          const obj = {};
          info.subArgs?.forEach((info) => {
            obj[info.name] = info.bindValue;
          });
          _params[info.name] = obj;
        }
        // 数据类型是Array，但不是Array_Object
        else if (
          info.dataType?.includes('Array') &&
          !info.dataType?.includes('Object')
        ) {
          _params[info.name] = info.subArgs?.map((_arg) => _arg.bindValue);
        }
        // 数据类型不是Array，也不是Object
        else if (
          !info.dataType?.includes('Array') &&
          info.dataType !== DataTypeEnum.Object
        ) {
          _params[info.name] = info.bindValue;
        } else {
          // 系统对象（Array_Item）
          _params[info.name] = handleArrayObject(
            info?.subArgs as BindConfigWithSub[],
          );
        }
      });
      return _params;
    });
  };

  // 处理入参列表数据
  const handleDataSource = (treeData: BindConfigWithSub[]) => {
    // const params = {};
    const arrayItem = (data: BindConfigWithSub[]) => {
      const params = {};
      data?.forEach((item) => {
        const { name, dataType, subArgs } = item;
        // 数据类型不是Array，也不是Object
        if (!dataType?.includes('Array') && dataType !== DataTypeEnum.Object) {
          params[name] = item.bindValue;
        }
        // 数据类型是Array，但不是Array_Object
        if (dataType?.includes('Array') && !dataType?.includes('Object')) {
          params[name] = item.subArgs?.map((info) => info.bindValue);
        }
        if (dataType === DataTypeEnum.Object && name !== ARRAY_ITEM) {
          const obj = {};
          subArgs?.forEach((info) => {
            obj[info.name] = info.bindValue;
          });
          params[name] = obj;
        }

        if (
          dataType === DataTypeEnum.Array_Object &&
          subArgs &&
          subArgs?.length > 0
        ) {
          params[name] = handleArrayObject(subArgs);
        }
      });
      return params;
    };
    return arrayItem(treeData);
  };

  // 自动解析
  const handleAutoResolve = () => {
    const params = handleDataSource(dataSource);
    runPluginAnalysis({
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
      destroyOnClose
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
            <h3>自动解析</h3>
            <CloseOutlined
              className={cx('cursor-pointer')}
              onClick={onCancel}
            />
          </header>
          {/*内容区*/}
          <div className={cx('flex-1', 'flex', 'flex-col', 'overflow-hide')}>
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
                  <Button
                    type="primary"
                    onClick={handleAutoResolve}
                    loading={loadingAnalysis}
                  >
                    自动解析
                  </Button>
                </div>
              )}
            />
          </div>
        </div>
      )}
    ></Modal>
  );
};

export default PluginAutoAnalysis;
