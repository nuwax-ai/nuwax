import { Card, Col, Row, Skeleton } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { ResourceGridProps } from './type';

const cx = classNames.bind(styles);

const ResourceGrid: React.FC<ResourceGridProps> = ({ resources, loading }) => {
  return (
    <Card
      className={cx(styles['resource-grid'])}
      bordered={false}
      title="资源概览"
    >
      <Row gutter={[16, 16]}>
        {(loading ? Array.from({ length: 8 }) : resources).map(
          (resource, index) => (
            <Col key={index} xs={12} sm={12} md={6} lg={6} xl={6}>
              {loading ? (
                <div className={cx(styles['resource-item'])}>
                  <Skeleton.Button
                    active
                    style={{ width: 48, height: 48, borderRadius: 10 }}
                  />
                  <div className={cx(styles['resource-info'])}>
                    <Skeleton.Input active style={{ width: 60, height: 20 }} />
                    <Skeleton.Input active style={{ width: 40, height: 24 }} />
                  </div>
                </div>
              ) : (
                <div className={cx(styles['resource-item'])}>
                  <div
                    className={cx(styles['resource-icon'])}
                    style={{
                      color: (resource as any).color,
                      backgroundColor: (resource as any).bgColor,
                    }}
                  >
                    {(resource as any).icon}
                  </div>
                  <div className={cx(styles['resource-info'])}>
                    <div className={cx(styles['resource-name'])}>
                      {(resource as any).name}
                    </div>
                    <div className={cx(styles['resource-count'])}>
                      {(resource as any).count}
                    </div>
                  </div>
                </div>
              )}
            </Col>
          ),
        )}
      </Row>
    </Card>
  );
};

export default ResourceGrid;
