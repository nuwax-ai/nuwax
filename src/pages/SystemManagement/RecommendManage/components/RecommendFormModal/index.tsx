import agentImage from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import { Form, message, Select } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import {
  getUsedChatboxSingleInstanceTypes,
  isChatboxFunctionTypeDisabled,
} from '../../utils/chatboxFunctionTypeRules';
import { getSquareTargetTypeTitle } from '../../utils/squareTargetTypeLabel';
import RecommendAddModal from '../RecommendAddModal';
import SelectedAgentCard from './SelectedAgentCard';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 对话框智能体推荐 - 新增/编辑弹窗 Props
 */
export interface RecommendFormModalProps {
  /** 弹窗是否可见 */
  open: boolean;
  /** 编辑时的推荐记录，为空表示新增 */
  editingRecord?: DisplayRecommendInfo | null;
  /** 当前页已有推荐列表（子类型互斥） */
  existingRecords?: DisplayRecommendInfo[];
  /** 新增时的默认排序值 */
  defaultSort: number;
  /** 取消回调 */
  onCancel: () => void;
  /** 保存成功回调 */
  onSuccess: () => void;
}

/** 对话框智能体固定推荐智能体 */
const TARGET_TYPE = DisplayRecommendTargetTypeEnum.Agent;
/** 对话框智能体推荐类型 */
const REC_TYPE = DisplayRecTypeEnum.ChatBoxNav;

const buildTargetKey = (targetId: number) => `${TARGET_TYPE}-${targetId}`;

/**
 * 对话框智能体推荐 - 新增/编辑弹窗
 */
const RecommendFormModal: React.FC<RecommendFormModalProps> = ({
  open,
  editingRecord,
  existingRecords = [],
  defaultSort,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!editingRecord;

  /** 提交保存 loading */
  const [loading, setLoading] = useState(false);
  /** 功能子类型 */
  const [functionType, setFunctionType] = useState<
    DisplayRecommendFunctionTypeEnum | ''
  >(DisplayRecommendFunctionTypeEnum.Chat);
  /** 已选智能体 */
  const [selectedTarget, setSelectedTarget] =
    useState<SquarePublishedItemInfo | null>(null);
  /** 用户上传的推荐图标 */
  const [iconUrl, setIconUrl] = useState('');
  /** 选择智能体弹窗 */
  const [pickModalOpen, setPickModalOpen] = useState(false);

  /** functionType 下拉选项（已占用的单子类型禁用） */
  const chatboxFunctionTypeOptions = useMemo(() => {
    const usedTypes = getUsedChatboxSingleInstanceTypes(
      existingRecords,
      editingRecord?.id,
    );
    const currentFunctionType = editingRecord?.functionType;

    const allTypes =
      RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.ChatBoxNav].functionTypes ||
      [];
    const orderedTypes = [
      DisplayRecommendFunctionTypeEnum.Chat,
      ...allTypes.filter(
        (type) => type !== DisplayRecommendFunctionTypeEnum.Chat,
      ),
    ];

    return orderedTypes.map((type) => ({
      value: type,
      label: getChatboxFunctionTypeLabel(type),
      disabled: isChatboxFunctionTypeDisabled(
        type,
        usedTypes,
        currentFunctionType,
      ),
    }));
  }, [existingRecords, editingRecord?.functionType, editingRecord?.id]);

  const selectTargetLabel = getSquareTargetTypeTitle(TARGET_TYPE);

  const pickedTargetKeys = useMemo(
    () => (selectedTarget ? [buildTargetKey(selectedTarget.targetId)] : []),
    [selectedTarget],
  );

  /** 选择弹窗：当前子类型下已占用的推荐（用于展示「已添加」） */
  const pickExistingRecords = useMemo(() => {
    if (!functionType) return [];
    return existingRecords.filter((record) => {
      if (record.functionType !== functionType) return false;
      if (editingRecord && record.id === editingRecord.id) return false;
      return true;
    });
  }, [existingRecords, functionType, editingRecord]);

  /**
   * 重置表单（新增模式）
   */
  const resetForm = useCallback(() => {
    setFunctionType(DisplayRecommendFunctionTypeEnum.Chat);
    setSelectedTarget(null);
    setIconUrl('');
  }, []);

  /** 弹窗打开时：编辑回填 / 新增重置 */
  useEffect(() => {
    if (!open) return;
    setPickModalOpen(false);
    if (editingRecord) {
      setFunctionType(
        (editingRecord.functionType as DisplayRecommendFunctionTypeEnum) || '',
      );
      setSelectedTarget({
        targetId: editingRecord.targetId,
        name: editingRecord.label,
        icon: editingRecord.icon,
      } as SquarePublishedItemInfo);
      setIconUrl(editingRecord.icon || '');
      return;
    }
    resetForm();
  }, [open, editingRecord, resetForm]);

  /**
   * 提交保存
   */
  const handleSubmit = async () => {
    if (!selectedTarget) {
      message.warning(
        dict(
          'PC.Pages.SystemRecommendManage.selectTargetRequired',
          selectTargetLabel,
        ),
      );
      return;
    }

    const payload: DisplayRecommendParams = {
      id: editingRecord?.id,
      targetType: TARGET_TYPE,
      targetId: selectedTarget.targetId,
      recType: REC_TYPE,
      functionType: functionType || '',
      label: selectedTarget.name || '',
      icon: iconUrl || '',
      placeholder: editingRecord?.placeholder || '',
      sort: editingRecord?.sort ?? defaultSort,
    };

    setLoading(true);
    try {
      const res = isEdit
        ? await apiSystemUpdateDisplayRecommend(payload)
        : await apiSystemSaveDisplayRecommend(payload);
      if (res?.code === SUCCESS_CODE) {
        message.success(
          dict(
            isEdit
              ? 'PC.Pages.SystemRecommendManage.updateSuccess'
              : 'PC.Pages.SystemRecommendManage.createSuccess',
          ),
        );
        onSuccess();
        onCancel();
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 从选择弹窗回填智能体（不调用保存接口）
   */
  const handlePickTarget = (item: SquarePublishedItemInfo) => {
    setSelectedTarget(item);
    setPickModalOpen(false);
  };

  return (
    <>
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
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            {dict('PC.Components.CreateAgent.iconLabel')}
          </div>
          <UploadAvatar
            onUploadSuccess={setIconUrl}
            imageUrl={iconUrl}
            defaultImage={agentImage as string}
            svgIconName="icons-workspace-agent"
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            {dict('PC.Pages.SystemRecommendManage.colSubType')}
          </div>
          <Select
            style={{ width: '100%' }}
            value={functionType}
            options={chatboxFunctionTypeOptions}
            disabled={isEdit}
            onChange={(v) => {
              setFunctionType(v);
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>{selectTargetLabel}</div>
          {selectedTarget ? (
            <SelectedAgentCard
              item={selectedTarget}
              onClick={() => setPickModalOpen(true)}
            />
          ) : (
            !isEdit && (
              <div
                className={cx(styles['add-agent-placeholder'])}
                onClick={() => setPickModalOpen(true)}
              >
                {dict('PC.Pages.SystemRecommendManage.clickToAddAgent')}
              </div>
            )
          )}
        </div>
      </CustomFormModal>

      {/* 选择智能体弹窗 */}
      <RecommendAddModal
        open={pickModalOpen}
        recType={REC_TYPE}
        existingRecords={pickExistingRecords}
        defaultSort={defaultSort}
        mode="pick"
        pickedTargetKeys={pickedTargetKeys}
        onPick={handlePickTarget}
        onCancel={() => setPickModalOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
};

export default RecommendFormModal;
