import LabelStar from '@/components/LabelStar';
import { AGENT_VARIABLES_INPUT_OPTIONS } from '@/constants/agent.constants';
import { apiAgentComponentVariableUpdate } from '@/services/agentConfig';
import { InputTypeEnum, UpdateVariablesTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import type { CreateVariablesProps } from '@/types/interfaces/agentConfig';
import { BindConfigWithSub } from '@/types/interfaces/common';
import {
  DeleteOutlined,
  FormOutlined,
  HolderOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, message, Modal, Space, Table, TableColumnsType } from 'antd';
import classNames from 'classnames';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import CreateVariableModal from './CreateVariableModal';
import styles from './index.less';

const cx = classNames.bind(styles);

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

interface RowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  'data-row-key': string;
}

const Row: React.FC<RowProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props['data-row-key'] });

  const style: React.CSSProperties = {
    ...props.style,
    ...(isDragging ? { position: 'relative' } : {}),
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
    paddingRight: '10px',
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

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
  // const tableRef = useRef<any>(null);
  // 缓存输入数据，用于重置父级组件table表单
  const inputDataRef = useRef<BindConfigWithSub[]>([]);
  // 更新变量操作类型
  const updateVariablesTypeRef = useRef<UpdateVariablesTypeEnum>(
    UpdateVariablesTypeEnum.Delete,
  );

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
        if (updateVariablesTypeRef.current === UpdateVariablesTypeEnum.Delete) {
          message.success('删除成功');
        } else {
          message.success('更新成功');
        }
        isAddedNewVariable.current = true;
        setInputData(inputDataRef.current);
      },
    },
  );

  // 更新变量
  const handleUpdateVariables = (newInputData: BindConfigWithSub[]) => {
    const data = {
      id: variablesInfo?.id,
      targetId: variablesInfo?.targetId,
      bindConfig: { variables: newInputData },
    };

    runVariableUpdate(data);
  };

  // 删除变量
  const handleDel = (key: string) => {
    const newInputData = inputData.filter((item) => item.key !== key);
    inputDataRef.current = newInputData;
    updateVariablesTypeRef.current = UpdateVariablesTypeEnum.Delete;
    // 更新变量
    handleUpdateVariables(newInputData);
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      dataIndex: 'sort',
      key: 'sort',
      align: 'center',
      width: 40,
      render: (_, record) => !record.systemVariable && <DragHandle />,
    },
    {
      title: <LabelStar label="名称" />,
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: true,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: 180,
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
      width: 70,
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

  // // 滚动到底部的函数
  // const scrollToBottom = () => {
  //   // 滚动到底部
  //   tableRef.current?.scrollTo({
  //     top: tableRef.current?.scrollHeight,
  //     behavior: 'smooth',
  //   });
  // };

  // useEffect(() => {
  //   if (open) {
  //     // 滚动到底部的函数
  //     scrollToBottom();
  //   }
  // }, [open]);

  // 更新变量配置数据
  const handleConfirm = (newInputData: BindConfigWithSub[]) => {
    setVariableModalOpen(false);
    setInputData(newInputData);
    isAddedNewVariable.current = true;
    // scrollToBottom();
  };

  // 取消操作
  const handleCancel = () => {
    setVariableModalOpen(false);
    // 是否新增、编辑或删除变量了， 如果是，关闭弹窗后，刷新变量列表，如果没有，仅关闭弹窗
    if (isAddedNewVariable.current) {
      onConfirm();
    } else {
      onCancel();
    }
  };

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // 更新变量操作类型: 拖拽
      updateVariablesTypeRef.current = UpdateVariablesTypeEnum.Drag;
      // 更新变量
      const _activeIndex = inputData.findIndex(
        (record) => record.key === active?.id,
      );
      const _overIndex = inputData.findIndex(
        (record) => record.key === over?.id,
      );
      const newInputData = arrayMove(inputData, _activeIndex, _overIndex);

      inputDataRef.current = newInputData;
      setInputData(newInputData);
      // 更新变量
      handleUpdateVariables(newInputData);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <Modal
      width={800}
      title="变量"
      open={open}
      footer={null}
      onCancel={handleCancel}
    >
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={inputData.map((item) => item.key as string)}
          strategy={verticalListSortingStrategy}
        >
          <Table<BindConfigWithSub>
            // ref={tableRef}
            rowKey="key"
            components={{ body: { row: Row } }}
            className={cx(styles['table-container'], 'overflow-hide')}
            columns={inputColumns}
            dataSource={inputData}
            pagination={false}
            virtual
            scroll={{
              y: 560,
            }}
            footer={() => (
              <Button icon={<PlusOutlined />} onClick={handleAddVariable}>
                新增
              </Button>
            )}
          />
        </SortableContext>
      </DndContext>
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
  );
};

export default CreateVariables;
