import CustomPopover from '@/components/CustomPopover';
import InfiniteScrollDiv from '@/components/InfiniteScrollDiv';
import Loading from '@/components/Loading';
import useSpaceSquare from '@/hooks/useSpaceSquare';
import { apiPublishOffShelf } from '@/services/publish';
import {
  apiPublishedAgentList,
  apiPublishedPluginList,
  apiPublishedTemplateList,
  apiPublishedWorkflowList,
} from '@/services/square';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { Page } from '@/types/interfaces/request';
import { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { EllipsisOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Empty, Modal, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
// 复用广场中的组件
import { SPACE_SQUARE_TABS } from '@/constants/space.constants';
import SingleAgent from '../Square/SingleAgent';
import SquareComponentInfo from '../Square/SquareComponentInfo';
import TemplateItem from '../Square/TemplateItem';
import styles from './index.less';

const cx = classNames.bind(styles);

// 空间广场
const SpaceSection: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // 目标类型（智能体、插件、工作流、模板）
  const targetComponentTypeRef = React.useRef<SquareAgentTypeEnum>();
  // tabs激活的key
  const [activeKey, setActiveKey] = useState<SquareAgentTypeEnum>(
    SquareAgentTypeEnum.Agent,
  );
  const [loading, setLoading] = useState<boolean>(false);
  // 当前页码
  const [page, setPage] = useState<number>(1);
  // 是否有更多数据
  const [hasMore, setHasMore] = useState<boolean>(true);
  const {
    squareComponentList,
    setSquareComponentList,
    handleClick,
    handleToggleCollectSuccess,
  } = useSpaceSquare();

  // 查询列表成功后处理数据
  const handleSuccess = (result: Page<SquarePublishedItemInfo>) => {
    const { records, pages, current } = result;
    setSquareComponentList((prev) => {
      return current === 1 ? records || [] : [...prev, ...records];
    });
    // 如果当前页码大于等于总页数，则不再加载更多数据
    setHasMore(current < pages);
    // 更新页码
    setPage(current + 1);
    setLoading(false);
  };

  // 广场-已发布智能体列表接口
  const { run: runAgentList } = useRequest(apiPublishedAgentList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      handleSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 广场-已发布插件列表接口（广场以及弹框选择中全部插件）
  const { run: runPluginList } = useRequest(apiPublishedPluginList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      handleSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 广场-已发布工作流列表接口（广场以及弹框选择中全部插件）
  const { run: runWorkflowList } = useRequest(apiPublishedWorkflowList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      handleSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 广场-已发布模板列表接口
  const { run: runTemplateList } = useRequest(apiPublishedTemplateList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: Page<SquarePublishedItemInfo>) => {
      handleSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 查询列表
  const handleQuery = (
    targetType: SquareAgentTypeEnum,
    pageIndex: number = 1,
  ) => {
    const params = {
      page: pageIndex,
      pageSize: 20,
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
    onSuccess: () => {
      // 刷新
      const targetType = targetComponentTypeRef.current;
      handleQuery(targetType as SquareAgentTypeEnum);
    },
  });

  // 切换标签页 targetType: 组件类型，agent: 智能体，plugin: 插件，workflow: 工作流，template: 模板
  const handleTabClick = (targetType: string) => {
    setLoading(true);
    setSquareComponentList([]);
    const _activeKey = targetType as SquareAgentTypeEnum;
    setActiveKey(_activeKey);
    handleQuery(_activeKey);
  };

  useEffect(() => {
    handleTabClick(SquareAgentTypeEnum.Agent);
  }, [spaceId]);

  // 下架
  const handleOffShelf = (
    componentTypeName: string,
    info: SquarePublishedItemInfo,
    componentType: SquareAgentTypeEnum,
    justOffShelfTemplate: boolean = false,
  ) => {
    const { targetId, name, targetType, id: publishId } = info;
    Modal.confirm({
      title: `您确定要下架此${componentTypeName}吗?`,
      icon: <ExclamationCircleFilled />,
      content: name,
      okText: '确定',
      maskClosable: true,
      cancelText: '取消',
      onOk() {
        targetComponentTypeRef.current = componentType;
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
    componentTypeName: string,
    info: SquarePublishedItemInfo,
    componentType: SquareAgentTypeEnum,
    justOffShelfTemplate: boolean = false,
  ) => {
    return (
      <CustomPopover
        list={[{ label: '下架' }]}
        onClick={() =>
          handleOffShelf(
            componentTypeName,
            info,
            componentType,
            justOffShelfTemplate,
          )
        }
      >
        <EllipsisOutlined className={cx(styles.icon)} />
      </CustomPopover>
    );
  };

  // 获取子组件
  const getChildren = (type: SquareAgentTypeEnum) => {
    return squareComponentList.map((item, index) => {
      if (type === SquareAgentTypeEnum.Agent) {
        return (
          <SingleAgent
            key={index}
            publishedItemInfo={item}
            extra={getExtra('智能体', item, type)}
            onToggleCollectSuccess={handleToggleCollectSuccess}
            onClick={() => handleClick(item.targetId, item.targetType)}
          />
        );
      } else if (type === SquareAgentTypeEnum.Template) {
        return (
          <TemplateItem
            key={index}
            publishedItemInfo={item}
            extra={getExtra('模板', item, type, true)}
            onClick={() => handleClick(item.targetId, item.targetType)}
          />
        );
      } else {
        const componentTypeName =
          type === SquareAgentTypeEnum.Plugin ? '插件' : '工作流';
        return (
          <SquareComponentInfo
            key={index}
            publishedItemInfo={item}
            extra={getExtra(componentTypeName, item, type)}
            onToggleCollectSuccess={handleToggleCollectSuccess}
            onClick={() => handleClick(item.targetId, item.targetType)}
          />
        );
      }
    });
  };

  // 滚动加载更多
  const handleScroll = () => {
    handleQuery(activeKey, page);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col')}>
      <h3 className={cx(styles.title)}>空间广场</h3>
      <Tabs
        rootClassName={cx(styles.tab)}
        tabBarGutter={50}
        activeKey={activeKey}
        items={SPACE_SQUARE_TABS}
        onTabClick={handleTabClick}
      />
      {loading ? (
        <Loading />
      ) : squareComponentList?.length > 0 ? (
        <div className={cx('flex-1', 'overflow-y')} id="scrollableDiv">
          <InfiniteScrollDiv
            scrollableTarget="scrollableDiv"
            list={squareComponentList}
            hasMore={hasMore}
            onScroll={handleScroll}
          >
            <div className={cx(styles['list-section'])}>
              {getChildren(activeKey)}
            </div>
          </InfiniteScrollDiv>
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="暂无数据" />
        </div>
      )}
    </div>
  );
};

export default SpaceSection;
