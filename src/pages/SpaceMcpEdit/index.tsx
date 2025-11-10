import mcpImage from '@/assets/images/mcp_image.png';
import CodeEditor from '@/components/CodeEditor';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import Loading from '@/components/custom/Loading';
import LabelStar from '@/components/LabelStar';
import UploadAvatar from '@/components/UploadAvatar';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { MCP_INSTALL_TYPE_LIST } from '@/constants/mcp.constants';
import useMcp from '@/hooks/useMcp';
import { apiMcpDetail, apiMcpUpdate } from '@/services/mcp';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import {
  DeployStatusEnum,
  McpEditHeadMenusEnum,
  McpExecuteTypeEnum,
  McpInstallTypeEnum,
} from '@/types/enums/mcp';
import { CodeLangEnum } from '@/types/enums/plugin';
import {
  McpDetailInfo,
  McpResourceInfo,
  McpToolInfo,
  McpUpdateParams,
} from '@/types/interfaces/mcp';
import { isValidJSON } from '@/utils/common';
import { getActiveKeys } from '@/utils/deepNode';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRequest } from 'umi';
import styles from './index.less';
import McpEditHeader from './McpEditHeader';
import McpEditItem from './McpEditItem';
import McpTryRunModal from './McpTryRunModal';

const cx = classNames.bind(styles);

