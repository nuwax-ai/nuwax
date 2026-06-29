import { EllipsisTooltip } from '@/components/custom/EllipsisTooltip';
import Loading from '@/components/custom/Loading';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { getTime } from '@/utils';
import { getImg } from '@/utils/workflow';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Divider, Empty, Input, message, Modal, Segmented } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RECOMMEND_PAGE_CONFIG_MAP } from '../../constants';
import { apiSystemSaveDisplayRecommend } from '../../services/recomment';
import {
  DisplayRecommendInfo,
  DisplayRecommendTargetTypeEnum,
  DisplayRecTypeEnum,
} from '../../types';
import { PUBLISHED_TARGET_SOURCE_MAP } from '../../utils/publishedTargetSource';
import { getSquareTargetTypeTitle } from '../../utils/squareTargetTypeLabel';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 列表每页条数 */
const PAGE_SIZE = 20;

/** 目标类型 → 默认图标类型 */
const TARGET_ICON_TYPE_MAP: Record<
  DisplayRecommendTargetTypeEnum,
  AgentComponentTypeEnum
> = {
  [DisplayRecommendTargetTypeEnum.Agent]: AgentComponentTypeEnum.Agent,
  [DisplayRecommendTargetTypeEnum.PageApp]: AgentComponentTypeEnum.Page,
  [DisplayRecommendTargetTypeEnum.Skill]: AgentComponentTypeEnum.Skill,
  [DisplayRecommendTargetTypeEnum.Plugin]: AgentComponentTypeEnum.Plugin,
  [DisplayRecommendTargetTypeEnum.Workflow]: AgentComponentTypeEnum.Workflow,
};

export interface RecommendAddModalProps {
  /** 弹窗是否可见 */
  open: boolean;
  /** 推荐展示类型 */
  recType: DisplayRecTypeEnum;
  /** 当前页已添加的推荐记录，用于展示「已添加」 */
  existingRecords: DisplayRecommendInfo[];
  /** 新增时的默认排序值 */
  defaultSort: number;
  /** 取消回调 */
  onCancel: () => void;
  /** 添加成功回调（刷新列表） */
  onSuccess: () => void;
}

/**
 * 推荐管理 - 新建弹窗（参考 Created 布局）
 * 从广场已发布列表选择目标并添加，支持 Tab 切换、搜索、滚动加载
 */
