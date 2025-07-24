import Loading from '@/components/Loading';
import SelectList from '@/components/SelectList';
import {
  FILTER_DEPLOY,
  MCP_MANAGE_SEGMENTED_LIST,
} from '@/constants/mcp.constants';
import { CREATE_LIST } from '@/constants/space.constants';
import { apiMcpDelete, apiMcpList, apiMcpStop } from '@/services/mcp';
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
import { Button, Empty, Input, message, Modal, Segmented } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import styles from './index.less';
import McpComponentItem from './McpComponentItem';
import ServerExportModal from './ServerExportModal';
const cx = classNames.bind(styles);
const { confirm } = Modal;

/**
 * 工作空间 - MCP管理
 */
const SpaceLibrary: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // Mcp管理列表
  const [mcpList, setMcpList] = useState<McpDetailInfo[]>([]);
  // 所有Mcp管理列表
  const mcpListAllRef = useRef<McpDetailInfo[]>([]);
  // 搜索关键词
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  // 创建者
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  // 过滤部署状态
  const [deployStatus, setDeployStatus] = useState<FilterDeployEnum>(
    FilterDeployEnum.All,
  );
  // 服务导出弹窗
  const [serverExportModalVisible, setServerExportModalVisible] =
    useState<boolean>(false);
  // 分段器
  const [segmentedValue, setSegmentedValue] = useState<McpManageSegmentedEnum>(
    McpManageSegmentedEnum.Custom,
  );
  // 当前Mcp信息
  const currentMcpInfoRef = useRef<McpDetailInfo | null>(null);
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤Mcp管理列表数据
  const handleFilterList = (
    filterCreate: CreateListEnum,
    filterDeploy: FilterDeployEnum,
    filterKeyword: string,
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

  // MCP管理列表
  const { run: runMcpList } = useRequest(apiMcpList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo[]) => {
      handleFilterList(create, deployStatus, keyword, result);
      mcpListAllRef.current = result;
      setLoading(false);
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
    setLoading(true);
    runMcpList(spaceId);
  }, [spaceId]);

  // 切换创建者
  const handlerChangeCreate = (value: React.Key) => {
    const _value = value as CreateListEnum;
    setCreate(_value);
    handleFilterList(_value, deployStatus, keyword);
  };

  // 切换部署状态
  const handlerChangeDeployStatus = (value: React.Key) => {
    const _value = value as FilterDeployEnum;
    setDeployStatus(_value);
    handleFilterList(create, _value, keyword);
  };

  // 智能体搜索
  const handleQueryAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    if (segmentedValue === McpManageSegmentedEnum.Custom) {
      handleFilterList(create, deployStatus, _keyword);
    } else {
      // todo: 官方服务, 搜索全局部署的MCP
    }
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    handleFilterList(create, deployStatus, '');
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
    }
  };

  // 点击单个资源组件
  const handleClickComponent = (info: McpDetailInfo) => {
    const { id, spaceId } = info;
    history.push(`/space/${spaceId}/mcp/edit/${id}`);
  };

  // 创建MCP服务
  const handleCreate = () => {
    history.push(`/space/${spaceId}/mcp/create`);
  };

  // 切换分段器
  const handleChangeSegmentedValue = (value: McpManageSegmentedEnum) => {
    setSegmentedValue(value);
    setKeyword('');
    if (value === McpManageSegmentedEnum.Custom) {
      handleFilterList(create, deployStatus, '');
    } else {
      // todo: 官方服务, 点击官方服务时直接展示全局部署的MCP
      setMcpList([]);
    }
  };

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'flex-col',
        'h-full',
        'overflow-y',
      )}
    >
      <div className={cx('flex', 'content-between')}>
        <h3 className={cx(styles.title)}>MCP管理</h3>
        <Segmented
          options={MCP_MANAGE_SEGMENTED_LIST}
          value={segmentedValue}
          onChange={handleChangeSegmentedValue}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          创建MCP服务
        </Button>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        {segmentedValue === McpManageSegmentedEnum.Custom && (
          <>
            <SelectList
              value={create}
              options={CREATE_LIST}
              onChange={handlerChangeCreate}
            />
            <SelectList
              value={deployStatus}
              options={FILTER_DEPLOY}
              onChange={handlerChangeDeployStatus}
            />
          </>
        )}
        <Input
          rootClassName={cx(styles.input)}
          placeholder="搜索MCP服务"
          value={keyword}
          onChange={handleQueryAgent}
          prefix={<SearchOutlined />}
          allowClear
          onClear={handleClearKeyword}
        />
      </div>
      <div className={cx('flex-1', 'overflow-y')}>
        {loading ? (
          <Loading className="h-full" />
        ) : mcpList?.length > 0 ? (
          <div className={cx(styles['main-container'])}>
            {mcpList?.map((info) => (
              <McpComponentItem
                key={info.id}
                mcpInfo={info}
                onClick={() => handleClickComponent(info)}
                onClickMore={(item) => handleClickMore(item, info)}
              />
            ))}
          </div>
        ) : (
          <div
            className={cx('flex', 'h-full', 'items-center', 'content-center')}
          >
            <Empty description="未能找到相关结果" />
          </div>
        )}
      </div>
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
