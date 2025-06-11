import Loading from '@/components/Loading';
import SelectList from '@/components/SelectList';
import { CREATE_LIST, FILTER_DEPLOY } from '@/constants/space.constants';
import { apiMcpList } from '@/services/mcp';
import { CreateListEnum } from '@/types/enums/space';
import { McpDetailInfo } from '@/types/interfaces/mcp';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useModel, useParams, useRequest } from 'umi';
import styles from './index.less';
// import { FilterDeployEnum } from '@/types/enums/mcp';
const cx = classNames.bind(styles);
// const { confirm } = Modal;

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
  // 创建
  const [create, setCreate] = useState<CreateListEnum>(
    CreateListEnum.All_Person,
  );
  // 获取用户信息
  const { userInfo } = useModel('userInfo');

  // 过滤Mcp管理列表数据
  const handleFilterList = (
    filterCreate: CreateListEnum,
    // filterDeploy: FilterDeployEnum,
    filterKeyword: string,
    list = mcpListAllRef.current,
  ) => {
    let _list = list;
    if (filterCreate === CreateListEnum.Me) {
      _list = _list.filter((item) => item.creatorId === userInfo.id);
    }
    // if (filterDeploy === FilterDeployEnum.Deployed) {
    //   _list = _list.filter(
    //     (item) => item.deployStatus === FilterDeployEnum.Deployed,
    //   );
    // }
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
      handleFilterList(create, keyword, result);
      mcpListAllRef.current = result;
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
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
    handleFilterList(_value, keyword);
  };

  // 智能体搜索
  const handleQueryAgent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const _keyword = e.target.value;
    setKeyword(_keyword);
    handleFilterList(create, _keyword);
  };

  // 清除关键词
  const handleClearKeyword = () => {
    setKeyword('');
    handleFilterList(create, '');
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
        <Button type="primary" icon={<PlusOutlined />}>
          创建MCP服务
        </Button>
      </div>
      <div className={cx('flex', styles['select-search-area'])}>
        <SelectList
          value={create}
          options={CREATE_LIST}
          onChange={handlerChangeCreate}
        />
        <SelectList
          value={status}
          options={FILTER_DEPLOY}
          // onChange={handlerChangeStatus}
        />
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
              <div key={info.id}>{info.id}</div>
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
    </div>
  );
};

export default SpaceLibrary;
