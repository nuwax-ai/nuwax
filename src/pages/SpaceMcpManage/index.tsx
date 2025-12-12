import ButtonToggle from '@/components/ButtonToggle';
import Loading from '@/components/custom/Loading';
import SelectList from '@/components/custom/SelectList';
import {
  FILTER_DEPLOY,
  MCP_MANAGE_SEGMENTED_LIST,
} from '@/constants/mcp.constants';
import { CREATE_LIST } from '@/constants/space.constants';
import {
  apiMcpDelete,
  apiMcpList,
  apiMcpOfficialList,
  apiMcpStop,
} from '@/services/mcp';
import {
  DeployStatusEnum,
  FilterDeployEnum,
  McpManageSegmentedEnum,
  McpMoreActionEnum,
} from '@/types/enums/mcp';
import { CreateListEnum } from '@/types/enums/space';
import { CustomPopoverItem } from '@/types/interfaces/common';
import { McpDetailInfo } from '@/types/interfaces/mcp';
import {
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, message, Modal, Segmented, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest, useSearchParams } from 'umi';
import styles from './index.less';
import McpComponentItem from './McpComponentItem';
import ServerExportModal from './ServerExportModal';
const cx = classNames.bind(styles);
const { confirm } = Modal;
type IQuery = 'create' | 'deployStatus' | 'segmentedValue' | 'keyword';

/**
 * 工作空间 - MCP管理
 */
