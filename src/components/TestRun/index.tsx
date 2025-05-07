// import squareImage from '@/assets/images/square_bg.png';
import CodeEditor from '@/components/CodeEditor';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { DataTypeEnum } from '@/types/enums/common';
import { DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode } from '@/types/interfaces/graph';
import { InputAndOutConfig, TestRunparams } from '@/types/interfaces/node';
import { getAccept } from '@/utils';
import { returnImg } from '@/utils/workflow';
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Bubble, Prompts, Sender } from '@ant-design/x';
import {
  Button,
  Collapse,
  Empty,
  Form,
  FormInstance,
  Input,
  InputNumber,
  Radio,
  Tag,
  Upload,
  UploadProps,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';
// import { stringify } from 'uuid';
interface TestRunProps {
  // 当前节点的类型
  node: ChildNode;
  // 是否开启弹窗
  visible: boolean;
  // 运行
  run: (type: string, params?: DefaultObjectType) => void;
  // 按钮是否处于加载
  loading: boolean;
  // 清除运行结果
  clearRunResult: () => void;
  // 运行结果
  testRunResult?: string;
  // 预设值
  value?: string;
  // 修改
  onChange?: (val?: string | number | bigint) => void;
  // 专属于问答，在stopwait后，修改当前的
  stopWait?: boolean;
  //
  formItemValue?: DefaultObjectType;
  testRunparams?: TestRunparams;
}

interface QaItems {
  key: string;
  description: string;
}

// mock的option数据
// const mockOptions = [
//   { label: '角色陪伴-苏瑶', value: 'su-yao', img: squareImage },
//   { label: '智慧家具管家', value: 'su', img: squareImage },
//   { label: 'coder', value: 'coder', img: squareImage },
// ];

const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
// 根据type返回不同的输入项
const getInputBox = (item: InputAndOutConfig, form: FormInstance) => {
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      try {
        const data = info.file.response?.data;
        form.setFieldValue(item.name, data?.url);
      } catch (error) {
        message.warning(info.file.response?.message);
      }
    }
  };

  switch (true) {
    case item.dataType?.includes('File'):
      return (
        <Upload
          action={UPLOAD_FILE_ACTION}
          onChange={handleChange}
          headers={{
            Authorization: token ? `Bearer ${token}` : '',
          }}
          accept={getAccept(item.dataType as DataTypeEnum)}
        >
          <Button>上传文件</Button>
        </Upload>
      );
    case item.dataType === 'Object' || item.dataType?.includes('Array'):
      return (
        <CodeEditor
          value={form.getFieldValue(item.name) || ''}
          codeLanguage={'JSON'}
          onChange={(code: string) => {
            form.setFieldsValue({ [item.name]: code }); // 更新表单值
          }}
          height="180px"
        />
      );
    case item.dataType === 'Number':
      return <InputNumber />;
    case item.dataType === 'Integer':
      return <InputNumber precision={0} />;
    case item.dataType === 'Boolean':
      return (
        <Radio.Group
          options={[
            { label: 'true', value: 'true' },
            { label: 'false', value: 'false' },
          ]}
        />
      );
    default: {
      return <Input />;
    }
  }
};

const renderFormItem = (
  type: string,
  items: InputAndOutConfig[],
  form: FormInstance,
) => {
  return (
    <>
      {items.map((item, index) => (
        <div key={item.key || index}>
          <Form.Item
            name={[item.name]} // 绑定到 bindValue
            label={
              <>
                {item.name}
                <Tag color="#C9CDD4" className="ml-10">
                  {item.dataType}
                </Tag>
              </>
            }
          >
            {getInputBox(item, form)}
          </Form.Item>
        </div>
      ))}
    </>
  );
};

