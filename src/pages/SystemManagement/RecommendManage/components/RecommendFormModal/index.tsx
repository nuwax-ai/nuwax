import CustomFormModal from '@/components/CustomFormModal';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { Empty, Form, message, Select, Spin } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RECOMMEND_PAGE_CONFIG_MAP } from '../../constants';
import {
  apiSystemSaveDisplayRecommend,
  apiSystemUpdateDisplayRecommend,
} from '../../services/recomment';
import {
  DisplayRecommendFunctionTypeEnum,
  DisplayRecommendInfo,
  DisplayRecommendParams,
  DisplayRecommendTargetTypeEnum,
  DisplayRecTypeEnum,
} from '../../types';
import { getChatboxFunctionTypeLabel } from '../../utils/chatboxFunctionTypeLabel';
import { PUBLISHED_TARGET_SOURCE_MAP } from '../../utils/publishedTargetSource';
import { getSquareTargetTypeTitle } from '../../utils/squareTargetTypeLabel';

/**
 * 推荐表单弹窗 Props
 */
export interface RecommendFormModalProps {
  /** 弹窗是否可见 */
  open: boolean;
  /** 推荐展示类型：Home / Official / ChatBoxNav */
  recType: DisplayRecTypeEnum;
  /** 编辑时的推荐记录，为空表示新增 */
  editingRecord?: DisplayRecommendInfo | null;
  /** 新增时的默认排序值 */
  defaultSort: number;
  /** 取消回调 */
  onCancel: () => void;
  /** 保存成功回调 */
  onSuccess: () => void;
}

/** 目标下拉选项结构 */
interface TargetSelectOption {
  label: string;
  value: number;
  item: SquarePublishedItemInfo;
}

/** 目标列表每页条数 */
const TARGET_PAGE_SIZE = 20;
/** 搜索防抖间隔（毫秒） */
const SEARCH_DEBOUNCE_MS = 300;

/** 首页推荐 / 对话框智能体固定为智能体 */
const SINGLE_TARGET_TYPE = DisplayRecommendTargetTypeEnum.Agent;

/**
 * 根据 recType 获取新增时的默认目标类型
 */
const getDefaultTargetType = (
  recType: DisplayRecTypeEnum,
): DisplayRecommendTargetTypeEnum => {
  if (recType === DisplayRecTypeEnum.Official) {
    return RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.Official]
      .targetTypes[0];
  }
  return SINGLE_TARGET_TYPE;
};

const getDefaultFunctionType = (
  recType: DisplayRecTypeEnum,
): DisplayRecommendFunctionTypeEnum | '' => {
  if (recType === DisplayRecTypeEnum.ChatBoxNav) {
    return (
      RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.ChatBoxNav]
        .defaultFunctionType || DisplayRecommendFunctionTypeEnum.AgentDev
    );
  }
  return '';
};

/**
 * 推荐管理 - 新增/编辑弹窗
 *
 * 按 recType 区分交互：
 * - Home：直接选择智能体（apiPublishedAgentList）
 * - Official：先选目标类型，再按类型加载广场列表
 * - ChatBoxNav：先选 functionType，再选择智能体
 */