const SpaceLibrary: React.FC = () => {
  // ✅ umi 中的 useSearchParams
  const [searchParams, setSearchParams] = useSearchParams();

  // ✅ 当 select 改变时同步 URL
  const handleChange = (key: IQuery, value: string) => {
    // 更新 URL 参数
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // Mcp管理列表
  const [mcpList, setMcpList] = useState<McpDetailInfo[]>([]);
  // 所有Mcp管理列表
  const mcpListAllRef = useRef<McpDetailInfo[]>([]);
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>(
    searchParams.get('keyword') || '',
  );
  const [loading, setLoading] = useState<boolean>(false);
  // 创建者
  const [create, setCreate] = useState<CreateListEnum>(
    Number(searchParams.get('create')) || CreateListEnum.All_Person,
  );
  // 过滤部署状态
  const [deployStatus, setDeployStatus] = useState<FilterDeployEnum>(
    searchParams.get('deployStatus') || FilterDeployEnum.All,
  );
  // 服务导出弹窗
  const [serverExportModalVisible, setServerExportModalVisible] =
    useState<boolean>(false);
  // 分段器
  const [segmentedValue, setSegmentedValue] = useState<McpManageSegmentedEnum>(
    searchParams.get('segmentedValue') || McpManageSegmentedEnum.Custom,
  );
  // 当前Mcp信息
  const currentMcpInfoRef = useRef<McpDetailInfo | null>(null);
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤Mcp管理列表数据
  const handleFilterList = (
    filterCreate?: CreateListEnum,
    filterDeploy?: FilterDeployEnum,
    filterKeyword?: string,
    list = mcpListAllRef.current,
  ) => {
    let _list = list;
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === userInfo.id);
    }
    if (filterDeploy === FilterDeployEnum.Deployed) {
      _list = _list.filter(
        (item) => item.deployStatus === DeployStatusEnum.Deployed,
      );
    }
    if (filterKeyword) {
      _list = _list.filter((item) => item.name.includes(filterKeyword));
    }
    setMcpList(_list);
  };

  // 过滤官方服务列表数据
  const handleFilterOfficialList = (
    filterKeyword?: string,
    list = mcpListAllRef.current,
  ) => {
    let _list = filterKeyword
      ? list.filter((item) => item.name.includes(filterKeyword))
      : list;
    setMcpList(_list);
  };

  // ✅ 监听 URL 改变（支持浏览器前进/后退）
  useEffect(() => {
    const create =
      Number(searchParams.get('create')) || CreateListEnum.All_Person;
    const deployStatus =
      searchParams.get('deployStatus') || FilterDeployEnum.All;
    const segmentedValue =
      searchParams.get('segmentedValue') || McpManageSegmentedEnum.Custom;
    const keyword = searchParams.get('keyword') || '';

    setCreate(create);
    setDeployStatus(deployStatus);
    setSegmentedValue(segmentedValue);
    setKeyword(keyword);

    if (segmentedValue === McpManageSegmentedEnum.Custom) {
      handleFilterList(create, deployStatus, keyword);
    } else {
      handleFilterOfficialList(keyword);
    }
  }, [searchParams]);

  // 列表请求成功后处理数据
  const handleListSuccess = (result: McpDetailInfo[]) => {
    setLoading(false);
    mcpListAllRef.current = result;
    handleFilterList(create, deployStatus, keyword, result);
  };

  // MCP管理列表
  const { run: runMcpList } = useRequest(apiMcpList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo[]) => {
      handleListSuccess(result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // MCP列表（官方服务）
  const { run: runMcpOfficialList } = useRequest(apiMcpOfficialList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo[]) => {
      setLoading(false);
      mcpListAllRef.current = result;
      handleFilterOfficialList(keyword, result);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 修改状态为已停止
  const handleMcpList = (id: number, list: McpDetailInfo[]) => {
    return list.map((item) => {
      if (item.id === id) {
        return { ...item, deployStatus: DeployStatusEnum.Stopped };
      }
      return item;
    });
  };

  // 停止服务成功后处理数据: 修改状态为已停止
  const handleStopServiceSuccess = (id: number) => {
    const list = handleMcpList(id, mcpList);
    setMcpList(list);
    mcpListAllRef.current = handleMcpList(id, mcpListAllRef.current);
  };

  // MCP停用服务
  const { run: runMcpStop } = useRequest(apiMcpStop, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('停用成功');
      const [id] = params;
      handleStopServiceSuccess(id);
    },
  });

  // 删除服务成功后处理数据
  const handleDelSuccess = (id: number) => {
    const list = mcpList.filter((item) => item.id !== id);
    setMcpList(list);
    mcpListAllRef.current = mcpListAllRef.current.filter(
      (item) => item.id !== id,
    );
  };

  // MCP删除
  const { run: runMcpDelete } = useRequest(apiMcpDelete, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: number[]) => {
      message.success('删除成功');
      const [id] = params;
      handleDelSuccess(id);
    },
  });

  useEffect(() => {
    const currentValue =
      searchParams.get('segmentedValue') || McpManageSegmentedEnum.Custom;
    setSegmentedValue(currentValue);
    setLoading(true);
    if (currentValue === McpManageSegmentedEnum.Custom) {
      runMcpList(spaceId);
    } else {
      runMcpOfficialList();
    }
  }, [spaceId]);

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _value = value as CreateListEnum;
    setCreate(_value);
    handleFilterList(_value, deployStatus, keyword);
    handleChange('create', _value.toString());
  };

  // 切换部署状态
  const handlerChangeDeployStatus = (value: React.Key) => {
    const _value = value as FilterDeployEnum;
    setDeployStatus(_value);
    handleFilterList(create, _value, keyword);
    handleChange('deployStatus', _value);
  };

  // 智能体搜索
  const handleQueryAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleChange('keyword', _keyword);
    if (segmentedValue === McpManageSegmentedEnum.Custom) {
      handleFilterList(create, deployStatus, _keyword);
    } else {
      handleFilterOfficialList(_keyword);
    }
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    if (segmentedValue === McpManageSegmentedEnum.Custom) {
      handleFilterList(create, deployStatus);
    } else {
      handleFilterOfficialList();
    }
  };

  // 点击更多操作
  const handleClickMore = (item: CustomPopoverItem, info: McpDetailInfo) => {
    currentMcpInfoRef.current = info;
    const type = item.type as McpMoreActionEnum;
    switch (type) {
      // 停止服务
      case McpMoreActionEnum.Stop_Service:
        confirm({
          title: '您确定要停止此服务吗?',
          icon: <ExclamationCircleFilled />,
          content: info.name,
          okText: '确定',
          maskClosable: true,
          cancelText: '取消',
          onOk() {
            runMcpStop(info.id);
          },
        });
        break;
      // 删除
      case McpMoreActionEnum.Del:
        confirm({
          title: '您确定要删除此服务吗?',
          icon: <ExclamationCircleFilled />,
          content: info.name,
          okText: '确定',
          maskClosable: true,
          cancelText: '取消',
          onOk() {
            runMcpDelete(info.id);
          },
        });
        break;
      // 导出
      case McpMoreActionEnum.Service_Export:
        setServerExportModalVisible(true);
        break;
      // 日志
      case McpMoreActionEnum.Log:
        history.push(`/space/${spaceId}/library-log`);
        break;
      default:
        break;
    }
  };

  // 点击单个资源组件
  const handleClickComponent = (info: McpDetailInfo) => {
    const { id, spaceId } = info;
    // 官方服务不能编辑, spaceId 为 -1时代表官方服务，后台写死的spaceId
    if (spaceId === -1) {
      return;
    }
    // 自定义服务，跳转到编辑页面
    history.push(`/space/${spaceId}/mcp/edit/${id}`);
  };

  // 创建MCP服务
  const handleCreate = () => {
    history.push(`/space/${spaceId}/mcp/create`);
  };

  // 切换分段器
  const handleChangeSegmentedValue = (value: McpManageSegmentedEnum) => {
    handleChange('segmentedValue', value);
    setSegmentedValue(value);
    // setKeyword('');
    setLoading(true);
    if (value === McpManageSegmentedEnum.Custom) {
      runMcpList(spaceId);
    } else {
      runMcpOfficialList();
    }
  };
  const listLength = useMemo(() => {
    return mcpList.length;
  }, [mcpList]);
  // 由于屏

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <div
        className={cx('flex', 'content-between')}
        style={{ marginBottom: 5 }}
      >
        <div style={{ flex: 1 }}>
          <Space>
            <h3 className={cx(styles.title)}>MCP管理</h3>
            {segmentedValue === McpManageSegmentedEnum.Custom && (
              <>
                <SelectList
                  value={create}
                  options={CREATE_LIST}
                  onChange={handlerChangeCreate}
                />
                {/* 单选模式 */}
                <ButtonToggle
                  options={FILTER_DEPLOY}
                  value={deployStatus}
                  onChange={(value) =>
                    handlerChangeDeployStatus(value as React.Key)
                  }
                />
              </>
            )}
          </Space>
        </div>
        <div>
          <Segmented
            options={MCP_MANAGE_SEGMENTED_LIST}
            value={segmentedValue}
            onChange={handleChangeSegmentedValue}
          />
        </div>
        <div style={{ flex: 1, display: 'flex' }}>
          <Input
            rootClassName={cx(styles.input)}
            placeholder="搜索MCP服务"
            value={keyword}
            onChange={handleQueryAgent}
            prefix={<SearchOutlined />}
            allowClear
            onClear={handleClearKeyword}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建MCP服务
          </Button>
        </div>
      </div>
      <div className={cx('flex', styles['select-search-area'])}></div>
      {loading ? (
        <Loading />
      ) : listLength > 0 ? (
        <div
          className={cx(
            styles['main-container'],
            'flex-1',
            'scroll-container-hide',
          )}
        >
          {mcpList?.map((info) => (
            <McpComponentItem
              key={info.id}
              className={cx(info?.spaceId === -1 && styles['office-mcp-item'])}
              mcpInfo={info}
              onClick={() => handleClickComponent(info)}
              onClickMore={(item) => handleClickMore(item, info)}
            />
          ))}
        </div>
      ) : (
        <div className={cx('flex', 'h-full', 'items-center', 'content-center')}>
          <Empty description="未能找到相关结果" />
        </div>
      )}
      <ServerExportModal
        open={serverExportModalVisible}
        mcpId={currentMcpInfoRef.current?.id}
        name={currentMcpInfoRef.current?.name}
        onCancel={() => setServerExportModalVisible(false)}
      />
    </div>
  );
};

export default SpaceLibrary;