const RecommendAddModal: React.FC<RecommendAddModalProps> = ({
  open,
  recType,
  existingRecords,
  defaultSort,
  onCancel,
  onSuccess,
}) => {
  const pageConfig = RECOMMEND_PAGE_CONFIG_MAP[recType];
  const targetTypes = pageConfig.targetTypes;

  const [activeTargetType, setActiveTargetType] =
    useState<DisplayRecommendTargetTypeEnum>(targetTypes[0]);
  const [searchKw, setSearchKw] = useState('');
  const [list, setList] = useState<SquarePublishedItemInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  /** 本次弹窗内新添加成功的 targetKey */
  const [sessionAddedKeys, setSessionAddedKeys] = useState<Set<string>>(
    () => new Set(),
  );
  /** 正在添加的 targetKey */
  const [addingKey, setAddingKey] = useState<string>();

  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const requestVersionRef = useRef(0);
  const addedCountRef = useRef(0);

  const tabOptions = useMemo(
    () =>
      targetTypes.map((type) => ({
        label: getSquareTargetTypeTitle(type),
        value: type,
      })),
    [targetTypes],
  );

  // 已添加的 targetKey 集合
  const addedKeySet = useMemo(() => {
    const keys = new Set<string>();
    existingRecords.forEach((item) => {
      keys.add(`${item.targetType}-${item.targetId}`);
    });
    sessionAddedKeys.forEach((key) => keys.add(key));
    return keys;
  }, [existingRecords, sessionAddedKeys]);

  // 构建 targetKey
  const buildTargetKey = (
    targetType: DisplayRecommendTargetTypeEnum,
    targetId: number,
  ) => `${targetType}-${targetId}`;

  /**
   * 拉取广场已发布列表
   */
  const fetchList = useCallback(
    async (
      targetType: DisplayRecommendTargetTypeEnum,
      pageNo: number,
      kw: string,
      append: boolean,
    ) => {
      const source = PUBLISHED_TARGET_SOURCE_MAP[targetType];
      if (!source || fetchingRef.current) return;

      const localVersion = ++requestVersionRef.current;
      fetchingRef.current = true;
      if (pageNo === 1) {
        setLoading(true);
      }

      try {
        const res = await source.fetchApi(
          source.buildParams(pageNo, PAGE_SIZE, kw || undefined),
        );
        if (localVersion !== requestVersionRef.current) return;
        if (res?.code !== SUCCESS_CODE) return;

        const records = res.data?.records || [];
        setList((prev) => {
          if (!append || pageNo === 1) return records;
          const map = new Map<number, SquarePublishedItemInfo>();
          [...prev, ...records].forEach((item) => {
            map.set(item.targetId, item);
          });
          return Array.from(map.values());
        });
        setPage(pageNo);
        setTotalPages(res.data?.pages ?? 0);
      } finally {
        if (localVersion === requestVersionRef.current) {
          fetchingRef.current = false;
          setLoading(false);
          setIsSearching(false);
        }
      }
    },
    [],
  );

  /** 弹窗打开 / Tab 切换：重置并加载第一页 */
  useEffect(() => {
    if (!open) return;
    setActiveTargetType(targetTypes[0]);
    setSearchKw('');
    setList([]);
    setPage(1);
    setTotalPages(0);
    setSessionAddedKeys(new Set());
    addedCountRef.current = 0;
  }, [open, targetTypes]);

  useEffect(() => {
    if (!open) return;
    setSearchKw('');
    setList([]);
    setPage(1);
    setTotalPages(0);
    fetchList(activeTargetType, 1, '', false);
  }, [open, activeTargetType, fetchList]);

  /** 滚动加载下一页 */
  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node || fetchingRef.current || page >= totalPages) return;

    const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (remaining < 50 && list.length > 0) {
      fetchList(activeTargetType, page + 1, searchKw, true);
    }
  }, [activeTargetType, fetchList, list.length, page, searchKw, totalPages]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!open || !node) return;
    node.addEventListener('scroll', handleScroll);
    return () => node.removeEventListener('scroll', handleScroll);
  }, [open, handleScroll]);

  /** 搜索（回车触发） */
  const handleSearch = (kw: string) => {
    setIsSearching(!!kw);
    setPage(1);
    setList([]);
    fetchList(activeTargetType, 1, kw, false);
  };

  /** 添加推荐 */
  const handleAdd = async (item: SquarePublishedItemInfo) => {
    const targetKey = buildTargetKey(activeTargetType, item.targetId);
    if (addedKeySet.has(targetKey) || addingKey === targetKey) return;

    setAddingKey(targetKey);
    try {
      const res = await apiSystemSaveDisplayRecommend({
        targetType: activeTargetType,
        targetId: item.targetId,
        recType,
        functionType: '',
        label: item.name,
        icon: item.icon,
        placeholder: '',
        sort: defaultSort + addedCountRef.current,
      });
      if (res?.code !== SUCCESS_CODE) return;

      addedCountRef.current += 1;
      setSessionAddedKeys((prev) => new Set(prev).add(targetKey));
      message.success(dict('PC.Pages.SystemRecommendManage.createSuccess'));
      onSuccess();
    } finally {
      setAddingKey(undefined);
    }
  };

  // 渲染列表项
  const renderListItem = (item: SquarePublishedItemInfo, index: number) => {
    const targetKey = buildTargetKey(activeTargetType, item.targetId);
    const isAdded = addedKeySet.has(targetKey);
    const isAdding = addingKey === targetKey;
    const iconType = TARGET_ICON_TYPE_MAP[activeTargetType];

    return (
      <div
        className={cx('dis-sb', styles['list-item-style'])}
        key={`${item.targetId}-${index}`}
      >
        <img
          src={item.icon || getImg(iconType)}
          alt=""
          className={cx(styles['left-image-style'])}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getImg(iconType) || '';
          }}
        />
        <div className={cx('flex-1', styles['content-font'])}>
          <EllipsisTooltip
            className={cx(styles['label-font-style'])}
            text={item.name}
            maxLines={2}
          />
          <EllipsisTooltip
            className={cx(styles['created-description-style'])}
            text={item.description}
          />
          <div className={cx('dis-sb', styles['count-div-style'])}>
            <div className="dis-left">
              <img
                src={
                  item.publishUser?.avatar ||
                  require('@/assets/images/avatar.png')
                }
                style={{ borderRadius: '50%' }}
                alt={dict('PC.Components.Created.userAvatar')}
              />
              <span>{item.publishUser?.nickName}</span>
              <Divider type="vertical" />
              <span>
                {dict(
                  'PC.Components.Created.publishedAt',
                  getTime(item.created!),
                )}
              </span>
            </div>
          </div>
        </div>
        <Button
          color="default"
          variant="filled"
          loading={isAdding}
          disabled={!isAdding && isAdded}
          className={cx(
            styles['add-button'],
            isAdded && styles['add-button-added'],
          )}
          onClick={() => handleAdd(item)}
        >
          {isAdded
            ? dict('PC.Components.Created.added')
            : dict('PC.Components.Created.add')}
        </Button>
      </div>
    );
  };

  const title = (
    <div className={cx('dis-left', styles['created-title'])}>
      <h3 className={styles['created-title-text']}>
        {dict('PC.Components.Created.addTitle')}
      </h3>
      {tabOptions.length > 0 && (
        <Segmented
          value={activeTargetType}
          size="large"
          options={tabOptions}
          className={styles['segmented-style']}
          onChange={(value) =>
            setActiveTargetType(value as DisplayRecommendTargetTypeEnum)
          }
        />
      )}
    </div>
  );

  return (
    <Modal
      keyboard={false}
      maskClosable={false}
      open={open}
      footer={null}
      centered
      title={title}
      onCancel={onCancel}
      className={cx(styles['created-modal-style'])}
      width={1096}
      destroyOnHidden
    >
      <div className={cx(styles['created-container'], 'dis-sb-start')}>
        <div className={cx(styles['aside-style'])}>
          <div className={cx(styles['aside-header'])}>
            <Input
              allowClear
              value={searchKw}
              variant="filled"
              placeholder={dict('PC.Components.Created.search')}
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchKw(e.target.value)}
              onClear={() => handleSearch('')}
              onPressEnter={(e) =>
                handleSearch((e.currentTarget as HTMLInputElement).value)
              }
            />
          </div>
        </div>
        <div
          className={cx(styles['main-style'], 'flex-1', 'overflow-y')}
          ref={scrollRef}
        >
          {loading ? (
            <Loading className={cx('h-full')} />
          ) : list.length ? (
            list.map(renderListItem)
          ) : (
            <div className={cx(styles['created-list-empty-style'])}>
              <Empty
                description={
                  isSearching
                    ? dict('PC.Components.Created.emptyWithSearch')
                    : dict('PC.Components.Created.empty')
                }
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default RecommendAddModal;
