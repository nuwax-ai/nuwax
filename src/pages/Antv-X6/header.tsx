import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import {
  // CheckCircleOutlined,
  EditOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Tag } from 'antd';
import React from 'react';
interface HeaderProp {
  info: {
    name?: string;
    icon?: string;
    publishStatus?: string;
    created?: string;
    modified?: string;
    id?: number;
  };
  showPublish: () => void;
  setShowCreateWorkflow: () => void;
}

const Header: React.FC<HeaderProp> = ({
  info,
  setShowCreateWorkflow,
  showPublish,
}) => {
  const { name, icon, publishStatus, modified } = info;

  // 返回上一级
  const bank = () => {
    history.back();
  };

  return (
    <div className="fold-header-style dis-sb">
      <div className="dis-left">
        <LeftOutlined className="back-icon-style" onClick={bank} />
        <img
          src={icon || getImg(AgentComponentTypeEnum.Workflow)}
          alt=""
          className="header-icon-style"
        />
        <div className="dis-col header-content-style ">
          <div className="dis-left ">
            <span className="header-name-style">{name}</span>
            <EditOutlined className="mr-16" onClick={setShowCreateWorkflow} />
            {/* <CheckCircleOutlined /> */}
          </div>
          <div className="header-tag-style">
            <Tag color="#C9CDD4">工作流</Tag>
            <Tag color="#C9CDD4">
              {publishStatus === 'Published' ? '已发布' : '未发布'}
            </Tag>
            <span>
              配置自动保存于{getTime(modified ?? new Date().toString())}
            </span>
          </div>
        </div>
      </div>
      <Button onClick={showPublish} type={'primary'}>
        发布
      </Button>
    </div>
  );
};

export default Header;
