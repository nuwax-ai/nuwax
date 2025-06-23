import mcpImage from '@/assets/images/mcp_image.png';
import CodeEditor from '@/components/CodeEditor';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import LabelStar from '@/components/LabelStar';
import UploadAvatar from '@/components/UploadAvatar';
import { MCP_INSTALL_TYPE_LIST } from '@/constants/mcp.constants';
import useMcp from '@/hooks/useMcp';
import { apiMcpDetail, apiMcpUpdate } from '@/services/mcp';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { McpEditHeadMenusEnum, McpInstallTypeEnum } from '@/types/enums/mcp';
import { CodeLangEnum } from '@/types/enums/plugin';
import { BindConfigWithSub } from '@/types/interfaces/common';
import {
  McpDetailInfo,
  McpResourceInfo,
  McpToolInfo,
} from '@/types/interfaces/mcp';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useParams, useRequest } from 'umi';
import styles from './index.less';
import McpEditHeader from './McpEditHeader';
import McpEditItem from './McpEditItem';

const cx = classNames.bind(styles);

// 创建MCP服务
const SpaceMcpCreate: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const mcpId = Number(params.mcpId);
  // MCP服务详情信息
  const [mcpDetailInfo, setMcpDetailInfo] = useState<McpDetailInfo>();
  // 当前菜单
  const [currentMenu, setCurrentMenu] = useState<McpEditHeadMenusEnum>(
    McpEditHeadMenusEnum.Overview,
  );
  // mcp列表
  const [mcpEditList, setMcpEditList] = useState<
    McpToolInfo[] | McpResourceInfo[]
  >([]);

  const {
    form,
    imageUrl,
    setImageUrl,
    saveLoading,
    setSaveLoading,
    saveDeployLoading,
    setSaveDeployLoading,
    checkTag,
    openAddComponent,
    setOpenAddComponent,
    mcpConfigComponentList,
    setMcpConfigComponentList,
    addComponents,
    setAddComponents,
    collapseActiveKey,
    handleAddComponent,
    handleSave,
    withDeployRef,
    collapseList,
  } = useMcp();

  // 查询MCP服务详情成功后，处理数据
  const handleQuerySuccess = (result: McpDetailInfo) => {
    setMcpDetailInfo(result);
    const { name, description, icon, installType, mcpConfig } = result;
    form.setFieldsValue({
      name,
      description,
      installType,
      serverConfig: mcpConfig?.serverConfig,
    });
    // MCP服务配置组件列表
    setMcpConfigComponentList(mcpConfig?.components || []);
    setImageUrl(icon);
    // 添加组件列表
    mcpConfig?.components?.forEach((item) => {
      setAddComponents((list) => {
        return [
          ...list,
          {
            type: item.type,
            targetId: item.targetId,
            status: AgentAddComponentStatusEnum.Added,
          },
        ];
      });
    });
  };

  // MCP详情查询
  const { run: runDetail } = useRequest(apiMcpDetail, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo) => {
      handleQuerySuccess(result);
    },
  });

  // MCP服务更新
  const { run: runUpdate } = useRequest(apiMcpUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('更新MCP服务成功');
      setSaveDeployLoading(false);
      setSaveLoading(false);
    },
    onError: () => {
      setSaveDeployLoading(false);
      setSaveLoading(false);
    },
  });

  useEffect(() => {
    runDetail(mcpId);
  }, [mcpId]);

  const onFinish: FormProps<{
    name: string;
    description: string;
    installType: McpInstallTypeEnum;
    serverConfig: string;
  }>['onFinish'] = (values) => {
    if (withDeployRef.current) {
      setSaveDeployLoading(true);
    } else {
      setSaveLoading(true);
    }
    const { serverConfig, installType, ...rest } = values;
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
      id: mcpId,
      icon: imageUrl,
      mcpConfig,
      withDeploy: withDeployRef.current,
    };
    runUpdate(data);
  };

  // 选择菜单
  const handleChooseMenu = (value: McpEditHeadMenusEnum) => {
    setCurrentMenu(value);
    if (value === McpEditHeadMenusEnum.Tool) {
      setMcpEditList(mcpDetailInfo?.mcpConfig?.tools || []);
    }
    if (value === McpEditHeadMenusEnum.Resource) {
      setMcpEditList(mcpDetailInfo?.mcpConfig?.resources || []);
    }
    if (value === McpEditHeadMenusEnum.Prompt) {
      setMcpEditList(mcpDetailInfo?.mcpConfig?.prompts || []);
    }
  };

  // 点击测试按钮
  const handleClickTryRun = (inputArgs: BindConfigWithSub[]) => {
    console.log('inputArgs', inputArgs);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <McpEditHeader
        spaceId={spaceId}
        saveLoading={saveLoading}
        saveDeployLoading={saveDeployLoading}
        mcpInfo={mcpDetailInfo}
        currentMenu={currentMenu}
        onChooseMenu={handleChooseMenu}
        onSave={() => handleSave(false)}
        onSaveAndDeploy={() => handleSave(true)}
      />
      <div className={cx('flex-1', 'overflow-y')}>
        <div className={cx(styles['main-container'])}>
          {currentMenu === McpEditHeadMenusEnum.Overview ? (
            <>
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
                {mcpDetailInfo?.installType !== McpInstallTypeEnum.COMPONENT ? (
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
            </>
          ) : (
            <div className={cx('flex', 'flex-col', 'gap-10')}>
              {mcpEditList?.map((item, index) => (
                <McpEditItem
                  key={index}
                  name={item.name}
                  description={item.description}
                  onClick={() => handleClickTryRun(item.inputArgs)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {/*添加插件、工作流、知识库、数据库弹窗*/}
      <Created
        open={openAddComponent}
        onCancel={() => setOpenAddComponent(false)}
        checkTag={checkTag}
        addComponents={addComponents}
        onAdded={handleAddComponent}
        hideTop={[AgentComponentTypeEnum.MCP]}
      />
    </div>
  );
};

export default SpaceMcpCreate;
