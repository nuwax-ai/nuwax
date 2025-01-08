import CodeEditor from '@/components/CodeEditor';
import {
  DeleteOutlined,
  ExpandAltOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  Form,
  Input,
  Space,
  Typography,
} from 'antd';
import React from 'react';
import { useModel } from 'umi';
import '../index.less';
import { dataTypes } from '../params';
import { NodeRenderProps, RenderItemProps } from '../type';
import { default as ComplexNode } from './complexNode';
import { default as NodeItem } from './nodeItem';
const { StartNode, EndNode, CycleNode, VariableNode } = NodeItem;
const { ModelNode } = ComplexNode;

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
    case 'documentNode':
      return <StartNode type="document" />;
    case 'endNode':
      return <EndNode />;
    case 'processNode':
      return <EndNode type="processNode" />;
    case 'cycleNode':
      return <CycleNode />;
    case 'variableNode':
      return <VariableNode />;
    case 'textNode':
      return <VariableNode type="textNode" />;
    case 'modelNode': {
      // 分组的数据源
      const groupedOptionsData = [
        {
          label: 'Image Models',
          options: [
            {
              icon: <PlusOutlined />,
              label: 'Image Processing',
              value: 'ImageProcessing',
              size: '10MB',
              modelName: 'VGG16',
              desc: 'A popular convolutional neural network for image recognition.',
              tagList: ['CNN', 'Image Recognition', 'Transfer Learning'],
            },
            // 更多图像模型...
          ],
        },
        {
          label: 'Text Models',
          options: [
            {
              icon: <PlusOutlined />,
              label: 'Text Analysis',
              value: 'textAnalysis',
              size: '5MB',
              modelName: 'BERT',
              desc: 'Bidirectional Encoder Representations from Transformers for NLP tasks.',
              tagList: ['NLP', 'Text Classification', 'Pre-trained'],
            },
            // 更多文本模型...
          ],
        },
        {
          label: 'Audio Models',
          options: [
            {
              icon: <PlusOutlined />,
              label: 'Audio Detection',
              value: 'AudioDetection',
              size: '8MB',
              modelName: 'WaveNet',
              desc: 'Generative model for raw audio waveforms.',
              tagList: ['Audio', 'Waveform Generation', 'Deep Learning'],
            },
          ],
        },
      ];
      return <ModelNode groupedOptionsData={groupedOptionsData} />;
    }
    case 'searchNode':
      return <SearchNode />;
    case 'codeNode':
      return <CodeNode />;
    default:
      return <TestNode />;
  }
};

export default FoldWarpNode;
