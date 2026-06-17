import CustomFormModal from '@/components/CustomFormModal';
import { apiGetUserGroupList } from '@/pages/SystemManagement/MenuPermission/services/user-group-manage';
import { UserGroupInfo } from '@/pages/SystemManagement/MenuPermission/types/user-group-manage';
import { dict } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import type { InputRef } from 'antd';
import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiCreateSubscriptionPlan,
  apiUpdateSubscriptionPlan,
} from '../../services/subscription';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanInfo,
  SubscriptionPlanStatusEnum,
} from '../../types/subscription';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 默认用户组编码，创建/编辑套餐时必须关联 */
const DEFAULT_USER_GROUP_CODE = 'default_group';

interface CreatePlanModalProps {
  open: boolean;
  sort?: number;
  planInfo?: SubscriptionPlanInfo | null;
  onSuccess?: () => void;
  onCancel: () => void;
}

interface UserGroupCardProps {
  group: UserGroupInfo;
  selected: boolean;
  /** 锁定选中状态，不可取消 */
  locked?: boolean;
  onClick: (id: number) => void;
}

/**
 * 用户组权限信息卡片
 * @param group - 用户组信息
 * @param selected - 是否选中
 * @param locked - 是否锁定（不可取消选中）
 * @param onClick - 点击卡片回调
 * @returns 用户组展示卡片
 */
const UserGroupCard: React.FC<UserGroupCardProps> = ({
  group,
  selected,
  locked = false,
  onClick,
}) => {
  const handleClick = () => {
    if (locked) {
      return;
    }
    onClick(group.id);
  };

  return (
    <div
      className={cx(styles['user-group-card'], {
        [styles['user-group-card-selected']]: selected,
        [styles['user-group-card-locked']]: locked,
      })}
      onClick={handleClick}
    >
      <div className={cx(styles['user-group-card-title'], 'text-ellipsis')}>
        {group.name}
      </div>
      <div className={cx(styles['user-group-card-desc'], 'text-ellipsis')}>
        {group.description}
      </div>
    </div>
  );
};

interface CreatePlanFormValues {
  status: boolean;
  name: string;
  creditAmount?: number;
  price: number;
  period: 'MONTH' | 'QUARTER' | 'YEAR' | 'FOREVER';
  isHot: boolean;
  description: string;
  sort: number;
}

/**
 * 新增套餐弹窗
 * @param open - 是否打开弹窗
 * @param onCancel - 取消回调
 * @returns
 */
