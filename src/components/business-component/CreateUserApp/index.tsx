import agentImage from '@/assets/images/agent_image.png';
import GuardedFormModal, {
  GuardedFormModalForm,
} from '@/components/business-component/GuardedFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { apiDisplayRecommendList } from '@/services/displayRecommend';
import { dict } from '@/services/i18nRuntime';
import { apiUserAppCreate, apiUserAppUpdate } from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  DisplayRecommendFunctionTypeEnum,
  type DisplayRecommendGroup,
  type DisplayRecommendInfo,
} from '@/types/interfaces/displayRecommend';
import type {
  CreateUserAppParams,
  UpdateUserAppParams,
  UserAppInfo,
} from '@/types/interfaces/userProject';
import { emitProjectChanged } from '@/utils/directorySyncEvents';
import { customizeRequiredMark } from '@/utils/form';
import { resolveCreateIcon } from '@/utils/resolveCreateIcon';
import { Form, FormProps, Input, message, Select } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';

export interface CreateUserAppProps {
  /** 空间 ID，创建时写入应用所属空间；不传则由服务端放入个人空间 */
  spaceId?: number;
  /** 弹窗模式：创建或更新，默认创建 */
  mode?: CreateUpdateModeEnum;
  /** 当前应用详情，更新模式下用于回填名称、介绍、图标 */
  userAppInfo?: UserAppInfo | null;
  /** 是否显示弹窗 */
  open: boolean;
  /** 关闭弹窗 */
  onCancel: () => void;
  /** 创建成功回调，参数为新建的应用详情 */
  onConfirmCreate?: (result: UserAppInfo) => void;
  /** 更新成功回调，参数为更新后的应用详情 */
  onConfirmUpdate?: (info: UserAppInfo) => void;
}

/**
 * 创建 / 更新全栈应用弹窗。
 *
 * 参考 CreateAgent：名称、介绍、图标表单；创建走 apiUserAppCreate，更新走 apiUserAppUpdate。
 * 创建时若未上传图标，会尝试根据名称和介绍自动生成图标。
 * 创建参数对齐首页创建全栈口径：sandboxId 传云电脑哨兵 -1（全栈仅云端）、
 * devAgentId 取自推荐位 functionType=UserAppDev 的下拉选项（targetId）。
 *
 * @param props 弹窗属性
 * @param props.spaceId 空间 ID
 * @param props.mode 创建或更新
 * @param props.userAppInfo 更新时的应用详情
 * @param props.open 是否显示
 * @param props.onCancel 取消回调
 * @param props.onConfirmCreate 创建成功回调
 * @param props.onConfirmUpdate 更新成功回调
 * @returns 应用信息表单弹窗
 */
