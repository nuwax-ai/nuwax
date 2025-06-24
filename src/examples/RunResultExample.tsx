import RunResult from '@/pages/Antv-X6/component/runResult';
import { Button, Card } from 'antd';
import React, { useState } from 'react';

/**
 * 运行结果组件示例
 */
const RunResultExample: React.FC = () => {
  // 当前页码
  const [current, setCurrent] = useState(1);
  // 是否只看错误
  const [onlyError, setOnlyError] = useState(false);
  // 是否展开
  const [expanded, setExpanded] = useState(true);

  // 模拟数据
  const sampleData = {
    inputParams: {
      String1: 'dd',
    },
    outputResult: {
      output: 'dd',
    },
    batchVariables: {
      batchVar1: 'value1',
      batchVar2: 'value2',
    },
  };

  // 处理页码变化
  const handlePageChange = (page: number) => {
    console.log('页码变化：', page);
    setCurrent(page);
  };

  // 处理只看错误变化
  const handleOnlyErrorChange = (checked: boolean) => {
    console.log('只看错误变化：', checked);
    setOnlyError(checked);
  };

  // 处理展开/收起变化
  const handleExpandChange = (expanded: boolean) => {
    console.log('展开/收起变化：', expanded);
    setExpanded(expanded);
  };

  // 运行成功示例
  const successExample = () => (
    <RunResult
      success={true}
      time="0.001s"
      total={10}
      current={current}
      onlyError={onlyError}
      onPageChange={handlePageChange}
      onOnlyErrorChange={handleOnlyErrorChange}
      inputParams={sampleData.inputParams}
      outputResult={sampleData.outputResult}
      batchVariables={sampleData.batchVariables}
      expanded={expanded}
      onExpandChange={handleExpandChange}
    />
  );

  // 运行失败示例
  const errorExample = () => (
    <RunResult
      success={false}
      time="0.005s"
      total={5}
      current={current}
      onlyError={onlyError}
      onPageChange={handlePageChange}
      onOnlyErrorChange={handleOnlyErrorChange}
      inputParams={sampleData.inputParams}
      outputResult={{ error: '运行出错：参数类型不匹配' }}
      expanded={expanded}
      onExpandChange={handleExpandChange}
    />
  );

  return (
    <div style={{ padding: '20px' }}>
      <Card title="运行结果组件示例" bordered={false}>
        <div style={{ marginBottom: '20px' }}>
          <Button
            onClick={() => setExpanded(!expanded)}
            style={{ marginRight: '10px' }}
          >
            {expanded ? '收起' : '展开'}
          </Button>
          <Button
            onClick={() => setCurrent(current > 1 ? current - 1 : 1)}
            style={{ marginRight: '10px' }}
          >
            上一页
          </Button>
          <Button onClick={() => setCurrent(current < 10 ? current + 1 : 10)}>
            下一页
          </Button>
        </div>

        <h3>运行成功示例</h3>
        {successExample()}

        <h3>运行失败示例</h3>
        {errorExample()}
      </Card>
    </div>
  );
};

export default RunResultExample;