const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  open,
  sort = 1,
  planInfo,
  onSuccess,
  onCancel,
}) => {
  const [form] = Form.useForm();
  // 名称输入框引用
  const nameInputRef = useRef<InputRef>(null);
  // 用户组列表
  const [userGroupList, setUserGroupList] = useState<UserGroupInfo[]>([]);
  // 已选中的用户组ID列表（支持多选）
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const defaultGroupId = useMemo(
    () =>
      userGroupList.find((group) => group.code === DEFAULT_USER_GROUP_CODE)?.id,
    [userGroupList],
  );

  /**
   * 确保默认用户组始终包含在选中列表中
   */
  const ensureDefaultGroupSelected = (groupIds: number[]) => {
    if (!defaultGroupId || groupIds.includes(defaultGroupId)) {
      return groupIds;
    }
    return [...groupIds, defaultGroupId];
  };

  /**
   * 查询用户组列表
   */
  const { run: runGetUserGroupList } = useRequest(apiGetUserGroupList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: UserGroupInfo[]) => {
      setUserGroupList(result);
      const defaultGroup = result.find(
        (group) => group.code === DEFAULT_USER_GROUP_CODE,
      );
      if (defaultGroup) {
        setSelectedGroupIds((prev) =>
          prev.includes(defaultGroup.id) ? prev : [...prev, defaultGroup.id],
        );
      }
    },
  });

  /**
   * 创建订阅套餐
   */
  const { run: runCreateSubscriptionPlan, loading: createLoading } = useRequest(
    apiCreateSubscriptionPlan,
    {
      manual: true,
      onSuccess: () => {
        message.success(dict('PC.Common.Global.createSuccess'));
        onSuccess?.();
        onCancel();
      },
      onError: () => {
        message.error(dict('PC.Common.Toast.operationFailed'));
      },
    },
  );

  /**
   * 更新订阅套餐
   */
  const { run: runUpdateSubscriptionPlan, loading: updateLoading } = useRequest(
    apiUpdateSubscriptionPlan,
    {
      manual: true,
      onSuccess: () => {
        message.success(
          dict('PC.Pages.AgentEdit.CreatePlanModal.updateSuccess'),
        );
        onSuccess?.();
        onCancel();
      },
      onError: () => {
        message.error(dict('PC.Common.Toast.operationFailed'));
      },
    },
  );

  // 打开弹窗时查询用户组列表
  useEffect(() => {
    let timer: number | undefined;

    if (open) {
      form.setFieldsValue({
        name: planInfo?.name,
        description: planInfo?.description,
        price: planInfo?.price || 0,
        period: planInfo?.period || 'MONTH',
        creditAmount: planInfo?.creditAmount || 0,
        isHot: planInfo?.isHot || false,
        status: planInfo
          ? planInfo.status === SubscriptionPlanStatusEnum.Online
          : true,
        sort: planInfo?.sort || sort || 1,
      });
      setSelectedGroupIds(ensureDefaultGroupSelected(planInfo?.groupIds || []));
      runGetUserGroupList();

      // 自动聚焦名称输入框
      timer = window.setTimeout(() => {
        nameInputRef.current?.focus({
          cursor: 'end',
        });
      }, 0);
    } else {
      form.resetFields();
      setSelectedGroupIds([]);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [open, planInfo, sort]);

  // 用户组列表或默认组加载后，确保默认用户组始终选中
  useEffect(() => {
    if (!open || !defaultGroupId) {
      return;
    }
    setSelectedGroupIds((prev) => ensureDefaultGroupSelected(prev));
  }, [open, defaultGroupId]);

  // 确认提交
  const handleConfirm = () => {
    form.submit();
  };

  // 切换用户组选中状态（默认用户组不可取消）
  const handleToggleGroup = (groupId: number) => {
    if (groupId === defaultGroupId) {
      return;
    }
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  // 提交表单
  const handleSubmit = (values: CreatePlanFormValues) => {
    const isEditMode = !!planInfo?.id;
    const payload = {
      ...(isEditMode ? { id: planInfo?.id } : {}),
      ...values,
      groupIds: ensureDefaultGroupSelected(selectedGroupIds),
      bizType: planInfo?.bizType ?? SubscriptionPlanBizTypeEnum.SYSTEM,
      bizId: planInfo?.bizId ?? '-1',
      status: values.status
        ? SubscriptionPlanStatusEnum.Online
        : SubscriptionPlanStatusEnum.Offline,
      callLimitCount: planInfo?.callLimitCount ?? -1,
      dailyGiftCreditAmount: planInfo?.dailyGiftCreditAmount ?? 0,
    } as SubscriptionPlanInfo;

    if (isEditMode) {
      runUpdateSubscriptionPlan(payload);
      return;
    }

    runCreateSubscriptionPlan(payload);
  };

  return (
    <CustomFormModal
      form={form}
      title={
        planInfo?.id
          ? dict('PC.Pages.SpaceSubscriptionSettings.editTitle')
          : dict('PC.Pages.SystemPlans.createPlan')
      }
      open={open}
      classNames={{ body: styles['create-plan-modal-body'] }}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      loading={createLoading || updateLoading}
      width={760}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark={customizeRequiredMark}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={dict('PC.Pages.SystemPlans.colName')}
              name="name"
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Pages.SpaceSubscriptionSettings.fieldNameRequired',
                  ),
                },
              ]}
            >
              <Input
                ref={nameInputRef}
                placeholder={dict(
                  'PC.Pages.SystemPlans.fieldNamePlaceholderExample',
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={dict('PC.Pages.SystemPlans.fieldCreditAmountMonthly')}
              name="creditAmount"
            >
              <InputNumber
                min={0}
                max={100000000}
                precision={0}
                className="w-full"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={dict('PC.Pages.SystemPlans.fieldPriceLabel')}
              name="price"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                max={100000000}
                step={0.01}
                precision={2}
                className="w-full"
                placeholder={dict(
                  'PC.Pages.SystemPlans.fieldPricePlaceholderExample',
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={dict('PC.Pages.SystemPlans.fieldValidityPeriod')}
              name="period"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  {
                    label: dict('PC.Pages.SystemPlans.periodOption1Month'),
                    value: 'MONTH',
                  },
                  {
                    label: dict('PC.Pages.SystemPlans.periodOption3Months'),
                    value: 'QUARTER',
                  },
                  {
                    label: dict('PC.Pages.SystemPlans.periodOption12Months'),
                    value: 'YEAR',
                  },
                  {
                    label: dict('PC.Pages.SystemPlans.periodForever'),
                    value: 'FOREVER',
                  },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={dict('PC.Pages.SystemPlans.fieldHotLabel')}
              name="isHot"
              valuePropName="checked"
            >
              <Switch
                checkedChildren={dict('PC.Common.Global.yes')}
                unCheckedChildren={dict('PC.Common.Global.no')}
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            {/* // 状态：0-下线，1-上线 */}
            <Form.Item
              label={dict('PC.Pages.SystemPlans.status')}
              name="status"
              valuePropName="checked"
            >
              <Switch
                checkedChildren={dict('PC.Common.Global.yes')}
                unCheckedChildren={dict('PC.Common.Global.no')}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label={dict('PC.Pages.SpaceSubscriptionSettings.fieldDesc')}
              name="description"
              rules={[{ required: true }]}
            >
              <Input.TextArea
                rows={3}
                placeholder={dict('PC.Pages.SystemPlans.fieldDescPlaceholder')}
                showCount
                maxLength={500}
                autoSize={{ minRows: 3, maxRows: 6 }}
                className="dispose-textarea-count"
              />
            </Form.Item>
          </Col>
        </Row>

        {/* 开发者权限(可多选) */}
        {userGroupList.length > 0 && (
          <>
            <h3 className={styles['developer-permission-title']}>
              {dict('PC.Pages.SystemPlans.developerPermissionTitle')}
            </h3>
            <div className={styles['developer-permission-desc']}>
              {dict('PC.Pages.SystemPlans.developerPermissionDesc')}
            </div>

            <div className={cx('flex', styles['user-group-card-container'])}>
              {userGroupList.map((group) => (
                <UserGroupCard
                  key={group.id}
                  group={group}
                  selected={selectedGroupIds.includes(group.id)}
                  locked={group.id === defaultGroupId}
                  onClick={handleToggleGroup}
                />
              ))}
            </div>
          </>
        )}
      </Form>
    </CustomFormModal>
  );
};

export default CreatePlanModal;
