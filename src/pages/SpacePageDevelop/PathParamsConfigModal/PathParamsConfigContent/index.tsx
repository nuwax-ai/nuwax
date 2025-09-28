import LabelStar from '@/components/LabelStar';
import PluginConfigTitle from '@/components/PluginConfigTitle';
import { AFFERENT_MODE_LIST } from '@/constants/library.constants';
import { InputTypeEnum } from '@/types/enums/common';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { DeleteOutlined } from '@ant-design/icons';
import { Button, Checkbox, Input, Select, Table, TableColumnsType } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 路径参数配置内容
 */
const PathParamsConfigContent: React.FC = () => {
  // 入参配置
  const [inputConfigArgs, setInputConfigArgs] = useState<BindConfigWithSub[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(false);

  // 入参配置 - 新增
  const handleInputConfigAdd = () => {
    const _inputConfigArgs = [...inputConfigArgs];
    _inputConfigArgs.push({
      key: uuidv4(),
      name: '',
      description: '',
      inputType: InputTypeEnum.Query,
      displayName: '',
      require: false,
      bindValue: '',
      enable: true,
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 入参配置 - 删除
  const handleInputDel = (key: React.Key) => {
    const _inputConfigArgs = inputConfigArgs.filter(
      (item: BindConfigWithSub) => item.key !== key,
    );
    setInputConfigArgs(_inputConfigArgs);
  };

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | boolean,
  ) => {
    const _inputConfigArgs = [...inputConfigArgs];
    _inputConfigArgs.forEach((item: BindConfigWithSub) => {
      if (item.key === key) {
        item[attr] = value;
      }
    });
    setInputConfigArgs(_inputConfigArgs);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: <LabelStar label="参数名称" />,
      dataIndex: 'name',
      key: 'name',
      className: 'flex items-center',
      render: (value, record) => (
        <Input
          placeholder="请输入参数名称，确保含义清晰"
          value={value}
          onChange={(e) => handleInputValue(record.key, 'name', e.target.value)}
        />
      ),
    },
    {
      title: <LabelStar label="参数描述" />,
      dataIndex: 'description',
      key: 'description',
      render: (value, record) => (
        <Input
          placeholder="请输入参数描述，确保描述详细便于大模型更好的理解"
          value={value}
          onChange={(e) =>
            handleInputValue(record.key, 'description', e.target.value)
          }
        />
      ),
    },
    {
      title: <LabelStar label="传入方式" />,
      dataIndex: 'inputType',
      key: 'inputType',
      width: 120,
      render: (value, record) => (
        <Select
          options={AFFERENT_MODE_LIST}
          value={value}
          onChange={(value) => handleInputValue(record.key, 'inputType', value)}
        />
      ),
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      width: 100,
      align: 'center',
      render: (value, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Checkbox
            checked={value}
            onChange={(e) =>
              handleInputValue(record.key, 'require', e.target.checked)
            }
          />
        </div>
      ),
    },
    {
      title: '默认值',
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (value, record) => (
        <Input
          placeholder="请输入默认值"
          value={value}
          onChange={(e) =>
            handleInputValue(record.key, 'bindValue', e.target.value)
          }
        />
      ),
    },
    {
      title: '开启',
      dataIndex: 'enable',
      key: 'enable',
      width: 70,
      align: 'center',
      render: (value: boolean, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Checkbox
            disabled={record.require && !record.bindValue}
            checked={value}
            onChange={(e) =>
              handleInputValue(record.key, 'enable', e.target.checked)
            }
          />
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center', 'content-center')}>
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleInputDel(record.key)}
          />
        </div>
      ),
    },
  ];

  // 保存
  const handleSave = () => {
    console.log('handleSave');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <PluginConfigTitle
        className="px-16"
        title="入参配置"
        onClick={handleInputConfigAdd}
      />
      <Table<BindConfigWithSub>
        columns={inputColumns}
        dataSource={inputConfigArgs}
        virtual
        scroll={{
          y: 420,
        }}
        pagination={false}
      />
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave} loading={loading}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default PathParamsConfigContent;
