import type {
  tryOutputConfigDataType,
  TryRunModelProps,
} from '@/types/interfaces/library';
import { CloseOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Checkbox, Input, Modal, Table } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import ParamsNameLabel from './ParamsNameLabel';

const cx = classNames.bind(styles);

// 入参配置columns
const inputColumns: TableColumnsType<tryOutputConfigDataType>['columns'] = [
  {
    title: '参数名称',
    dataIndex: 'paramName',
    key: 'paramName',
    className: 'flex',
    render: (_, record) => (
      <ParamsNameLabel paramName={record.paramName} paramType="string" />
    ),
  },
  {
    title: '参数值',
    dataIndex: 'desc',
    key: 'desc',
    render: (_, record) => (
      <>
        {record?.children?.length ? null : (
          <Input placeholder="请输入参数描述，确保描述详细便于大模型更好的理解" />
        )}
        <p className={cx(styles['param-desc'])}>{record.desc}</p>
      </>
    ),
  },
];

// 入参源数据
const inputData: tryOutputConfigDataType[] = [
  {
    key: '1',
    paramName: 'John Brown',
    desc: '这里是参数描述',
    children: [
      {
        key: '11',
        paramName: 'John Brown',
        desc: 'desc',
      },
      {
        key: '12',
        paramName: 'John Brown',
        desc: 'desc',
      },
    ],
  },
];

// 试运行弹窗组件
const TryRunModel: React.FC<TryRunModelProps> = ({ open, onCancel }) => {
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
              <h3 className={cx(styles['p-title'])}>端侧插件1.test输入参数</h3>
              <Table<tryOutputConfigDataType>
                className={cx(styles['table-wrap'])}
                columns={inputColumns}
                dataSource={inputData}
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
                    <Button type="primary" disabled>
                      运行
                    </Button>
                  </div>
                )}
              />
            </div>
            {/*右侧内容*/}
            <div className={cx('flex-1', 'flex', 'flex-col')}>
              <h3 className={cx(styles['p-title'])}>端侧插件1.test 调试结果</h3>
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
            <Button type="primary">完成</Button>
          </div>
        </div>
      )}
    ></Modal>
  );
};

export default TryRunModel;
