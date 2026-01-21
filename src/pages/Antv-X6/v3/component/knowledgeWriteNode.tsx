import Created from '@/components/Created';
import TooltipIcon from '@/components/custom/TooltipIcon';
import TreeInput from '@/components/FormListItem/TreeInput';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { NodeTypeEnum } from '@/types/enums/common';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Radio } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
// import '../indexV3.less';
import { TreeOutput } from './commonNode';
import { SkillList } from './NewSkillV3';

const DEFAULT_INPUT_ARGS_DESC = '知识库文件';
const KB_FORM_KEY = 'knowledgeBaseConfig'; // 单个知识库配置
const KBC_INPUT_ARGS_KEY = 'inputArgs';

// 定义知识库写入
const KnowledgeWriteNode: React.FC<NodeDisposeProps> = ({ form, type, id }) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  const { setIsModified } = useModel('workflowV3');
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  //   显示新增
  const showAdd = () => {
    setOpen(true);
  };

  // 添加知识库回调
  const onAddedSkill = (item: CreatedNodeItem) => {
    // 知识库写入只允许一个知识库
    // 构造存储格式，虽然只存一个，为了复用 SkillList 组件或者保持一致性，
    // 这里我们直接存单个对象或者数组。
    // 根据 Screenshot "仅可以添加一个知识库", we should probably store it as an array of 1 or just an object.
    // Looking at KnowledgeNode, it uses `knowledgeBaseConfigs` as an array.
    // Here we might want to store just one. But SkillList expects an array?
    // Let's assume we store it as an array but limit it to 1, or manage it as a single object but wrap it for display.

    // Convert to the format expected
    const newItem = {
      ...item,
      type: item.targetType as unknown as NodeTypeEnum,
      knowledgeBaseId: item.targetId,
    };

    // Update form
    // Note: The requirement says "Target Knowledge Base", implies singular.
    // But verify if we can reuse SkillList. SkillList takes `params` which is array.

    // Set the value as an array of 1 element for consistency if we use SkillList,
    // OR if we implement a custom single-item view.
    // The screenshot shows a card similar to SkillList items.

    // Let's try to reuse SkillList but restrict it to one item?
    // Or just manually render the single item card.

    // For now, let's use an array but overwrite it.

    form.setFieldValue(KB_FORM_KEY, [newItem]);
    form.setFieldValue('knowledgeBaseId', item.targetId);
    setIsModified(true);
    form.submit();
    setOpen(false);

    setAddComponents([
      {
        type: item.targetType,
        targetId: item.targetId,
        status: AgentAddComponentStatusEnum.Added,
      },
    ]);
  };

  // 移出
  const removeItem = () => {
    form.setFieldValue(KB_FORM_KEY, []);
    form.setFieldValue('knowledgeBaseId', undefined);
    setIsModified(true);
    form.submit();
  };

  // 修改 (Not really applicable for single item replacement/add, but SkillList might need it)
  const modifyItem = () => {
    // Usually not needed for simple Knowledge Base selection unless there are params
    // Knowledge Write typically doesn't have params on the knowledge base itself in the same way plugins do?
    // But wait, the screenshot doesn't show params on the knowledge base card itself.
  };

  const knowledgeBaseConfig = form.getFieldValue(KB_FORM_KEY); // Expecting array of 1 or undefined

  useEffect(() => {
    const _arr =
      knowledgeBaseConfig?.map((item: CreatedNodeItem) => {
        return {
          type: item.type,
          targetId: item.knowledgeBaseId,
          status: AgentAddComponentStatusEnum.Added,
        };
      }) || [];
    setAddComponents(_arr);
  }, [knowledgeBaseConfig]);

  const inputArgs = (form?.getFieldValue(KBC_INPUT_ARGS_KEY) || []).map(
    (item: any) => {
      return {
        ...item,
        description: item.description || DEFAULT_INPUT_ARGS_DESC,
      };
    },
  );

  return (
    <div className="knowledge-write-node">
      {/* 输入参数 */}
      <div className="node-item-style">
        <TreeInput
          title={'输入'}
          form={form}
          params={inputArgs}
          key={`${type}-${id}-${KBC_INPUT_ARGS_KEY}`}
          // inputArgs usually fixed for this node?
          // The screenshot shows "knowledge" variable.
          // TreeInput supports editing if we allow it, but for KnowledgeWrite
          // the input `knowledge` is likely fixed required input.
          // If we want to allow users to map variables to it, TreeInput does that.
        />
      </div>

      {/* 知识库选择 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">知识库</span>
          <div className="text-gray-400 text-xs">
            {!knowledgeBaseConfig?.length &&
              '请添加知识库到此节点，仅支持添加一个文档类型知识库'}
          </div>
          {/* If empty, show plus button? Or always show plus if not full? */}
          {(!knowledgeBaseConfig || knowledgeBaseConfig.length === 0) && (
            <Button
              icon={<PlusOutlined />}
              size={'small'}
              onClick={showAdd}
            ></Button>
          )}
        </div>

        <Form.Item shouldUpdate noStyle>
          {() =>
            form.getFieldValue(KB_FORM_KEY)?.length ? (
              <SkillList
                skillName={KB_FORM_KEY}
                params={form.getFieldValue(KB_FORM_KEY)}
                form={form}
                modifyItem={modifyItem} // Might not need modifcation for basic KB
                removeItem={removeItem}
                disabled={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded border border-dashed border-gray-200">
                <div className="text-gray-400 mb-2">
                  {/* Icon placeholder if needed */}
                  <InfoCircleOutlined style={{ fontSize: 24 }} />
                </div>
                <div className="text-gray-400 text-xs">知识不可为空</div>
              </div>
            )
          }
        </Form.Item>
      </div>

      {/* 数据写入设置 */}
      <div className="node-item-style">
        <div className="node-title-style margin-bottom">数据写入设置</div>

        {/* 文档解析策略 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span>文档解析策略</span>
            <TooltipIcon title="快速解析速度快，精准解析效果好但速度慢" />
          </div>
          <Form.Item name="parsingStrategy" initialValue="FAST" noStyle>
            <Radio.Group className="w-full flex">
              <Radio.Button value="FAST" className="flex-1 text-center">
                快速解析
              </Radio.Button>
              <Radio.Button value="PRECISE" className="flex-1 text-center">
                精准解析
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>

        {/* 分段策略 */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <span>分段策略</span>
            <TooltipIcon title="自动分段由系统自动处理，自定义分段可手动设置规则" />
          </div>
          <Form.Item name="segmentationStrategy" initialValue="AUTO" noStyle>
            <Radio.Group className="w-full flex">
              <Radio.Button value="AUTO" className="flex-1 text-center">
                自动分段
              </Radio.Button>
              {/* <Radio.Button value="CUSTOM" className="flex-1 text-center">自定义分段</Radio.Button> */}
              {/* Screenshot shows Custom as an option but maybe disabled or simple impl? */}
              <Radio.Button value="CUSTOM" className="flex-1 text-center">
                自定义分段
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>
      </div>

      {/* 输出 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>

      <Created
        checkTag={AgentComponentTypeEnum.Knowledge} // Select Knowledge Base
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        addComponents={addComponents}
        hideTop={[
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Agent,
          AgentComponentTypeEnum.Plugin,
          AgentComponentTypeEnum.Workflow,
          AgentComponentTypeEnum.MCP,
        ]} // Hide other types, show Knowledge only
      />
    </div>
  );
};

export default KnowledgeWriteNode;
