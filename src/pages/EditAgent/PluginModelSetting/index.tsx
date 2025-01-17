import { PLUGIN_SETTING_ACTIONS } from '@/constants/space.contants';
import { PluginSettingEnum } from '@/types/enums/space';
import { CloseOutlined } from '@ant-design/icons';
import { Modal, Space, Table, TableProps, Tag } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PluginModelSettingProps {
  open: boolean;
  onCancel: () => void;
}

interface DataType {
  key: string;
  name: string;
  age: number;
  address: string;
  tags: string[];
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: '参数名称',
    dataIndex: 'name',
    key: 'name',
    render: (text) => <a>{text}</a>,
  },
  {
    title: '参数类型',
    dataIndex: 'age',
    key: 'age',
  },
  {
    title: '必填',
    dataIndex: 'address',
    key: 'address',
  },
  {
    title: '默认值',
    key: 'tags',
    dataIndex: 'tags',
    render: (_, { tags }) => (
      <>
        {tags.map((tag) => {
          let color = tag.length > 5 ? 'geekblue' : 'green';
          if (tag === 'loser') {
            color = 'volcano';
          }
          return (
            <Tag color={color} key={tag}>
              {tag.toUpperCase()}
            </Tag>
          );
        })}
      </>
    ),
  },
  {
    title: '开启',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a>Invite {record.name}</a>
        <a>Delete</a>
      </Space>
    ),
  },
];

const data: DataType[] = [
  {
    key: '1',
    name: 'John Brown',
    age: 32,
    address: 'New York No. 1 Lake Park',
    tags: ['nice', 'developer'],
  },
  {
    key: '2',
    name: 'Jim Green',
    age: 42,
    address: 'London No. 1 Lake Park',
    tags: ['loser'],
  },
  {
    key: '3',
    name: 'Joe Black',
    age: 32,
    address: 'Sydney No. 1 Lake Park',
    tags: ['cool', 'teacher'],
  },
];

const PluginModelSetting: React.FC<PluginModelSettingProps> = ({
  open,
  onCancel,
}) => {
  const [action, setAction] = useState<PluginSettingEnum>(
    PluginSettingEnum.Params,
  );

  const handlerClick = (type: PluginSettingEnum) => {
    setAction(type);
  };

  const Content: React.FC = () => {
    switch (action) {
      case PluginSettingEnum.Params:
        return <Table<DataType> columns={columns} dataSource={data} />;
      case PluginSettingEnum.Card_Bind:
        return null;
    }
  };

  return (
    <Modal
      centered
      open={open}
      footer={null}
      onCancel={onCancel}
      className={cx(styles['modal-container'])}
      modalRender={() => (
        <div className={cx(styles.container, 'flex', 'overflow-hide')}>
          <div className={cx(styles.left)}>
            <h3>设置</h3>
            <ul>
              {PLUGIN_SETTING_ACTIONS.map((item) => (
                <li
                  key={item.type}
                  className={cx(styles.item, 'cursor-pointer', {
                    [styles.checked]: action === item.type,
                  })}
                  onClick={() => handlerClick(item.type)}
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
          <div className={cx('flex-1', styles.right)}>
            <Content />
          </div>
          <CloseOutlined
            className={cx(styles.close, 'cursor-pointer')}
            onClick={onCancel}
          />
        </div>
      )}
    ></Modal>
  );
};

export default PluginModelSetting;