const RecommendFormModal: React.FC<RecommendFormModalProps> = ({
  open,
  recType,
  editingRecord,
  defaultSort,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!editingRecord;
  const isOfficialPage = recType === DisplayRecTypeEnum.Official;
  const isChatboxPage = recType === DisplayRecTypeEnum.ChatBoxNav;

  /** 提交保存 loading */
  const [loading, setLoading] = useState(false);
  /** 当前选中的目标类型 */
  const [targetType, setTargetType] = useState<DisplayRecommendTargetTypeEnum>(
    () => getDefaultTargetType(recType),
  );
  /** 对话框智能体功能子类型 */
  const [functionType, setFunctionType] = useState<
    DisplayRecommendFunctionTypeEnum | ''
  >(() => getDefaultFunctionType(recType));
  /** 目标下拉列表 loading */
  const [targetLoading, setTargetLoading] = useState(false);
  /** 目标下拉选项 */
  const [targetOptions, setTargetOptions] = useState<TargetSelectOption[]>([]);
  /** 目标列表当前页码 */
  const [targetPage, setTargetPage] = useState(1);
  /** 目标列表是否还有下一页 */
  const [targetHasMore, setTargetHasMore] = useState(false);
  /** 目标搜索关键词 */
  const [targetSearchKw, setTargetSearchKw] = useState('');
  /** 已选目标 ID（受控 Select value） */
  const [selectedTargetId, setSelectedTargetId] = useState<number>();
  /** 已选目标完整信息 */
  const [selectedTarget, setSelectedTarget] =
    useState<SquarePublishedItemInfo | null>(null);

  /** 搜索防抖定时器 */
  const searchTimerRef = useRef<number>();
  /** 防止滚动加载时重复请求 */
  const fetchingRef = useRef(false);

  /** 官方推荐页：目标类型下拉选项 */
  const officialTargetTypeOptions = useMemo(
    () =>
      RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.Official].targetTypes.map(
        (type) => ({
          value: type,
          label: getSquareTargetTypeTitle(type),
        }),
      ),
    [],
  );

  /** 对话框智能体：functionType 下拉选项 */
  const chatboxFunctionTypeOptions = useMemo(
    () =>
      (
        RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.ChatBoxNav]
          .functionTypes || []
      ).map((type) => ({
        value: type,
        label: getChatboxFunctionTypeLabel(type),
      })),
    [],
  );

  /** 推荐目标选择区 label（官方推荐随目标类型变化；首页/对话框固定为智能体） */
  const selectTargetLabel = useMemo(() => {
    if (isOfficialPage) {
      return getSquareTargetTypeTitle(targetType);
    }
    return getSquareTargetTypeTitle(SINGLE_TARGET_TYPE);
  }, [isOfficialPage, targetType]);

  /**
   * 重置目标选择相关状态
   */
  const resetTargetSelect = useCallback(() => {
    setTargetType(getDefaultTargetType(recType));
    setFunctionType(getDefaultFunctionType(recType));
    setTargetSearchKw('');
    setTargetOptions([]);
    setTargetPage(1);
    setTargetHasMore(false);
    setSelectedTargetId(undefined);
    setSelectedTarget(null);
  }, [recType]);

  /**
   * 重置整个表单（新增模式）
   */
  const resetForm = useCallback(() => {
    resetTargetSelect();
  }, [resetTargetSelect]);

  /**
   * 拉取推荐目标列表
   * @param page 页码
   * @param kw 搜索关键词
   * @param append 是否追加到已有选项（滚动加载时为 true）
   */
  const fetchTargets = useCallback(
    async (page: number, kw: string, append: boolean) => {
      const source = PUBLISHED_TARGET_SOURCE_MAP[targetType];
      if (!source || fetchingRef.current) return;

      fetchingRef.current = true;
      setTargetLoading(true);
      try {
        const res = await source.fetchApi(
          source.buildParams(page, TARGET_PAGE_SIZE, kw || undefined),
        );
        if (res?.code !== SUCCESS_CODE) return;

        const records = res.data?.records || [];
        const nextOptions: TargetSelectOption[] = records.map((item) => ({
          label: item.name,
          value: item.targetId,
          item,
        }));

        setTargetOptions((prev) => {
          const merged = append ? [...prev, ...nextOptions] : nextOptions;
          const uniqueMap = new Map<number, TargetSelectOption>();
          merged.forEach((option) => {
            uniqueMap.set(option.value, option);
          });
          return Array.from(uniqueMap.values());
        });
        setTargetPage(page);
        setTargetHasMore(page < (res.data?.pages ?? 0));
      } finally {
        fetchingRef.current = false;
        setTargetLoading(false);
      }
    },
    [targetType],
  );

  /** 弹窗打开时：编辑回填 / 新增重置 */
  useEffect(() => {
    if (!open) return;
    if (editingRecord) {
      setTargetType(editingRecord.targetType as DisplayRecommendTargetTypeEnum);
      setFunctionType(
        (editingRecord.functionType as DisplayRecommendFunctionTypeEnum) || '',
      );
      setSelectedTargetId(editingRecord.targetId);
      setSelectedTarget({
        targetId: editingRecord.targetId,
        name: editingRecord.label,
        icon: editingRecord.icon,
      } as SquarePublishedItemInfo);
      return;
    }
    resetForm();
  }, [open, editingRecord, resetForm]);

  /** 新增模式下，目标类型变化时重新加载第一页 */
  useEffect(() => {
    if (!open || isEdit) return;
    setTargetSearchKw('');
    setSelectedTargetId(undefined);
    setSelectedTarget(null);
    fetchTargets(1, '', false);
  }, [open, isEdit, targetType, fetchTargets]);

  /** 卸载时清理搜索防抖定时器 */
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  /**
   * 目标搜索（服务端搜索，带防抖）
   */
  const handleTargetSearch = (value: string) => {
    setTargetSearchKw(value);
    if (searchTimerRef.current) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      fetchTargets(1, value, false);
    }, SEARCH_DEBOUNCE_MS);
  };

  /**
   * 下拉滚动到底部时加载下一页
   */
  const handlePopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 48;
    if (isNearBottom && !targetLoading && targetHasMore) {
      fetchTargets(targetPage + 1, targetSearchKw, true);
    }
  };

  /**
   * 提交保存
   */
  const handleSubmit = async () => {
    if (!isEdit && !selectedTarget) {
      message.warning(
        dict('PC.Pages.SystemRecommendManage.selectTargetRequired'),
      );
      return;
    }

    const payload: DisplayRecommendParams = {
      id: editingRecord?.id,
      targetType: isEdit ? editingRecord!.targetType : targetType,
      targetId: isEdit ? editingRecord!.targetId : selectedTarget!.targetId,
      recType,
      functionType: functionType || '',
      label: selectedTarget?.name || editingRecord?.label || '',
      icon: selectedTarget?.icon || editingRecord?.icon || '',
      placeholder: editingRecord?.placeholder || '',
      sort: editingRecord?.sort ?? defaultSort,
    };

    setLoading(true);
    try {
      const res = isEdit
        ? await apiSystemUpdateDisplayRecommend(payload)
        : await apiSystemSaveDisplayRecommend(payload);
      if (res?.code === SUCCESS_CODE) {
        message.success(dict('PC.Common.Global.savedSuccessfully'));
        onSuccess();
        onCancel();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={
        isEdit
          ? dict('PC.Pages.SystemRecommendManage.editTitle')
          : dict('PC.Pages.SystemRecommendManage.addTitle')
      }
      loading={loading}
      onCancel={onCancel}
      onConfirm={handleSubmit}
    >
      {/* 对话框智能体：先选 functionType */}
      {!isEdit && isChatboxPage && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            {dict('PC.Pages.SystemRecommendManage.colSubType')}
          </div>
          <Select
            style={{ width: '100%' }}
            value={functionType}
            options={chatboxFunctionTypeOptions}
            onChange={(v) => {
              setFunctionType(v);
            }}
          />
        </div>
      )}

      {/* 官方推荐：先选目标类型 */}
      {!isEdit && isOfficialPage && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            {dict('PC.Pages.SystemRecommendManage.colTargetType')}
          </div>
          <Select
            style={{ width: '100%' }}
            value={targetType}
            options={officialTargetTypeOptions}
            onChange={(v) => {
              setTargetType(v);
              setSelectedTargetId(undefined);
              setSelectedTarget(null);
            }}
          />
        </div>
      )}

      {/* 新增：从广场已发布列表选择目标（搜索 + 滚动加载） */}
      {!isEdit && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>{selectTargetLabel}</div>
          <Select
            showSearch
            allowClear
            filterOption={false}
            style={{ width: '100%' }}
            placeholder={dict('PC.Common.Global.pleaseSelect')}
            value={selectedTargetId}
            options={targetOptions}
            loading={targetLoading}
            onSearch={handleTargetSearch}
            onPopupScroll={handlePopupScroll}
            notFoundContent={
              targetLoading ? (
                <div style={{ textAlign: 'center', padding: 8 }}>
                  <Spin size="small" />
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={dict('PC.Common.Global.emptyData')}
                />
              )
            }
            onChange={(value) => {
              if (value === undefined || value === null) {
                setSelectedTargetId(undefined);
                setSelectedTarget(null);
                return;
              }
              const option = targetOptions.find((item) => item.value === value);
              const item = option?.item;
              setSelectedTargetId(value);
              setSelectedTarget(item || null);
            }}
          />
        </div>
      )}
    </CustomFormModal>
  );
};

export default RecommendFormModal;
