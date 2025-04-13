// import squareImage from '@/assets/images/square_bg.png';
import CodeEditor from '@/components/CodeEditor';
import { DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode } from '@/types/interfaces/graph';
import { TestRunparams } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Bubble, Prompts, Sender } from '@ant-design/x';
import { Button, Collapse, Empty, Form, FormInstance, Input, Tag } from 'antd';
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

const renderFormItem = (type: string, items: any[], form: FormInstance) => {
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
            {item.dataType === 'Object' || item.dataType?.includes('Array') ? (
              <CodeEditor
                value={form.getFieldValue(item.name) || ''}
                codeLanguage={'JSON'}
                onChange={(code: string) => {
                  form.setFieldsValue({ [item.name]: code }); // 更新表单值
                }}
                height="180px"
              />
            ) : (
              <Input />
            )}
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
    if (
      value &&
      JSON.stringify(value) !== '{}'
      // (node.nodeConfig.queries && node.nodeConfig.queries.length) ||
      // (node.nodeConfig.headers && node.nodeConfig.headers.length) ||
      // (node.nodeConfig.inputArgs && node.nodeConfig.inputArgs.length)
    ) {
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
      } else {
        value = JSON.parse(value['params']);
        console.log(value, 'value');
      }
      run(node.type, value);
    } else {
      run(node.type);
    }
  };

  // else {
  //   const _value =JSON.parse(JSON.stringify(value));
  //   for (let item of ['body', 'headers', 'queries']) {
  //     if (Object.prototype.hasOwnProperty.call(_value, item)) {
  //       // 过滤原型链属性
  //       const inputArg = node.nodeConfig[item].find((arg) => {
  //         if (_value[item] && value[item].length > 0) {
  //           return _value[item].some((entry: any) => arg.name === Object.keys(entry)[0]);
  //         }
  //         return false;
  //       });

  //       if (
  //         inputArg &&
  //         (inputArg.dataType === 'Object' ||
  //           inputArg.dataType?.includes('Array'))
  //       ) {
  //         if (inputArg && (inputArg.dataType === 'Object' || inputArg.dataType?.includes('Array'))) {
  //           _value[item] = _value[item].map((entry: any) => {
  //             const key = inputArg.name; // 直接使用 inputArg.name 作为键
  //              try {
  //               entry[key] = JSON.parse(entry[key]);
  //             } catch (error) {
  //               console.error('JSON 解析失败:', error);
  //             }
  //             return entry;
  //           });
  //         }
  //         console.log(_value,'value')
  //       }
  //     }
  //   }

  // }

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
              // <>
              //   {node.nodeConfig.body &&
              //     node.nodeConfig.body.length &&
              //     renderFormList('body', node.nodeConfig.body, form)}
              //   {node.nodeConfig.headers &&
              //     node.nodeConfig.headers.length &&
              //     renderFormList('headers', node.nodeConfig.headers, form)}
              //   {node.nodeConfig.queries &&
              //     node.nodeConfig.queries.length &&
              //     renderFormList('queries', node.nodeConfig.queries, form)}
              //   {!node.nodeConfig.body?.length &&
              //     !node.nodeConfig.headers?.length &&
              //     !node.nodeConfig.queries?.length && (
              //       <Empty description="本次试运行无需输入" />
              //     )}
              // </>
              <>
                <Form.Item name="params">
                  <CodeEditor
                    value={form.getFieldValue('params') || ''}
                    codeLanguage={'JSON'}
                    onChange={(code: string) => {
                      form.setFieldValue('params', code); // 更新表单值
                    }}
                    height="180px"
                  />
                </Form.Item>
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
      console.log(_obj, '_obj');
      form.setFieldsValue(_obj);
    }
  }, [formItemValue]);

  // const initValue = (items: InputAndOutConfig[]) => {
  //   return items.map((item) => ({ [item.name]: '' }));
  // };
  // useEffect(() => {
  //   if (node.type === 'HTTPRequest') {
  //     if (node.nodeConfig.body && node.nodeConfig.body.length) {
  //       form.setFieldsValue({ body: initValue(node.nodeConfig.body) });
  //     }
  //     if (node.nodeConfig.headers && node.nodeConfig.headers.length) {
  //       form.setFieldsValue({ headers: initValue(node.nodeConfig.headers) });
  //     }
  //     if (node.nodeConfig.queries && node.nodeConfig.queries.length) {
  //       form.setFieldsValue({ queries: initValue(node.nodeConfig.queries) });
  //     }
  //   }
  // }, [node]);
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
