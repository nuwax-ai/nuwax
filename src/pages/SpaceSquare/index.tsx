import useSpaceSquare from '@/hooks/useSpaceSquare';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedTemplateList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { Page } from '@/types/interfaces/request';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { Empty, Tabs, TabsProps } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useParams, useRequest } from 'umi';
import SingleAgent from '../Square/SingleAgent';
import SquareComponentInfo from '../Square/SquareComponentInfo';
import TemplateItem from '../Square/TemplateItem';
import styles from './index.less';

const cx = classNames.bind(styles);

// 空间广场
const SpaceSection: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const {
    squareComponentList,
    setSquareComponentList,
    handleClick,
    handleToggleCollectSuccess,
  } = useSpaceSquare();

  // 广场-已发布智能体列表接口
  const { run: runAgentList } = useRequest(apiPublishedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      setSquareComponentList(result?.records || []);
    },
  });

  // 广场-已发布插件列表接口（广场以及弹框选择中全部插件）
  const { run: runPluginList } = useRequest(apiPublishedPluginList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      setSquareComponentList(result?.records || []);
    },
  });

  // 广场-已发布工作流列表接口（广场以及弹框选择中全部插件）
  const { run: runWorkflowList } = useRequest(apiPublishedWorkflowList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      setSquareComponentList(result?.records || []);
    },
  });

  // 广场-已发布模板列表接口
  const { run: runTemplateList } = useRequest(apiPublishedTemplateList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      setSquareComponentList(result?.records || []);
    },
  });

  const items: TabsProps['items'] = [
    {
      key: SquareAgentTypeEnum.Agent,
      label: '智能体',
      children:
        squareComponentList?.length > 0 ? (
          <div className={cx(styles['list-section'])}>
            {squareComponentList.map((item, index) => {
              return (
                <SingleAgent
                  key={index}
                  publishedItemInfo={item}
                  onToggleCollectSuccess={handleToggleCollectSuccess}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={cx('flex', 'flex-1', 'items-center', 'content-center')}
          >
            <Empty description="暂无数据" />
          </div>
        ),
    },
    {
      key: SquareAgentTypeEnum.Plugin,
      label: '插件',
      children:
        squareComponentList?.length > 0 ? (
          <div className={cx(styles['list-section'])}>
            {squareComponentList.map((item, index) => {
              return (
                <SquareComponentInfo
                  key={index}
                  publishedItemInfo={item}
                  onToggleCollectSuccess={handleToggleCollectSuccess}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={cx('flex', 'flex-1', 'items-center', 'content-center')}
          >
            <Empty description="暂无数据" />
          </div>
        ),
    },
    {
      key: SquareAgentTypeEnum.Workflow,
      label: '工作流',
      children:
        squareComponentList?.length > 0 ? (
          <div className={cx(styles['list-section'])}>
            {squareComponentList.map((item, index) => {
              return (
                <SquareComponentInfo
                  key={index}
                  publishedItemInfo={item}
                  onToggleCollectSuccess={handleToggleCollectSuccess}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={cx('flex', 'flex-1', 'items-center', 'content-center')}
          >
            <Empty description="暂无数据" />
          </div>
        ),
    },
    {
      key: SquareAgentTypeEnum.Template,
      label: '模板',
      children:
        squareComponentList?.length > 0 ? (
          <div className={cx(styles['list-section'])}>
            {squareComponentList.map((item, index) => {
              return (
                <TemplateItem
                  key={index}
                  publishedItemInfo={item}
                  onClick={() => handleClick(item.targetId, item.targetType)}
                />
              );
            })}
          </div>
        ) : (
          <div
            className={cx('flex', 'flex-1', 'items-center', 'content-center')}
          >
            <Empty description="暂无数据" />
          </div>
        ),
    },
  ];

  const handleQuery = (targetType: SquareAgentTypeEnum, page: number = 1) => {
    const params = {
      page,
      pageSize: 100,
      category: targetType,
      // 空间ID（可选）需要通过空间过滤时有用
      spaceId,
      // 只返回空间的组件
      justReturnSpaceData: true,
    };
    // 分类类型
    switch (targetType) {
      case SquareAgentTypeEnum.Agent:
        runAgentList(params);
        break;
      case SquareAgentTypeEnum.Plugin:
        runPluginList(params);
        break;
      case SquareAgentTypeEnum.Workflow:
        runWorkflowList(params);
        break;
      case SquareAgentTypeEnum.Template:
        runTemplateList(params);
        break;
    }
  };

  // 切换标签页 targetType: 组件类型，agent: 智能体，plugin: 插件，workflow: 工作流，template: 模板
  const handleTabClick = (targetType: string) => {
    handleQuery(targetType as SquareAgentTypeEnum);
  };

  useEffect(() => {
    handleQuery(SquareAgentTypeEnum.Agent);
  }, []);
  return (
    <div className={cx(styles.container)}>
      <h3 className={cx(styles.title)}>空间广场</h3>
      <Tabs
        rootClassName={cx(styles.tab)}
        tabBarGutter={50}
        defaultActiveKey={SquareAgentTypeEnum.Agent}
        items={items}
        onTabClick={handleTabClick}
      />
    </div>
  );
};

export default SpaceSection;
