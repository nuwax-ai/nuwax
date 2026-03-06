import mcpImage from '@/assets/images/mcp_image.png';
import CodeEditor from '@/components/CodeEditor';
import ConfigOptionCollapse from '@/components/ConfigOptionCollapse';
import Created from '@/components/Created';
import LabelStar from '@/components/LabelStar';
import UploadAvatar from '@/components/UploadAvatar';
import { MCP_INSTALL_TYPE_LIST } from '@/constants/mcp.constants';
import useMcp from '@/hooks/useMcp';
import { apiMcpCreate } from '@/services/mcp';
import { McpInstallTypeEnum } from '@/types/enums/mcp';
import { CodeLangEnum } from '@/types/enums/plugin';
import { McpDetailInfo } from '@/types/interfaces/mcp';
import { isValidJSON } from '@/utils/common';
import { customizeRequiredMark } from '@/utils/form';
import { jumpBack } from '@/utils/router';
import { Form, FormProps, Input, message, Radio } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useParams, useRequest } from 'umi';
import styles from './index.less';
import McpHeader from './McpHeader';

const cx = classNames.bind(styles);

// 不同安装方式对应的默认配置模板
const INSTALL_TYPE_DEFAULT_CONFIG: Record<McpInstallTypeEnum, string> = {
  [McpInstallTypeEnum.NPX]: `{
  "mcpServers": {
    "mcpServerName": {
      "command": "npx",
      "args": [],
      "env": {}
    }
  }
}`,
  [McpInstallTypeEnum.UVX]: `{
  "mcpServers": {
    "mcpServerName": {
      "command": "uvx",
      "args": [],
      "env": {}
    }
  }
}`,
  [McpInstallTypeEnum.SSE]: `{
  "mcpServers": {
    "mcpServerName": {
      "type": "sse",
      "url": "url地址",
      "headers": {}
    }
  }
}`,
  [McpInstallTypeEnum.STREAMABLE_HTTP]: `{
  "mcpServers": {
    "mcpServerName": {
      "type": "streamableHttp",
      "url": "url地址",
      "headers": {}
    }
  }
}`,
  // 组件库方式不需要 serverConfig，这里给空字符串
  [McpInstallTypeEnum.COMPONENT]: '',
};

// 创建MCP服务
const SpaceMcpCreate: React.FC = () => {
  const params = useParams();
  const spaceId = Number(params.spaceId);
  // 安装方式
  const [installType, setInstallType] = useState<McpInstallTypeEnum>();

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
    addComponents,
    collapseActiveKey,
    handleAddComponent,
    handleSave,
    withDeployRef,
    collapseList,
  } = useMcp();

  useEffect(() => {
    // 默认安装方式为 npx，并填充对应的默认配置
    const defaultType = McpInstallTypeEnum.NPX;
    setInstallType(defaultType);
    form.setFieldsValue({
      installType: defaultType,
      serverConfig: INSTALL_TYPE_DEFAULT_CONFIG[defaultType],
    });
  }, []);

  // MCP服务创建
  const { run: runCreate } = useRequest(apiMcpCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: McpDetailInfo) => {
      setSaveDeployLoading(false);
      setSaveLoading(false);
      const text = withDeployRef.current
        ? '已完成保存并提交部署'
        : '保存MCP服务成功';
      message.success(text);
      history.replace(`/space/${spaceId}/mcp/edit/${result.id}`);
    },
    onError: () => {
      setSaveDeployLoading(false);
      setSaveLoading(false);
    },
  });

  const onFinish: FormProps<{
    name: string;
    description: string;
    installType: McpInstallTypeEnum;
    serverConfig: string;
  }>['onFinish'] = (values) => {
    const { serverConfig, ...rest } = values;
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
      ...rest,
      spaceId,
      icon: imageUrl,
      mcpConfig,
      withDeploy: withDeployRef.current,
    };

    runCreate(data);
  };

  return (
    <div className={cx(styles.container, 'flex', 'flex-col', 'h-full')}>
      <McpHeader
        spaceId={spaceId}
        saveLoading={saveLoading}
        saveDeployLoading={saveDeployLoading}
        onCancel={() => jumpBack(`/space/${spaceId}/mcp`)}
        onSave={() => handleSave(false)}
        onSaveAndDeploy={() => handleSave(true)}
      />
      <div className={cx('flex-1', 'overflow-y')}>
        <div className={cx(styles['main-container'])}>
          <UploadAvatar
            className={styles['upload-box']}
            onUploadSuccess={setImageUrl}
            imageUrl={imageUrl}
            defaultImage={mcpImage}
            svgIconName="icons-workspace-mcp"
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
                maxLength={10000}
                autoSize={{ minRows: 3, maxRows: 5 }}
              />
            </Form.Item>
            <Form.Item
              name="installType"
              label="安装方式"
              rules={[{ required: true, message: '请选择安装方式' }]}
            >
              <Radio.Group
                onChange={(e) => {
                  const type = e.target.value as McpInstallTypeEnum;
                  setInstallType(type);
                  // 切换安装方式时，为代码编辑器填充对应的默认配置，方便用户直接修改
                  if (type !== McpInstallTypeEnum.COMPONENT) {
                    form.setFieldsValue({
                      serverConfig: INSTALL_TYPE_DEFAULT_CONFIG[type],
                    });
                  } else {
                    form.setFieldsValue({ serverConfig: '' });
                  }
                }}
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
                  value={form.getFieldValue('serverConfig')}
                  onChange={(code) => {
                    form.setFieldsValue({ serverConfig: code });
                  }}
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
        open={openAddComponent}
        onCancel={() => setOpenAddComponent(false)}
        checkTag={checkTag}
        addComponents={addComponents}
        onAdded={handleAddComponent}
      />
    </div>
  );
};

export default SpaceMcpCreate;
