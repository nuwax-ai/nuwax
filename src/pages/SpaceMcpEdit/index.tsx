import mcpImage from '@/assets/images/mcp_image.png';
import CodeEditor from '@/components/CodeEditor';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import LabelStar from '@/components/LabelStar';
import McpCollapseComponentList from '@/components/McpCollapseComponentList';
import TooltipIcon from '@/components/TooltipIcon';
import UploadAvatar from '@/components/UploadAvatar';
import {
  MCP_COLLAPSE_COMPONENT_LIST,
  MCP_INSTALL_TYPE_LIST,
} from '@/constants/mcp.constants';
import { apiMcpDetail, apiMcpUpdate } from '@/services/mcp';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { McpInstallTypeEnum } from '@/types/enums/mcp';
import { CodeLangEnum } from '@/types/enums/plugin';
import { AgentArrangeConfigEnum } from '@/types/enums/space';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { McpConfigComponentInfo, McpDetailInfo } from '@/types/interfaces/mcp';
import { customizeRequiredMark } from '@/utils/form';
import { jumpBack } from '@/utils/router';
import { CollapseProps, Form, FormProps, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useModel, useParams, useRequest } from 'umi';
import styles from './index.less';
import McpHeader from './McpHeader';

const cx = classNames.bind(styles);

