import pageImage from '@/assets/images/agent_image.png';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import CustomPopover from '@/components/CustomPopover';
import { PAGE_DEVELOP_PUBLISH_TYPE_LIST } from '@/constants/pageDev.constants';
import { PageDevelopPublishTypeEnum } from '@/types/enums/pageDev';
import { ProjectDetailData } from '@/types/interfaces/appDev';
import { jumpBack } from '@/utils/router';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Popover, Space, Tag, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevHeaderProps {
  workspace: {
    name?: string;
    projectId?: string;
  };
  spaceId: number;
  // 发布成组件
  onPublishComponent: () => void;
  // 发布成应用
  onPublishApplication: () => void;
  onEditProject: () => void;
  // 版本历史相关
  onOpenVersionHistory: () => void;
  hasUpdates?: boolean;
  isDeploying?: boolean;
  /** 聊天加载状态，用于禁用相关功能 */
  isChatLoading?: boolean;
  /** 项目详情信息 */
  projectInfo?: ProjectDetailData | null;
}

/**
 * AppDev 页面顶部头部组件
 * 统一了 EditAgent 页面的头部样式和交互模式
 */
const AppDevHeader: React.FC<AppDevHeaderProps> = ({
  workspace,
  onPublishComponent,
  onPublishApplication,
  onEditProject,
  onOpenVersionHistory,
  spaceId,
  hasUpdates = true,
  isDeploying = false,
  isChatLoading = false, // 新增：聊天加载状态
  projectInfo,
}) => {
  // 获取项目名称，优先使用接口数据
  const projectName = projectInfo?.name || workspace.name || '大模型三部曲';

  // 获取项目图标，优先使用接口数据，为空时使用默认图标
  const projectIcon = projectInfo?.icon;
  // 获取部署状态
  const deployStatus = projectInfo?.buildRunning;

  // 点击发布类型按钮
  const handleClickPopoverItem = (item: any) => {
    switch (item.value) {
      case PageDevelopPublishTypeEnum.PAGE:
        onPublishComponent();
        break;
      case PageDevelopPublishTypeEnum.AGENT:
        onPublishApplication();
        break;
    }
  };

  // 发布类型列表
  const publishList = useMemo(() => {
    if (projectInfo?.publishType === PageDevelopPublishTypeEnum.AGENT) {
      return PAGE_DEVELOP_PUBLISH_TYPE_LIST.filter(
        (item) => item.value === PageDevelopPublishTypeEnum.AGENT,
      );
    }
    return PAGE_DEVELOP_PUBLISH_TYPE_LIST;
  }, [projectInfo?.publishType]);

  return (
    <header className={cx('flex', 'items-center', 'relative', styles.header)}>
      <SvgIcon
        name="icons-nav-backward"
        className={cx(styles['icon-backward'])}
        onClick={() => jumpBack(`/space/${spaceId}/page-develop`)}
      />
      {/* 项目图标 - 优先显示项目图标，为空时显示创建者头像 */}
      <Space size={27} wrap>
        <Avatar size={27} shape="square" src={projectIcon || pageImage} />
      </Space>
      <div className={cx('flex', 'items-center', styles['header-info'])}>
        <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
          {projectName}
        </h3>
        <FormOutlined
          className={cx(styles['edit-ico'], 'cursor-pointer')}
          onClick={onEditProject}
        />
        <div className={cx('flex', 'items-center', styles['agent-rel-info'])}>
          {workspace.projectId && (
            <span className={cx(styles['project-id'])}>
              项目ID: {workspace.projectId}
            </span>
          )}
          {deployStatus && (
            <Popover content={'已发布'}>
              <CheckCircleFilled className={cx(styles.circle)} />
            </Popover>
          )}
          {/* 已发布，并存在更新 */}
          {hasUpdates && (
            <Tag
              bordered={false}
              color="volcano"
              className={cx(styles['volcano'])}
            >
              有更新未发布
            </Tag>
          )}
        </div>
      </div>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <ConditionRender
          condition={
            projectInfo?.publishType === PageDevelopPublishTypeEnum.AGENT
          }
        >
          <Tooltip title="版本历史">
            <ClockCircleOutlined
              className={cx(
                'ico',
                'cursor-pointer',
                styles['version-history-icon'],
              )}
              onClick={onOpenVersionHistory}
            />
          </Tooltip>
        </ConditionRender>
        {/*添加资源*/}
        <CustomPopover list={publishList} onClick={handleClickPopoverItem}>
          <div className={cx('flex', 'items-center', styles['action-buttons'])}>
            <Button
              type="primary"
              loading={isDeploying}
              className={styles.deployButton}
              disabled={isChatLoading} // 新增：聊天加载时禁用部署按钮
            >
              {isDeploying ? '发布中...' : '发布'}
            </Button>
          </div>
        </CustomPopover>
      </div>
    </header>
  );
};

export default AppDevHeader;