// 创建MCP服务
const SpaceMcpCreate: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  const mcpId = Number(params.mcpId);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
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
  // mcp测试信息
  const [mcpTestInfo, setMcpTestInfo] = useState<
    McpToolInfo | McpResourceInfo
  >();
  // 入参配置 - 展开的行，控制属性
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  // 试运行弹窗
  const [visible, setVisible] = useState<boolean>(false);
  // 执行类型,可用值:TOOL,RESOURCE,PROMPT
  const mcpExecuteTypeRef = useRef<McpExecuteTypeEnum>(McpExecuteTypeEnum.TOOL);
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 缓存MCP服务详情，用于切换菜单时，用于保存或保存并部署的数据
  const mcpDetailInfoRef = useRef<McpDetailInfo>();
  // 缓存当前菜单状态，解决onFinish闭包问题
  const currentMenuRef = useRef<McpEditHeadMenusEnum>(
    McpEditHeadMenusEnum.Overview,
  );

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
    setLoadingDetail(false);
    setMcpDetailInfo(result);
    mcpDetailInfoRef.current = result;
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
    onSuccess: (_: null, params: McpUpdateParams[]) => {
      const currentMcpDetailInfo = params[0];
      const { withDeploy } = currentMcpDetailInfo;
      const text = withDeploy ? '已完成保存并提交部署' : '保存MCP服务成功';
      message.success(text);
      setSaveDeployLoading(false);
      setSaveLoading(false);
      // 保存或者保存并部署后，恢复到Overview菜单（因为保存后工具、资源、提示词列表会清空）
      setCurrentMenu(McpEditHeadMenusEnum.Overview);
      // 设置初始菜单状态
      currentMenuRef.current = McpEditHeadMenusEnum.Overview;
      // 重新查询MCP服务详情
      runDetail(mcpId);
    },
    onError: () => {
      setSaveDeployLoading(false);
      setSaveLoading(false);
    },
  });

  useEffect(() => {
    setLoadingDetail(true);
    runDetail(mcpId);
    // 设置初始菜单状态
    currentMenuRef.current = McpEditHeadMenusEnum.Overview;
  }, [mcpId]);

  // 清理定时器
  const handleClearInterval = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  // 定时查询MCP服务详情
  const loadMcpDetail = async () => {
    const { code, data, message: msg } = await apiMcpDetail(mcpId);
    if (code === SUCCESS_CODE) {
      const _info = {
        ...mcpDetailInfo,
        deployStatus: data.deployStatus,
        deployed: data.deployed,
        modified: data.modified,
        mcpConfig: {
          ...mcpDetailInfo?.mcpConfig,
          tools: data.mcpConfig?.tools,
          resources: data.mcpConfig?.resources,
          prompts: data.mcpConfig?.prompts,
        },
      } as McpDetailInfo;

      setMcpDetailInfo(_info);
    } else {
      message.error(msg);
      handleClearInterval();
    }
  };

  useEffect(() => {
    // 部署中，定时查询MCP服务详情, 部署成功后，停止定时查询
    if (mcpDetailInfo?.deployStatus === DeployStatusEnum.Deploying) {
      intervalIdRef.current = setInterval(() => {
        loadMcpDetail();
      }, 2000);
    } else {
      handleClearInterval();
    }

    // 组件卸载时清理定时器
    return () => {
      handleClearInterval();
    };
  }, [mcpDetailInfo]);

  const onFinish: FormProps<{
    name: string;
    description: string;
    installType: McpInstallTypeEnum;
    serverConfig: string;
  }>['onFinish'] = (values) => {
    let name, description, installType, serverConfig;
    // 如果是 Overview 菜单，使用表单数据
    if (currentMenuRef.current === McpEditHeadMenusEnum.Overview) {
      name = values.name;
      description = values.description;
      installType = values.installType;
      serverConfig = values.serverConfig;
    } else {
      name = mcpDetailInfoRef.current?.name;
      description = mcpDetailInfoRef.current?.description;
      installType = mcpDetailInfoRef.current?.installType;
      serverConfig = mcpDetailInfoRef.current?.mcpConfig?.serverConfig;
    }

    // 组件库
    if (installType === McpInstallTypeEnum.COMPONENT) {
      if (!mcpConfigComponentList?.length) {
        message.warning('请选择组件');
        return;
      }
    } else if (!serverConfig) {
      message.warning('请输入MCP服务配置');
      return;
    }

    // loading状态
    if (withDeployRef.current) {
      setSaveDeployLoading(true);
    } else {
      setSaveLoading(true);
    }

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
      name,
      description,
      installType,
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
    currentMenuRef.current = value;
    // 如果是 Overview 菜单，需要重置form数据
    if (value === McpEditHeadMenusEnum.Overview && mcpDetailInfoRef.current) {
      const { name, description, installType, mcpConfig } =
        mcpDetailInfoRef.current;
      form.setFieldsValue({
        name,
        description,
        installType,
        serverConfig: mcpConfig?.serverConfig,
      });
    } else if (!!mcpDetailInfo) {
      const values = form.getFieldsValue();
      const { serverConfig, ...rest } = values;
      mcpDetailInfoRef.current = {
        ...mcpDetailInfo,
        ...rest,
        mcpConfig: {
          ...(mcpDetailInfo?.mcpConfig || {}),
          serverConfig,
        },
      };
    }
    if (value === McpEditHeadMenusEnum.Tool) {
      mcpExecuteTypeRef.current = McpExecuteTypeEnum.TOOL;
      setMcpEditList(mcpDetailInfo?.mcpConfig?.tools || []);
    }
    if (value === McpEditHeadMenusEnum.Resource) {
      mcpExecuteTypeRef.current = McpExecuteTypeEnum.RESOURCE;
      setMcpEditList(mcpDetailInfo?.mcpConfig?.resources || []);
    }
    if (value === McpEditHeadMenusEnum.Prompt) {
      mcpExecuteTypeRef.current = McpExecuteTypeEnum.PROMPT;
      setMcpEditList(mcpDetailInfo?.mcpConfig?.prompts || []);
    }
  };

  // 点击测试按钮
  const handleClickTryRun = (info: McpToolInfo | McpResourceInfo) => {
    // 默认展开的入参配置key
    const _expandedRowKeys = getActiveKeys(info.inputArgs);
    setExpandedRowKeys(_expandedRowKeys);
    setMcpTestInfo(info);
    setVisible(true);
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
      <div
        className={cx('flex-1', 'scroll-container')}
        style={{ margin: '10px 0' }}
      >
        {loadingDetail ? (
          <Loading className="h-full" />
        ) : (
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
                    rules={[
                      { required: true, message: '请输入描述你的MCP服务' },
                    ]}
                  >
                    <Input.TextArea
                      className="dispose-textarea-count"
                      placeholder="描述你的MCP服务"
                      showCount
                      maxLength={10000}
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
                  {mcpDetailInfo?.installType !==
                  McpInstallTypeEnum.COMPONENT ? (
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
                      rules={[
                        {
                          required: true,
                          message: '请输入MCP服务配置',
                        },
                        {
                          validator: (_, value) => {
                            if (!value) {
                              return Promise.resolve();
                            }
                            if (!isValidJSON(value)) {
                              return Promise.reject(
                                new Error('请输入有效的JSON格式'),
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                    >
                      <CodeEditor
                        className={cx('w-full', 'radius-10', 'overflow-hide')}
                        codeLanguage={CodeLangEnum.JSON}
                        height="300px"
                        codeOptimizeVisible={false}
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
                    onClick={() => handleClickTryRun(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
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
      {/* 试运行弹窗组件 */}
      <McpTryRunModal
        inputConfigArgs={mcpTestInfo?.inputArgs || []}
        inputExpandedRowKeys={expandedRowKeys}
        executeType={mcpExecuteTypeRef.current}
        mcpId={mcpId}
        name={mcpTestInfo?.name}
        open={visible}
        onCancel={() => setVisible(false)}
      />
    </div>
  );
};

export default SpaceMcpCreate;
