import LabelStar from '@/components/LabelStar';
import { AGENT_VARIABLES_INPUT_OPTIONS } from '@/constants/agent.constants';
import { apiAgentComponentVariableUpdate } from '@/services/agentConfig';
import { InputTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import type { CreateVariablesProps } from '@/types/interfaces/agentConfig';
import { DeleteOutlined, FormOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, message, Modal, Space, Table } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
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
  // 变量列表数据
  const [inputData, setInputData] = useState<BindConfigWithSub[]>([]);
  // 新增、编辑变量的模式，默认为新增
  const [mode, setMode] = useState<CreateUpdateModeEnum>(
    CreateUpdateModeEnum.Create,
  );
  // 当前编辑的变量
  const [currentVariable, setCurrentVariable] =
    useState<BindConfigWithSub | null>();
  // 创建变量弹窗
  const [variableModalOpen, setVariableModalOpen] = useState<boolean>(false);
  // 是否新增、更新变量了， 如果是，关闭弹窗后，刷新变量列表，如果没有，仅关闭弹窗
  const isAddedNewVariable = useRef<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);
  // 缓存输入数据，用于重置父级组件table表单
  const inputDataRef = useRef<BindConfigWithSub[]>([]);

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

  // 编辑变量
  const handleEditVariable = (record: BindConfigWithSub) => {
    setVariableModalOpen(true);
    setMode(CreateUpdateModeEnum.Update);
    setCurrentVariable(record);
  };

  // 新增变量
  const handleAddVariable = () => {
    setVariableModalOpen(true);
    setMode(CreateUpdateModeEnum.Create);
    setCurrentVariable(null);
  };

  // 更新变量配置
  const { run: runVariableUpdate } = useRequest(
    apiAgentComponentVariableUpdate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success('删除成功');
        setInputData(inputDataRef.current);
      },
    },
  );

  // 删除变量
  const handleDel = (key: string) => {
    const newInputData = inputData.filter((item) => item.key !== key);
    inputDataRef.current = newInputData;

    const data = {
      id: variablesInfo?.id,
      targetId: variablesInfo?.targetId,
      bindConfig: {
        variables: newInputData,
      },
    };
    runVariableUpdate(data);
  };

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
              <FormOutlined
                className={cx('cursor-pointer')}
                onClick={() => handleEditVariable(record)}
              />
              <DeleteOutlined
                className={cx('cursor-pointer')}
                onClick={() => handleDel(record.key as string)}
              />
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
              <Button icon={<PlusOutlined />} onClick={handleAddVariable}>
                新增
              </Button>
            )}
          />
        </div>
        <CreateVariableModal
          id={variablesInfo?.id}
          targetId={variablesInfo?.targetId}
          mode={mode}
          currentVariable={currentVariable}
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
