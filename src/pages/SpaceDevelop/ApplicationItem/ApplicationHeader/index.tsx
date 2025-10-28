import agentImage from '@/assets/images/agent_image.png';
import ConditionRender from '@/components/ConditionRender';
import { PublishStatusEnum } from '@/types/enums/common';
import type { ApplicationHeaderProps } from '@/types/interfaces/space';
import { CheckCircleTwoTone } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  agentConfigInfo,
}) => {
  return (
    <div className={cx('flex', styles.header)}>
      <div className={cx('flex-1', 'overflow-hide')}>
        <div className={cx('flex', styles['info-box'])}>
          <h3 className={cx('text-ellipsis', styles.title)}>
            {agentConfigInfo.name}
          </h3>
          <ConditionRender
            condition={
              agentConfigInfo.publishStatus === PublishStatusEnum.Published
            }
          >
            <CheckCircleTwoTone twoToneColor="#52c41a" />
          </ConditionRender>
        </div>
        <p className={cx('text-ellipsis-2', styles.desc)}>
          {agentConfigInfo.description}
        </p>
      </div>
      <span className={cx(styles['logo-box'], 'overflow-hide')}>
        <img src={agentConfigInfo.icon || (agentImage as string)} alt="" />
      </span>
    </div>
  );
};

export default ApplicationHeader;
