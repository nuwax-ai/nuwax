import ConditionRender from '@/components/ConditionRender';
import { useFlowKind } from '@/contexts/FlowKindContext';
import { SaveStatusEnum } from '@/models/workflowV3';
import { getImg } from '@/pages/Antv-X6/v3/utils/workflowV3';
import { t } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { FlowKindEnum, PermissionsEnum } from '@/types/enums/common';
import { getTime } from '@/utils';
import { jumpBack } from '@/utils/router';
import {
  ApartmentOutlined,
  CaretRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ExclamationCircleFilled,
  FormOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  LoadingOutlined,
  RedoOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { Button, Popover, Select, Tag, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { useModel, useParams } from 'umi';
interface HeaderProp {
  // 是否隐藏返回箭头
  hideBack?: boolean;
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
    // 流类型：Workflow / AgentFlow
    workflowType?: string;
  };
  onToggleVersionHistory: () => void;
  showPublish: () => void;
  setShowCreateWorkflow: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onManualSave?: () => Promise<boolean>;
  onBack?: () => void;
  // AgentFlow 专用
  onAutoArrange?: () => void;
  handleTestRun?: () => void;
  testRunLoading?: boolean;
  flowControlModel?: string;
  onFlowControlModelChange?: (model: string) => void;
}

const Header: React.FC<HeaderProp> = ({
  // 是否隐藏返回箭头, 默认不隐藏
  hideBack = false,
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
  onBack,
  // AgentFlow 专用
  onAutoArrange,
  handleTestRun,
  testRunLoading,
  flowControlModel,
  onFlowControlModelChange,
}) => {
  const flowKind = useFlowKind();
  const isAgentFlow = flowKind === FlowKindEnum.AgentFlow;
  const { spaceId } = useParams();
  const { saveStatus, saveError, lastSaveTime } = useModel('workflowV3');
  const {
    name,
    icon,
    publishStatus,
    modified,
    description,
    publishDate,
    workflowType,
  } = info;

  const isMac = /mac/i.test(navigator.userAgent);
  const undoShortcut = isMac ? 'Cmd+Z' : 'Ctrl+Z';
  const redoShortcut = isMac ? 'Cmd+Shift+Z' : 'Ctrl+Shift+Z';

  // Delay the "saving" state to avoid quick flicker.
  // Show saving state only when save duration exceeds 300ms.
  const [showSaving, setShowSaving] = React.useState(false);
  const savingTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (saveStatus === SaveStatusEnum.Saving) {
      // Show "saving" only after 300ms delay.
      savingTimerRef.current = setTimeout(() => {
        setShowSaving(true);
      }, 300);
    } else {
      // Save completed: clear timer and hide immediately.
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
        savingTimerRef.current = null;
      }
      setShowSaving(false);
    }

    return () => {
      if (savingTimerRef.current) {
        clearTimeout(savingTimerRef.current);
      }
    };
  }, [saveStatus]);

  // Whether publish button should be disabled.
  const disabledBtn = useMemo(() => {
    if (info) {
      return !info?.permissions?.includes(PermissionsEnum.Publish);
    } else {
      return false;
    }
  }, [info]);

  // Render save status tag.
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case SaveStatusEnum.Saving:
        // Show "saving" only when duration exceeds 300ms.
        if (!showSaving) {
          // Within 300ms, keep showing the previous "saved" state.
          return (
            <Tag color="default" bordered={false}>
              {t(
                'PC.Pages.AntvX6Header.autoSavedAt',
                getTime(
                  lastSaveTime?.toString() ?? modified ?? new Date().toString(),
                ),
              )}
            </Tag>
          );
        }
        return (
          <Tag color="processing" bordered={false} icon={<LoadingOutlined />}>
            {t('PC.Pages.AntvX6Header.saving')}
          </Tag>
        );
      case SaveStatusEnum.Saved:
        return (
          <Tag color="default" bordered={false}>
            {t(
              'PC.Pages.AntvX6Header.autoSavedAt',
              getTime(
                lastSaveTime?.toString() ?? modified ?? new Date().toString(),
              ),
            )}
          </Tag>
        );
      case SaveStatusEnum.Failed:
        return (
          <div className="flex items-center gap-8" style={{ marginRight: 8 }}>
            <Tooltip
              title={
                saveError || t('PC.Pages.AntvX6Header.saveFailedCheckNetwork')
              }
            >
              <Tag
                color="error"
                bordered={false}
                icon={<ExclamationCircleFilled />}
              >
                {t('PC.Pages.AntvX6Header.saveFailed')}
              </Tag>
            </Tooltip>
            {onManualSave && (
              <Button
                type="default"
                onClick={() => onManualSave?.()}
                size="small"
              >
                {t('PC.Pages.AntvX6Header.retrySave')}
              </Button>
            )}
          </div>
        );
      case SaveStatusEnum.Unsaved:
        return (
          <div className="flex items-center gap-8" style={{ marginRight: 8 }}>
            <Tag color="warning" bordered={false}>
              {t('PC.Pages.AntvX6Header.unsavedChanges')}
            </Tag>
            {onManualSave && (
              <Button
                type="default"
                onClick={() => onManualSave?.()}
                size="small"
              >
                {t('PC.Pages.AntvX6Header.saveNow')}
              </Button>
            )}
          </div>
        );
      default:
        return (
          <Tag color="default" bordered={false}>
            {t(
              'PC.Pages.AntvX6Header.autoSavedAt',
              getTime(modified ?? new Date().toString()),
            )}
          </Tag>
        );
    }
  };

  return (
    <div className="fold-header-style flex items-center gap-20">
      <div className="dis-left flex-1">
        <ConditionRender condition={!hideBack}>
          <LeftOutlined
            className="back-icon-style"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                jumpBack(`/space/${spaceId}/library`);
              }
            }}
          />
        </ConditionRender>
        <img
          src={icon || getImg(AgentComponentTypeEnum.Workflow)}
          alt=""
          className="header-icon-style"
        />
        <div className="dis-col header-content-style ">
          <div className="dis-left">
            <strong className="header-name-style">{name}</strong>
            {workflowType === FlowKindEnum.AgentFlow && (
              <Tag color="purple" bordered={false} style={{ marginLeft: 4 }}>
                AgentFlow
              </Tag>
            )}
            {/* AgentFlow: 流程控制模型 Dropdown */}
            {isAgentFlow && (
              <Select
                value={flowControlModel || 'qwen-plus'}
                onChange={onFlowControlModelChange}
                size="small"
                style={{ width: 160, marginLeft: 8 }}
                options={[
                  { label: 'Qwen3.6-Plus', value: 'qwen3.6-plus' },
                  { label: 'Qwen3.5-Turbo', value: 'qwen3.5-turbo' },
                  { label: 'deepseek-v4-flash', value: 'deepseek-v4-flash' },
                  { label: 'qwen-max', value: 'qwen-max' },
                  { label: 'qwen-plus', value: 'qwen-plus' },
                ]}
              />
            )}
            {/* AgentFlow: 自动排列按钮 */}
            {isAgentFlow && onAutoArrange && (
              <Tooltip title={t('PC.Pages.AntvX6Header.autoArrange')}>
                <Button
                  type="text"
                  size="small"
                  icon={<ApartmentOutlined />}
                  onClick={onAutoArrange}
                  style={{ marginLeft: 4 }}
                />
              </Tooltip>
            )}
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

      <div className="header-tag-style flex items-center gap-8">
        {/* <Tag color="#C9CDD4">
              {publishStatus === 'Published'
                ? t('PC.Pages.AntvX6Header.published')
                : t('PC.Pages.AntvX6Header.unpublished')}
            </Tag> */}
        {renderSaveStatus()}

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

      <div
        className="flex items-center gap-8 mr-12"
        style={{ display: 'flex', gap: '16px' }}
      >
        <Tooltip
          title={t('PC.Pages.AntvX6Header.undoWithShortcut', undoShortcut)}
        >
          <UndoOutlined
            style={{
              fontSize: '18px',
              color: canUndo ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.25)',
              cursor: canUndo ? 'pointer' : 'not-allowed',
            }}
            onClick={canUndo ? onUndo : undefined}
          />
        </Tooltip>
        <Tooltip
          title={t('PC.Pages.AntvX6Header.redoWithShortcut', redoShortcut)}
        >
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
      {/* AgentFlow: 保存按钮 */}
      {isAgentFlow && onManualSave && (
        <Button
          type="default"
          icon={<SaveOutlined />}
          onClick={() => onManualSave()}
          size="small"
        >
          {t('PC.Pages.AntvX6Header.save')}
        </Button>
      )}
      {/* AgentFlow: 运行按钮 */}
      {isAgentFlow && handleTestRun && (
        <Button
          loading={testRunLoading}
          icon={<CaretRightOutlined />}
          variant="solid"
          color="green"
          onClick={handleTestRun}
          size="small"
        >
          {t('PC.Pages.AntvX6Header.run')}
        </Button>
      )}
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
