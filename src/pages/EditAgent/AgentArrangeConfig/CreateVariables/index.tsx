import { apiAgentComponentVariableUpdate } from '@/services/agentConfig';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import type { CreateVariablesProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, message, Modal, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建、更新变量弹窗
const CreateVariables: React.FC<CreateVariablesProps> = ({
  open,
  variablesInfo,
  onCancel,
  onConfirm,
}) => {
  const [inputData, setInputData] = useState<BindConfigWithSub[]>([]);

  useEffect(() => {
    const variables: BindConfigWithSub[] =
      variablesInfo?.bindConfig?.variables || [];
    if (variables?.length > 0) {
      const _variables = variables.map((item) => {
        return {
          ...item,
          key: Math.random(),
        };
      });
      setInputData(_variables);
    }
  }, [variablesInfo]);

  // 更新变量配置
  const { run: runVariableUpdate } = useRequest(
    apiAgentComponentVariableUpdate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success('变量更新成功');
        onConfirm();
      },
    },
  );

  const handleInputValue = (index: number, attr: string, value: React.Key) => {
    const _inputData = [...inputData];
    _inputData[index][attr] = value;
    setInputData(_inputData);
  };

  const handleAddChildren = () => {
    const data = {
      key: Math.random(),
      name: '',
      description: '',
      systemVariable: false,
      bindValue: '',
    };
    const _inputData = [...inputData];
    _inputData.push(data);
    setInputData(_inputData);
  };
  const handleDel = (index: number) => {
    const _inputData = [...inputData];
    _inputData.splice(index, 1);
    setInputData(_inputData);
  };

  const handleOk = () => {
    const data = {
      id: variablesInfo.id,
      targetId: variablesInfo.targetId,
      bindConfig: {
        variables: inputData,
      },
    };
    runVariableUpdate(data);
  };

  // 入参配置columns
  const inputColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (value: string, record: BindConfigWithSub, index: number) => (
        <>
          {record?.systemVariable ? (
            <span>{value}</span>
          ) : (
            <Input
              placeholder="输入变量名称"
              value={value}
              onChange={(e) => handleInputValue(index, 'name', e.target.value)}
            />
          )}
        </>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (value: string, record: BindConfigWithSub, index: number) => (
        <>
          {record?.systemVariable ? (
            <span>{value}</span>
          ) : (
            <Input
              placeholder="输入变量描述信息"
              value={value}
              onChange={(e) =>
                handleInputValue(index, 'description', e.target.value)
              }
            />
          )}
        </>
      ),
    },
    {
      title: '类型',
      dataIndex: 'systemVariable',
      key: 'systemVariable',
      width: 100,
      render: (value: boolean) => (
        <span>{value ? '系统变量' : '自定义变量'}</span>
      ),
    },
    {
      title: '默认值',
      dataIndex: 'bindValue',
      key: 'bindValue',
      width: 150,
      render: (value: string, record: BindConfigWithSub, index: number) => (
        <>
          {record?.systemVariable ? (
            <span>--</span>
          ) : (
            <Space className={cx('flex', 'content-between')}>
              <Input
                placeholder="输入默认值（选填）"
                value={value}
                onChange={(e) =>
                  handleInputValue(index, 'bindValue', e.target.value)
                }
              />
              <span
                className={cx('hover-box', 'cursor-pointer')}
                onClick={() => handleDel(index)}
              >
                <DeleteOutlined />
              </span>
            </Space>
          )}
        </>
      ),
    },
  ];

  return (
    <Modal
      width={650}
      title="变量"
      open={open}
      cancelText="取消"
      okText="保存"
      onCancel={onCancel}
      onOk={handleOk}
    >
      <Table<BindConfigWithSub>
        className={cx(styles['table-container'], 'overflow-hide')}
        columns={inputColumns}
        dataSource={inputData}
        pagination={false}
        footer={() => (
          <Button icon={<PlusOutlined />} onClick={handleAddChildren}>
            新增
          </Button>
        )}
      />
    </Modal>
  );
};

export default CreateVariables;