const CreateUserApp: React.FC<CreateUserAppProps> = ({
  spaceId,
  mode = CreateUpdateModeEnum.Create,
  userAppInfo,
  open,
  onCancel,
  onConfirmCreate,
  onConfirmUpdate,
}) => {
  const [form] = Form.useForm();
  /** 已上传或回填的图标地址 */
  const [imageUrl, setImageUrl] = useState<string>('');
  /** 提交中，用于弹窗确认按钮 loading */
  const [loading, setLoading] = useState<boolean>(false);
  /** 全栈应用开发智能体推荐项（functionType=UserAppDev） */
  const [devAgentOptions, setDevAgentOptions] = useState<
    DisplayRecommendInfo[]
  >([]);

  // 加载全栈应用开发智能体推荐项
  const [devAgentLoading, setDevAgentLoading] = useState<boolean>(false);

  // 全栈应用开发智能体推荐项下拉选项
  const devAgentSelectOptions = useMemo(
    () =>
      devAgentOptions.map((item) => ({
        label: item.label,
        value: item.targetId,
      })),
    [devAgentOptions],
  );

  // 创建全栈应用
  const { run: runAdd } = useRequest(apiUserAppCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: UserAppInfo) => {
      setImageUrl('');
      if (data) {
        emitProjectChanged({
          operation: 'created',
          project: {
            projectId: String(data.id),
            projectType: AgentComponentTypeEnum.UserApp,
            ...(data.spaceId !== undefined
              ? { spaceId: String(data.spaceId) }
              : {}),
          },
          origin: 'create-user-app',
          reason: 'create',
        });
        onConfirmCreate?.(data);
      }
      message.success(dict('PC.Components.CreateUserApp.createSuccess'));
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 更新全栈应用基本信息（未传字段不更新）
  const { run: runUpdate } = useRequest(apiUserAppUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: UserAppInfo, params: UpdateUserAppParams[]) => {
      message.success(dict('PC.Components.CreateUserApp.editSuccess'));
      setLoading(false);
      const payload = params[0];
      const nextInfo =
        data ??
        ({
          ...userAppInfo,
          ...payload,
        } as UserAppInfo);
      emitProjectChanged({
        operation: 'updated',
        project: {
          projectId: String(payload.id),
          projectType: AgentComponentTypeEnum.UserApp,
          ...(nextInfo.spaceId !== undefined
            ? { spaceId: String(nextInfo.spaceId) }
            : spaceId !== undefined
            ? { spaceId: String(spaceId) }
            : {}),
        },
        patch: {
          name: payload.name,
          description: payload.description,
          icon: payload.icon,
        },
        origin: 'create-user-app',
        reason: 'rename',
      });
      onConfirmUpdate?.(nextInfo);
    },
    onError: () => {
      setLoading(false);
    },
  });

  /**
   * 从推荐列表中收集 functionType=UserAppDev 的项。
   *
   * @param groups 首页 / 对话框推荐分组
   * @returns 排序后的全栈应用开发智能体列表
   */
  const pickUserAppDevAgents = useCallback(
    (groups: Array<DisplayRecommendGroup | undefined>) => {
      const allList: DisplayRecommendInfo[] = [];
      groups.forEach((group) => {
        if (!group) {
          return;
        }
        Object.values(group).forEach((list) => {
          if (Array.isArray(list)) {
            allList.push(...list);
          }
        });
      });
      return allList
        .filter(
          (item) =>
            item.functionType === DisplayRecommendFunctionTypeEnum.UserAppDev,
        )
        .sort((prev, next) => (prev.sort ?? 0) - (next.sort ?? 0));
    },
    [],
  );

  /** 打开弹窗时拉取全栈应用开发智能体推荐列表 */
  const loadDevAgentOptions = useCallback(async () => {
    setDevAgentLoading(true);
    try {
      const result = await apiDisplayRecommendList();
      if (result?.code !== SUCCESS_CODE || !result.data) {
        setDevAgentOptions([]);
        return;
      }
      const list = pickUserAppDevAgents([
        result.data.recHome,
        result.data.recChatBoxNav,
      ]);
      setDevAgentOptions(list);
      if (list.length > 0) {
        form.setFieldValue('devAgentId', list[0].targetId);
      }
    } catch (error) {
      console.error('[CreateUserApp] Failed to load dev agent options:', error);
      setDevAgentOptions([]);
    } finally {
      setDevAgentLoading(false);
    }
  }, [form, pickUserAppDevAgents]);

  /**
   * 按当前应用详情回填表单与图标。
   */
  const initForm = useCallback(() => {
    setImageUrl(userAppInfo?.icon || '');
    form.setFieldsValue({
      name: userAppInfo?.name,
      description: userAppInfo?.description,
      devAgentId: undefined,
    });
  }, [form, userAppInfo]);

  // 弹窗打开时回填表单，创建模式下加载开发智能体列表
  useEffect(() => {
    if (!open) {
      return;
    }
    initForm();
    if (mode === CreateUpdateModeEnum.Create) {
      void loadDevAgentOptions();
    }
  }, [initForm, loadDevAgentOptions, mode, open]);

  /**
   * 提交表单：创建时补全图标后调用创建接口，更新时必须带应用 ID。
   *
   * @param values 表单值（名称、介绍）
   */
  const onFinish: FormProps<CreateUserAppParams>['onFinish'] = async (
    values,
  ) => {
    setLoading(true);
    try {
      if (mode === CreateUpdateModeEnum.Create) {
        // 未上传图标时，根据名称和介绍尝试自动生成
        const { icon, description } = await resolveCreateIcon({
          imageUrl,
          name: values.name,
          description: values.description,
        });
        runAdd({
          ...values,
          description: description ?? values.description,
          icon,
          spaceId,
          sandboxId: Number(CLOUD_SANDBOX_ID),
          devAgentId: values.devAgentId,
        });
      } else {
        // 更新应用：缺少 id 时不发请求
        if (!userAppInfo?.id) {
          setLoading(false);
          return;
        }
        runUpdate({
          id: userAppInfo.id,
          name: values.name,
          description: values.description,
          icon: imageUrl,
        });
      }
    } catch {
      setLoading(false);
    }
  };

  /** 触发 antd Form 校验并提交 */
  const handleSubmit = () => {
    form.submit();
  };

  /** 关闭弹窗并恢复表单为打开前的回填值 */
  const handleCancel = () => {
    onCancel();
    initForm();
  };

  /** 按模式切换「创建应用 / 更新应用」标题 */
  const title =
    mode === CreateUpdateModeEnum.Create
      ? dict('PC.Components.CreateUserApp.createTitle')
      : dict('PC.Components.CreateUserApp.updateTitle');

  return (
    <GuardedFormModal
      form={form}
      title={title}
      open={open}
      loading={loading}
      onCancel={handleCancel}
      onConfirm={handleSubmit}
    >
      <GuardedFormModalForm
        form={form}
        requiredMark={customizeRequiredMark}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label={dict('PC.Components.CreateUserApp.nameLabel')}
          validateTrigger="onBlur"
          rules={[
            {
              required: true,
              message: dict('PC.Components.CreateUserApp.nameRequired'),
            },
            {
              validator(_, value) {
                if (!value || value?.length <= 50) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(dict('PC.Components.CreateUserApp.nameMaxLength')),
                );
              },
            },
          ]}
        >
          <Input
            placeholder={dict('PC.Components.CreateUserApp.namePlaceholder')}
            showCount
            maxLength={50}
          />
        </Form.Item>
        <OverrideTextArea
          name="description"
          label={dict('PC.Components.CreateUserApp.descriptionLabel')}
          initialValue={userAppInfo?.description}
          placeholder={dict(
            'PC.Components.CreateUserApp.descriptionPlaceholder',
          )}
          maxLength={10000}
        />
        {mode === CreateUpdateModeEnum.Create ? (
          <Form.Item
            name="devAgentId"
            label={dict('PC.Components.CreateUserApp.devAgentLabel')}
            rules={
              devAgentOptions.length > 0
                ? [
                    {
                      required: true,
                      message: dict(
                        'PC.Components.CreateUserApp.devAgentRequired',
                      ),
                    },
                  ]
                : []
            }
          >
            <Select
              loading={devAgentLoading}
              placeholder={dict(
                'PC.Components.CreateUserApp.devAgentPlaceholder',
              )}
              options={devAgentSelectOptions}
            />
          </Form.Item>
        ) : null}
        <Form.Item
          name="icon"
          label={dict('PC.Components.CreateUserApp.iconLabel')}
        >
          <UploadAvatar
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={agentImage as string}
            svgIconName="icons-workspace-agent"
          />
        </Form.Item>
      </GuardedFormModalForm>
    </GuardedFormModal>
  );
};

export default CreateUserApp;
