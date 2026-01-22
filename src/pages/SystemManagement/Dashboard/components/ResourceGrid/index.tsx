import { Card, Col, Row } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import type { ResourceGridProps } from './type';

const cx = classNames.bind(styles);

const ResourceGrid: React.FC<ResourceGridProps> = ({ resources }) => {
  return (
    <Card
      className={cx(styles['resource-grid'])}
      bordered={false}
      title="资源概览"
    >
      <Row gutter={[16, 16]}>
        {resources.map((resource, index) => (
          <Col key={index} xs={12} sm={12} md={6} lg={6} xl={6}>
            <div className={cx(styles['resource-item'])}>
              <div
                className={cx(styles['resource-icon'])}
                style={{
                  color: resource.color,
                  backgroundColor: resource.bgColor,
                }}
              >
                {resource.icon}
              </div>
              <div className={cx(styles['resource-info'])}>
                <div className={cx(styles['resource-name'])}>
                  {resource.name}
                </div>
                <div className={cx(styles['resource-count'])}>
                  {resource.count}
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default ResourceGrid;
