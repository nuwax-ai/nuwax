// import squareImage from '@/assets/images/square_bg.png';
import CodeEditor from '@/components/CodeEditor';
import { DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode } from '@/types/interfaces/graph';
import { returnImg } from '@/utils/workflow';
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Bubble, Prompts, Sender } from '@ant-design/x';
import { Button, Collapse, Empty, Form, Input, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';
import './index.less';
interface TestRunProps {
  // 当前节点的类型
  node: ChildNode;
  // 是否开启弹窗
  visible: boolean;
  // 运行
  run: (type: string, params?: DefaultObjectType) => void;
  // 按钮是否处于加载
  loading: boolean;
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

// 试运行
const TestRun: React.FC<TestRunProps> = ({
  node,
  visible,
  run,
  loading,
  testRunResult,
  stopWait,
  formItemValue,
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
    if (node.nodeConfig.inputArgs && node.nodeConfig.inputArgs.length) {
      const value = form.getFieldsValue();
      for (let item in value) {
        if (typeof value[item] === 'string' && value[item].includes('\r\n')) {
          value[item] = JSON.parse(value[item]);
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
          {node.nodeConfig.inputArgs &&
            node.nodeConfig.inputArgs.length > 0 && (
              <div className="border-bottom ">
                <p className="collapse-title-style dis-left">
                  {returnImg(node.type)}
                  <span className="ml-10">{node.name}节点</span>
                </p>
                <Form
                  form={form}
                  layout={'vertical'}
                  onFinish={onFinish}
                  className="test-run-form"
                >
                  {node.nodeConfig.inputArgs.map((item) => {
                    if (item.dataType === 'Object') {
                      return (
                        <div key={item.name}>
                          <Form.Item
                            name={item.name}
                            label={
                              <>
                                {item.name}
                                <Tag className="ml-10">{item.dataType}</Tag>
                              </>
                            }
                            rules={[{ required: true, message: '请输入' }]}
                          >
                            <CodeEditor
                              value={form.getFieldValue(item.name) || ''}
                              codeLanguage={'JSON'}
                              changeCode={(code) => {
                                form.setFieldsValue({ [item.name]: code }); // 更新表单值
                              }}
                              height="180px"
                            />
                          </Form.Item>
                        </div>
                      );
                    }
                    return (
                      <div key={item.name}>
                        <Form.Item
                          name={item.name}
                          label={
                            <>
                              {item.name}
                              <Tag className="ml-10">{item.dataType}</Tag>
                            </>
                          }
                          rules={[{ required: true, message: '请输入' }]}
                        >
                          <Input />
                        </Form.Item>
                      </div>
                    );
                  })}
                </Form>
              </div>
            )}
          {(!node.nodeConfig.inputArgs ||
            !node.nodeConfig.inputArgs.length) && (
            <Empty description="本次试运行无需输入" />
          )}
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
                <pre className="result-style">{testRunResult}</pre>
              </>
            ),
          },
        ]
      : []),
  ];

  const answer = (val: string) => {
    run('QA', { answer: val });
  };

  const [value, setValue] = useState<string>('');

  // 每次点开前应该要清除遗留数据
  useEffect(() => {
    form.resetFields();
    if (stopWait) {
      const newItem = (node.nodeConfig?.options || []).map((item) => ({
        key: item.index.toString(),
        description: item.content,
      }));
      setQaItem(newItem);
    }
  }, [testRun, stopWait]);

  useEffect(() => {
    if (JSON.stringify(formItemValue) !== '{}') {
      form.setFieldsValue(formItemValue);
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
      <div className="test-content-style dis-col overflow-y">
        {/* 试运行的头部 */}
        <div className="test-run-header dis-sb">
          <span>试运行</span>
          <CloseOutlined
            className={'cursor-pointer'}
            onClick={() => setTestRun(false)}
          />
        </div>
        {/* 试运行的内容 */}
        {!stopWait && (
          <>
            <div className="collapse-item-style flex-1">
              <Collapse
                items={items}
                ghost
                defaultActiveKey={['inputArgs', 'outputArgs']}
              />
              {node.type === 'Start' ||
                (node.type === 'Loop' && (
                  <div>
                    <div className="test-run-content-label">关联智能体</div>
                    <div>
                      <p>选择你需要的智能体</p>
                      {/* <SelectList
                    className={'selectItem'}
                    prefix={<SearchOutlined />}
                    value={value}
                    options={mockOptions}
                    onChange={setValue}
                  /> */}
                    </div>
                  </div>
                ))}
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
          <div className="stop-wait-style dis-col flex-1">
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
                node.nodeConfig.answerType === 'SELECT' ? (
                  <div className="qa-question-style">
                    <Prompts
                      title={node.nodeConfig.question}
                      items={qaItems}
                      vertical
                      onItemClick={(info) => {
                        answer(info.data.description as string);
                      }}
                    />
                  </div>
                ) : (
                  <div className="qa-question-style">
                    {node.nodeConfig.question}
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
