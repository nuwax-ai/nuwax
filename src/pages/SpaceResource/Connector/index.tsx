import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiConnectorProviderPageList } from '@/services/systemManage';
import { apiSpaceList } from '@/services/workspace';
import { SpaceTypeEnum } from '@/types/enums/space';
import type { ConnectorProviderInfo } from '@/types/interfaces/systemManage';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import {
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Empty, Input, message, Select, Space, Spin } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ConnectorCard from './components/ConnectorCard';
import ConnectorImportDrawer from './components/ConnectorImportDrawer';
import styles from './index.less';

/**
 * 工作空间连接器页面
 * 路由：/space/:spaceId/connector
 *
 * 数据流：
 *   1. 页面打开调 GET /api/space/list 拉空间列表（空间下拉框数据源），
 *      默认选中第一个空间
 *   2. 按选中空间 + 筛选条件调
 *      GET /api/connector/providers?spaceId=&scope=space&status=&connected=&keyword=&pageNum=1&pageSize=500
 *
 * 视觉：卡片网格（与管理端 /system/connector-manage 的表格列表不同）；
 * 顶部筛选栏样式参考管理端连接器列表（关键字 + 状态 + 连接）。
 * 「导入」走 ConnectorImportDrawer（预览 diff + 确认导入，接口 space 维度）；
 * 「新增连接器」与卡片上的操作按钮暂为视觉占位，功能后续实现。
 */

/** 状态筛选选项（value 直接透传接口 status 参数） */
const STATUS_FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: 'all' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

/** 连接筛选选项（value 直接透传接口 connected 参数） */
const CONNECTED_FILTER_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '全部', value: 'all' },
  { label: '已连接', value: 'true' },
  { label: '未连接', value: 'false' },
];

