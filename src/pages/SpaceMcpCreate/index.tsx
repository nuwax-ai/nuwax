import CodeEditor from '@/components/CodeEditor';
import CollapseComponentList from '@/components/CollapseComponentList';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import PluginModelSetting from '@/components/PluginModelSetting';
import TooltipIcon from '@/components/TooltipIcon';
import { MCP_INSTALL_TYPE_LIST } from '@/constants/mcp.constants';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
  BindValueType,
} from '@/types/enums/agent';
import { McpInstallTypeEnum } from '@/types/enums/mcp';
import { CodeLangEnum } from '@/types/enums/plugin';
import { AgentArrangeConfigEnum } from '@/types/enums/space';
import {
  AgentComponentInfo,
  BindConfigWithSub,
} from '@/types/interfaces/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { CollapseProps, Form, FormProps, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useModel, useParams } from 'umi';
import styles from './index.less';
import McpHeader from './McpHeader';

const cx = classNames.bind(styles);

// 创建MCP服务
const SpaceMcpCreate: React.FC = () => {
  const [form] = Form.useForm();
  const params = useParams();
  const spaceId = Number(params.spaceId);

  const [installType, setInstallType] = useState<McpInstallTypeEnum>();
  // 当前组件信息
  const [currentComponentInfo, setCurrentComponentInfo] =
    useState<AgentComponentInfo>();
  const [agentComponentList, setAgentComponentList] = useState<
    AgentComponentInfo[]
  >([]);
  // 插件弹窗
  const [openPluginModel, setOpenPluginModel] = useState<boolean>(false);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // 打开、关闭弹窗
  const { show, setShow } = useModel('model');

  // 取消创建MCP服务
  const handleCancel = () => {
    console.log('取消创建MCP服务');
  };

  // 保存MCP服务
  const handleSave = () => {
    console.log('保存MCP服务');
  };

  // 保存并部署MCP服务
  const handleSaveAndDeploy = () => {
    console.log('保存并部署MCP服务');
  };

  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('Success:', values);
  };

  // 绑定的变量信息
  const variablesInfo = useMemo(() => {
    return agentComponentList?.find(
      (item: AgentComponentInfo) =>
        item.type === AgentComponentTypeEnum.Variable,
    ) as AgentComponentInfo;
  }, [agentComponentList]);

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return (
      agentComponentList?.filter(
        (item: AgentComponentInfo) => item.type === type,
      ) || []
    );
  };

  // 插件设置
  const handlePluginSet = (id: number) => {
    const componentInfo = agentComponentList?.find(
      (info: AgentComponentInfo) => info.id === id,
    );

    const inputConfigArgs = componentInfo?.bindConfig?.inputArgBindConfigs;
    // 默认值：输入
    const _inputConfigArgs = inputConfigArgs?.map((info: BindConfigWithSub) => {
      if (!info.bindValueType) {
        info.bindValueType = BindValueType.Input;
      }
      return info;
    });
    if (componentInfo && componentInfo.bindConfig) {
      componentInfo.bindConfig.inputArgBindConfigs = _inputConfigArgs;
    }
    // 工作流组件，去掉属性配置（argBindConfigs属性是之前的，目前改为inputArgBindConfigs）
    if (componentInfo?.type === AgentComponentTypeEnum.Workflow) {
      componentInfo.bindConfig.argBindConfigs = null;
    }
    setCurrentComponentInfo(componentInfo);
    setOpenPluginModel(true);
  };

  const handleAgentComponentDel = async (
    id: number,
    targetId: number,
    type: AgentComponentTypeEnum,
  ) => {
    // await runAgentComponentDel(id);
    message.success('已成功删除');
    const list =
      agentComponentList?.filter(
        (item: AgentComponentInfo) => !(item.id === id && item.type === type),
      ) || [];
    setAgentComponentList(list);
    const newList =
      addComponents?.filter(
        (item) => !(item.targetId === targetId && item.type === type),
      ) || [];
    setAddComponents(newList);
  };

  // 添加插件、工作流、知识库等
  const handlerComponentPlus = (
    e: React.MouseEvent<HTMLElement>,
    type: AgentComponentTypeEnum,
  ) => {
    e.stopPropagation();
    setCheckTag(type);
    setShow(true);
  };

  // 是否存在组件
  const isExistComponent = (type: AgentComponentTypeEnum) => {
    return agentComponentList?.some(
      (item: AgentComponentInfo) => item.type === type,
    );
  };

  // 折叠面板 - 当前激活 tab 面板的 key
  const collapseActiveKey = useMemo(() => {
    const skill: AgentArrangeConfigEnum[] = [];
    if (isExistComponent(AgentComponentTypeEnum.Plugin)) {
      skill.push(AgentArrangeConfigEnum.Plugin);
    }
    if (isExistComponent(AgentComponentTypeEnum.Workflow)) {
      skill.push(AgentArrangeConfigEnum.Workflow);
    }
    if (isExistComponent(AgentComponentTypeEnum.Trigger)) {
      skill.push(AgentArrangeConfigEnum.Trigger);
    }
    return skill;
  }, [agentComponentList]);

  // 折叠面板列表
  const collapseList: CollapseProps['items'] = [
    {
      key: AgentArrangeConfigEnum.Plugin,
      label: '插件',
      children: (
        <CollapseComponentList
          type={AgentComponentTypeEnum.Plugin}
          list={filterList(AgentComponentTypeEnum.Plugin)}
          onSet={handlePluginSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加插件"
          onClick={(e) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Plugin)
          }
        />
      ),
    },
    {
      key: AgentArrangeConfigEnum.Workflow,
      label: '工作流',
      children: (
        <CollapseComponentList
          type={AgentComponentTypeEnum.Workflow}
          list={filterList(AgentComponentTypeEnum.Workflow)}
          onSet={handlePluginSet}
          onDel={handleAgentComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title="添加工作流"
          onClick={(e) =>
            handlerComponentPlus(e, AgentComponentTypeEnum.Workflow)
          }
        />
      ),
    },
  ];

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
    setAddComponents((list) => {
      return [
        ...list,
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Loading,
        },
      ];
    });
    // runComponentAdd({
    //   agentId,
    //   type: info.targetType,
    //   targetId: info.targetId,
    // });
  };

  return (
    <div className={cx(styles.container)}>
      <McpHeader
        spaceId={spaceId}
        onCancel={handleCancel}
        onSave={handleSave}
        onSaveAndDeploy={handleSaveAndDeploy}
      />
      <div className={cx(styles['main-container'])}>
        <Form
          form={form}
          preserve={false}
          layout="vertical"
          requiredMark={customizeRequiredMark}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="name"
            label="服务名称"
            rules={[{ required: true, message: '请输入MCP服务名称' }]}
          >
            <Input placeholder="MCP服务名称" showCount maxLength={30} />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述你的MCP服务' }]}
          >
            <Input.TextArea
              className="dispose-textarea-count"
              placeholder="描述你的MCP服务"
              showCount
              maxLength={500}
              autoSize={{ minRows: 3, maxRows: 5 }}
            />
          </Form.Item>
          <Form.Item
            name="installType"
            label="安装方式"
            rules={[{ required: true, message: '请选择安装方式' }]}
          >
            <Radio.Group
              onChange={(e) =>
                setInstallType(e.target.value as McpInstallTypeEnum)
              }
              value={installType}
              options={MCP_INSTALL_TYPE_LIST}
            />
          </Form.Item>
          {/* 安装方式切换 */}
          {installType !== McpInstallTypeEnum.COMPONENT ? (
            // MCP服务配置，installType为npx、uvx、sse时有效	类型：string
            <Form.Item
              name="serverConfig"
              label={
                <div className={cx('flex', 'items-center')}>
                  <span>MCP服务配置</span>
                  <span className={cx(styles['sub-title'])}>
                    MCP服务使用json配置，提交前确保格式正确
                  </span>
                </div>
              }
              rules={[{ required: true, message: '请输入MCP服务配置' }]}
            >
              <CodeEditor
                className={cx('w-full', 'radius-10', 'overflow-hide')}
                codeLanguage={CodeLangEnum.JSON}
                height="400px"
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="components"
              label="组件选择"
              rules={[{ required: true, message: '请选择组件' }]}
            >
              <ConfigOptionCollapse
                items={collapseList}
                defaultActiveKey={collapseActiveKey}
              />
            </Form.Item>
          )}
        </Form>
      </div>
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        open={show}
        onCancel={() => setShow(false)}
        checkTag={checkTag}
        addComponents={addComponents}
        onAdded={handleAddComponent}
      />
      {/*插件设置弹窗*/}
      <PluginModelSetting
        open={openPluginModel}
        variables={variablesInfo?.bindConfig?.variables || []}
        currentComponentInfo={currentComponentInfo}
        onCancel={() => setOpenPluginModel(false)}
      />
    </div>
  );
};

export default SpaceMcpCreate;
