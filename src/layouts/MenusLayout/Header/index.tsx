import ConditionRender from '@/components/ConditionRender';
import { ICON_NEW_AGENT } from '@/constants/images.constants';
import useConversation from '@/hooks/useConversation';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const Header: React.FC = () => {
  // 创建智能体会话
  const { handleCreateConversation } = useConversation();
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  const handlerClick = async () => {
    if (tenantConfigInfo) {
      // 创建智能体会话
      await handleCreateConversation(tenantConfigInfo.defaultAgentId);
    }
  };
  return (
    <>
      <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
        <img
          src={tenantConfigInfo?.siteLogo}
          className={cx(styles.logo)}
          alt=""
        />
      </ConditionRender>
      <span
        className={cx(
          styles['add-agent'],
          'flex',
          'content-center',
          'items-center',
          'cursor-pointer',
          'hover-deep',
        )}
        onClick={handlerClick}
      >
        <Tooltip
          placement="right"
          color={'#fff'}
          styles={{
            body: { color: '#000' },
          }}
          title="新建会话"
        >
          <span>
            <ICON_NEW_AGENT />
          </span>
        </Tooltip>
      </span>
      <div className={cx(styles['divider-horizontal'])} />
    </>
  );
};

export default Header;