const SpaceConnector: React.FC = () => {
  // 空间列表（下拉框数据源）
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const [spaceLoading, setSpaceLoading] = useState<boolean>(true);
  /** 当前选中的空间 ID（页面打开后默认第一个空间） */
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  /** 空间下拉搜索关键字（自行过滤，以便过滤后剔除空分组） */
  const [spaceSearch, setSpaceSearch] = useState<string>('');

  // 筛选条件（value 与接口参数一一对应）
  const [keyword, setKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');
  const [status, setStatus] = useState<string>('all');
  const [connected, setConnected] = useState<string>('all');

  // 连接器卡片列表
  const [records, setRecords] = useState<ConnectorProviderInfo[]>([]);
  const [listLoading, setListLoading] = useState<boolean>(false);
  /** 「导入」抽屉开关 */
  const [importOpen, setImportOpen] = useState<boolean>(false);

  /** 页面打开：拉空间列表并默认选中第一个空间 */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSpaceLoading(true);
        const response = await apiSpaceList();
        const list = response?.code === SUCCESS_CODE ? response.data ?? [] : [];
        if (cancelled) return;
        setSpaces(list);
        if (list.length) {
          setSelectedSpaceId(list[0].id);
        }
      } catch {
        if (!cancelled) {
          setSpaces([]);
        }
      } finally {
        if (!cancelled) {
          setSpaceLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** 关键字防抖：输入停止 400ms 后才触发列表请求 */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 400);
    return () => {
      clearTimeout(timer);
    };
  }, [keyword]);

  /**
   * 拉取连接器列表：选中空间或任一筛选条件变化时重新请求；
   * 导入抽屉「确认导入」成功后也手动调用刷新。
   * isCancelled 由调用方（useEffect 清理逻辑）传入，防止竞态写入过期响应
   */
  const fetchList = useCallback(
    async (isCancelled?: () => boolean) => {
      // 空间未就绪（列表还在加载 / 当前账号没有空间）时不请求
      if (selectedSpaceId === null) return;
      try {
        setListLoading(true);
        const response = await apiConnectorProviderPageList({
          spaceId: selectedSpaceId,
          scope: 'space',
          status,
          connected,
          keyword: debouncedKeyword,
          pageNum: 1,
          pageSize: 500,
        });
        if (isCancelled?.()) return;
        if (response?.code === SUCCESS_CODE) {
          setRecords(response.data?.records ?? []);
        } else {
          setRecords([]);
          message.error(response?.message || '获取连接器列表失败');
        }
      } catch {
        if (!isCancelled?.()) {
          setRecords([]);
        }
      } finally {
        if (!isCancelled?.()) {
          setListLoading(false);
        }
      }
    },
    [selectedSpaceId, status, connected, debouncedKeyword],
  );

  useEffect(() => {
    let cancelled = false;
    void fetchList(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  /**
   * 空间下拉框分组选项：按 SpaceInfo.type 分为「个人空间 / 团队空间」两组
   * （接口返回平铺列表，分组在前端完成；Class 等其余类型归入团队空间，
   * 与设计稿一致，空分组不渲染）
   */
  const spaceOptions = useMemo(() => {
    const keyword = spaceSearch.trim().toLowerCase();
    const filtered = keyword
      ? spaces.filter((item) => item.name?.toLowerCase().includes(keyword))
      : spaces;
    const personalOptions = filtered
      .filter((item) => item.type === SpaceTypeEnum.Personal)
      .map((item) => ({ label: item.name, value: item.id }));
    const teamOptions = filtered
      .filter((item) => item.type !== SpaceTypeEnum.Personal)
      .map((item) => ({ label: item.name, value: item.id }));

    const groups: Array<{
      label: string;
      options: Array<{ label: string; value: number }>;
    }> = [];
    if (personalOptions.length) {
      groups.push({ label: '个人空间', options: personalOptions });
    }
    if (teamOptions.length) {
      groups.push({ label: '团队空间', options: teamOptions });
    }
    return groups;
  }, [spaces, spaceSearch]);

  return (
    <WorkspaceLayout
      title="连接器"
      rightSlot={
        <Space size={12}>
          {/* TODO: 新增连接器 功能待实现 */}
          <Button className={styles.darkBtn} icon={<PlusOutlined />}>
            新增连接器
          </Button>
          {/* 导入：右侧滑出导入抽屉（预览 diff + 确认导入） */}
          <Button
            icon={<UploadOutlined />}
            onClick={() => setImportOpen(true)}
            disabled={selectedSpaceId === null}
          >
            导入
          </Button>
        </Space>
      }
    >
      <div className={styles.page}>
        {/* 筛选栏：关键字 + 状态 + 连接（样式参考管理端连接器列表）；右侧为空间选择器 */}
        <div className={styles.filterBar}>
          <Input
            className={styles.searchInput}
            allowClear
            prefix={<SearchOutlined className={styles.searchIcon} />}
            placeholder="搜索空间连接器（名称 / service / 分类 / 标签）"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <div className={styles.filterItem}>
            <span className={styles.filterItemLabel}>状态:</span>
            <Select
              className={styles.filterItemSelect}
              variant="borderless"
              value={status}
              options={STATUS_FILTER_OPTIONS}
              onChange={setStatus}
              popupMatchSelectWidth={false}
            />
          </div>
          <div className={styles.filterItem}>
            <span className={styles.filterItemLabel}>连接:</span>
            <Select
              className={styles.filterItemSelect}
              variant="borderless"
              value={connected}
              options={CONNECTED_FILTER_OPTIONS}
              onChange={setConnected}
              popupMatchSelectWidth={false}
            />
          </div>
          <div className={styles.flexSpace} />
          {/* 空间选择器：个人空间 / 团队空间分组展示，切换后按新 spaceId 重新拉取列表 */}
          <div className={styles.filterItem}>
            <span className={styles.filterItemLabel}>空间:</span>
            <Select
              className={styles.spaceSelect}
              variant="borderless"
              showSearch
              filterOption={false}
              searchValue={spaceSearch}
              onSearch={setSpaceSearch}
              loading={spaceLoading}
              value={selectedSpaceId ?? undefined}
              options={spaceOptions}
              onChange={(value) => setSelectedSpaceId(value)}
              popupMatchSelectWidth={false}
              notFoundContent={spaceLoading ? <Spin size="small" /> : null}
            />
          </div>
        </div>

        {/* 卡片网格 */}
        {listLoading ? (
          <div className={styles.loadingWrap}>
            <Spin />
          </div>
        ) : selectedSpaceId === null ? (
          <div className={styles.emptyWrap}>
            <Empty description="暂无空间" />
          </div>
        ) : records.length ? (
          <div className={styles.grid}>
            {records.map((record) => (
              <ConnectorCard key={record.id} record={record} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyWrap}>
            <Empty description="暂无连接器" />
          </div>
        )}
      </div>

      {/* 导入连接器抽屉：预览 diff / 确认导入均按当前选中空间（spaceId 挂 query） */}
      {selectedSpaceId !== null ? (
        <ConnectorImportDrawer
          open={importOpen}
          onClose={() => setImportOpen(false)}
          spaceId={selectedSpaceId}
          onImported={() => void fetchList()}
        />
      ) : null}
    </WorkspaceLayout>
  );
};

export default SpaceConnector;
