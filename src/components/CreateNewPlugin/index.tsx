import pluginIcon from '@/assets/images/plugin_image.png';
import ConditionRender from '@/components/ConditionRender';
import SelectList from '@/components/custom/SelectList';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import {
  CLOUD_BASE_CODE_OPTIONS,
  PLUGIN_CREATE_TOOL,
} from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiAddResourceToGroup,
  apiResourceGroupList,
} from '@/services/library';
import { apiPluginAdd, apiPluginHttpUpdate } from '@/services/plugin';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { PluginTypeEnum } from '@/types/enums/plugin';
import { ComponentTypeEnum } from '@/types/enums/space';
import type { CreateNewPluginProps } from '@/types/interfaces/library';
import type {
  PluginAddParams,
  PluginHttpUpdateParams,
} from '@/types/interfaces/plugin';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps, RadioChangeEvent } from 'antd';
import { Form, Input, message, Radio, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useRequest } from 'umi';
import CustomFormModal from '../CustomFormModal';

const cx = classNames;

/**
 * 新建、修改插件组件
 */
const CreateNewPlugin: React.FC<CreateNewPluginProps> = ({
  spaceId,
  id,
  icon,
  name,
  description,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel,
  onConfirm,
  defaultGroupId,
}) => {
  const [form] = Form.useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [pluginType, setPluginType] = useState<PluginTypeEnum>();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setImageUrl(icon || '');
      form.setFieldsValue({
        name,
        description,
        groupId:
          mode === CreateUpdateModeEnum.Create
            ? defaultGroupId || undefined
            : undefined,
      });
    }
  }, [open, icon, name, description, defaultGroupId, mode]);

  // 根据type类型，判断插件跳转路径
  const handlePluginUrl = (id: number, type: PluginTypeEnum) => {
    if (type === PluginTypeEnum.CODE) {
      history.push(`/space/${spaceId}/plugin/${id}/cloud-tool`);
    } else if (type === PluginTypeEnum.HTTP) {
      history.push(`/space/${spaceId}/plugin/${id}`);
    }
  };

  const [groupOptions, setGroupOptions] = useState<any[]>([]);

  // 拉取资源分组列表
  useEffect(() => {
    if (open && mode === CreateUpdateModeEnum.Create && spaceId) {
      apiResourceGroupList({
        spaceId,
        types: [ComponentTypeEnum.Plugin],
      })
        .then((res) => {
          if (res.success && res.data) {
            setGroupOptions(res.data || []);
          }
        })
        .catch(() => {});
    }
  }, [open, mode, spaceId]);

  // 新增插件接口
  const { run: runCreate } = useRequest(apiPluginAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: async (result: number, params: PluginAddParams[]) => {
      // 校验如果用户选择了分组，则先执行移入分组操作
      const targetGroupId = form.getFieldValue('groupId');
      if (targetGroupId) {
        try {
          await apiAddResourceToGroup(targetGroupId, {
            targetType: ComponentTypeEnum.Plugin,
            targetId: result,
          });
        } catch (e) {}
      }

      setImageUrl('');
      // 关闭弹窗
      onCancel();
      // 跳转到插件配置页面
      const { type } = params[0];
      handlePluginUrl(result, type);
      message.success(dict('PC.Components.CreateNewPlugin.pluginCreated'));
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 更新HTTP插件配置接口
  const { run: runUpdate } = useRequest(apiPluginHttpUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: PluginHttpUpdateParams[]) => {
      setImageUrl('');
      const info = params[0];
      onConfirm?.(info);
      message.success(dict('PC.Components.CreateNewPlugin.pluginUpdated'));
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const onFinish: FormProps<
    PluginAddParams & { groupId?: number }
  >['onFinish'] = (values) => {
    setLoading(true);
    if (mode === CreateUpdateModeEnum.Create) {
      runCreate({
        ...values,
        icon: imageUrl,
        spaceId,
      });
    } else {
      // 更新HTTP插件配置接口
      runUpdate({
        ...values,
        icon: imageUrl,
        id,
      });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  const handleChangeCreateTool = ({ target: { value } }: RadioChangeEvent) => {
    if (value === PluginTypeEnum.HTTP) {
      form.setFieldValue('codeLang', null);
    }
    setPluginType(value);
  };

  return (
    <CustomFormModal
      form={form}
      title={
        mode === CreateUpdateModeEnum.Create
          ? dict('PC.Components.CreateNewPlugin.createPlugin')
          : dict('PC.Components.CreateNewPlugin.updatePlugin')
      }
      open={open}
      classNames={classNames}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <div className={cx('flex', 'flex-col', 'items-center', 'py-16')}>
        <UploadAvatar
          className={cx('mt-16', 'mb-16')}
          onUploadSuccess={setImageUrl}
          imageUrl={imageUrl}
          defaultImage={pluginIcon as string}
          svgIconName="icons-workspace-plugin"
        />
        <Form
          form={form}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          rootClassName={cx('w-full')}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label={dict('PC.Components.CreateNewPlugin.pluginName')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Components.CreateNewPlugin.pleaseInputPluginName',
                ),
              },
              {
                validator(_, value) {
                  if (!value || value?.length <= 30) {
                    return Promise.resolve();
                  }
                  if (value?.length > 30) {
                    return Promise.reject(
                      new Error(
                        dict('PC.Components.CreateNewPlugin.nameMaxChars'),
                      ),
                    );
                  }
                  return Promise.reject(
                    new Error(
                      dict(
                        'PC.Components.CreateNewPlugin.pleaseInputPluginNameBang',
                      ),
                    ),
                  );
                },
              },
            ]}
          >
            <Input
              placeholder={dict(
                'PC.Components.CreateNewPlugin.placeholderPluginName',
              )}
              showCount
              maxLength={30}
            />
          </Form.Item>
          <OverrideTextArea
            name="description"
            label={dict('PC.Components.CreateNewPlugin.pluginDescription')}
            initialValue={description}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Components.CreateNewPlugin.pleaseInputPluginDesc',
                ),
              },
            ]}
            placeholder={dict(
              'PC.Components.CreateNewPlugin.placeholderPluginDesc',
            )}
            maxLength={10000}
          />
          <ConditionRender condition={mode === CreateUpdateModeEnum.Create}>
            <Form.Item
              name="type"
              label={dict('PC.Components.CreateNewPlugin.pluginCreateTool')}
              rules={[
                {
                  required: true,
                  message: dict(
                    'PC.Components.CreateNewPlugin.pleaseSelectPluginCreateTool',
                  ),
                },
              ]}
            >
              <Radio.Group
                options={PLUGIN_CREATE_TOOL}
                value={pluginType}
                onChange={handleChangeCreateTool}
              ></Radio.Group>
            </Form.Item>
            <ConditionRender condition={pluginType === PluginTypeEnum.CODE}>
              <Form.Item
                name="codeLang"
                label={dict('PC.Components.CreateNewPlugin.ideRuntime')}
                rules={[
                  {
                    required: true,
                    message: dict(
                      'PC.Components.CreateNewPlugin.pleaseSelectPluginMode',
                    ),
                  },
                ]}
              >
                <SelectList options={CLOUD_BASE_CODE_OPTIONS} />
              </Form.Item>
            </ConditionRender>
            <Form.Item
              name="groupId"
              label={dict('PC.Pages.SpaceResource.LeftGroupList.selectGroup')}
            >
              <Select
                placeholder={dict(
                  'PC.Pages.SpaceResource.LeftGroupList.selectGroupPlaceholder',
                )}
                allowClear
                options={groupOptions.map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
              />
            </Form.Item>
          </ConditionRender>
        </Form>
      </div>
    </CustomFormModal>
  );
};

export default CreateNewPlugin;
