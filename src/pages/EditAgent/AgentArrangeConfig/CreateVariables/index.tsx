import LabelStar from '@/components/LabelStar';
import { AGENT_VARIABLES_INPUT_OPTIONS } from '@/constants/agent.constants';
import { InputTypeEnum } from '@/types/enums/agent';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import type { CreateVariablesProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, FormOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CreateVariableModal from './CreateVariableModal';
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
  // 创建变量弹窗
  const [variableModalOpen, setVariableModalOpen] = useState<boolean>(false);
  // 是否新增变量了， 如果是，关闭弹窗后，刷新变量列表，如果没有，仅关闭弹窗
  const isAddedNewVariable = useRef<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const variables: BindConfigWithSub[] =
      variablesInfo?.bindConfig?.variables || [];
    if (variables?.length > 0) {
      const _variables = variables.map((item) => {
        return {
          ...item,
          key: uuidv4(),
        };
      });
      setInputData(_variables);
    }
  }, [variablesInfo]);

  // 入参配置columns
  const inputColumns = [
    {
      title: <LabelStar label="名称" />,
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'systemVariable',
      key: 'systemVariable',
      className: 'flex',
      width: 100,
      ellipsis: true,
      render: (value: boolean) => (
        <span className={cx('flex', 'items-center')}>
          {value ? '系统变量' : '自定义变量'}
        </span>
      ),
    },
    {
      title: '输入方式',
      dataIndex: 'inputType',
      key: 'inputType',
      render: (value: InputTypeEnum) => (
        <span className={cx('flex', 'items-center')}>
          {AGENT_VARIABLES_INPUT_OPTIONS.find((item) => item.value === value)
            ?.label || '--'}
        </span>
      ),
    },
    {
      title: '是否必须',
      dataIndex: 'require',
      key: 'require',
      render: (value: boolean) => (
        <span className={cx('flex', 'items-center')}>
          {value ? '是' : '否'}
        </span>
      ),
    },
    {
      title: '',
      dataIndex: 'action',
      width: 80,
      render: (_: string, record: BindConfigWithSub) => (
        <>
          {record?.systemVariable ? (
            <span>--</span>
          ) : (
            <Space className={cx('flex', 'content-between')}>
              <FormOutlined />
              <DeleteOutlined />
            </Space>
          )}
        </>
      ),
    },
  ];

  // 滚动到底部的函数
  const scrollToBottom = () => {
    if (tableRef.current) {
      const scrollElement = tableRef.current.querySelector('.ant-table-body');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    // 滚动到底部的函数
    scrollToBottom();
  }, [open]);

  // 更新变量配置数据
  const handleConfirm = (newInputData: BindConfigWithSub[]) => {
    setVariableModalOpen(false);
    setInputData(newInputData);
    isAddedNewVariable.current = true;
    scrollToBottom();
  };

  // 取消操作
  const handleCancel = () => {
    setVariableModalOpen(false);
    // 是否新增变量了， 如果是，关闭弹窗后，刷新变量列表，如果没有，仅关闭弹窗
    if (isAddedNewVariable.current) {
      onConfirm();
    } else {
      onCancel();
    }
  };

  return (
    <>
      <Modal
        width={800}
        title="变量"
        open={open}
        footer={null}
        onCancel={handleCancel}
      >
        <div ref={tableRef}>
          <Table<BindConfigWithSub>
            className={cx(styles['table-container'], 'overflow-hide')}
            columns={inputColumns}
            dataSource={inputData}
            pagination={false}
            scroll={{
              y: 560,
            }}
            footer={() => (
              <Button
                icon={<PlusOutlined />}
                onClick={() => setVariableModalOpen(true)}
              >
                新增
              </Button>
            )}
          />
        </div>
        <CreateVariableModal
          id={variablesInfo?.id}
          targetId={variablesInfo?.targetId}
          inputData={inputData}
          open={variableModalOpen}
          onCancel={() => setVariableModalOpen(false)}
          onConfirm={handleConfirm}
        />
      </Modal>
    </>
  );
};

export default CreateVariables;
