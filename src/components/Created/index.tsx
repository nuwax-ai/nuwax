import Constant, { SUCCESS_CODE } from '@/constants/codes.constants';
import { CREATED_TABS } from '@/constants/common.constants';
import service, { IGetList } from '@/services/created';
import { apiTableAdd } from '@/services/dataTable';
import { apiCustomPageQueryList } from '@/services/pageDev';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { BuildRunningEnum } from '@/types/enums/pageDev';
import { AgentAddComponentBaseInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { CustomPageDto } from '@/types/interfaces/pageDev';
import { getTime } from '@/utils';
import { jumpToMcpCreate, jumpToPageDevelop } from '@/utils/router';
import { getImg } from '@/utils/workflow';
import {
  PlusOutlined,
  SearchOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Empty,
  Input,
  Menu,
  message,
  Modal,
  Segmented,
} from 'antd';
import { AnyObject } from 'antd/es/_util/type';
import classNames from 'classnames';
import { useCallback, useEffect, useRef, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import CreatedItem from '../CreatedItem';
import CreateKnowledge from '../CreateKnowledge';
import CreateNewPlugin from '../CreateNewPlugin';
import CreateWorkflow from '../CreateWorkflow';
import Loading from '../custom/Loading';
import styles from './index.less';
import MCPItem from './MCPItem';
import PageItem from './PageItem';
import { CreatedProp, MenuItem } from './type';

const cx = classNames.bind(styles);

const defaultTabsTypes = [
  AgentComponentTypeEnum.Plugin,
  AgentComponentTypeEnum.Workflow,
  AgentComponentTypeEnum.Knowledge,
  AgentComponentTypeEnum.Table,
];
const defaultTabs = CREATED_TABS.filter((item) =>
  defaultTabsTypes.includes(item.key),
);

// 创建插件、工作流、知识库、数据库
const Created: React.FC<CreatedProp> = ({
  open,
  onCancel,
  checkTag,
  onAdded,
  addComponents,
  addSkillLoading = undefined,
  tabs = defaultTabs,
  hideTop,
}) => {
  /**  -----------------  定义一些变量  -----------------   */
  // const { spaceId } = useModel('workflow');
  const params = useParams();
  const spaceId = Number(params.spaceId);

  // 打开、关闭创建弹窗
  const [showCreate, setShowCreate] = useState(false);
  // 搜索栏的
  const [search, setSearch] = useState<string>('');
  // 当前顶部被选中被选中的
  const [selected, SetSelected] = useState<{
    label: string;
    key: AgentComponentTypeEnum;
  }>({
    label: '插件',
    key: AgentComponentTypeEnum.Plugin,
  });
  // 分页
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  });

  const [sizes, setSizes] = useState<number>(100);
  // 当前被选中的左侧菜单
  const [selectMenu, setSelectMenu] = useState<string>('all');
  const [currentNode, setCurrentNode] = useState<CreatedNodeItem>();
  // 右侧的list
  const [list, setList] = useState<CreatedNodeItem[]>([]);
  // 页面列表
  const [pageList, setPageList] = useState<CustomPageDto[]>([]);
  // 添加loading状态
  const [loading, setLoading] = useState<boolean>(false);
  // 是否进行搜索
  const [doSearching, setDoSearching] = useState<{
    list: CreatedNodeItem[];
    searching: boolean;
  }>({ list: [], searching: false });
  // 是否只返回空间数据，暂时用于滚动加载事件
  const justReturnSpaceDataRef = useRef<boolean>(false);
  // 知识库数据类型, 暂时用于滚动加载事件保存dataType，如果是全部，则不传dataType
  const dataTypeRef = useRef<number | null>(null);

  // 左侧菜单栏
  const items: MenuItem[] = [
    {
      key: 'all', // 子项也需要唯一的 key
      label: '全部',
    },
    {
      key: 'library',
      label: `组件库${selected.label}`,
    },
    {
      key: 'collect',
      label: '收藏',
    },
  ];

  const pageItem = [
    {
      key: 'all', // 子项也需要唯一的 key
      label: '全部',
    },
  ];

  const knowledgeItem = [
    {
      key: 'all', // 子项也需要唯一的 key
      label: '全部',
    },
    {
      key: 1,
      label: '文档',
    },
  ];

  const databaseItem = [
    {
      key: 'all', // 子项也需要唯一的 key
      label: '组件库数据表',
    },
  ];

  const mcpItem = [
    {
      key: 'all', // 子项也需要唯一的 key
      label: '全部',
    },
    {
      key: 'custom',
      label: '自定义服务',
    },
  ];

  const getItems = () => {
    switch (selected.key) {
      case AgentComponentTypeEnum.Knowledge:
        return knowledgeItem;
      case AgentComponentTypeEnum.Table:
        return databaseItem;
      case AgentComponentTypeEnum.MCP:
        return mcpItem;
      case AgentComponentTypeEnum.Page:
        return pageItem;
      default:
        return items;
    }
  };

  // 添加ref引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRequesting = useRef(false);
  /**  -----------------  需要调用接口  -----------------   */

  // 获取右侧的list（关键修改）
  const getList = async (type: AgentComponentTypeEnum, params: IGetList) => {
    // if (needFrontEndSearching(type, params?.kw || '')) {
    //   //如果是MCP 并且是有搜索词 则不调用接口
    //   return;
    // }
    setDoSearching({ list: [], searching: false });
    try {
      if (spaceId === 0) return;
      if ((params.page > sizes && params.page !== 1) || isRequesting.current)
        return;
      isRequesting.current = true;
      if (params.page === 1) {
        // 设置loading状态为true
        setLoading(true);
      }

      // 如果需要只返回空间数据，则设置justReturnSpaceData为true
      if (justReturnSpaceDataRef.current) {
        params.justReturnSpaceData = true;
      }

      // 知识库：如果需要传dataType，则设置dataType
      if (dataTypeRef.current) {
        params.dataType = dataTypeRef.current;
      }

      const {
        code,
        data,
        message: messageText,
      } = await service.getList(type, { ...params, spaceId });
      isRequesting.current = false;
      // 请求完成，设置loading状态为false
      setLoading(false);

      if (code !== SUCCESS_CODE) {
        message.error(messageText);
        return;
      }

      setSizes(data.pages);
      setPagination((prev) => ({
        ...prev,
        page: data.current,
        total: data.total,
      }));
      setList((prev) => {
        const newList =
          params.page === 1 ? [...data.records] : [...prev, ...data.records];

        setDoSearching({ ...doSearching, list: newList }); //同步更新缓存列表
        return newList;
      });
    } catch (error) {
      isRequesting.current = false;
      setLoading(false);
      setSizes(100);
    }
  };

  // 获取已经收藏的list
  const getCollectList = async (params: IGetList) => {
    try {
      setLoading(true);
      const _type = selected.key?.toLowerCase();
      const _res = await service.collectList(_type, params);
      setList([..._res.data]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // 收藏和取消收藏
  const collectAndUnCollect = async (item: CreatedNodeItem) => {
    const _type = selected.key?.toLowerCase();
    // 使用计算属性名定义对象

    let _res;
    if (item.collect) {
      _res = await service.unCollect(_type, item.targetId as number);
    } else {
      _res = await service.collect(_type, item.targetId as number);
    }

    if (_res.code === Constant.success) {
      const newArr = list.map((child) => {
        if (item.targetId === child.targetId) {
          if (child.collect) {
            child.collect = false;
            if (child.statistics) {
              child.statistics.collectCount =
                (child.statistics.collectCount || 1) - 1;
            }
          } else {
            child.collect = true;
            if (child.statistics) {
              child.statistics.collectCount =
                (child.statistics.collectCount || 0) + 1;
            }
          }
        }
        return child;
      });
      setList(newArr);
    }
  };

  // 新增工作流，插件，知识库，数据库
  const onConfirm = async (value: AnyObject) => {
    if (selected.key === AgentComponentTypeEnum.Table) {
      try {
        const params = {
          tableName: value.name,
          tableDescription: value.description,
          spaceId: spaceId,
          icon: value.icon,
        };
        const res = await apiTableAdd(params);
        history.push(`/space/${spaceId}/table/${res.data}`);
      } catch (error) {}
    }
  };

  /**  -----------------  无需调用接口的方法  -----------------   */
  //   点击添加,通知父组件,并将参数传递给父组件
  const onAddNode = (item: CreatedNodeItem) => {
    onAdded(item);
    setCurrentNode(item);
  };
  //   搜索
  const onSearch = (value: string) => {
    const _params: IGetList = {
      kw: value,
      page: 1,
      pageSize: 20,
    };
    setSearch(value); // 更新搜索状态
    setPagination({ page: 1, pageSize: 20 }); // 重置分页状态
    setList([]); // 清空列表

    // 只触发一次请求
    getList(selected.key, _params);
  };

  const callInterface = (val: string, params: IGetList) => {
    setSizes(100);
    // 通过左侧菜单决定调用哪个接口
    switch (val) {
      case 'collect':
        getCollectList(params);
        break;
      case 'library':
        justReturnSpaceDataRef.current = true;
        getList(selected.key, { ...params, justReturnSpaceData: true });
        break;
      default:
        getList(selected.key, params);
        break;
    }
  };

  // 查询页面列表接口
  const { run: runPageList } = useRequest(apiCustomPageQueryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: CustomPageDto[]) => {
      setPageList(result);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 清空页面搜索
  const clearPageSearch = () => {
    setLoading(true);
    runPageList(spaceId, BuildRunningEnum.Published);
  };

  // 搜索页面
  const searchPage = (keyword: string) => {
    const list = pageList?.filter((item) => item.name.includes(keyword)) || [];
    setPageList(list);
  };

  // 修改 onMenuClick 方法，确保切换左侧菜单时重置分页
  const onMenuClick = (val: string) => {
    setSearch('');
    setSelectMenu(val);

    // 页面
    if (selected.key === AgentComponentTypeEnum.Page) {
      clearPageSearch();
      return;
    }

    setPagination({ page: 1, pageSize: 20 }); // 确保重置分页
    setList([]);
    justReturnSpaceDataRef.current = false;
    dataTypeRef.current = null;

    const params: IGetList = {
      page: 1,
      pageSize: 20,
    };
    // 知识库
    if (selected.key === AgentComponentTypeEnum.Knowledge && val !== 'all') {
      params.dataType = Number(val);
      dataTypeRef.current = Number(val);
    }

    // MCP(自定义服务)
    if (selected.key === AgentComponentTypeEnum.MCP && val === 'custom') {
      // params.justReturnSpaceData = true;
      justReturnSpaceDataRef.current = true;
    }

    callInterface(val, params);
  };

  // 修改 changeTitle 方法，确保切换顶部选项时重置分页
  const changeTitle = (val: string | number) => {
    if (!val) return;

    // 重置知识库数据类型和是否只返回空间数据
    dataTypeRef.current = null;
    justReturnSpaceDataRef.current = false;

    const _select = val as string;
    const _item = tabs.find((item) => item.key === _select);
    if (_item) {
      setSelectMenu('all');
      setSearch('');
      SetSelected(_item);

      // 页面
      if (val === AgentComponentTypeEnum.Page) {
        setList([]); // 清空列表
        setLoading(true);
        runPageList(spaceId, BuildRunningEnum.Published);
        return;
      } else {
        setPagination({ page: 1, pageSize: 20 }); // 重置分页状态
        setSizes(100); // 重置数据大小

        // 只触发一次请求
        getList(_item.key, {
          page: 1,
          pageSize: 20,
        });
      }
    }
  };

  const handleScroll = useCallback(() => {
    if (selectMenu === 'collect' || isRequesting.current) return;

    const node = scrollRef.current;
    if (node) {
      const remainingSpace =
        node.scrollHeight - node.scrollTop - node.clientHeight;
      const shouldLoad =
        list.length > 0 && remainingSpace < 50 && pagination.page < sizes;

      if (shouldLoad) {
        const nextPage = pagination.page + 1;

        const params: IGetList = {
          pageSize: 20,
          page: nextPage,
        };

        setPagination((prev) => ({ ...prev, page: nextPage }));
        getList(selected.key, params);
      }
    }
  }, [pagination, selectMenu, sizes, isRequesting, selected.key, list.length]);

  useEffect(() => {
    const node = scrollRef.current;

    if (open && node) {
      node.addEventListener('scroll', handleScroll);

      return () => {
        node.removeEventListener('scroll', handleScroll);
      };
    }
  }, [open, handleScroll]);

  // 修改 changeTitle 方法，确保 open 为 true 时才触发请求
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        changeTitle(checkTag);
      }, 100);
    }
  }, [checkTag, open]); // 添加 open 依赖

  // 顶部的标题
  const title = (
    <div className={cx('dis-left', styles['created-title'])}>
      <h3 className={styles['created-title-text']}>添加</h3>
      <Segmented
        value={selected.key}
        size="large"
        onChange={changeTitle}
        options={tabs
          .filter((item) => !hideTop?.includes(item.key))
          .map((item) => ({
            label: item.label,
            value: item.key,
          }))}
        className={styles['segmented-style']}
      />
    </div>
  );

  const getItemStatusResult = useCallback(
    (
      item: AgentAddComponentBaseInfo,
      targetStatus: AgentAddComponentStatusEnum,
    ): boolean | undefined => {
      return addComponents?.some(
        (info) =>
          info.type === item.targetType &&
          info.targetId === item.targetId &&
          info.status === targetStatus &&
          (info?.toolName || '') === (item.toolName || ''),
      );
    },
    [addComponents],
  );

  const isAdded = useCallback(
    (item: CreatedNodeItem) => {
      return getItemStatusResult(item, AgentAddComponentStatusEnum.Added);
    },
    [getItemStatusResult],
  );

  const handleItemLoading = useCallback(
    (item: CreatedNodeItem, toolName?: string) => {
      if (addSkillLoading === undefined) {
        return getItemStatusResult(item, AgentAddComponentStatusEnum.Loading);
      }

      if (
        addSkillLoading &&
        currentNode?.targetId === item.targetId &&
        (currentNode?.toolName || '') === (toolName || '')
      ) {
        return true;
      }
      return false;
    },
    [getItemStatusResult, currentNode, addSkillLoading],
  );

  const renderMCPItem = (
    item: CreatedNodeItem,
    index: number,
    selected: {
      label: string;
      key: AgentComponentTypeEnum;
    },
  ) => {
    return (
      <MCPItem
        key={`${item.targetId}-${index}`}
        item={item}
        index={index}
        getToolLoading={handleItemLoading}
        selected={selected}
        onAddNode={onAddNode}
        addedComponents={addComponents || []}
      />
    );
  };

  // 添加页面节点
  const addPageNode = (item: CustomPageDto) => {
    onAdded({
      targetType: AgentComponentTypeEnum.Page,
      targetId: item.projectIdStr,
    });
  };

  const renderPageItem = (item: CustomPageDto, index: number) => {
    // 是否已添加
    const isAddedState = getItemStatusResult(
      {
        targetType: AgentComponentTypeEnum.Page,
        targetId: item.projectIdStr,
      },
      AgentAddComponentStatusEnum.Added,
    );

    // 是否正在加载中
    const isCurrentLoading = getItemStatusResult(
      {
        targetType: AgentComponentTypeEnum.Page,
        targetId: item.projectId,
      },
      AgentAddComponentStatusEnum.Loading,
    );

    return (
      <PageItem
        key={`${item.projectId}-${index}`}
        item={item}
        index={index}
        onAddNode={addPageNode}
        isAddedState={isAddedState}
        isCurrentLoading={isCurrentLoading}
      />
    );
  };

  const renderNormalItem = (item: CreatedNodeItem, index: number) => {
    const isCurrentLoading = handleItemLoading(item);
    const isAddedState = isAdded(item);
    return (
      <div
        className={cx('dis-sb', styles['list-item-style'])}
        key={`${item.targetId}-${index}`}
      >
        <img
          src={item.icon || getImg(selected.key)}
          alt=""
          className={cx(styles['left-image-style'])}
        />
        <div className={cx('flex-1', styles['content-font'])}>
          <p className={cx(styles['label-font-style'], 'text-ellipsis-2')}>
            {item.name}
          </p>
          <p
            className={cx(styles['created-description-style'], 'text-ellipsis')}
          >
            {item.description}
          </p>
          <div className={cx('dis-sb', styles['count-div-style'])}>
            <div className={'dis-left'}>
              <img
                src={
                  item.publishUser?.avatar ||
                  require('@/assets/images/avatar.png')
                }
                style={{ borderRadius: '50%' }}
                alt="用户头像"
              />
              <span>{item.publishUser?.nickName}</span>
              <Divider type="vertical" />
              <span>{`发布于${getTime(item.created!)}`}</span>
              {![
                AgentComponentTypeEnum.Knowledge,
                AgentComponentTypeEnum.MCP,
              ].includes(selected.key) && (
                <>
                  <Divider type="vertical" />
                  {item.collect && (
                    <StarFilled
                      className={cx(
                        styles['collect-star'],
                        styles['icon-margin'],
                      )}
                      onClick={() => collectAndUnCollect(item)}
                    />
                  )}
                  {!item.collect && (
                    <StarOutlined
                      className={cx(styles['icon-margin'])}
                      onClick={() => collectAndUnCollect(item)}
                    />
                  )}
                  <span>
                    {item.statistics ? item.statistics.collectCount : 0}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button
          color="default"
          variant="filled"
          onClick={() => onAddNode(item)}
          loading={isCurrentLoading}
          className={cx(
            styles['add-button'],
            isAddedState && styles['add-button-added'],
          )}
          disabled={isCurrentLoading ? false : isAddedState}
        >
          {isAddedState ? '已添加' : '添加'}
        </Button>
      </div>
    );
  };

  // 点击创建
  const handleClickCreate = (
    selectedKey: AgentComponentTypeEnum,
    spaceId: number,
  ) => {
    if (selectedKey === AgentComponentTypeEnum.MCP) {
      jumpToMcpCreate(spaceId);
    } else if (selectedKey === AgentComponentTypeEnum.Page) {
      jumpToPageDevelop(spaceId);
    } else {
      setShowCreate(true);
    }
  };
  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={open}
      footer={null}
      centered
      title={title}
      onCancel={onCancel}
      className={cx(styles['created-modal-style'])}
      width={1096}
    >
      <div className={cx(styles['created-container'], 'dis-sb-start')}>
        {/* 左侧部分 */}
        <div className={cx(styles['aside-style'])}>
          <div className={cx(styles['aside-header'])}>
            {/* 搜索框 */}
            <Input
              allowClear
              value={search}
              variant="filled"
              placeholder="搜索"
              prefix={<SearchOutlined />}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onClear={() => {
                setSearch('');
                // 清空页面搜索
                if (selected.key === AgentComponentTypeEnum.Page) {
                  clearPageSearch();
                } else {
                  getList(selected.key, { page: 1, pageSize: 20 });
                }
              }}
              onPressEnter={(event) => {
                const keyword = (event.currentTarget as HTMLInputElement).value;
                if (event.key === 'Enter') {
                  // 页面搜索
                  if (selected.key === AgentComponentTypeEnum.Page) {
                    searchPage(keyword);
                  } else {
                    setDoSearching({ ...doSearching, searching: true });
                    onSearch(keyword);
                  }
                }
              }}
            />
            {/* 创建按钮 */}
            <Button
              type="primary"
              className={cx(styles['create-button'])}
              icon={<PlusOutlined />}
              block
              onClick={() => handleClickCreate(selected.key, spaceId)}
            >{`创建${selected.label}`}</Button>
          </div>
          {/* 下方的菜单 */}
          <Menu
            className={cx(styles['aside-menu'])}
            onClick={(val) => onMenuClick(val.key)}
            selectedKeys={[selectMenu]}
            mode="vertical"
            items={getItems()}
          ></Menu>
        </div>
        {/* 右侧部分应该是变动的 */}
        <div
          className={cx(styles['main-style'], 'flex-1', 'overflow-y')}
          ref={scrollRef}
        >
          {loading ? (
            <Loading className={cx('h-full')} />
          ) : // 页面列表
          selected.key === AgentComponentTypeEnum.Page && pageList?.length ? (
            pageList?.map((item: CustomPageDto, index: number) => {
              // 页面组件
              return renderPageItem(item, index);
            })
          ) : list?.length ? (
            list.map((item: CreatedNodeItem, index: number) => {
              if (selected.key === AgentComponentTypeEnum.MCP) {
                return renderMCPItem(item, index, selected);
              }
              return renderNormalItem(item, index);
            })
          ) : (
            <div className={cx(styles['created-list-empty-style'])}>
              <Empty
                description={
                  doSearching.searching ? '暂无数据，请重新搜索' : '暂无数据'
                }
              />
            </div>
          )}
        </div>
      </div>
      <CreateWorkflow
        onConfirm={onConfirm}
        onCancel={() => setShowCreate(false)}
        open={showCreate && selected.key === AgentComponentTypeEnum.Workflow}
        type={CreateUpdateModeEnum.Create}
        spaceId={spaceId}
      />
      <CreateNewPlugin
        onConfirm={onConfirm}
        spaceId={spaceId}
        onCancel={() => setShowCreate(false)}
        open={showCreate && selected.key === AgentComponentTypeEnum.Plugin}
        mode={CreateUpdateModeEnum.Create}
      />
      <CreateKnowledge
        spaceId={spaceId}
        onConfirm={onConfirm}
        onCancel={() => setShowCreate(false)}
        open={showCreate && selected.key === AgentComponentTypeEnum.Knowledge}
        mode={CreateUpdateModeEnum.Create}
      />
      <CreatedItem
        spaceId={spaceId}
        type={AgentComponentTypeEnum.Table}
        mode={CreateUpdateModeEnum.Create}
        Confirm={onConfirm}
        onCancel={() => setShowCreate(false)}
        open={showCreate && selected.key === AgentComponentTypeEnum.Table}
      />
    </Modal>
  );
};

export default Created;
