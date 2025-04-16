import Constant from '@/constants/codes.constants';
import { ICON_TABLE, ICON_WORD } from '@/constants/images.constants';
import service, { IGetList } from '@/services/created';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { WorkflowModeEnum } from '@/types/enums/library';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import {
  // ClockCircleOutlined,
  // MessageOutlined,
  ProductFilled,
  SearchOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import { Button, Divider, Input, Menu, Modal, Radio } from 'antd';
import { RadioChangeEvent } from 'antd/lib/radio';
import { useCallback, useEffect, useRef, useState } from 'react';
// import { useModel } from 'umi';
import { useParams } from 'umi';
import CreateKnowledge from '../CreateKnowledge';
import CreateNewPlugin from '../CreateNewPlugin';
import CreateWorkflow from '../CreateWorkflow';
import './index.less';
import { ButtonList, CreatedProp, MenuItem } from './type';
// 顶部的标签页名称
const buttonList: ButtonList[] = [
  { label: '插件', key: AgentComponentTypeEnum.Plugin },
  { label: '工作流', key: AgentComponentTypeEnum.Workflow },
  { label: '知识库', key: AgentComponentTypeEnum.Knowledge },
  // { label: '数据库', key: AgentComponentTypeEnum.Database },
];

// 创建插件、工作流、知识库、数据库
const Created: React.FC<CreatedProp> = ({
  open,
  onCancel,
  checkTag,
  onAdded,
  addComponents,
}) => {
  /**  -----------------  定义一些变量  -----------------   */
  // const { spaceId } = useModel('workflow');
  const { spaceId } = useParams();

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
    pageSize: 10,
  });

  const [sizes, setSizes] = useState<number>(100);
  // 当前被选中的左侧菜单
  const [selectMenu, setSelectMenu] = useState<string>('all');
  //   右侧的list
  const [list, setList] = useState<CreatedNodeItem[]>([]);

  // 左侧菜单栏
  const items: MenuItem[] = [
    {
      key: 'library',
      icon: <SearchOutlined />,
      label: `组件库${selected.label}`,
    },
    {
      key: 'collect',
      icon: <StarFilled />,
      label: '收藏',
    },
    {
      key: 'divider',
      type: 'divider', // 确保分隔线项有 key 和 type 属性
    },
    {
      key: 'group',
      label: `搜索${selected.label}`, // 如果需要动态内容，可以像这样使用模板字符串
      type: 'group', // 使用 Ant Design 支持的类型
      children: [
        {
          key: 'all', // 子项也需要唯一的 key
          label: '全部',
          icon: <ProductFilled />,
        },
      ],
    },
  ];

  const knowledgeItem = [
    {
      key: 'all', // 子项也需要唯一的 key
      label: '全部',
      icon: <ProductFilled />,
    },
    {
      key: '1',
      icon: <ICON_WORD />,
      label: '文档',
    },
    {
      key: '2',
      icon: <ICON_TABLE />,
      label: '表格',
    },
  ];
  // 添加ref引用
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRequesting = useRef(false);
  /**  -----------------  需要调用接口  -----------------   */

  // 获取右侧的list（关键修改）
  const getList = async (type: AgentComponentTypeEnum, params: IGetList) => {
    if (spaceId === 0) return;
    if (params.page > sizes || isRequesting.current) return;
    isRequesting.current = true;
    const _res = await service.getList(type, { ...params, spaceId });
    isRequesting.current = false;
    console.log(_res);
    if (_res.code === Constant.success) {
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
    }
  };

  // 获取已经收藏的list
  const getCollectList = async (params: IGetList) => {
    const _type = selected.key.toLowerCase();
    const _res = await service.collectList(_type, params);
    setList([..._res.data]);
  };

  // 收藏和取消收藏
  const collectAndUnCollect = async (item: CreatedNodeItem) => {
    const _type = selected.key.toLowerCase();
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

  // 新增工作流，插件，知识库，数据库
  const onConfirm = () => {
    setShowCreate(false);
    const _params = {
      page: 1,
      pageSize: 10,
    };
    getList(selected.key, _params);
    setPagination(_params);
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

  const callInterface = (val: string, params: IGetList) => {
    setSizes(100);
    // 通过左侧菜单决定调用哪个接口
    switch (val) {
      case 'collect':
        getCollectList(params);
        break;
      case 'library':
        getList(selected.key, { ...params, justReturnSpaceData: true });
        break;
      default:
        getList(selected.key, params);
        break;
    }
  };

  // 修改 onMenuClick 方法，确保切换左侧菜单时重置分页
  const onMenuClick = (val: string) => {
    setSearch('');
    setSelectMenu(val);
    setPagination({ page: 1, pageSize: 10 }); // 确保重置分页
    setList([]);

    const params: IGetList = {
      page: 1,
      pageSize: 10,
    };

    if (selected.key === AgentComponentTypeEnum.Knowledge && val !== 'all') {
      params.dataType = val;
    }

    callInterface(val, params);
  };

  // 修改 changeTitle 方法，确保切换顶部选项时重置分页
  const changeTitle = (val: RadioChangeEvent | string) => {
    if (!val) return;

    const _select = typeof val === 'string' ? val : val.target.value;
    const _item = buttonList.find((item) => item.key === _select);
    if (_item) {
      setSelectMenu('all');
      setSearch('');
      SetSelected(_item);
      setPagination({ page: 1, pageSize: 10 }); // 重置分页状态
      setSizes(100); // 重置数据大小
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
  //   顶部的标题
  const title = (
    <div className="dis-left created-title">
      <Radio.Group
        value={selected.key}
        onChange={changeTitle}
        defaultValue="plugInNode"
      >
        {buttonList.map((item, index) => (
          <span key={item.key} className="radio-title-style">
            <Radio.Button
              value={item.key}
              className={`radio-button-style ${
                index === 0 ? 'first-radio-style' : ''
              }`}
            >
              {item.label}
            </Radio.Button>
          </span>
        ))}
      </Radio.Group>
    </div>
  );

  return (
    <Modal
      keyboard={false} //是否能使用sec关闭
      maskClosable={false} //点击蒙版层是否可以关闭
      open={open}
      footer={null}
      centered
      title={title}
      onCancel={() => onCancel()}
      className="created-modal-style"
      width={1096}
    >
      <div className="created-container dis-sb-start">
        {/* 左侧部分 */}
        <div className="aside-style">
          {/* 搜索框 */}
          <Input
            className="margin-bottom"
            allowClear
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
          {/* 创建按钮 */}
          <Button
            type="primary"
            className="margin-bottom"
            style={{ width: '100%' }}
            onClick={() => setShowCreate(true)}
          >{`创建${selected.label}`}</Button>

          {/* 下方的菜单 */}
          <Menu
            onClick={(val) => onMenuClick(val.key)}
            selectedKeys={[selectMenu]}
            mode="inline"
            items={
              selected.key === AgentComponentTypeEnum.Knowledge
                ? knowledgeItem
                : items
            }
          ></Menu>
        </div>
        {/* 右侧部分应该是变动的 */}
        <div className="main-style flex-1 overflow-y" ref={scrollRef}>
          {list.map((item) => (
            <div className="dis-sb list-item-style" key={item.targetId}>
              <img
                src={item.icon || getImg(selected.key)}
                alt=""
                className="left-image-style"
              />
              <div className="flex-1 content-font">
                <p className="label-font-style margin-bottom-6">{item.name}</p>
                <p className="margin-bottom-6 created-description-style">
                  {item.description}
                </p>
                {/* <Tag>{item.tag}</Tag> */}
                <div className="dis-sb count-div-style">
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
                    <span className="margin-left-6">
                      发布于{getTime(item.created!)}
                    </span>
                    {selected.key !== AgentComponentTypeEnum.Knowledge && (
                      <>
                        <Divider type="vertical" />
                        {item.collect && (
                          <StarFilled
                            className="collect-star icon-margin"
                            onClick={() => collectAndUnCollect(item)}
                          />
                        )}
                        {!item.collect && (
                          <StarOutlined
                            className="icon-margin"
                            onClick={() => collectAndUnCollect(item)}
                          />
                        )}
                        <span className="margin-left-6">
                          {item.statistics ? item.statistics.collectCount : 0}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                color="primary"
                variant="outlined"
                onClick={() => onAddNode(item)}
                loading={addComponents?.some(
                  (info) =>
                    info.type === item.targetType &&
                    info.targetId === item.targetId &&
                    info.status === AgentAddComponentStatusEnum.Loading,
                )}
                disabled={addComponents?.some(
                  (info) =>
                    info.type === item.targetType &&
                    info.targetId === item.targetId &&
                    info.status === AgentAddComponentStatusEnum.Added,
                )}
              >
                添加
              </Button>
            </div>
          ))}
        </div>
      </div>
      <CreateWorkflow
        onConfirm={onConfirm}
        onCancel={() => setShowCreate(false)}
        open={showCreate && selected.key === AgentComponentTypeEnum.Workflow}
        type={WorkflowModeEnum.Create}
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
    </Modal>
  );
};

export default Created;
