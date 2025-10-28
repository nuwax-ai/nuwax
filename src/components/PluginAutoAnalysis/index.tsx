import ParamsNameLabel from '@/components/ParamsNameLabel';
import { ARRAY_ITEM } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import useTryRun from '@/hooks/useTryRun';
import { apiPluginAnalysisOutput } from '@/services/plugin';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { PluginAutoAnalysisProps } from '@/types/interfaces/library';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

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
  const {
    handleInit,
    dataSource,
    handleDataSource,
    expandedRowKeys,
    handleInputValue,
    handleInputAddChild,
    handleInputDel,
  } = useTryRun();

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
              item.key = uuidv4();
            }
            return item;
          });
          onConfirm(list);
        }
        onCancel();
      },
    },
  );

  useEffect(() => {
    handleInit(inputConfigArgs, inputExpandedRowKeys);
  }, [inputConfigArgs, inputExpandedRowKeys]);

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
      render: (_: null, record: BindConfigWithSub, index: number) => (
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
      destroyOnHidden
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
            />
          </div>
          <div className={cx('text-right')}>
            <Button
              type="primary"
              onClick={handleAutoResolve}
              loading={loadingAnalysis}
            >
              自动解析
            </Button>
          </div>
        </div>
      )}
    ></Modal>
  );
};

export default PluginAutoAnalysis;
