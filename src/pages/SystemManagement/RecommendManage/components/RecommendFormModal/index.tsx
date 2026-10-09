import agentImage from '@/assets/images/agent_image.png';
import CustomFormModal from '@/components/CustomFormModal';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import useCommercialEdition from '@/hooks/useCommercialEdition';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { dict } from '@/services/i18nRuntime';
import { fetchChatboxCategories } from '@/services/square';
import type { DisplayRecommendPrompt } from '@/types/interfaces/displayRecommend';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import {
  DeleteOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Form, Input, message, Select, Tooltip } from 'antd';
import classNames from 'classnames';
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
import { getSquareTargetTypeTitle } from '../../utils/squareTargetTypeLabel';
import RecommendAddModal from '../RecommendAddModal';
import PromptSettingsModal from './PromptSettingsModal';
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

/**
 * 对话框智能体推荐 - 新增/编辑弹窗
 */
const RecommendFormModal: React.FC<RecommendFormModalProps> = ({
  open,
  editingRecord,
  defaultSort,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm<{ prompts: DisplayRecommendPrompt[] }>();
  const prompts = Form.useWatch('prompts', { form, preserve: true }) || [];
  const [promptEditor, setPromptEditor] = useState<{
    index: number;
    value: DisplayRecommendPrompt;
  } | null>(null);
  const isEdit = !!editingRecord;
  const { aiOSCommercialEdition } = useCommercialEdition();
  const commercialEditionRef = useRef(aiOSCommercialEdition);
  commercialEditionRef.current = aiOSCommercialEdition;

  /** 提交保存 loading */
  const [loading, setLoading] = useState<boolean>(false);
  const submittingRef = useRef(false);
  /** 功能子类型 */
  const [functionType, setFunctionType] = useState<
    DisplayRecommendFunctionTypeEnum | ''
  >(DisplayRecommendFunctionTypeEnum.Chat);
  /** 已选智能体（卡片展示用，icon 为智能体自身图标） */
  const [selectedTarget, setSelectedTarget] =
    useState<SquarePublishedItemInfo | null>(null);
  /** 推荐位自定义图标（与已选智能体图标独立） */
  const [recommendIconUrl, setRecommendIconUrl] = useState<string>('');
  /** 占位提示文案 */
  const [placeholder, setPlaceholder] = useState<string>('');
  /** 上框展示名称（对应推荐记录 label） */
  const [label, setLabel] = useState<string>('');
  /** 对话框智能体分类（来源：系统管理-分类管理 ChatBox 分类） */
  const [category, setCategory] = useState<string>('');
  /** 对话框智能体分类下拉选项 */
  const [categoryOptions, setCategoryOptions] = useState<
    { value: string; label: string }[]
  >([]);
  /** 选择智能体弹窗 */
  const [pickModalOpen, setPickModalOpen] = useState<boolean>(false);

  /** 所有子类型均允许配置多条推荐。 */
  const chatboxFunctionTypeOptions = useMemo(() => {
    const allTypes =
      RECOMMEND_PAGE_CONFIG_MAP[DisplayRecTypeEnum.ChatBoxNav].functionTypes ||
      [];
    const orderedTypes = [
      DisplayRecommendFunctionTypeEnum.Chat,
      ...allTypes.filter(
        (type) => type !== DisplayRecommendFunctionTypeEnum.Chat,
      ),
    ];

    return orderedTypes
      .filter(
        (type) =>
          isEdit ||
          aiOSCommercialEdition ||
          type === DisplayRecommendFunctionTypeEnum.Chat,
      )
      .map((type) => ({
        value: type,
        label: getChatboxFunctionTypeLabel(type),
      }));
  }, [aiOSCommercialEdition, isEdit]);

  useEffect(() => {
    if (!isEdit && !aiOSCommercialEdition) {
      setFunctionType(DisplayRecommendFunctionTypeEnum.Chat);
    }
  }, [aiOSCommercialEdition, isEdit]);

  const selectTargetLabel = getSquareTargetTypeTitle(TARGET_TYPE);

  /**
   * 重置表单（新增模式）
   */
  const resetForm = useCallback(() => {
    setFunctionType(DisplayRecommendFunctionTypeEnum.Chat);
    setSelectedTarget(null);
    setRecommendIconUrl('');
    setPlaceholder('');
    setLabel('');
    setCategory('');
  }, []);

  /** 弹窗打开时拉取对话框智能体分类选项(已发布分类接口 ChatBox 分类,与首页 pill 同源) */
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchChatboxCategories()
      .then((children) => {
        if (!cancelled) {
          setCategoryOptions(
            children.map((item) => ({
              value: item.key,
              label: item.label,
            })),
          );
        }
      })
      .catch((error) => {
        console.error('fetch chatbox category list failed:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  /** 弹窗打开时：编辑回填 / 新增重置 */
  useEffect(() => {
    setPromptEditor(null);
    if (!open) return;
    setPickModalOpen(false);
    form.resetFields();
    form.setFieldsValue({
      prompts: (editingRecord?.prompts || []).map((prompt) => ({ ...prompt })),
    });
    if (editingRecord) {
      let cancelled = false;
      setSelectedTarget({
        targetId: editingRecord.targetId,
        name: editingRecord.label,
      } as SquarePublishedItemInfo);
      setFunctionType(
        (editingRecord.functionType as DisplayRecommendFunctionTypeEnum) || '',
      );
      setRecommendIconUrl(editingRecord.icon || '');
      setPlaceholder(editingRecord.placeholder || '');
      setLabel(editingRecord.label || '');
      setCategory(editingRecord.category || '');
      apiPublishedAgentInfo(editingRecord.targetId)
        .then((res) => {
          const data = res?.code === SUCCESS_CODE ? res.data : undefined;
          if (!cancelled && data) {
            setSelectedTarget({
              targetId: data.agentId,
              name: data.name,
              icon: data.icon,
              description: data.description,
            } as SquarePublishedItemInfo);
          }
        })
        .catch((error) => {
          console.error('fetch published agent info failed:', error);
        });
      return () => {
        cancelled = true;
      };
    }
    resetForm();
  }, [open, editingRecord, form, resetForm]);

  /**
   * 提交保存
   */
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const subtypeAllowed = () => {
      if (
        isEdit ||
        commercialEditionRef.current ||
        functionType === DisplayRecommendFunctionTypeEnum.Chat
      ) {
        return true;
      }
      setFunctionType(DisplayRecommendFunctionTypeEnum.Chat);
      message.warning(
        dict('PC.Components.CommercialLicense.authorizationRequired'),
      );
      return false;
    };
    if (!subtypeAllowed()) return;
    submittingRef.current = true;
    let values: { prompts: DisplayRecommendPrompt[] };
    try {
      values = await form.validateFields();
    } catch {
      submittingRef.current = false;
      return;
    }
    // 表单异步校验期间租户配置也可能刷新，发请求前按最新授权再检查。
    if (!subtypeAllowed()) {
      submittingRef.current = false;
      return;
    }
    if (!selectedTarget) {
      submittingRef.current = false;
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
      label: label.trim() || selectedTarget.name || '',
      icon: recommendIconUrl || '',
      placeholder: placeholder || '',
      category: category || '',
      prompts: (values.prompts || []).map((prompt) => ({
        title: prompt.title?.trim() || '',
        content: prompt.content,
        icon: prompt.icon || '',
      })),
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
    } catch {
      // 请求层已提示错误，保留表单供修改后重试。
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  /**
   * 从选择弹窗回填智能体（不修改推荐图标）
   */
  const handlePickTarget = (item: SquarePublishedItemInfo) => {
    setSelectedTarget(item);
    setLabel((prev) => {
      if (prev.trim()) {
        return prev;
      }
      return item.name || '';
    });
    setPickModalOpen(false);
  };

  /** 更新推荐位图标，不影响 SelectedAgentCard 中的智能体图标 */
  const handleRecommendIconChange = useCallback((url: string) => {
    setRecommendIconUrl(url);
  }, []);

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
        centered
        classNames={{ body: styles['form-body'] }}
        onCancel={onCancel}
        onConfirm={handleSubmit}
      >
        <Form form={form} layout="vertical" disabled={loading}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              {dict('PC.Components.CreateAgent.iconLabel')}
            </div>
            <UploadAvatar
              onUploadSuccess={handleRecommendIconChange}
              imageUrl={recommendIconUrl}
              defaultImage={agentImage as string}
              svgIconName="icons-workspace-agent"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              {dict('PC.Pages.SystemRecommendManage.dialogHintLabel')}
            </div>
            <Input
              value={placeholder}
              placeholder={dict(
                'PC.Pages.SystemRecommendManage.dialogHintPlaceholder',
              )}
              onChange={(e) => setPlaceholder(e.target.value)}
              maxLength={200}
              showCount
              allowClear
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              {dict('PC.Pages.SystemRecommendManage.chatboxCategory')}
            </div>
            <Select
              style={{ width: '100%' }}
              value={category || undefined}
              options={categoryOptions}
              allowClear
              placeholder={dict('PC.Common.Global.pleaseSelect')}
              onChange={(v) => setCategory(v || '')}
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
            <div style={{ marginBottom: 8 }}>
              {dict('PC.Pages.SystemRecommendManage.upperBoxDisplayName')}
            </div>
            <Input
              value={label}
              placeholder={dict(
                'PC.Pages.SystemRecommendManage.upperBoxDisplayNamePlaceholder',
              )}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={50}
              showCount
              allowClear
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
          <Form.List name="prompts">
            {(fields, { add, remove }) => (
              <section className={styles['prompts-section']}>
                <div className={styles['prompts-header']}>
                  <span>
                    {dict('PC.Pages.SystemRecommendManage.promptsLabel')}
                  </span>
                  <Tooltip
                    title={dict('PC.Pages.SystemRecommendManage.addPrompt')}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<PlusOutlined aria-hidden="true" />}
                      aria-label={dict(
                        'PC.Pages.SystemRecommendManage.addPrompt',
                      )}
                      onClick={() => add({ title: '', content: '', icon: '' })}
                    />
                  </Tooltip>
                </div>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    className={cx(styles['prompt-row'], {
                      [styles['prompt-has-icon']]: !!prompts[name]?.icon,
                    })}
                  >
                    <Form.Item {...restField} name={[name, 'title']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'icon']} hidden>
                      <Input />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'content']}
                      className={styles['prompt-content']}
                      rules={[
                        {
                          required: true,
                          whitespace: true,
                          message: dict(
                            'PC.Pages.SystemRecommendManage.promptContentRequired',
                          ),
                        },
                      ]}
                    >
                      <Input.TextArea
                        aria-label={dict(
                          'PC.Pages.SystemRecommendManage.promptNumber',
                          index + 1,
                        )}
                        placeholder={dict(
                          'PC.Pages.SystemRecommendManage.promptContentPlaceholder',
                        )}
                        autoSize={{ minRows: 1, maxRows: 1 }}
                      />
                    </Form.Item>
                    {prompts[name]?.icon && (
                      <img
                        className={styles['prompt-icon']}
                        src={prompts[name].icon}
                        alt=""
                      />
                    )}
                    <div className={styles['prompt-actions']}>
                      <Tooltip
                        title={dict(
                          'PC.Pages.SystemRecommendManage.removePrompt',
                        )}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          aria-label={dict(
                            'PC.Pages.SystemRecommendManage.removePrompt',
                          )}
                          onClick={() => remove(name)}
                        />
                      </Tooltip>
                      <Tooltip
                        title={dict(
                          'PC.Pages.SystemRecommendManage.editPrompt',
                        )}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<SettingOutlined />}
                          aria-label={dict(
                            'PC.Pages.SystemRecommendManage.editPrompt',
                          )}
                          onClick={() =>
                            setPromptEditor({
                              index: name,
                              value: {
                                ...form.getFieldValue(['prompts', name]),
                              },
                            })
                          }
                        />
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </Form.List>
        </Form>
      </CustomFormModal>

      <PromptSettingsModal
        open={!!promptEditor}
        value={promptEditor?.value}
        onCancel={() => setPromptEditor(null)}
        onConfirm={(value) => {
          if (promptEditor) {
            form.setFieldValue(['prompts', promptEditor.index], value);
          }
          setPromptEditor(null);
        }}
      />

      {/* 选择智能体弹窗 */}
      <RecommendAddModal
        open={pickModalOpen}
        recType={REC_TYPE}
        defaultSort={defaultSort}
        mode="pick"
        onPick={handlePickTarget}
        onCancel={() => setPickModalOpen(false)}
        onSuccess={() => {}}
      />
    </>
  );
};

export default RecommendFormModal;
