import knowledgeIcon from '@/assets/images/knowledge_image.png';
import Created from '@/components/Created';
import SkillListItem from '@/components/CreateKnowledge/SkillListItem';
import CustomFormModal from '@/components/CustomFormModal';
import OverrideTextArea from '@/components/OverrideTextArea';
import UploadAvatar from '@/components/UploadAvatar';
import { CREATED_TABS } from '@/constants/common.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiKnowledgeConfigAdd,
  apiKnowledgeConfigDetail,
  apiKnowledgeConfigUpdate,
} from '@/services/knowledge';
import { apiModelList } from '@/services/modelConfig';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { KnowledgeDataTypeEnum } from '@/types/enums/library';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import type {
  CreatedNodeItem,
  CreateKnowledgeProps,
  option,
} from '@/types/interfaces/common';
import type {
  KnowledgeBaseInfo,
  KnowledgeConfigUpdateParams,
  KnowledgeInfo,
} from '@/types/interfaces/knowledge';
import { ModelConfigInfo } from '@/types/interfaces/model';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Select } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { history, useRequest } from 'umi';
import SelectList from '../custom/SelectList';
import styles from './index.less';
import SkillListEmpty from './SkillListEmpty';

const cx = classNames.bind(styles);

/**
 * 创建知识库
 */
