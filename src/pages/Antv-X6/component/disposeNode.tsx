import CodeEditor from '@/components/CodeEditor';
import { ICON_OPTIMIZE } from '@/constants/images.constants';
import {
  CaretDownOutlined,
  CaretUpOutlined,
  DeleteOutlined,
  ExpandAltOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Slider,
  Space,
  Typography,
} from 'antd';
import React, { useState } from 'react';
import { useModel } from 'umi';
import '../index.less';
import { dataTypes } from '../params';
import { NodeRenderProps, RenderItemProps } from '../type';
import { default as NodeItem } from './nodeItem';

const { StartNode, EndNode } = NodeItem;

// 默认的renderItem方法
const defaultRenderItem: React.FC<RenderItemProps> = ({
  field,
  onRemove,
  fieldConfigs,
  rowIndex,
}) => {
  return (
    <Space className="dis-sb" style={{ width: '100%' }}>
      {fieldConfigs.map((config, index) => (
        <div key={index}>
          {rowIndex === 0 && <Typography.Text>{config.label}</Typography.Text>}
          <Form.Item
            name={[field.name, config.name]}
            rules={config.rules}
            style={config.style}
          >
            {/* 使用 ...config.props 来传递特定组件的属性 */}
            <config.component
              {...config.props}
              placeholder={config.placeholder}
            />
          </Form.Item>
        </div>
      ))}
      <Form.Item
        name={[field.name, 'isSelect']}
        valuePropName="checked"
        initialValue={true}
      >
        <div className={`dis-sa  ${rowIndex === 0 ? 'right-icon-style' : ''}`}>
          <Checkbox className="margin-right"></Checkbox>
          <DeleteOutlined onClick={onRemove} />
        </div>
      </Form.Item>
    </Space>
  );
};

// 定义通用节点渲染逻辑
const CommonNode: React.FC<NodeRenderProps> = ({
  title,
  fieldConfigs,
  renderItem = defaultRenderItem,
  initialValues,
}) => {
  const [form] = Form.useForm();

  const addInputItem = () => {
    const nextItems = [
      ...(form.getFieldValue('inputItems') || []),
      { name: '', type: '', isSelect: true },
    ];
    form.setFieldsValue({ inputItems: nextItems });
  };
  // 提交form表单
  const submitForm = (values: any) => {
    console.log('Received values of form:', values);
  };

  return (
    <div className="start-node-style">
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">{title}</span>
        <Button
          icon={<PlusOutlined />}
          size={'small'}
          onClick={addInputItem}
        ></Button>
      </div>
      <Form form={form} onFinish={submitForm} initialValues={initialValues}>
        <Form.List name="inputItems">
          {(fields, { remove }, { errors }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item key={field.key} noStyle>
                  {renderItem({
                    field,
                    onRemove: () => remove(field.name),
                    fieldConfigs,
                    rowIndex: index, // 新增传递索引信息
                    form,
                  })}
                </Form.Item>
              ))}
              {errors.length > 0 && (
                <div style={{ color: 'red' }}>{errors.join(', ')}</div>
              )}
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
};

