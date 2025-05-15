import ParamsNameLabel from '@/components/ParamsNameLabel';
import { ARRAY_ITEM } from '@/constants/common.constants';
import { ICON_ADD_TR } from '@/constants/images.constants';
import useTryRun from '@/hooks/useTryRun';
import { apiPluginTest } from '@/services/plugin';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { PluginTryRunModelProps } from '@/types/interfaces/library';
import type { PluginTestResult } from '@/types/interfaces/plugin';
import {
  CloseOutlined,
  DeleteOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 试运行弹窗组件
const PluginTryRunModel: React.FC<PluginTryRunModelProps> = ({
  inputConfigArgs,
  inputExpandedRowKeys,
  pluginId,
  pluginName,
  open,
  onCancel,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  // 试运行结果
  const [result, setResult] = useState<string>('');
  const {
    handleInit,
    dataSource,
    handleDataSource,
    expandedRowKeys,
    handleInputValue,
    handleInputAddChild,
    handleInputDel,
  } = useTryRun();

  // 插件试运行接口
  const { run: runTest } = useRequest(apiPluginTest, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (res: PluginTestResult) => {
      setLoading(false);
      if (!res.success) {
        message.warning(res.error);
      } else {
        setResult(JSON.stringify(res.result, null, 2));
      }
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    handleInit(inputConfigArgs, inputExpandedRowKeys);
  }, [inputConfigArgs, inputExpandedRowKeys]);

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
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

  // 试运行
  const handleRunTest = () => {
    setResult('');
    setLoading(true);
    const params = handleDataSource(dataSource);
    runTest({
      pluginId,
      params,
    });
  };

  // 取消试运行
  const handleCancel = () => {
    setResult('');
    onCancel();
  };

  return (
    <Modal
      centered
      open={open}
      onCancel={handleCancel}
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
              onClick={handleCancel}
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
                    <Button
                      type="primary"
                      onClick={handleRunTest}
                      loading={loading}
                    >
                      运行
                    </Button>
                  </div>
                )}
              />
            </div>
            {/*右侧内容*/}
            <div className={cx('flex-1', 'flex', 'flex-col', 'overflow-hide')}>
              <h3 className={cx(styles['p-title'])}>{pluginName} 调试结果</h3>
              <div
                className={cx(
                  'flex-1',
                  'radius-6',
                  'overflow-hide',
                  styles['result-wrap'],
                )}
              >
                {loading ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'items-center',
                      'content-center',
                      styles['loading-box'],
                    )}
                  >
                    <LoadingOutlined />
                    <span>加载中...</span>
                  </div>
                ) : result ? (
                  <div
                    className={cx(
                      'h-full',
                      'flex',
                      'flex-col',
                      'px-16',
                      'py-16',
                      'overflow-y',
                    )}
                  >
                    <pre>{result}</pre>
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
                    调试结果将展示在此处
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
