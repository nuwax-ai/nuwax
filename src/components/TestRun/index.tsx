// import squareImage from '@/assets/images/square_bg.png';
// import SelectList from '@/components/SelectList';
import { NodeTypeEnum } from '@/types/enums/common';
import { DefaultObjectType } from '@/types/interfaces/common';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { returnImg } from '@/utils/workflow';
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Collapse, Empty, Form, Input, Tag } from 'antd';
import { useEffect } from 'react';
import { useModel } from 'umi';
import './index.less';
interface TestRunProps {
  // 当前节点的类型
  type: NodeTypeEnum;
  // 是否开启弹窗
  visible: boolean;
  // 运行
  run: (type: string, params?: DefaultObjectType) => void;
  // 按钮是否处于加载
  loading: boolean;
  // 顶部的样式
  title?: string;
  // 输入的内容
  inputArgs?: InputAndOutConfig[];
  // 运行结果
  testRunResult?: string;
  // 预设值
  value?: string;
  // 修改
  onChange?: (val?: string | number | bigint) => void;
  // 专属于问答，在stopwait后，修改当前的
  stopWait?: boolean;
}

// mock的option数据
// const mockOptions = [
//   { label: '角色陪伴-苏瑶', value: 'su-yao', img: squareImage },
//   { label: '智慧家具管家', value: 'su', img: squareImage },
//   { label: 'coder', value: 'coder', img: squareImage },
// ];

// 试运行
const TestRun: React.FC<TestRunProps> = ({
  type,
  visible,
  run,
  loading,
  title,
  inputArgs,
  testRunResult,
  stopWait,
}) => {
  const { testRun, setTestRun } = useModel('model');
  // const [value, setValue] = useState('');

  const [form] = Form.useForm();

  const onFinish = (values: DefaultObjectType) => {
    run(type, values);
  };

  const handlerSubmit = () => {
    if (inputArgs && inputArgs.length) {
      form.submit();
    } else {
      run(type);
    }
  };
  const items = [
    {
      key: 'inputArgs',
      label: '试运行输入',
      children: (
        <>
          {inputArgs && inputArgs.length > 0 && (
            <div className="border-bottom ">
              <p className="collapse-title-style dis-left">
                {returnImg(type)}
                <span className="ml-10">{title}节点</span>
              </p>
              <Form
                form={form}
                layout={'vertical'}
                onFinish={onFinish}
                className="test-run-form"
              >
                {inputArgs.map((item) => (
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
                ))}
              </Form>
            </div>
          )}
          {(!inputArgs || !inputArgs.length) && (
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
                {inputArgs?.map((item) => (
                  <Input
                    key={item.name}
                    prefix={item.name + ':'}
                    value={form.getFieldValue(item.name)}
                    disabled
                    className="mb-12"
                  ></Input>
                ))}
                <p className="collapse-title-style dis-left">输出</p>
                <div className="result-style">{testRunResult}</div>
              </>
            ),
          },
        ]
      : []),
  ];
  // 每次点开前应该要清除遗留数据
  useEffect(() => {
    form.resetFields();
  }, [testRun]);

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
          <div className="collapse-item-style flex-1">
            <Collapse
              items={items}
              ghost
              defaultActiveKey={['inputArgs', 'outputArgs']}
            />
            {type === 'Start' ||
              (type === 'Loop' && (
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
        )}
        {stopWait && (
          <div className="stop-wait-style">
            <div className="stop-wait-header">
              {returnImg('QA')}
              <span className="ml-10">问答</span>
              <span>回复以下问题后继续试运行</span>
            </div>
          </div>
        )}
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
      </div>
    </div>
  );
};

export default TestRun;
