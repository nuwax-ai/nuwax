import WorkspaceLayout from '@/components/WorkspaceLayout';
import { AppstoreAddOutlined, SmileOutlined } from '@ant-design/icons';
import { Card, Empty, Typography } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const { Title, Paragraph } = Typography;

/**
 * 更多页面
 * @description 承载更多扩展功能或设置的整合视图
 */
const MorePage: React.FC = () => {
  return (
    <WorkspaceLayout title="更多页面">
      <div
        className={classNames(
          styles.container,
          'flex',
          'items-center',
          'justify-center',
        )}
      >
        <Card className={styles['glass-card']} variant="borderless">
          <Empty
            image={
              <AppstoreAddOutlined
                className={styles['empty-icon']}
                style={{ fontSize: 64 }}
              />
            }
            description={
              <div className={styles['empty-content']}>
                <Title level={4} className={styles['title']}>
                  更多功能 敬请期待 <SmileOutlined />
                </Title>
                <Paragraph type="secondary" className={styles['desc']}>
                  该页面内容正在建设中，未来将为您提供更丰富的功能模块和便捷服务。
                </Paragraph>
              </div>
            }
          />
        </Card>
      </div>
    </WorkspaceLayout>
  );
};

export default MorePage;
