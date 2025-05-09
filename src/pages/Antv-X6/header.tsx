import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import {
  CheckCircleFilled,
  // CheckCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tag } from 'antd';
import React from 'react';
interface HeaderProp {
  info: {
    name?: string;
    icon?: string;
    publishStatus?: string;
    created?: string;
    modified?: string;
    id?: number;
    description?: string;
    publishDate?: string | null;
  };
  showPublish: () => void;
  setShowCreateWorkflow: () => void;
}

const Header: React.FC<HeaderProp> = ({
  info,
  setShowCreateWorkflow,
  showPublish,
}) => {
  const { name, icon, publishStatus, modified, description, publishDate } =
    info;

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
          <div className="dis-left">
            <strong className="header-name-style">{name}</strong>
            <Popover content={description}>
              <InfoCircleOutlined className="mr-6" />
            </Popover>
            {publishStatus === 'Published' && (
              <Popover content={'已发布'}>
                <CheckCircleFilled
                  className="mr-6"
                  style={{ color: '#00B23C' }}
                />
              </Popover>
            )}
            <EditOutlined onClick={setShowCreateWorkflow} />
            {publishDate === null && (
              <Tag
                color="default"
                bordered={false}
                style={{ marginLeft: '6px' }}
              >
                未发布
              </Tag>
            )}
            {publishDate !== null && publishDate !== modified && (
              <Tag
                bordered={false}
                color="volcano"
                style={{ marginLeft: '6px' }}
              >
                有更新未发布
              </Tag>
            )}
            {/* <CheckCircleOutlined /> */}
          </div>
          <div className="header-tag-style">
            {/* <Tag color="#C9CDD4">
              {publishStatus === 'Published' ? '已发布' : '未发布'}
            </Tag> */}
            <Tag color="#EBECF5" style={{ color: 'rgba(15,21,40,0.82)' }}>
              已自动保存 {getTime(modified ?? new Date().toString())}
            </Tag>
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
