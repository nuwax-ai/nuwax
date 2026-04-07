import { t } from '@/services/i18nRuntime';
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

  // Whether publish button is disabled.
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
              <Popover content={t('PC.Pages.AntvX6Header.published')}>
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
        <Tag color="default" bordered={false}>
          {t(
            'PC.Pages.AntvX6Header.autoSavedAt',
            getTime(modified ?? new Date().toString()),
          )}
        </Tag>

        {publishDate === null && (
          <Tag color="#EBECF5" style={{ color: 'rgba(15,21,40,0.82)' }}>
            {t('PC.Pages.AntvX6Header.unpublished')}
          </Tag>
        )}

        {publishDate !== null && publishDate !== modified && (
          <Tag bordered={false} color="volcano">
            {t('PC.Pages.AntvX6Header.updatedNotPublished')}
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
        {isValidLoading
          ? t('PC.Pages.AntvX6Header.validating')
          : t('PC.Pages.AntvX6Header.publish')}
      </Button>
    </div>
  );
};

export default Header;
