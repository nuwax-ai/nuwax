import { RocketOutlined } from '@ant-design/icons';
import { Button, Card, Result } from 'antd';
import styles from './index.less';

/**
 * 生态市场 MCP 页面
 * 下个版本开发，当前显示占位页面
 */
export default function EcosystemMcp() {
  return (
    <div className={styles.container}>
      <Card className={styles.contentCard} variant="outlined">
        <Result
          icon={<RocketOutlined style={{ color: '#1890ff' }} />}
          title="MCP 功能即将上线"
          subTitle="我们正在努力开发 MCP (Model Context Protocol) 功能，敬请期待下个版本的发布！"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回上一页
            </Button>
          }
        />
      </Card>
    </div>
  );
}
