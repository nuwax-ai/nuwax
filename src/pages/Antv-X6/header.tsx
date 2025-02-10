import { getTime } from '@/utils';
import {
  CheckCircleOutlined,
  EditOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import React from 'react';
interface HeaderProp {
  info: {
    name: string;
    icon?: string;
    publishStatus: string;
    created: string;
    modified: string;
  };

  onSubmit: () => void;

  setShowCreateWorkflow: () => void;
}

const Header: React.FC<HeaderProp> = ({
  info,
  onSubmit,
  setShowCreateWorkflow,
}) => {
  const { name, icon, publishStatus, modified } = info;

  return (
    <div className="fold-header-style dis-sb">
      <div className="dis-left">
        <LeftOutlined className="back-icon-style" />
        {icon && <img src={icon} alt="" className="header-icon-style" />}
        <div className="dis-col header-content-style ">
          <div className="dis-left ">
            <span className="header-name-style">{name}</span>
            <EditOutlined className="mr-16" onClick={setShowCreateWorkflow} />
            <CheckCircleOutlined />
          </div>
          <div className="header-tag-style">
            <Tag>工作流</Tag>
            <Tag>{publishStatus}</Tag>
            <span>配置自动保存于{getTime(modified)}</span>
          </div>
        </div>
      </div>
      <Button onClick={onSubmit} type={'primary'}>
        发布
      </Button>
    </div>
  );
};

export default Header;