// 试运行
const TestRun: React.FC<TestRunProps> = ({
  node,
  visible,
  run,
  loading,
  testRunResult,
  clearRunResult,
  stopWait,
  formItemValue,
  testRunparams,
}) => {
  const { testRun, setTestRun } = useModel('model');
  // const [value, setValue] = useState('');

  const [form] = Form.useForm();
  // 问答的选项
  const [qaItems, setQaItem] = useState<QaItems[]>([]);
  const onFinish = (values: DefaultObjectType) => {
    run(node.type, values);
  };

  const handlerSubmit = () => {
    let value = form.getFieldsValue();
    if (value && JSON.stringify(value) !== '{}') {
      // const value = form.getFieldsValue();
      if (node.nodeConfig.inputArgs && node.nodeConfig.inputArgs.length) {
        for (let item in value) {
          if (Object.prototype.hasOwnProperty.call(value, item)) {
            // 过滤原型链属性
            const inputArg = node.nodeConfig.inputArgs.find(
              (arg) => arg.name === item,
            );
            if (
              inputArg &&
              (inputArg.dataType === 'Object' ||
                inputArg.dataType?.includes('Array'))
            ) {
              try {
                value[item] = JSON.parse(value[item]);
              } catch (error) {
                console.error('JSON 解析失败:', error);
              }
            }
          }
        }
      } else if (node.type === 'HTTPRequest') {
        // 将body，queries，headers合并到一个对象中
        const newList = [
          ...(node.nodeConfig.body || []),
          ...(node.nodeConfig.queries || []),
          ...(node.nodeConfig.headers || []),
        ];
        // 直接处理表单中的单个元素
        for (let item in value) {
          if (Object.prototype.hasOwnProperty.call(value, item)) {
            const inputArg = newList?.find((arg) => arg.name === item);
            if (
              inputArg &&
              (inputArg.dataType === 'Object' ||
                inputArg.dataType?.includes('Array'))
            ) {
              try {
                value[item] = JSON.parse(value[item]);
              } catch (error) {
                console.error('JSON 解析失败:', error);
              }
            }
          }
        }
      }
      run(node.type, value);
    } else {
      run(node.type);
    }
  };

  const items = [
    {
      key: 'inputArgs',
      label: '试运行输入',
      children: (
        <>
          <Form
            form={form}
            layout={'vertical'}
            onFinish={onFinish}
            className="test-run-form"
          >
            <div className="dis-left">
              {returnImg(node.type)}
              <span style={{ marginLeft: '10px' }}>{node.name}</span>
            </div>
            {node.type !== 'HTTPRequest' &&
              (node.nodeConfig.inputArgs && node.nodeConfig.inputArgs.length ? (
                renderFormItem('inputArgs', node.nodeConfig.inputArgs, form)
              ) : (
                <Empty description="本次试运行无需输入" />
              ))}
            {node.type === 'HTTPRequest' && (
              <>
                {node.nodeConfig.body &&
                  node.nodeConfig.body.length &&
                  renderFormItem('body', node.nodeConfig.body, form)}
                {node.nodeConfig.headers &&
                  node.nodeConfig.headers.length &&
                  renderFormItem('headers', node.nodeConfig.headers, form)}
                {node.nodeConfig.queries &&
                  node.nodeConfig.queries.length &&
                  renderFormItem('queries', node.nodeConfig.queries, form)}
                {!node.nodeConfig.body?.length &&
                  !node.nodeConfig.headers?.length &&
                  !node.nodeConfig.queries?.length && (
                    <Empty description="本次试运行无需输入" />
                  )}
              </>
            )}
          </Form>
        </>
      ),
    },
    ...(testRunResult
      ? [
          {
            key: 'outputArgs',
            label: '运行结果',
            children: (
              <>
                <p className="collapse-title-style dis-left">输入</p>
                {node.nodeConfig.inputArgs?.map((item) => (
                  <Input
                    key={item.name}
                    prefix={item.name + ':'}
                    value={form.getFieldValue(item.name)}
                    disabled
                    className="mb-12"
                  ></Input>
                ))}
                <p className="collapse-title-style dis-left">输出</p>
                <pre className="result-style overflow-y">{testRunResult}</pre>
              </>
            ),
          },
        ]
      : []),
  ];

  const answer = (val: string) => {
    run('Start', { answer: val });
  };

  const [value, setValue] = useState<string>('');

  // 每次点开前应该要清除遗留数据
  useEffect(() => {
    form.resetFields();
    if (stopWait) {
      const newItem = (testRunparams?.options || []).map((item) => ({
        key: item.uuid,
        description: item.content,
      }));
      setQaItem(newItem);
    }
  }, [testRun, stopWait]);

  useEffect(() => {
    let _obj = JSON.parse(JSON.stringify(formItemValue || {})); // TOD
    if (JSON.stringify(_obj) !== '{}') {
      for (let item in _obj) {
        if (typeof _obj[item] !== 'string') {
          _obj[item] = JSON.stringify(_obj[item]);
        }
      }
      form.setFieldsValue(_obj);
    }
  }, [formItemValue]);

  return (
    <div
      className="test-run-style"
      style={{
        display: testRun ? 'flex' : 'none',
        paddingTop: visible ? '100px' : '0',
      }}
    >
      {/* 根据testRun来控制当前组件的状态 */}
      <div className="test-content-style dis-col ">
        {/* 试运行的头部 */}
        <div className="test-run-header dis-sb">
          <span>试运行</span>
          <CloseOutlined
            className={'cursor-pointer'}
            onClick={() => {
              setTestRun(false);
              clearRunResult();
            }}
          />
        </div>
        {/* 试运行的内容 */}
        {!stopWait && (
          <>
            <div className="collapse-item-style flex-1 ">
              <Collapse
                items={items}
                ghost
                defaultActiveKey={['inputArgs', 'outputArgs']}
              />
            </div>
            {/* 试运行的运行按钮 */}
            <Button
              icon={<CaretRightOutlined />}
              type="primary"
              onClick={handlerSubmit}
              loading={loading}
              className="mt-16"
            >
              运行
            </Button>
          </>
        )}
        {stopWait && (
          <div className="stop-wait-style dis-col flex-1 overflow-y">
            {/* 头部 */}
            <div className="stop-wait-header dis-center">
              {returnImg('QA')}
              <div></div>
              <span className="ml-10">问答</span>
              <span className="ml-10">回复以下问题后继续试运行</span>
            </div>
            {/* 对话气泡 */}
            <Bubble
              className="flex-1"
              avatar={
                <img
                  src={require('@/assets/images/robot.png')}
                  className="bubble-avatar"
                />
              }
              variant={
                node.nodeConfig.answerType === 'SELECT'
                  ? 'borderless'
                  : 'filled'
              }
              header={<span>机器人</span>}
              content={
                testRunparams &&
                testRunparams.options &&
                testRunparams.options.length ? (
                  <div className="qa-question-style">
                    <Prompts
                      title={testRunparams.question}
                      items={qaItems}
                      vertical
                      onItemClick={(info) => {
                        answer(info.data.description as string);
                      }}
                    />
                  </div>
                ) : (
                  <div className="qa-question-style">
                    {testRunparams?.question}
                  </div>
                )
              }
            />

            <Sender
              value={value}
              onChange={(v) => {
                setValue(v);
              }}
              onSubmit={() => {
                answer(value);
                setValue('');
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRun;
