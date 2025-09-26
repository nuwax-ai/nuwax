import { ReverseProxyEnum } from '@/types/enums/space';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { Button, Input, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 反向代理内容配置Props
 */
interface ReverseProxyContentConfigProps {
  type: ReverseProxyEnum;
}

/**
 * 反向代理内容配置
 */
const ReverseProxyContentConfig: React.FC<ReverseProxyContentConfigProps> = ({
  type,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [configArgs, setConfigArgs] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setConfigArgs([]);
      setLoading(false);
    }, 1000);
  }, [type]);

  // 保存
  const handleSave = async (record: any) => {
    console.log(record);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<any> = [
    {
      title: '路径',
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center table-params-name-td',
      render: (_, record) => (
        <div className={cx('flex', 'flex-col')}>
          {record.action === 'edit' ? (
            <Input placeholder="请输入路径" />
          ) : (
            <span className={cx('text-ellipsis')}>{record.name}</span>
          )}
        </div>
      ),
    },
    {
      title: '后端地址',
      dataIndex: 'dataType',
      key: 'dataType',
      render: (_, record) => (
        <div className={cx('flex', 'flex-col')}>
          {record.action === 'edit' ? (
            <Input placeholder="请输入后端地址" />
          ) : (
            <span className={cx('text-ellipsis')}>{record.address}</span>
          )}
        </div>
      ),
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          {record.action !== 'edit' ? (
            <>
              <EditOutlined />
              <DeleteOutlined />
            </>
          ) : (
            <Button onClick={() => handleSave(record)}>保存</Button>
          )}
        </div>
      ),
    },
  ];

  const handleAddConfig = () => {
    setConfigArgs([
      ...configArgs,
      {
        key: uuidv4(),
        name: '',
        address: '',
        action: 'edit',
      },
    ]);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <Table<any>
        columns={inputColumns}
        dataSource={configArgs}
        loading={loading}
        pagination={false}
        virtual
        scroll={{
          y: 320,
        }}
        footer={() =>
          !loading && (
            <Button icon={<PlusOutlined />} onClick={handleAddConfig}>
              新增配置
            </Button>
          )
        }
      />
    </div>
  );
};

export default ReverseProxyContentConfig;