// 创建MCP服务
const SpaceMcpCreate: React.FC = () => {
  const [form] = Form.useForm();
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const mcpId = Number(params.mcpId);
  const [imageUrl, setImageUrl] = useState<string>('');
  // 安装方式
  const [installType, setInstallType] = useState<McpInstallTypeEnum>();
  // MCP服务配置组件列表
  const [mcpConfigComponentList, setMcpConfigComponentList] = useState<
    McpConfigComponentInfo[]
  >([]);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [mcpDetailInfo, setMcpDetailInfo] = useState<McpDetailInfo>();
  const [checkTag, setCheckTag] = useState<AgentComponentTypeEnum>(
    AgentComponentTypeEnum.Plugin,
  );
  // 是否部署
  const withDeployRef = useRef<boolean>(false);
  // 打开、关闭弹窗
  const { show, setShow } = useModel('model');

  // MCP详情查询
  const { run: runDetail } = useRequest(apiMcpDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo) => {
      setMcpDetailInfo(result);
      const { name, description, icon, installType, mcpConfig } = result;
      form.setFieldsValue({
        name,
        description,
        icon,
        installType,
        serverConfig: mcpConfig?.serverConfig,
      });
      setMcpConfigComponentList(mcpConfig?.components || []);
      setImageUrl(icon);
      setInstallType(installType);
    },
  });

  console.log('mcpDetailInfo', mcpDetailInfo);

  // MCP服务更新
  const { run: runUpdate } = useRequest(apiMcpUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo) => {
      console.log('创建MCP服务成功', result);
      message.success('更新MCP服务成功');
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  useEffect(() => {
    runDetail(mcpId);
  }, [mcpId]);

  // 保存MCP服务
  const handleSave = (withDeploy: boolean = false) => {
    withDeployRef.current = withDeploy;
    form.submit();
  };

  const onFinish: FormProps<{
    name: string;
    description: string;
    installType: McpInstallTypeEnum;
    serverConfig: string;
  }>['onFinish'] = (values) => {
    const { serverConfig, ...rest } = values;
    const mcpConfig =
      installType === McpInstallTypeEnum.COMPONENT
        ? {
            serverConfig: '',
            components: mcpConfigComponentList,
          }
        : {
            serverConfig,
            components: [],
          };
    const data = {
      ...rest,
      spaceId,
      icon: imageUrl,
      mcpConfig,
      withDeploy: withDeployRef.current,
    };
    runUpdate(data);
  };

  // 根据组件类型，过滤组件
  const filterList = (type: AgentComponentTypeEnum) => {
    return (
      mcpConfigComponentList?.filter(
        (item: McpConfigComponentInfo) => item.type === type,
      ) || []
    );
  };

  /**
   * 删除组件
   * @param targetId: 关联的组件ID
   * @param type: 组件类型
   */
  const handleComponentDel = async (
    targetId: number,
    type: AgentComponentTypeEnum,
  ) => {
    // 从mcpConfigComponentList中删除组件
    const list = mcpConfigComponentList?.filter(
      (item: McpConfigComponentInfo) =>
        !(item.targetId === targetId && item.type === type),
    );
    setMcpConfigComponentList(list);
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
    return mcpConfigComponentList?.some(
      (item: McpConfigComponentInfo) => item.type === type,
    );
  };

  // 折叠面板 - 当前激活 tab 面板的 key
  const collapseActiveKey = useMemo(() => {
    const list: AgentArrangeConfigEnum[] = [];
    if (isExistComponent(AgentComponentTypeEnum.Plugin)) {
      list.push(AgentArrangeConfigEnum.Plugin);
    }
    if (isExistComponent(AgentComponentTypeEnum.Workflow)) {
      list.push(AgentArrangeConfigEnum.Workflow);
    }
    if (isExistComponent(AgentComponentTypeEnum.Knowledge)) {
      list.push(AgentArrangeConfigEnum.Knowledge);
    }
    if (isExistComponent(AgentComponentTypeEnum.Table)) {
      list.push(AgentArrangeConfigEnum.Table);
    }
    return list;
  }, [mcpConfigComponentList]);

  // 折叠面板列表
  const collapseList: CollapseProps['items'] = MCP_COLLAPSE_COMPONENT_LIST?.map(
    (item) => ({
      key: item.type,
      label: item.label,
      children: (
        <McpCollapseComponentList
          textClassName="px-16"
          type={item.type}
          list={filterList(item.type)}
          onDel={handleComponentDel}
        />
      ),
      extra: (
        <TooltipIcon
          title={`添加${item.label}`}
          onClick={(e) => handlerComponentPlus(e, item.type)}
        />
      ),
    }),
  );

  // 添加插件、工作流、知识库、数据库
  const handleAddComponent = (info: CreatedNodeItem) => {
    setAddComponents((list) => {
      return [
        ...list,
        {
          type: info.targetType,
          targetId: info.targetId,
          status: AgentAddComponentStatusEnum.Added,
        },
      ];
    });
    // MCP服务配置组件列表
    setMcpConfigComponentList((list) => {
      const newItem = {
        name: info.name,
        icon: info.icon,
        description: info.description,
        type: info.targetType,
        targetId: info.targetId,
        targetConfig: '',
      };
      return [...list, newItem];
    });
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <McpHeader
        spaceId={spaceId}
        saveLoading={loading}
        onCancel={() => jumpBack(`/space/${spaceId}/mcp`)}
        onSave={handleSave}
        onSaveAndDeploy={() => handleSave(true)}
      />
      <div className={cx('flex-1', 'overflow-y')}>
        <div className={cx(styles['main-container'])}>
          <UploadAvatar
            className={styles['upload-box']}
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={mcpImage}
          />
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
              <Radio.Group disabled options={MCP_INSTALL_TYPE_LIST} />
            </Form.Item>
            {/* 安装方式切换 */}
            {installType !== McpInstallTypeEnum.COMPONENT ? (
              // MCP服务配置，installType为npx、uvx、sse时有效	类型：string
              <Form.Item
                name="serverConfig"
                label={
                  <LabelStar
                    label={
                      <div className={cx('flex', 'items-center')}>
                        <span>MCP服务配置</span>
                        <span className={cx(styles['sub-title'])}>
                          MCP服务使用json配置，提交前确保格式正确
                        </span>
                      </div>
                    }
                  />
                }
              >
                <CodeEditor
                  className={cx('w-full', 'radius-10', 'overflow-hide')}
                  codeLanguage={CodeLangEnum.JSON}
                  height="300px"
                  codeOptimizeVisible={false}
                  isReadOnly={true}
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="components"
                label={<LabelStar label="组件选择" />}
              >
                <ConfigOptionCollapse
                  className={cx(styles['collapse-container'])}
                  items={collapseList}
                  defaultActiveKey={collapseActiveKey}
                />
              </Form.Item>
            )}
          </Form>
        </div>
      </div>
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        open={show}
        onCancel={() => setShow(false)}
        checkTag={checkTag}
        addComponents={addComponents}
        onAdded={handleAddComponent}
        hideTop={[AgentComponentTypeEnum.MCP]}
      />
    </div>
  );
};

export default SpaceMcpCreate;