const CreateKnowledge: React.FC<CreateKnowledgeProps> = ({
  mode = CreateUpdateModeEnum.Create,
  spaceId,
  knowledgeInfo,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [resourceFormat, setResourceFormat] = useState<KnowledgeDataTypeEnum>(
    KnowledgeDataTypeEnum.Text,
  );
  // 模型列表
  const [modelConfigList, setModelConfigList] = useState<option[]>([]);

  // 文档内容提取方式
  const [dataParsingMethod, setDataParsingMethod] = useState<
    'default' | 'workflow' | null
  >('default');
  const [dataParsingMethodItem, setDataParsingMethodItem] = useState<any>(null);
  // 打开、关闭组件选择弹窗
  const [show, setShow] = useState<boolean>(false);
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  // 数据新增接口
  const { run } = useRequest(apiKnowledgeConfigAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: number) => {
      message.success(dict('PC.Components.CreateKnowledge.createSuccess'));
      setLoading(false);
      onCancel();
      history.push(`/space/${spaceId}/knowledge/${result}`);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 数据更新接口
  const { run: runUpdate } = useRequest(apiKnowledgeConfigUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (_: null, params: KnowledgeConfigUpdateParams[]) => {
      message.success(dict('PC.Components.CreateKnowledge.updateSuccess'));
      setLoading(false);
      const info = params[0];
      onConfirm?.(info);
    },
    onError: () => {
      setLoading(false);
    },
  });
  // 数据详情接口
  const { run: runGetDetail } = useRequest(apiKnowledgeConfigDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (knowledgeInfo: KnowledgeInfo) => {
      setImageUrl(knowledgeInfo.icon);
      setResourceFormat(knowledgeInfo.dataType);
      form.setFieldsValue({
        name: knowledgeInfo.name,
        description: knowledgeInfo.description,
        embeddingModelId: knowledgeInfo.embeddingModelId,
        dataParsingMethod: knowledgeInfo.workflowId ? 'workflow' : 'default',
      });
      if (knowledgeInfo.workflowId) {
        setDataParsingMethod(knowledgeInfo.workflowId ? 'workflow' : 'default');
        setDataParsingMethodItem({
          id: knowledgeInfo.workflowId,
          name: knowledgeInfo.workflowName,
          icon: knowledgeInfo.workflowIcon,
          description: knowledgeInfo.workflowDescription,
        });
      }
    },
    onError: () => {},
  });

  // 查询可使用模型列表接口
  const { run: runMode } = useRequest(apiModelList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: ModelConfigInfo[]) => {
      const list: option[] =
        result?.map((item) => ({
          label: item.name,
          value: item.id,
        })) || [];
      setModelConfigList(list);
    },
  });

  useEffect(() => {
    if (open) {
      // 查询可使用模型列表接口
      runMode({
        spaceId,
        modelType: ModelTypeEnum.Embeddings,
      });
      // 初始化默认数据
      setDataParsingMethod('default');
      setDataParsingMethodItem(null);

      // 初始化详情接口的数据
      if (knowledgeInfo) {
        runGetDetail(knowledgeInfo.id);
      }
    }
  }, [spaceId, open, knowledgeInfo]);

  const onFinish: FormProps<KnowledgeBaseInfo>['onFinish'] = (values) => {
    const params: any = {
      spaceId,
      name: values.name,
      description: values.description,
      embeddingModelId: values.embeddingModelId,
      icon: imageUrl,
      dataType: resourceFormat,
    };
    if (dataParsingMethod === 'workflow') {
      params.workflowId = dataParsingMethodItem?.id;
    }

    setLoading(true);
    if (mode === CreateUpdateModeEnum.Create) {
      run(params);
    } else {
      runUpdate({
        id: knowledgeInfo?.id,
        ...params,
      });
    }
  };

  // 监听值变化（只包含变化的值）
  const onValuesChange = (changedValues: { dataParsingMethod: string }) => {
    if (changedValues.dataParsingMethod) {
      setDataParsingMethod(
        changedValues.dataParsingMethod as 'default' | 'workflow',
      );
    }
  };
  // 工作流
  const handleAddComponent = (info: CreatedNodeItem) => {
    setAddComponents(() => {
      return [
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Added,
          toolName: info.toolName || '',
        },
      ];
    });

    flushSync(() => {
      setDataParsingMethodItem({
        id: info.targetId,
        name: info.name,
        icon: info.icon,
        description: info.description,
      });
    });
    setShow(false);
  };
  // 工作流
  const handlerComponentPlus = (
    e: React.MouseEvent<HTMLElement>,
    type: AgentComponentTypeEnum,
  ) => {
    e.stopPropagation();
    setCheckTag(type);
    setShow(true);
  };

  const handleCheckItem = (e: React.MouseEvent<HTMLElement>) => {
    handlerComponentPlus(e, AgentComponentTypeEnum.Workflow);
  };

  const handleDeleteItem = () => {
    setDataParsingMethodItem(null);
    setAddComponents([]);
  };

  const handlerSubmit = () => {
    form.submit();
  };

  return (
    <>
      <CustomFormModal
        form={form}
        title={
          mode === CreateUpdateModeEnum.Create
            ? dict('PC.Components.CreateKnowledge.createTitle')
            : dict('PC.Components.CreateKnowledge.updateTitle')
        }
        open={open}
        loading={loading}
        onCancel={onCancel}
        onConfirm={handlerSubmit}
      >
        <Form
          form={form}
          className={cx('mt-16')}
          requiredMark={customizeRequiredMark}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={onValuesChange}
          preserve={false}
          autoComplete="off"
          initialValues={{
            dataParsingMethod: 'default',
          }}
        >
          <Form.Item
            name="name"
            label={dict('PC.Components.CreateKnowledge.nameLabel')}
            rules={[
              {
                required: true,
                message: dict('PC.Components.CreateKnowledge.nameRequired'),
              },
            ]}
          >
            <Input
              placeholder={dict(
                'PC.Components.CreateKnowledge.namePlaceholder',
              )}
              showCount
              maxLength={100}
            />
          </Form.Item>
          <OverrideTextArea
            name="description"
            label={dict('PC.Components.CreateKnowledge.descriptionLabel')}
            initialValue={knowledgeInfo?.description}
            placeholder={dict(
              'PC.Components.CreateKnowledge.descriptionPlaceholder',
            )}
            maxLength={10000}
          />
          <Form.Item
            name="embeddingModelId"
            label={dict('PC.Components.CreateKnowledge.embeddingModelLabel')}
            rules={[
              {
                required: true,
                message: dict(
                  'PC.Components.CreateKnowledge.embeddingModelRequired',
                ),
              },
            ]}
            tooltip={dict(
              'PC.Components.CreateKnowledge.embeddingModelTooltip',
            )}
          >
            <SelectList
              placeholder={dict(
                'PC.Components.CreateKnowledge.embeddingModelPlaceholder',
              )}
              /*disabled={mode === CreateUpdateModeEnum.Update}*/
              options={modelConfigList}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="dataParsingMethod"
            label={dict('PC.Components.CreateKnowledge.dataParsingMethodLabel')}
            tooltip={dict(
              'PC.Components.CreateKnowledge.dataParsingMethodTooltip',
            )}
          >
            <Select
              style={{ width: '100%' }}
              placeholder={dict(
                'PC.Components.CreateKnowledge.dataParsingMethodPlaceholder',
              )}
              options={[
                {
                  value: 'default',
                  label: dict('PC.Components.CreateKnowledge.systemDefault'),
                },
                {
                  value: 'workflow',
                  label: dict('PC.Components.CreateKnowledge.customWorkflow'),
                },
              ]}
            />
          </Form.Item>
          {dataParsingMethod === 'workflow' && (
            <Form.Item style={{ marginTop: '-15px' }}>
              {dataParsingMethodItem ? (
                <SkillListItem
                  item={dataParsingMethodItem}
                  onDelete={handleDeleteItem}
                />
              ) : (
                <SkillListEmpty onClick={handleCheckItem} />
              )}
            </Form.Item>
          )}

          <Form.Item
            name="icon"
            label={dict('PC.Components.CreateKnowledge.iconLabel')}
          >
            <UploadAvatar
              className={cx(styles['upload-box'])}
              onUploadSuccess={setImageUrl}
              imageUrl={imageUrl}
              defaultImage={knowledgeIcon as string}
              svgIconName="icons-workspace-knowledge"
            />
          </Form.Item>
        </Form>
        {/*添加插件、工作流、知识库、数据库弹窗*/}
        <Created
          open={show}
          onCancel={() => setShow(false)}
          checkTag={checkTag}
          addComponents={addComponents}
          onAdded={handleAddComponent}
          tabs={CREATED_TABS.filter(
            (item) => item.key === AgentComponentTypeEnum.Workflow,
          )}
        />
      </CustomFormModal>
    </>
  );
};

export default CreateKnowledge;
