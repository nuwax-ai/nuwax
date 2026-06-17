/**
 * SSE 流式渲染测试页面
 * 使用真实的 SSE 数据模拟消息流，验证渲染中断修复效果
 */
import {
  Alert,
  Button,
  Card,
  Progress,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const { Title, Paragraph, Text } = Typography;

// 从 SSE 日志中提取的消息数据
const SSE_TEST_DATA = [
  { text: '', delay: 0 },
  { text: '我来', delay: 1 },
  { text: '帮你', delay: 100 },
  { text: '分析和', delay: 0 },
  { text: '解决', delay: 8 },
  { text: '页面', delay: 1 },
  { text: '卡', delay: 1 },
  { text: '顿', delay: 1 },
  { text: '问题', delay: 1 },
  { text: '。', delay: 0 },
  { text: '让我', delay: 251 },
  { text: '先', delay: 50 },
  { text: '检测', delay: 1 },
  { text: '一下', delay: 50 },
  { text: '项目', delay: 85 },
  { text: '状态', delay: 1 },
  { text: '和', delay: 19 },
  { text: '识别', delay: 1 },
  { text: '性能', delay: 234 },
  { text: '瓶颈', delay: 36 },
  { text: '。', delay: 69 },
  { text: '\n\n', delay: 100 },
  { text: '**', delay: 10 },
  { text: '性能', delay: 60 },
  { text: '问题', delay: 1 },
  { text: '分析', delay: 1 },
  { text: '**', delay: 75 },
  { text: '：\n\n', delay: 57 },
  { text: '1', delay: 2 },
  { text: '.', delay: 2 },
  { text: ' **', delay: 0 },
  { text: '粒子', delay: 3 },
  { text: '系统', delay: 191 },
  { text: '开销', delay: 9 },
  { text: '大', delay: 0 },
  { text: '**', delay: 0 },
  { text: '：', delay: 2 },
  { text: '每次', delay: 9 },
  { text: '烟花', delay: 18 },
  { text: '产生', delay: 383 },
  { text: ' ', delay: 59 },
  { text: '40', delay: 4 },
  { text: ' 个', delay: 5 },
  { text: ' DOM', delay: 5 },
  { text: ' ', delay: 56 },
  { text: '节', delay: 1 },
  { text: '点', delay: 2 },
  { text: '，', delay: 3 },
  { text: '频繁', delay: 0 },
  { text: '更新', delay: 65 },
  { text: '导致', delay: 83 },
  { text: '卡', delay: 1 },
  { text: '顿', delay: 69 },
  { text: '\n', delay: 3 },
  { text: '2', delay: 1 },
  { text: '.', delay: 68 },
  { text: ' **', delay: 2 },
  { text: '音', delay: 0 },
  { text: '波', delay: 30 },
  { text: '动画', delay: 2 },
  { text: '过于', delay: 2 },
  { text: '频繁', delay: 1 },
  { text: '**', delay: 2 },
  { text: '：', delay: 2 },
  { text: '100', delay: 2 },
  { text: 'ms', delay: 2 },
  { text: ' 更新', delay: 50 },
  { text: '一次', delay: 2 },
  { text: '太', delay: 2 },
  { text: '快', delay: 30 },
  { text: '\n', delay: 2 },
  { text: '3', delay: 100 },
  { text: '.', delay: 2 },
  { text: ' **', delay: 2 },
  { text: '多个', delay: 50 },
  { text: '定时器', delay: 2 },
  { text: '同时', delay: 2 },
  { text: '运行', delay: 50 },
  { text: '**', delay: 2 },
  { text: '：', delay: 2 },
  { text: '造成', delay: 30 },
  { text: '性能', delay: 2 },
  { text: '瓶颈', delay: 2 },
  { text: '\n\n', delay: 100 },
  { text: '页面', delay: 1 },
  { text: '现在', delay: 1 },
  { text: '应该', delay: 0 },
  { text: '运行', delay: 2 },
  { text: '流畅', delay: 24 },
  { text: '，', delay: 0 },
  { text: '不再', delay: 1 },
  { text: '有', delay: 1 },
  { text: '卡', delay: 38 },
  { text: '顿', delay: 1 },
  { text: '现象', delay: 0 },
  { text: '！', delay: 0 },
];

// 生成更多测试数据以模拟真实场景
const generateMoreTestData = () => {
  const moreData: Array<{ text: string; delay: number }> = [];
  const chars =
    '这是更多的测试数据用于验证高频消息的渲染性能。我们将模拟每个字符独立到达的情况，验证消息缓冲区的优化效果。'.split(
      '',
    );
  chars.forEach((char) => {
    moreData.push({
      text: char,
      delay: Math.random() * 10, // 随机 0-10ms 延迟模拟真实场景
    });
  });
  return moreData;
};

// 组合测试数据
const FULL_TEST_DATA = [
  ...SSE_TEST_DATA,
  ...generateMoreTestData(),
  ...generateMoreTestData(),
];

/**
 * SSE 流式渲染测试页面
 */
const SSEStreamingTest: React.FC = () => {
  // === 状态变量 ===
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [content, setContent] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [renderCount, setRenderCount] = useState(0);
  const [frameDrops, setFrameDrops] = useState(0);
  const [testMode, setTestMode] = useState<'buffered' | 'direct'>('buffered');

  // === Refs ===
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const [fps, setFps] = useState(60);

  // 消息缓冲区（模拟修复后的逻辑）
  const textBufferRef = useRef<string>('');
  const lastFlushTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  // === 帧率监控 ===
  useEffect(() => {
    let animationId: number;
    const updateFps = (timestamp: number) => {
      frameCountRef.current++;

      if (timestamp - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = timestamp;
      }

      animationId = requestAnimationFrame(updateFps);
    };

    animationId = requestAnimationFrame(updateFps);
    return () => cancelAnimationFrame(animationId);
  }, []);

  /**
   * 刷新文本缓冲区 (缓冲模式) - 简化版
   * 直接在 RAF 中刷新，不做额外的时间检查
   */
  const flushTextBuffer = useCallback(() => {
    if (textBufferRef.current) {
      const textToFlush = textBufferRef.current;
      textBufferRef.current = '';
      setContent((prev) => prev + textToFlush);
      lastFlushTimeRef.current = Date.now();
      setRenderCount((prev) => prev + 1);
    }
    rafIdRef.current = null;
  }, []);

  /**
   * 追加文本到缓冲区 (缓冲模式)
   * 使用简单的 RAF 调度，每帧最多刷新一次
   */
  const appendToBuffer = useCallback(
    (text: string) => {
      textBufferRef.current += text;

      // 如果还没有安排 RAF，安排一个
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(flushTextBuffer);
      }
    },
    [flushTextBuffer],
  );

  /**
   * 直接追加文本 (无缓冲模式)
   */
  const appendDirect = useCallback((text: string) => {
    setContent((prev) => prev + text);
    setRenderCount((prev) => prev + 1);
  }, []);

  /**
   * 开始测试
   */
  const startTest = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentIndex(0);
    setContent('');
    setStartTime(Date.now());
    setEndTime(null);
    setRenderCount(0);
    setFrameDrops(0);
    textBufferRef.current = '';
    lastFlushTimeRef.current = Date.now();
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  /**
   * 暂停/继续测试
   */
  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  /**
   * 停止测试
   */
  const stopTest = useCallback(() => {
    // 强制刷新剩余内容
    if (textBufferRef.current) {
      flushTextBuffer();
    }
    setIsRunning(false);
    setIsPaused(false);
    setEndTime(Date.now());
  }, [flushTextBuffer]);

  /**
   * 重置测试
   */
  const resetTest = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setContent('');
    setStartTime(null);
    setEndTime(null);
    setRenderCount(0);
    setFrameDrops(0);
    textBufferRef.current = '';
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // === 模拟 SSE 消息流 ===
  useEffect(() => {
    if (!isRunning || isPaused || currentIndex >= FULL_TEST_DATA.length) {
      if (isRunning && currentIndex >= FULL_TEST_DATA.length) {
        stopTest();
      }
      return;
    }

    const data = FULL_TEST_DATA[currentIndex];
    const timeout = setTimeout(() => {
      // 根据模式选择处理方式
      if (testMode === 'buffered') {
        appendToBuffer(data.text);
      } else {
        appendDirect(data.text);
      }
      setCurrentIndex((prev) => prev + 1);

      // 检测帧丢失（如果 FPS 低于 30）
      if (fps < 30 && fps > 0) {
        setFrameDrops((prev) => prev + 1);
      }
    }, data.delay);

    return () => clearTimeout(timeout);
  }, [
    isRunning,
    isPaused,
    currentIndex,
    appendToBuffer,
    appendDirect,
    fps,
    stopTest,
    testMode,
  ]);

  // === 计算统计数据 ===
  const progress = (currentIndex / FULL_TEST_DATA.length) * 100;
  const duration =
    endTime && startTime
      ? endTime - startTime
      : startTime
      ? Date.now() - startTime
      : 0;
  const optimizationRate =
    currentIndex > 0 ? Math.round((1 - renderCount / currentIndex) * 100) : 0;

  return (
    <div
      style={{
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        background: '#fff',
        minHeight: '100vh',
      }}
    >
      <Title level={2}>🧪 SSE 流式渲染测试</Title>

      <Alert
        message="测试说明"
        description={
          <div>
            <Paragraph>
              此测试页面使用真实的 SSE 消息数据模拟流式渲染，验证修复效果：
            </Paragraph>
            <ul>
              <li>
                测试数据来自 <code>sse中断输出.txt</code>，包含{' '}
                {FULL_TEST_DATA.length} 条消息
              </li>
              <li>消息间隔模拟真实场景（0-383ms 不等）</li>
              <li>
                <strong>缓冲模式</strong>
                ：使用消息缓冲区机制批量处理高频消息（修复后的方式）
              </li>
              <li>
                <strong>直接模式</strong>：每条消息直接触发
                setState（修复前的方式）
              </li>
              <li>监控帧率和渲染次数，验证性能</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* 控制面板 */}
      <Card title="控制面板" style={{ marginBottom: '24px' }}>
        <Space size="large" wrap>
          <Space>
            <Text>测试模式：</Text>
            <Button
              type={testMode === 'buffered' ? 'primary' : 'default'}
              onClick={() => setTestMode('buffered')}
              disabled={isRunning}
            >
              缓冲模式（修复后）
            </Button>
            <Button
              type={testMode === 'direct' ? 'primary' : 'default'}
              onClick={() => setTestMode('direct')}
              disabled={isRunning}
            >
              直接模式（修复前）
            </Button>
          </Space>
          <Space>
            <Button type="primary" onClick={startTest} disabled={isRunning}>
              开始测试
            </Button>
            <Button onClick={togglePause} disabled={!isRunning}>
              {isPaused ? '继续' : '暂停'}
            </Button>
            <Button danger onClick={stopTest} disabled={!isRunning}>
              停止
            </Button>
            <Button onClick={resetTest}>重置</Button>
          </Space>
        </Space>
      </Card>

      {/* 状态统计 */}
      <Card title="性能统计" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
          <Statistic
            title="当前帧率 (FPS)"
            value={fps}
            suffix="fps"
            valueStyle={{
              color: fps >= 30 ? '#3f8600' : fps >= 15 ? '#faad14' : '#cf1322',
            }}
          />
          <Statistic
            title="消息进度"
            value={currentIndex}
            suffix={`/ ${FULL_TEST_DATA.length}`}
          />
          <Statistic title="实际渲染次数" value={renderCount} />
          <Statistic
            title="节省渲染次数"
            value={Math.max(0, currentIndex - renderCount)}
            valueStyle={{ color: '#3f8600' }}
          />
          <Statistic title="耗时" value={duration} suffix="ms" />
          <Statistic
            title="帧丢失检测"
            value={frameDrops}
            valueStyle={{
              color:
                frameDrops > 10
                  ? '#cf1322'
                  : frameDrops > 0
                  ? '#faad14'
                  : '#3f8600',
            }}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Text>进度：</Text>
          <Progress
            percent={Math.round(progress)}
            status={isRunning ? 'active' : 'normal'}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Space>
            <Tag color={fps >= 30 ? 'green' : fps >= 15 ? 'orange' : 'red'}>
              {fps >= 30 ? '流畅' : fps >= 15 ? '轻微卡顿' : '严重卡顿'}
            </Tag>
            <Tag color="blue">渲染优化率: {optimizationRate}%</Tag>
            <Tag color={testMode === 'buffered' ? 'green' : 'orange'}>
              当前模式: {testMode === 'buffered' ? '缓冲模式' : '直接模式'}
            </Tag>
          </Space>
        </div>
      </Card>

      {/* 渲染结果 */}
      <Card title="渲染结果">
        <div
          style={{
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '8px',
            minHeight: '200px',
            whiteSpace: 'pre-wrap',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
            fontSize: '14px',
            lineHeight: '1.6',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {content || '（等待测试开始...）'}
          {isRunning && <span className="cursor-blink">|</span>}
        </div>
      </Card>

      {/* 样式 */}
      <style>
        {`
          .cursor-blink {
            animation: blink 1s step-end infinite;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default SSEStreamingTest;