// 定义大模型的节点的渲染
const ModelNode: React.FC = () => {
  // 默认显示高级设置
  const [showDispose, setShowDispose] = useState<boolean>(true);
  // 随机性的值
  const [inputValue, setInputValue] = useState(0);
  //   top的值
  const [topValue, setTopValue] = useState(0);
  //   回复长度
  const [replyValue, setReplyValue] = useState(0);

  // 大模型列表
  const modelListOption = [
    { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
    { label: 'gpt-4', value: 'gpt-4' },
  ];
  const fieldConfigs = [
    {
      name: 'name',
      placeholder: '变量名',
      label: '变量名',
      rules: [{ required: true, message: '请输入变量名' }],
      component: Input,
      style: { width: '165px' },
    },
    {
      name: 'type',
      placeholder: '选择类型',
      label: '变量类型',
      rules: [{ required: true, message: '请选择变量类型' }],
      component: Cascader,
      style: { width: '113px' },
      props: { options: dataTypes }, // 传递特定于 Cascader 的属性
    },
  ];

  const inputfieldConfigs = [
    {
      name: 'name',
      placeholder: '输入参数名',
      label: '参数名',
      rules: [{ required: true, message: '请输入变量名' }],
      component: Input,
      style: { width: '165px' },
    },
    {
      name: 'type',
      placeholder: '输入或引用参数值',
      label: '参数值',
      rules: [{ required: true, message: '请选择变量类型' }],
      component: Input,
      style: { width: '113px' },
    },
  ];
  //   显示新增技能
  const showAdd = () => {
    console.log('showAdd');
  };
  // 改变模式
  const changeSegmented = (value: string) => {
    console.log('changeSegmented', value);
  };

  const content = (
    <>
      <div className="model-dispose-mode-style">
        <div className="dis-sb">
          <span className="label-style">生成多样性</span>
          <Segmented<string>
            options={['精确模式', '平衡模式', '创意模式', '自定义']}
            onChange={(value) => changeSegmented(value)}
            className="slider-style"
          />
          <span
            onClick={() => setShowDispose(!showDispose)}
            className="input-style"
          >
            高级设置 {showDispose ? <CaretUpOutlined /> : <CaretDownOutlined />}
          </span>
        </div>
        <div className="dis-sb">
          <span className="label-style">生成随机性</span>
          <Slider
            min={0}
            max={100}
            onChange={(value: number) => setInputValue(value)}
            value={typeof inputValue === 'number' ? inputValue : 0}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={inputValue}
            onChange={(value: number | string | null) =>
              setInputValue(Number(value))
            }
            className="input-style"
          />
        </div>
        <div className="dis-sb">
          <span className="label-style">top P</span>
          <Slider
            min={0}
            max={100}
            onChange={(value: number) => setTopValue(value)}
            value={typeof topValue === 'number' ? topValue : 0}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            style={{ margin: '0 16px' }}
            size="small"
            value={topValue}
            onChange={(value: number | string | null) =>
              setTopValue(Number(value))
            }
            className="input-style"
          />
        </div>
      </div>
      <div className="model-dispose-mode-style">
        <p className="node-title-style">输入及输出设置</p>
        <div className="dis-sb">
          <span className="label-style">最大回复长度</span>
          <Slider
            min={0}
            max={100}
            onChange={(value: number) => setReplyValue(value)}
            value={typeof replyValue === 'number' ? topValue : 0}
            className="slider-style"
          />
          <InputNumber
            min={1}
            max={20}
            size="small"
            style={{ margin: '0 16px' }}
            value={replyValue}
            onChange={(value: number | string | null) =>
              setReplyValue(Number(value))
            }
            className="input-style"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">模型</span>
          <Popover
            content={content}
            title="模型"
            trigger="click"
            placement="left"
          >
            <SettingOutlined />
          </Popover>
        </div>
        <Select
          placeholder="请选择模型"
          style={{ width: '100%', marginTop: '10px' }}
          options={modelListOption}
          className="input-style"
        />
      </div>
      {/* 技能模块 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">技能</span>
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={showAdd}
          ></Button>
        </div>
        <Empty />
      </div>
      <div className="node-item-style">
        <CommonNode
          title="输入"
          fieldConfigs={inputfieldConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">系统提示词</span>
          <div>
            <ExpandAltOutlined />
            <ICON_OPTIMIZE style={{ marginLeft: '10px' }} />
          </div>
        </div>
        <Input.TextArea
          placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
          autoSize={{ minRows: 3, maxRows: 5 }}
          style={{ marginBottom: '10px' }}
        />
      </div>
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">用户提示词</span>
          <div>
            <ExpandAltOutlined />
          </div>
        </div>
        <Input.TextArea
          placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
          autoSize={{ minRows: 3, maxRows: 5 }}
          style={{ marginBottom: '10px' }}
        />
      </div>
      <div className="node-item-style">
        <CommonNode
          title="输出"
          fieldConfigs={fieldConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
    </div>
  );
};

// 定义试运行
const TestNode: React.FC = () => {
  return <div className="node-title-style">试运行输入</div>;
};

// 定义搜索引擎插件
const SearchNode: React.FC = () => {
  return <div className="node-title-style">搜索引擎</div>;
};

// 定义代码节点
const CodeNode: React.FC = () => {
  const { setIsShow } = useModel('monaco');
  const showCode = () => {
    setIsShow(true);
  };
  const fieldConfigs = [
    {
      name: 'name',
      placeholder: '参数名',
      label: '参数名',
      rules: [{ required: true, message: '请输入参数名' }],
      component: Input,
    },
    {
      name: 'type',
      placeholder: '参数值',
      label: '参数值',
      rules: [{ required: true, message: '请输入或引用参数值' }],
      component: Input,
    },
  ];

  const outConfigs = [
    {
      name: 'name',
      placeholder: '变量名',
      label: '变量名',
      rules: [{ required: true, message: '请输入变量名' }],
      component: Input,
      style: { width: '165px' },
    },
    {
      name: 'type',
      placeholder: '选择类型',
      label: '变量类型',
      rules: [{ required: true, message: '请选择变量类型' }],
      component: Cascader,
      style: { width: '113px' },
      props: { options: dataTypes }, // 传递特定于 Cascader 的属性
    },
  ];
  return (
    <div>
      <div className="node-item-style">
        <CommonNode
          title="输入"
          fieldConfigs={fieldConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style ">代码</span>
          <ExpandAltOutlined
            onClick={() => {
              showCode();
            }}
          />
        </div>
        <CodeEditor height="180px" />
      </div>
      <div className="node-item-style">
        <CommonNode
          title="输出"
          fieldConfigs={outConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
    </div>
  );
};

interface FoldWarpNodeProps {
  // 当前节点的类型
  type: string;
  // 节点触发事件，通知父组件
  triggerEvent?: () => void;
}

// FoldWarpNode 函数根据 type 返回指定的 ReactNode
const FoldWarpNode: React.FC<FoldWarpNodeProps> = ({ type }) => {
  switch (type) {
    case 'startNode':
      return <StartNode />;
    case 'endNode':
      return <EndNode />;
    case 'processNode':
      return <EndNode type="processNode" />;
    case 'modelNode':
      return <ModelNode />;
    case 'searchNode':
      return <SearchNode />;

    case 'codeNode':
      return <CodeNode />;
    default:
      return <TestNode />;
  }
};

export default FoldWarpNode;
