import Constant from '@/constants/codes.constants';
import service, { IGetList } from '@/services/created';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import { SearchOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { Button, Divider, Empty, Input, Modal } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { useModel } from 'umi';
import { CreatedProp } from '@/components/Created/type';
import { CREATED_TABS } from '@/constants/common.constants';
import classNames from 'classnames';
import { useParams } from 'umi';
import Loading from '../custom/Loading';
import styles from './index.less';
const cx = classNames.bind(styles);
const defaultTabsTypes = [
  AgentComponentTypeEnum.Workflow,
  AgentComponentTypeEnum.Agent,
];

// 顶部的标签页名称
const buttonList = CREATED_TABS.filter((item) =>
  defaultTabsTypes.includes(item.key),
);
const getAllowCopy = (key: AgentComponentTypeEnum) => {
  // 模板库 允许复制
  if (defaultTabsTypes.includes(key)) {
    // 模板库 允许复制
    return 1;
  }
  return 0;
};

// 插件、工作流、知识库、数据库、智能体选择组件
const SelectComponent: React.FC<CreatedProp> = ({
  open,
  onCancel,
  checkTag,
  onAdded,
  tabs = buttonList,
  addComponents,
  hideTop,
}) => {
  /**  -----------------  定义一些变量  -----------------   */
  const { spaceId } = useParams();

  // 搜索栏的
  const [search, setSearch] = useState<string>('');
  // 当前顶部被选中被选中的
  const [selected, setSelected] = useState<{
    label: string;
    key: AgentComponentTypeEnum;
  }>({
    label: tabs.find((item) => item.key === checkTag)?.label || '',
    key: checkTag,
  });
  // 分页
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  });

  const [sizes, setSizes] = useState<number>(100);
  // 当前被选中的左侧菜单
  const [selectMenu, setSelectMenu] = useState<string>('all');
  //   右侧的list
  const [list, setList] = useState<CreatedNodeItem[]>([]);
  // 添加loading状态
  const [loading, setLoading] = useState<boolean>(false);

  // 左侧菜单栏配置（暂时未使用，保留以备后续功能扩展）
  // const items: MenuItem[] = [
  //   {
  //     key: 'all', // 子项也需要唯一的 key
  //     label: '全部',
  //   },
  // ];

  // const knowledgeItem = [
  //   {
  //     key: 'all', // 子项也需要唯一的 key
  //     label: '全部',
  //   },
  //   {
  //     key: '1',
  //     label: '文档',
  //   },
  //   {
  //     key: '2',
  //     label: '表格',
  //   },
  // ];

  // const databaseItem = [
  //   {
  //     key: 'all', // 子项也需要唯一的 key
  //     label: '组件库数据表',
  //   },
  // ];

  // 左侧菜单栏配置（暂时未使用，保留以备后续功能扩展）
  // const menusItems = useMemo(() => {
  //   switch (selected.key) {
  //     case AgentComponentTypeEnum.Knowledge:
  //       return knowledgeItem;
  //     case AgentComponentTypeEnum.Table:
  //       return databaseItem;
  //     default:
  //       return items;
  //     }
  //   }, [selected.key]);

  // 添加ref引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRequesting = useRef(false);
  /**  -----------------  需要调用接口  -----------------   */

  // 获取右侧的list（关键修改）
  const getList = async (type: AgentComponentTypeEnum, params: IGetList) => {
    try {
      if (spaceId === 0) return;
      if ((params.page > sizes && params.page !== 1) || isRequesting.current)
        return;
      isRequesting.current = true;
      const allowCopy = getAllowCopy(selected.key);

      // 目标类型，Agent,Plugin,Workflow,可用值:Agent,Plugin,Workflow,Knowledge,Table
      const targetType =
        type === AgentComponentTypeEnum.Page
          ? AgentComponentTypeEnum.Agent
          : type;
      // Agent目标子类型，ChatBot,PageApp,可用值:ChatBot,PageApp, 非Agent类型时不传
      const targetSubType =
        type === AgentComponentTypeEnum.Agent
          ? 'ChatBot'
          : type === AgentComponentTypeEnum.Page
          ? 'PageApp'
          : '';

      const _params = {
        ...params,
        spaceId,
        targetType,
        ...(targetSubType ? { targetSubType } : {}),
        ...(allowCopy === 1 ? { allowCopy } : {}),
      };

      const _res = await service.getList(targetType, _params);
      // 请求完成，设置loading状态为false
      setLoading(false);
      isRequesting.current = false;
      setSizes(_res.data.pages);
      setPagination((prev) => ({
        ...prev,
        page: _res.data.current,
        total: _res.data.total,
      }));

      setList((prev) =>
        params.page === 1
          ? [..._res.data.records]
          : [...prev, ..._res.data.records],
      );
    } catch (error) {
      isRequesting.current = false;
      setSizes(100);
    }
  };

  // 获取已经收藏的list（暂时未使用，保留以备后续功能扩展）
  // const getCollectList = async (params: IGetList) => {
  //   const _type = selected.key.toLowerCase();
  //   const _res = await service.collectList(_type, params);
  //   setList([..._res.data]);
  // };

  // 收藏和取消收藏
  const collectAndUnCollect = async (item: CreatedNodeItem) => {
    const _type = selected.key?.toLowerCase();
    // 使用计算属性名定义对象

    let _res;
    if (item.collect) {
      _res = await service.unCollect(_type, item.targetId);
    } else {
      _res = await service.collect(_type, item.targetId);
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

  /**  -----------------  无需调用接口的方法  -----------------   */
  //   点击添加,通知父组件,并将参数传递给父组件
  const onAddNode = (item: CreatedNodeItem) => {
    onAdded(item);
  };
  //   搜索
  const onSearch = (value: string) => {
    const _params: IGetList = {
      kw: value,
      page: 1,
      pageSize: 10,
    };
    setSearch(value); // 更新搜索状态
    setPagination({ page: 1, pageSize: 10 }); // 重置分页状态
    setList([]); // 清空列表

    // 只触发一次请求
    getList(selected.key, _params);
  };

  // 接口调用函数（暂时未使用，保留以备后续功能扩展）
  // const callInterface = (val: string, params: IGetList) => {
  //   setSizes(100);
  //   // 通过左侧菜单决定调用哪个接口
  //   switch (val) {
  //     case 'collect':
  //       getCollectList(params);
  //       break;
  //     case 'library':
  //       getList(selected.key, { ...params, justReturnSpaceData: true });
  //       break;
  //     default:
  //       getList(selected.key, params);
  //       break;
  //   }
  // };

  // 修改 onMenuClick 方法，确保切换左侧菜单时重置分页（暂时未使用，保留以备后续功能扩展）
  // const onMenuClick = (val: string) => {
  //   setSearch('');
  //   setSelectMenu(val);
  //   setPagination({ page: 1, pageSize: 10 }); // 确保重置分页
  //   setList([]);

  //   const params: IGetList = {
  //     page: 1,
  //     pageSize: 10,
  //     };

  //   if (selected.key === AgentComponentTypeEnum.Knowledge && val !== 'all') {
  //     params.dataType = val;
  //     }

  //   callInterface(val, params);
  // };

  // 修改 changeTitle 方法，确保切换顶部选项时重置分页
  const changeTitle = (val: RadioChangeEvent | string) => {
    if (!val) return;

    const _select = typeof val === 'string' ? val : val.target.value;
    const _item = tabs.find((item) => item.key === _select);

    if (_item) {
      setSelectMenu('all');
      setSearch('');
      setSelected(_item);
      setPagination({ page: 1, pageSize: 10 }); // 重置分页状态
      setSizes(100); // 重置数据大小
      setLoading(true);
      setList([]); // 清空列表

      // 只触发一次请求
      getList(_item.key, {
        page: 1,
        pageSize: 10,
      });
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
          pageSize: 10,
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
  const label = useMemo(() => {
    return tabs
      .filter((item) => !hideTop?.includes(item.key))
      .map((item) => item.label);
  }, [tabs, hideTop]);
  //   顶部的标题
  const title = (
    <div className={cx('dis-left', styles['created-title'])}>
      <h3 className={styles['created-title-text']}>添加{label}</h3>
    </div>
  );

  const isAdded = (item: CreatedNodeItem) => {
    return addComponents?.some(
      (info) =>
        info.type === item.targetType &&
        info.targetId === item.targetId &&
        info.status === AgentAddComponentStatusEnum.Added,
    );
  };
  const isLoading = (item: CreatedNodeItem) => {
    return addComponents?.some(
      (info) =>
        info.type === item.targetType &&
        info.targetId === item.targetId &&
        info.status === AgentAddComponentStatusEnum.Loading,
    );
  };
  const renderNormalItem = (item: CreatedNodeItem, index: number) => {
    const isLoadingState = isLoading(item);
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
          loading={isLoadingState}
          className={cx(
            styles['add-button'],
            isAddedState && styles['add-button-added'],
          )}
          disabled={isAddedState ? false : isLoadingState}
        >
          {isAddedState ? '已添加' : '添加'}
        </Button>
      </div>
    );
  };

  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={open}
      footer={null}
      centered
      title={title}
      onCancel={() => onCancel()}
      className={cx(styles['created-modal-style'])}
      width={1096}
    >
      <div className={cx(styles['created-container'], 'flex', 'flex-col')}>
        <div className={cx('dis-left', styles['filter-bar'])}>
          {/* <Segmented
            value={selectMenu}
            size="large"
            onChange={(value) => onMenuClick(value?.key || '')}
            options={menusItems}
            className={styles['segmented-style']}
          /> */}
          {/* 左侧部分 */}
          <div className={cx(styles['right-aside-style'])}>
            {/* 搜索框 */}
            <Input
              allowClear
              variant="filled"
              value={search}
              placeholder="搜索"
              prefix={<SearchOutlined />}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onClear={() => {
                setSearch('');
                getList(selected.key, { page: 1, pageSize: 10 });
              }}
              onPressEnter={(event) => {
                if (event.key === 'Enter') {
                  onSearch((event.currentTarget as HTMLInputElement).value);
                }
              }}
            />
          </div>
        </div>

        {/* 右侧部分应该是变动的 */}
        <div
          className={cx(styles['main-style'], 'flex-1', 'overflow-y')}
          ref={scrollRef}
        >
          {loading ? (
            <Loading className={cx('h-full')} />
          ) : list.length > 0 ? (
            list.map((item: CreatedNodeItem, index: number) =>
              renderNormalItem(item, index),
            )
          ) : (
            <div
              className={cx('h-full', 'flex', 'items-center', 'content-center')}
            >
              <Empty description="暂无数据" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SelectComponent;
