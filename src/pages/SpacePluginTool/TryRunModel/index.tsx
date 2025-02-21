import { apiPluginTest } from '@/services/plugin';
import { DataTypeEnum } from '@/types/enums/common';
import type { BindConfigWithSub } from '@/types/interfaces/agent';
import type { TryRunModelProps } from '@/types/interfaces/library';
import { PluginTestResult } from '@/types/interfaces/plugin';
import { CloseOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Checkbox, Input, message, Modal, Table } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import styles from './index.less';
import ParamsNameLabel from './ParamsNameLabel';

const cx = classNames.bind(styles);

// 试运行弹窗组件
const TryRunModel: React.FC<TryRunModelProps> = ({
  inputConfigArgs,
  pluginId,
  pluginName,
  open,
  onCancel,
}) => {
  // 查询插件信息
  const { run: runTest } = useRequest(apiPluginTest, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: PluginTestResult) => {
      console.log(result);
      if (!result.success) {
        message.warning(result.error);
      }
    },
  });

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub>['columns'] = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      className: 'flex',
      render: (_, record) =>
        record.require ? (
          <ParamsNameLabel paramName={record.name} paramType="string" />
        ) : (
          <span>{record.name}</span>
        ),
    },
    {
      title: '参数值',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) => (
        <>
          {record?.dataType === DataTypeEnum.Object ? null : (
            <Input placeholder="请输入参数值" />
          )}
          <p className={cx(styles['param-desc'])}>{record.description}</p>
        </>
      ),
    },
  ];

  const handleRunTest = () => {
    runTest({
      requestId: '',
      pluginId,
      params: {},
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
                dataSource={inputConfigArgs}
                pagination={false}
                virtual
                expandable={{
                  defaultExpandAllRows: true,
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
                {/*todo*/}
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
              </div>
            </div>
          </section>
          {/*footer*/}
          <div
            className={cx('flex', 'items-center', 'content-end', styles.footer)}
          >
            <Checkbox>保存调试结果为工具使用示例</Checkbox>
            <div className={cx(styles['divider-vertical'])} />
            <Button type="primary" onClick={onCancel}>
              完成
            </Button>
          </div>
        </div>
      )}
    ></Modal>
  );
};

export default TryRunModel;
