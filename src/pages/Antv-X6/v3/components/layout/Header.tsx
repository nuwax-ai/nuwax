import { SaveStatusEnum } from '@/models/workflowV3';
import { getImg } from '@/pages/Antv-X6/v3/utils/workflowV3';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { PermissionsEnum } from '@/types/enums/common';
import { getTime } from '@/utils';
import { jumpBack } from '@/utils/router';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  FormOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  LoadingOutlined,
  RedoOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Popover, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { useModel, useParams } from 'umi';
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
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onManualSave?: () => Promise<boolean>;
}

const Header: React.FC<HeaderProp> = ({
  isValidLoading,
  info,
  onToggleVersionHistory,
  setShowCreateWorkflow,
  showPublish,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onManualSave,
}) => {
  const { spaceId } = useParams();
  const { saveStatus, saveError, lastSaveTime } = useModel('workflowV3');
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

  // 渲染保存状态标签
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case SaveStatusEnum.Saving:
        return (
          <Tag color="processing" bordered={false} icon={<LoadingOutlined />}>
            保存中...
          </Tag>
        );
      case SaveStatusEnum.Saved:
        return (
          <Tag color="default" bordered={false}>
            已自动保存{' '}
            {getTime(
              lastSaveTime?.toString() ?? modified ?? new Date().toString(),
            )}
          </Tag>
        );
      case SaveStatusEnum.Failed:
        return (
          <div className="flex items-center gap-8" style={{ marginRight: 8 }}>
            <Tooltip title={saveError || '保存失败，请检查网络连接'}>
              <Tag
                color="error"
                bordered={false}
                icon={<ExclamationCircleFilled />}
              >
                保存失败
              </Tag>
            </Tooltip>
            {onManualSave && (
              <Button type="default" onClick={onManualSave} size="small">
                点击重试保存
              </Button>
            )}
          </div>
        );
      case SaveStatusEnum.Unsaved:
        return (
          <div className="flex items-center gap-8" style={{ marginRight: 8 }}>
            <Tag color="warning" bordered={false}>
              有未保存的更改
            </Tag>
            {onManualSave && (
              <Button type="default" onClick={onManualSave} size="small">
                点击立即保存
              </Button>
            )}
          </div>
        );
      default:
        return (
          <Tag color="default" bordered={false}>
            已自动保存 {getTime(modified ?? new Date().toString())}
          </Tag>
        );
    }
  };

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

      <div className="header-tag-style flex items-center gap-8">
        {/* <Tag color="#C9CDD4">
              {publishStatus === 'Published' ? '已发布' : '未发布'}
            </Tag> */}
        {renderSaveStatus()}

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

      {/* 撤销/重做按钮 */}
      <div
        className="flex items-center gap-8 mr-12"
        style={{ display: 'flex', gap: '16px' }}
      >
        <Tooltip title="撤销 (Cmd+Z)">
          <UndoOutlined
            style={{
              fontSize: '18px',
              color: canUndo ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.25)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            onClick={canUndo ? onUndo : undefined}
          />
        </Tooltip>
        <Tooltip title="重做 (Cmd+Shift+Z)">
          <RedoOutlined
            style={{
              fontSize: '18px',
              color: canRedo ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.25)',
              cursor: canRedo ? 'pointer' : 'not-allowed',
            }}
            onClick={canRedo ? onRedo : undefined}
          />
        </Tooltip>
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
