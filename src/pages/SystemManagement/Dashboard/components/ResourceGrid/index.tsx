import { Card, Skeleton } from 'antd';
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
      <div className={cx(styles['resource-list'])}>
        {(loading ? Array.from({ length: 8 }) : resources).map(
          (resource, index) => (
            <div key={index} className={cx(styles['resource-item-wrapper'])}>
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
            </div>
          ),
        )}
      </div>
    </Card>
  );
};

export default ResourceGrid;
