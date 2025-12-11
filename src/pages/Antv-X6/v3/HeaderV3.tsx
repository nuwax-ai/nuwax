import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PermissionsEnum } from '@/types/enums/common';
import { getTime } from '@/utils';
import { jumpBack } from '@/utils/router';
import { getImg } from '@/utils/workflow';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  FormOutlined,
  InfoCircleOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tag } from 'antd';
import React, { useMemo } from 'react';
import { useParams } from 'umi';
interface HeaderProp {
  isValidLoading?: boolean;
  info: {
    name?: string;
    icon?: string;
    publishStatus?: string;
    created?: string;
    modified?: string;
    id?: number;
    spaceId?: number;
    description?: string;
    publishDate?: string | null;
    permissions?: PermissionsEnum[];
  };
  onToggleVersionHistory: () => void;
  showPublish: () => void;
  setShowCreateWorkflow: () => void;
}

const Header: React.FC<HeaderProp> = ({
  isValidLoading,
  info,
  onToggleVersionHistory,
  setShowCreateWorkflow,
  showPublish,
}) => {
  const { spaceId } = useParams();
  const { name, icon, publishStatus, modified, description, publishDate } =
    info;

  // 发布按钮是否禁用
  const disabledBtn = useMemo(() => {
    if (info) {
      return !info?.permissions?.includes(PermissionsEnum.Publish);
    } else {
      return false;
    }
  }, [info]);

  return (
    <div className="fold-header-style flex items-center gap-20">
      <div className="dis-left flex-1">
        <LeftOutlined
          className="back-icon-style"
          onClick={() => jumpBack(`/space/${spaceId}/library`)}
        />
        <img
          src={icon || getImg(AgentComponentTypeEnum.Workflow)}
          alt=""
          className="header-icon-style"
        />
        <div className="dis-col header-content-style ">
          <div className="dis-left">
            <strong className="header-name-style">{name}</strong>
            <Popover content={description}>
              <InfoCircleOutlined
                className="mr-6"
                style={{ fontSize: '16px' }}
              />
            </Popover>
            {publishStatus === 'Published' && (
              <Popover content={'已发布'}>
                <CheckCircleFilled
                  className="mr-6"
                  style={{ color: '#00B23C', fontSize: '16px' }}
                />
              </Popover>
            )}
            <FormOutlined
              onClick={setShowCreateWorkflow}
              style={{ fontSize: '16px' }}
            />
          </div>
        </div>
      </div>

      <div className="header-tag-style">
        {/* <Tag color="#C9CDD4">
              {publishStatus === 'Published' ? '已发布' : '未发布'}
            </Tag> */}
        <Tag color="default" bordered={false}>
          已自动保存 {getTime(modified ?? new Date().toString())}
        </Tag>

        {publishDate === null && (
          <Tag color="#EBECF5" style={{ color: 'rgba(15,21,40,0.82)' }}>
            未发布
          </Tag>
        )}

        {publishDate !== null && publishDate !== modified && (
          <Tag bordered={false} color="volcano">
            有更新未发布
          </Tag>
        )}
      </div>
      <ClockCircleOutlined
        className={'ico cursor-pointer'}
        onClick={onToggleVersionHistory}
      />
      <Button
        disabled={disabledBtn}
        onClick={showPublish}
        type={'primary'}
        loading={isValidLoading}
      >
        {isValidLoading ? '校验中' : '发布'}
      </Button>
    </div>
  );
};

export default Header;
