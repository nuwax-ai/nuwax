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
  Button,
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
  // 绑定值，默认为空字符串
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
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setInputType(InputTypeEnum.Text); // 重置表单
      form.setFieldValue('inputType', InputTypeEnum.Text); // 重置表单
      setTargetComponentInfo(null);
    }
  }, [open]);

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
              {dataSource?.map((item) => (
                <DragManualCreateItem
                  key={item.id as string}
                  id={item.id as string}
                  onChange={(e) => handleChange(e, item.id as string)}
                  onDelete={() => handleDelete(item.id as string)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <Button
            type="primary"
            block
            onClick={handleAddItem}
            icon={<PlusOutlined />}
          >
            添加选项
          </Button>
        </div>
      ),
    },
    {
      key: OptionDataSourceEnum.BINDING,
      label: '插件绑定',
      children: (
        <PluginBinding
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
      key: uuidv4(),
      systemVariable: false,
      selectConfig,
    };
    const newInputData = [...inputData, newData];
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
