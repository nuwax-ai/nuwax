// import squareImage from '@/assets/images/square_bg.png';
import { AnswerTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { DefaultObjectType } from '@/types/interfaces/common';
import { ChildNode } from '@/types/interfaces/graph';
import {
  NodeConfig,
  NodePreviousAndArgMap,
  TestRunParams,
} from '@/types/interfaces/node';
import { cloneDeep } from '@/utils/common';
import {
  handleDisplayValue,
  handleFileDataConvert,
  returnImg,
} from '@/utils/workflow';
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Bubble, PromptProps, Prompts, Sender } from '@ant-design/x';
import { Button, Collapse, Empty, Form, FormInstance, Input } from 'antd';
import { useEffect, useState } from 'react';
import { useModel } from 'umi';
import FormItemsRender from './FormItemsRender';
import './index.less';
// import { stringify } from 'uuid';

function middleEllipsis(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const keep = maxLength - 3; // 3 for '...'
  const front = Math.ceil(keep / 2);
  const back = Math.floor(keep / 2);
  return str.slice(0, front) + '...' + str.slice(str.length - back);
}

interface TestRunProps {
  // 当前节点的类型
  node: ChildNode;
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
  testRunParams?: TestRunParams;
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

const StopWaitNode: React.FC<{
  params?: TestRunParams;
  items: QaItems[];
  value?: string;
  answerType?: AnswerTypeEnum;
  onAnswer: (val: string) => void;
  onChange: (v: string | number | bigint | undefined) => void;
  onSubmit: () => void;
}> = ({ params, items, value, answerType, onAnswer, onChange, onSubmit }) => {
  const handleAnswer = (info: { data: PromptProps }) => {
    onAnswer?.(info.data.description as string);
  };
  return (
    <div className="stop-wait-style dis-col flex-1 overflow-y">
      {/* 头部 */}
      <div className="stop-wait-header dis-center">
        {returnImg(NodeTypeEnum.QA)}
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
        variant={answerType === AnswerTypeEnum.SELECT ? 'borderless' : 'filled'}
        header={<span>机器人</span>}
        content={
          params?.options?.length ? (
            <div className="qa-question-style">
              <Prompts
                title={params?.question}
                items={items}
                vertical
                onItemClick={handleAnswer}
              />
            </div>
          ) : (
            <div className="qa-question-style">{params?.question}</div>
          )
        }
      />

      <Sender value={value} onChange={onChange} onSubmit={onSubmit} />
    </div>
  );
};

const HttpArgs: React.FC<{
  config: NodeConfig;
  loading: boolean;
  options: NodePreviousAndArgMap;
}> = ({ config, loading, options }) => {
  const { body, headers, queries } = config;
  return (
    <>
      {body && body.length > 0 && (
        <FormItemsRender items={body} loading={loading} options={options} />
      )}
      {headers && headers.length > 0 && (
        <FormItemsRender items={headers} loading={loading} options={options} />
      )}
      {queries && queries.length > 0 && (
        <FormItemsRender items={queries} loading={loading} options={options} />
      )}
      {!body?.length && !headers?.length && !queries?.length && (
        <Empty description="本次试运行无需输入" />
      )}
    </>
  );
};

const renderInputArgs = ({
  type,
  config,
  loading,
  options,
}: {
  type: NodeTypeEnum;
  config: NodeConfig;
  loading: boolean;
  options: NodePreviousAndArgMap;
}) => {
  const { inputArgs } = config;
  return (
    <>
      {type !== NodeTypeEnum.HTTPRequest &&
        (inputArgs && inputArgs.length ? (
          <FormItemsRender
            items={inputArgs}
            loading={loading}
            options={options}
          />
        ) : (
          <Empty description="本次试运行无需输入" />
        ))}
      {type === NodeTypeEnum.HTTPRequest && (
        <HttpArgs config={config} loading={loading} options={options} />
      )}
    </>
  );
};

const renderOutputArgs = ({
  form,
  value,
  config,
}: {
  form: FormInstance;
  value: string;
  config: NodeConfig;
}) => {
  const { inputArgs } = config;
  return (
    <>
      <p className="collapse-title-style dis-left">输入</p>
      {inputArgs?.map((item) => (
        <Input
          key={item.name}
          prefix={middleEllipsis(item.name + ':', 20)}
          value={handleDisplayValue(
            form.getFieldValue(item.name),
            item?.dataType || '',
          )}
          disabled
          className="mb-12 override-input-style"
        />
      ))}
      <p className="collapse-title-style dis-left">输出</p>
      <pre className="result-style overflow-y">{value}</pre>
    </>
  );
};

// 试运行组件
const TestRun: React.FC<TestRunProps> = ({
  node,
  run,
  loading,
  testRunResult,
  clearRunResult,
  stopWait,
  formItemValue,
  testRunParams,
}) => {
  const { testRun, setTestRun } = useModel('model');
  const { referenceList, storeWorkflow } = useModel('workflow');
  const [form] = Form.useForm();

  // 问答的选项
  const [qaItems, setQaItem] = useState<QaItems[]>([]);
  const onFinish = (values: DefaultObjectType) => {
    storeWorkflow('testRunValues', cloneDeep(values));
    const results: DefaultObjectType = cloneDeep(values);
    if (values && JSON.stringify(values) !== '{}') {
      if (node.nodeConfig.inputArgs && node.nodeConfig.inputArgs.length) {
        for (let item in values) {
          if (Object.prototype.hasOwnProperty.call(values, item)) {
            // 过滤原型链属性
            const inputArg = node.nodeConfig.inputArgs.find(
              (arg) => arg.name === item,
            );

            if (inputArg && inputArg.dataType?.includes('File')) {
              results[item] = handleFileDataConvert(
                values[item],
                inputArg.dataType,
              );
            } else if (
              inputArg &&
              (inputArg.dataType === 'Object' ||
                inputArg.dataType?.includes('Array'))
            ) {
              try {
                results[item] = JSON.parse(values[item]);
              } catch (error) {
                console.error('JSON 解析失败:', error);
              }
            }
          }
        }
      } else if (node.type === NodeTypeEnum.HTTPRequest) {
        // 将body，queries，headers合并到一个对象中
        const newList = [
          ...(node.nodeConfig.body || []),
          ...(node.nodeConfig.queries || []),
          ...(node.nodeConfig.headers || []),
        ];
        // 直接处理表单中的单个元素
        for (let item in values) {
          if (Object.prototype.hasOwnProperty.call(values, item)) {
            const inputArg = newList?.find((arg) => arg.name === item);
            if (
              inputArg &&
              (inputArg.dataType === 'Object' ||
                inputArg.dataType?.includes('Array'))
            ) {
              try {
                results[item] = JSON.parse(values[item]);
              } catch (error) {
                console.error('JSON 解析失败:', error);
              }
            }
          }
        }
      }
      run(node.type, results);
    } else {
      run(node.type);
    }
  };

  const items = [
    {
      key: 'inputArgs',
      label: '试运行输入',
      children: (
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
          {renderInputArgs({
            loading,
            type: node.type,
            config: node.nodeConfig,
            options: referenceList,
          })}
        </Form>
      ),
    },
    ...(testRunResult
      ? [
          {
            key: 'outputArgs',
            label: '运行结果',
            children: renderOutputArgs({
              form,
              config: node.nodeConfig,
              value: testRunResult,
            }),
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
    // form.resetFields();
    if (stopWait) {
      const newItem = (testRunParams?.options || []).map((item) => ({
        key: item.uuid,
        description: item.content,
      }));
      setQaItem(newItem);
    }
  }, [testRun, stopWait]);

  useEffect(() => {
    let _obj = JSON.parse(JSON.stringify(formItemValue || {}));
    if (
      node.type === NodeTypeEnum.HTTPRequest &&
      JSON.stringify(_obj) !== '{}'
    ) {
      for (let item in _obj) {
        if (typeof _obj[item] !== 'string' && _obj[item] !== null) {
          _obj[item] = JSON.stringify(_obj[item]);
        }
      }
      form.setFieldsValue(_obj);
    }
  }, [formItemValue]);
  if (!testRun) return null;
  return (
    <div
      className="test-run-style"
      style={{
        display: 'flex',
        paddingTop: '100px',
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
              onClick={() => {
                form.submit();
              }}
              loading={loading}
              className="mt-16"
            >
              运行
            </Button>
          </>
        )}
        {stopWait && (
          <StopWaitNode
            params={testRunParams}
            items={qaItems}
            answerType={node.nodeConfig.answerType}
            onAnswer={answer}
            onChange={(v) => {
              setValue(v as string);
            }}
            onSubmit={() => {
              answer(value);
              setValue('');
            }}
          />
        )}
      </div>
    </div>
  );
};

export default TestRun;
