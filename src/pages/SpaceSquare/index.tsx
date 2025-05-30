import CustomPopover from '@/components/CustomPopover';
import useSpaceSquare from '@/hooks/useSpaceSquare';
import { apiPublishOffShelf } from '@/services/publish';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedTemplateList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { PublishOffShelfParams } from '@/types/interfaces/publish';
import { Page } from '@/types/interfaces/request';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Empty, Modal, Tabs, TabsProps } from 'antd';
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

  // 智能体、插件、工作流下架
  const { run: runOffShelf } = useRequest(apiPublishOffShelf, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PublishOffShelfParams[]) => {
      // 刷新
      const targetType = params[0].targetType;
      handleQuery(targetType as unknown as SquareAgentTypeEnum);
    },
  });

  // 下架
  const handleOffShelf = (
    componentType: string,
    info: SquarePublishedItemInfo,
    justOffShelfTemplate: boolean = false,
  ) => {
    const { targetId, name, targetType, id: publishId } = info;
    Modal.confirm({
      title: `您确定要下架此${componentType}吗?`,
      icon: <ExclamationCircleFilled />,
      content: name,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        runOffShelf({
          targetType,
          targetId,
          publishId,
          justOffShelfTemplate,
        });
      },
    });
  };

  // 获取组件额外信息
  const getExtra = (
    componentType: string,
    info: SquarePublishedItemInfo,
    justOffShelfTemplate: boolean = false,
  ) => {
    return (
      <CustomPopover
        list={[{ label: '下架' }]}
        onClick={() =>
          handleOffShelf(componentType, info, justOffShelfTemplate)
        }
      >
        <EllipsisOutlined className={cx(styles.icon)} />
      </CustomPopover>
    );
  };

  // 获取子组件
  const getChildren = (type: SquareAgentTypeEnum) => {
    return squareComponentList?.length > 0 ? (
      <div className={cx(styles['list-section'])}>
        {squareComponentList.map((item, index) => {
          if (type === SquareAgentTypeEnum.Agent) {
            return (
              <SingleAgent
                key={index}
                publishedItemInfo={item}
                extra={getExtra('智能体', item)}
                onToggleCollectSuccess={handleToggleCollectSuccess}
                onClick={() => handleClick(item.targetId, item.targetType)}
              />
            );
          } else if (type === SquareAgentTypeEnum.Template) {
            return (
              <TemplateItem
                key={index}
                publishedItemInfo={item}
                extra={getExtra('模板', item, true)}
                onClick={() => handleClick(item.targetId, item.targetType)}
              />
            );
          } else {
            const componentType =
              type === SquareAgentTypeEnum.Plugin ? '插件' : '工作流';
            return (
              <SquareComponentInfo
                key={index}
                publishedItemInfo={item}
                extra={getExtra(componentType, item)}
                onToggleCollectSuccess={handleToggleCollectSuccess}
                onClick={() => handleClick(item.targetId, item.targetType)}
              />
            );
          }
        })}
      </div>
    ) : (
      <div className={cx('flex', 'flex-1', 'items-center', 'content-center')}>
        <Empty description="暂无数据" />
      </div>
    );
  };

  const items: TabsProps['items'] = [
    {
      key: SquareAgentTypeEnum.Agent,
      label: '智能体',
      children: getChildren(SquareAgentTypeEnum.Agent),
    },
    {
      key: SquareAgentTypeEnum.Plugin,
      label: '插件',
      children: getChildren(SquareAgentTypeEnum.Plugin),
    },
    {
      key: SquareAgentTypeEnum.Workflow,
      label: '工作流',
      children: getChildren(SquareAgentTypeEnum.Workflow),
    },
    {
      key: SquareAgentTypeEnum.Template,
      label: '模板',
      children: getChildren(SquareAgentTypeEnum.Template),
    },
  ];

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
