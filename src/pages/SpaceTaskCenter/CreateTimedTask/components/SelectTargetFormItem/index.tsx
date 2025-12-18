import Created from '@/components/Created';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { McpConfigComponentInfo } from '@/types/interfaces/mcp';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Form, FormInstance } from 'antd';
import { useState } from 'react';
import SelectTargetFormItemTarget from '../SelectTargetFormItemTarget';

export interface SelectTargetProps {
  form: FormInstance<any>;
  name: string;
  label: string;
  onChange?: (value: McpConfigComponentInfo | null) => void;
}

const SelectTarget: React.FC<SelectTargetProps> = ({
  form,
  name,
  label,
  onChange,
}) => {
  // 处于loading或added状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  // 打开添加组件的弹窗
  const [openAddComponent, setOpenAddComponent] = useState<boolean>(false);

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
    // 设置处于loading或added状态的组件列表
    setAddComponents(() => {
      return [
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Added,
        },
      ];
    });

    const item: McpConfigComponentInfo = {
      name: info.name,
      icon: info.icon,
      description: info.description,
      type: info.targetType,
      targetId: info.targetId,
      targetConfig: '',
    };
    // 设置表单值
    form.setFieldsValue({ [name]: item });
    // 回调
    onChange?.(item);
  };

  const handleDeleteTarget = () => {
    // 设置处于loading或added状态的组件列表
    setAddComponents([]);
    // 设置表单值为空
    form.setFieldsValue({ [name]: null });
    // 回调
    onChange?.(null as McpConfigComponentInfo | null);
  };

  return (
    <>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          width: '100%',
        }}
      >
        <Form.Item
          name={name}
          label={label}
          style={{ flex: 1, marginBottom: 0, width: '100%' }}
          rules={[
            { required: true, message: `请选择${label}`, type: 'object' },
          ]}
        >
          <SelectTargetFormItemTarget onDelete={handleDeleteTarget} />
        </Form.Item>
        <Button
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
          }}
          type="text"
          icon={<PlusOutlined />}
          onClick={() => setOpenAddComponent(true)}
        />
      </div>

      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        // 隐藏顶部
        hideTop={[
          AgentComponentTypeEnum.Knowledge,
          AgentComponentTypeEnum.Table,
          AgentComponentTypeEnum.Plugin,
        ]}
        isSpaceOnly={true}
        open={openAddComponent}
        onCancel={() => setOpenAddComponent(false)}
        checkTag={AgentComponentTypeEnum.Workflow}
        addComponents={addComponents}
        onAdded={handleAddComponent}
      />
    </>
  );
};

export default SelectTarget;
