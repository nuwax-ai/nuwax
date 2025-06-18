import Created from '@/components/Created';
import CustomFormModal from '@/components/CustomFormModal';
import { AGENT_VARIABLES_INPUT_OPTIONS } from '@/constants/agent.constants';
import { apiAgentComponentVariableUpdate } from '@/services/agentConfig';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
  InputTypeEnum,
  OptionDataSourceEnum,
} from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import {
  AgentAddComponentStatusInfo,
  CreateVariableModalProps,
} from '@/types/interfaces/agentConfig';
import { CreatedNodeItem, option } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { PlusOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  Checkbox,
  Form,
  FormProps,
  Input,
  message,
  Radio,
  Tabs,
  TabsProps,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import DragManualCreateItem from './DragManualCreateItem';
import styles from './index.less';
import PluginBinding from './PluginBinding';

const cx = classNames.bind(styles);

// 创建变量弹窗组件
const CreateVariableModal: React.FC<CreateVariableModalProps> = ({
  mode = CreateUpdateModeEnum.Create,
  currentVariable,
  id,
  targetId,
  inputData,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 输入方式，默认为文本
  const [inputType, setInputType] = useState<InputTypeEnum>(InputTypeEnum.Text);
  // 选项数据源，默认为手动创建
  const [activeTabKey, setActiveTabKey] = useState<OptionDataSourceEnum>(
    OptionDataSourceEnum.MANUAL,
  );
  // 选项数据源，默认为手动创建
  const [dataSource, setDataSource] = useState<option[]>([
    { id: uuidv4(), value: '', label: '' },
    { id: uuidv4(), value: '', label: '' },
  ]);
  // 绑定值，默认为空字符串 （为何不直接用Form.Item的name值呢？ 因为切换输入方式时，会导致footer确定按钮disabled会出现错误）
  const [bindValue, setBindValue] = useState<string>('');
  // 打开绑定组件弹窗
  const [show, setShow] = useState<boolean>(false);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 绑定组件
  const [targetComponentInfo, setTargetComponentInfo] =
    useState<CreatedNodeItem | null>(null);
  // 缓存输入数据，用于重置父级组件table表单
  const inputDataRef = useRef<BindConfigWithSub[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      // 新建模式
      if (mode === CreateUpdateModeEnum.Create) {
        setInputType(InputTypeEnum.Text);
        form.setFieldValue('inputType', InputTypeEnum.Text);
        // 绑定组件重置
        setTargetComponentInfo(null);
        setActiveTabKey(OptionDataSourceEnum.MANUAL);
        setDataSource([
          { id: uuidv4(), value: '', label: '' },
          { id: uuidv4(), value: '', label: '' },
        ]);
        setBindValue('');
      }
      // 编辑模式, 回显数据
      else if (mode === CreateUpdateModeEnum.Update && currentVariable) {
        const {
          name,
          displayName,
          require,
          inputType,
          description,
          selectConfig,
          bindValue,
        } = currentVariable;
        // 输入方式，默认为文本
        setInputType(inputType as InputTypeEnum);
        // 选项数据源
        setActiveTabKey(selectConfig?.dataSourceType as OptionDataSourceEnum);
        // 如果绑定了组件（插件、工作流），回显绑定组件信息
        if (
          selectConfig?.dataSourceType === OptionDataSourceEnum.BINDING &&
          selectConfig?.targetId
        ) {
          setAddComponents([
            {
              type: selectConfig?.targetType as AgentComponentTypeEnum,
              targetId: selectConfig?.targetId as number,
              status: AgentAddComponentStatusEnum.Added,
            },
          ]);
        }
        // 下拉参数配置列表存在
        else if (selectConfig && selectConfig?.options?.length > 0) {
          // 手动创建选项数据源
          setDataSource(
            selectConfig?.options?.map(
              (item) =>
                ({
                  ...item,
                  id: uuidv4(),
                } as option),
            ) || [],
          );
        }

        // 默认值，默认为空字符串
        setBindValue(bindValue || '');
        // 绑定值，重置表单
        form.setFieldsValue({
          name,
          displayName,
          require,
          inputType,
          description,
        });
      }
    }
  }, [open, mode, currentVariable]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setDataSource((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 删除选项
  const handleDelete = (id: string) => {
    setDataSource((items) => items.filter((item) => item.id !== id));
  };

  // 添加选项
  const handleAddItem = () => {
    setDataSource((items) => [
      ...items,
      { id: uuidv4(), value: '', label: '' },
    ]);
  };

  // 输入框内容变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const value = e.target.value;
    setDataSource((items) => {
      const newItems = [...items];
      const index = newItems.findIndex((item) => item.id === id);
      if (index !== -1) {
        newItems[index].value = value;
        newItems[index].label = value;
      }
      return newItems;
    });
  };

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
    const { targetId, targetType } = info;
    setTargetComponentInfo(info);
    setAddComponents([
      {
        type: targetType,
        targetId: targetId,
        status: AgentAddComponentStatusEnum.Added,
      },
    ]);
  };

  // 手动创建选项数据源
  const items: TabsProps['items'] = [
    {
      key: OptionDataSourceEnum.MANUAL,
      label: '手动创建',
      children: (
        <div className={cx('flex', 'flex-col', 'gap-10')}>
          <DndContext
            modifiers={[restrictToVerticalAxis]}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={dataSource.map((item) => item.id as string)}
              strategy={verticalListSortingStrategy}
            >
              {dataSource?.map((item) => {
                const id = item.id as string;
                const value = item.value as string;
                return (
                  <DragManualCreateItem
                    key={id}
                    id={id}
                    value={value}
                    onChange={(e) => handleChange(e, id)}
                    onDelete={() => handleDelete(id)}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
          <div className={cx(styles['add-item-btn'])} onClick={handleAddItem}>
            <PlusOutlined />
            添加选项
          </div>
        </div>
      ),
    },
    {
      key: OptionDataSourceEnum.BINDING,
      label: '插件绑定',
      children: (
        <PluginBinding
          targetType={currentVariable?.selectConfig?.targetType}
          targetIcon={currentVariable?.selectConfig?.targetIcon}
          targetName={currentVariable?.selectConfig?.targetName}
          targetComponentInfo={targetComponentInfo}
          onClick={() => setShow(true)}
        />
      ),
    },
  ];

  // 更新变量配置
  const { run: runVariableUpdate } = useRequest(
    apiAgentComponentVariableUpdate,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        setLoading(false);
        message.success('变量更新成功');
        onConfirm(inputDataRef.current);
      },
      onError: () => {
        setLoading(false);
      },
    },
  );

  // 表单提交
  const onFinish: FormProps<BindConfigWithSub>['onFinish'] = (values) => {
    // 下拉参数配置：如果输入方式是单选或多选，需要配置选项数据源
    let selectConfig = null,
      _bindValue = bindValue;
    // 单选、多选时需要配置选项数据源
    if (
      [InputTypeEnum.Select, InputTypeEnum.MultipleSelect].includes(inputType)
    ) {
      // tabs切换到"插件绑定"时，需要选择绑定组件才能提交
      if (activeTabKey === OptionDataSourceEnum.MANUAL && !dataSource?.length) {
        message.error('请添加选项');
        return;
      }

      // tabs切换到"插件绑定"时，需要选择绑定组件才能提交
      if (
        activeTabKey === OptionDataSourceEnum.BINDING &&
        !targetComponentInfo
      ) {
        message.error('请选择绑定组件');
        return;
      }

      selectConfig = {
        dataSourceType: activeTabKey,
        targetType: targetComponentInfo?.targetType,
        targetId: targetComponentInfo?.targetId,
        options: activeTabKey === OptionDataSourceEnum.MANUAL ? dataSource : [],
      };

      _bindValue = '';
    }

    // 最新数据
    const newData = {
      ...values,
      bindValue: _bindValue,
      systemVariable: false,
      selectConfig,
    };

    let newInputData;
    // 编辑模式，需要更新数据
    if (mode === CreateUpdateModeEnum.Update && currentVariable) {
      newInputData = inputData.map((item) => {
        if (item.key === currentVariable.key) {
          return { ...item, ...newData };
        }
        return item;
      });
    } else {
      // 新增变量，需要添加key
      newInputData = [
        ...inputData,
        {
          ...newData,
          key: uuidv4(),
        },
      ];
    }

    // 缓存最新的数据，用于更新变量配置
    inputDataRef.current = newInputData as BindConfigWithSub[];
    const data = {
      id,
      targetId,
      bindConfig: {
        variables: newInputData,
      },
    };
    setLoading(true);
    runVariableUpdate(data);
  };

  const handleConfirm = () => {
    form.submit(); // 提交表
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      loading={loading}
      classNames={{ body: cx(styles['modal-body-container']) }}
      title="编辑或添加变量"
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="字段名称"
          rules={[{ required: true, message: '请输入字段名称' }]}
        >
          <Input
            placeholder="请输入字段名称，符合字段命名规划"
            showCount
            maxLength={30}
          />
        </Form.Item>
        <Form.Item
          name="displayName"
          label="展示名称"
          rules={[{ required: true, message: '请输入字段展示名称' }]}
        >
          <Input
            placeholder="请输入字段展示名称，供前端展示使用"
            showCount
            maxLength={30}
          />
        </Form.Item>
        <Form.Item name="description" label="描述">
          <Input.TextArea
            className="dispose-textarea-count"
            placeholder="请输入字段描述"
            showCount
            maxLength={200}
            autoSize={{ minRows: 3, maxRows: 5 }}
          />
        </Form.Item>
        <Form.Item name="inputType" label="输入方式">
          <Radio.Group
            className={cx(styles['radio-group'])}
            options={AGENT_VARIABLES_INPUT_OPTIONS}
            value={inputType}
            onChange={(e) => setInputType(e.target.value as InputTypeEnum)}
          ></Radio.Group>
        </Form.Item>
        {/* 单选、多选时显示Tabs */}
        {[InputTypeEnum.Select, InputTypeEnum.MultipleSelect].includes(
          inputType,
        ) ? (
          <Tabs
            rootClassName={cx(styles.tab)}
            activeKey={activeTabKey}
            onChange={(key) => setActiveTabKey(key as OptionDataSourceEnum)}
            items={items}
          />
        ) : (
          <Form.Item className={cx('mb-16')} label="默认值">
            <Input.TextArea
              value={bindValue}
              onChange={(e) => setBindValue(e.target.value)}
              placeholder="请输入默认值"
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
        )}
        <Form.Item name="require" valuePropName="checked">
          <Checkbox>必填</Checkbox>
        </Form.Item>
      </Form>
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        open={show}
        onCancel={() => setShow(false)}
        checkTag={AgentComponentTypeEnum.Plugin}
        addComponents={addComponents}
        onAdded={handleAddComponent}
        hideTop={[
          AgentComponentTypeEnum.Knowledge,
          AgentComponentTypeEnum.Table,
        ]}
      />
    </CustomFormModal>
  );
};

export default CreateVariableModal;
