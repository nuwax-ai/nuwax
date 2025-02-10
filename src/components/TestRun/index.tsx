// import squareImage from '@/assets/images/square_bg.png';
// import SelectList from '@/components/SelectList';
import { NodeTypeEnum } from '@/types/enums/common';
import { CaretRightOutlined, CloseOutlined } from '@ant-design/icons';
import { Button, Empty } from 'antd';
// import { useState } from 'react';
import { useModel } from 'umi';
import './index.less';
interface TestRunProps {
  type: NodeTypeEnum;
  run: () => void;
  value?: string;
  onChange?: (val?: string | number | bigint) => void;
}

// mock的option数据
// const mockOptions = [
//   { label: '角色陪伴-苏瑶', value: 'su-yao', img: squareImage },
//   { label: '智慧家具管家', value: 'su', img: squareImage },
//   { label: 'coder', value: 'coder', img: squareImage },
// ];
// 试运行
const TestRun: React.FC<TestRunProps> = ({ type, run }) => {
  const { testRun, setTestRun } = useModel('model');
  // const [value, setValue] = useState('');
  return (
    <div
      className="test-run-style"
      style={{ display: testRun ? 'flex' : 'none' }}
    >
      {/* 根据testRun来控制当前组件的状态 */}
      <div className="test-content-style dis-col">
        {/* 试运行的头部 */}
        <div className="test-run-header dis-sb">
          <span>试运行</span>
          <CloseOutlined
            className={'cursor-pointer'}
            onClick={() => setTestRun(false)}
          />
        </div>
        {/* 试运行的内容 */}
        <div className="test-run-content flex-1">
          {/* 根据type来决定渲染些什么 */}
          <div className="test-run-content-label">
            试运行输入
            <div>
              <Empty description="本次试运行无需输入" />
            </div>
          </div>
          {/* {value && onChange && (
        )} */}

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
        {/* 试运行的运行按钮 */}
        <Button icon={<CaretRightOutlined />} onClick={run}>
          运行
        </Button>
      </div>
    </div>
  );
};

export default TestRun;
