import NavigationStyleToggle from '@/components/NavigationStyleToggle';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { history } from 'umi';

/**
 * 导航Token使用示例页面
 * 展示完整的导航风格切换功能和Token系统
 */
const NavigationTokenExample: React.FC = () => {
  const handleBack = () => {
    history.push('/examples');
  };

  return (
    <div className="navigation-token-example">
      <div
        style={{
          padding: '16px 24px',
          background: 'var(--xagi-current-bg-card)',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ color: 'var(--xagi-current-text-primary)' }}
        >
          返回示例中心
        </Button>
      </div>
      <NavigationStyleToggle />
    </div>
  );
};

export default NavigationTokenExample;
