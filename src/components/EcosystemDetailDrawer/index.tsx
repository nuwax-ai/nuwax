import {
  COMPONENT_LIST,
  ECO_TYPE_TITLE_MAP,
} from '@/constants/ecosystem.constants';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  Tooltip,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ActivatedIcon from './ActivatedIcon';
import styles from './index.less';
// 方程式支持
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CodeLangEnum } from '@/types/enums/plugin';
import {
  EcosystemDataTypeEnum,
  EcosystemDetailDrawerProps,
  EcosystemOwnedFlagEnum,
  type EcosystemDetailDrawerData,
} from '@/types/interfaces/ecosystem';
import { encodeHTML } from '@/utils/common';
import CodeEditor from '../CodeEditor';
import { PureMarkdownRenderer } from '../MarkdownRenderer';

const cx = classNames.bind(styles);

const { Title, Paragraph } = Typography;

const DEFAULT_ICON =
  'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png';
const DEFAULT_TEXT = '插件';

// 类型定义
interface ConfigParam {
  name: string;
  value: any;
  description?: string;
}

interface TargetInfo {
  defaultImage: string;
  text: string;
}

// 工具函数：安全解析JSON
const safeParseJSON = <T,>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON解析失败:', error);
    return defaultValue;
  }
};

// 类型定义：MCP配置
interface McpConfig {
  mcpConfig?: {
    serverConfig?: string;
  };
}

// 工具函数：合并配置参数
const mergeConfigParams = (
  configParam: ConfigParam[],
  localConfigParam: ConfigParam[],
): ConfigParam[] => {
  return configParam.map((item) => {
    const localItem = localConfigParam.find(
      (localItem) => localItem.name === item.name,
    );
    return {
      ...item,
      value: localItem?.value ?? item.value,
    };
  });
};

// 工具函数：将配置参数转换为表单值
const configParamToFormValues = (
  configParam: ConfigParam[],
): Record<string, any> => {
  return configParam.reduce((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {} as Record<string, any>);
};

/**
 * 插件详情抽屉组件
 * 右侧划出的插件详情展示
 */
const EcosystemDetailDrawer: React.FC<EcosystemDetailDrawerProps> = ({
  visible,
  data,
  onClose,
  onUpdateAndEnable,
  onDisable,
}) => {
  const {
    icon,
    title,
    description,
    isEnabled,
    publishDoc,
    dataType,
    serverConfigJson,
    configParamJson,
    localConfigParamJson,
    isNewVersion,
    author,
    ownedFlag,
    targetType,
  } = data ?? {};

  // 状态管理
  const [configParam, setConfigParam] = useState<ConfigParam[]>([]);
  const [showToolSection, setShowToolSection] = useState(false);
  const [showMcpConfig, setShowMcpConfig] = useState(false);
  const [needUpdateButton, setNeedUpdateButton] = useState(false);
  const [serverConfig, setServerConfig] = useState<string>('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  // 表单实例
  const [form] = Form.useForm();

  // 目标类型信息
  const [targetInfo, setTargetInfo] = useState<TargetInfo>({
    defaultImage: DEFAULT_ICON,
    text: DEFAULT_TEXT,
  });

  // 使用自定义 Hook 处理抽屉打开时的滚动条
  useDrawerScroll(visible);

  // 重置所有状态的函数
  const resetAllStates = useCallback(() => {
    form?.resetFields();
    setShowToolSection(false);
    setShowMcpConfig(false);
    setNeedUpdateButton(false);
    setConfigParam([]);
    setServerConfig('');
    setDisableLoading(false);
    setEnableLoading(false);
  }, [form]);

  // 监听抽屉关闭，重置表单和状态
  useEffect(() => {
    if (!visible) {
      resetAllStates();
    } else {
      // 抽屉打开时，增加渲染key强制重新渲染
      setRenderKey((prev) => prev + 1);
    }
  }, [visible, resetAllStates]);

  // 处理目标类型信息
  useEffect(() => {
    if (!visible) return;

    const type =
      targetType ??
      (dataType === EcosystemDataTypeEnum.MCP
        ? AgentComponentTypeEnum.MCP
        : null);

    if (!type) return;

    const hitInfo = COMPONENT_LIST.find((item: any) => item.type === type);
    setTargetInfo({
      defaultImage: hitInfo?.defaultImage ?? DEFAULT_ICON,
      text: hitInfo?.text ?? DEFAULT_TEXT,
    });
  }, [targetType, dataType, visible]);

  // 处理服务配置
  useEffect(() => {
    if (!visible) return;

    if (serverConfigJson) {
      const configJson = safeParseJSON<McpConfig>(serverConfigJson, {});
      setServerConfig(configJson?.mcpConfig?.serverConfig ?? '');
    }
  }, [serverConfigJson, visible]);

  // 处理配置参数
  useEffect(() => {
    if (!visible) return;

    if (configParamJson) {
      const _configParam = safeParseJSON<ConfigParam[]>(configParamJson, []);

      if (_configParam.length > 0) {
        const localConfigParam = safeParseJSON<ConfigParam[]>(
          localConfigParamJson ?? '[]',
          [],
        );

        const mergedConfigParam = mergeConfigParams(
          _configParam,
          localConfigParam,
        );
        setConfigParam(mergedConfigParam);

        // 使用 setTimeout 确保表单已经渲染完成
        setTimeout(() => {
          form.setFieldsValue(configParamToFormValues(mergedConfigParam));
        }, 100);
      }
    }

    return () => {
      form?.resetFields();
      setConfigParam([]);
    };
  }, [configParamJson, localConfigParamJson, form, visible]);

  // 处理更新按钮状态
  useEffect(() => {
    if (!visible) return;

    if (dataType === EcosystemDataTypeEnum.MCP && isEnabled) {
      setNeedUpdateButton(true);
    } else {
      const shouldShowUpdateButton = !(
        !isNewVersion &&
        isEnabled &&
        !configParam?.length
      );
      setNeedUpdateButton(shouldShowUpdateButton);
    }
  }, [isNewVersion, isEnabled, configParam, visible, dataType]);

  // 关闭处理函数
  const handleClose = useCallback(() => {
    resetAllStates();
    onClose();
  }, [resetAllStates, onClose]);

  // 启用处理函数
  const handleEnable = useCallback(async () => {
    // MCP类型处理
    if (dataType === EcosystemDataTypeEnum.MCP && serverConfigJson) {
      if (!showMcpConfig) {
        setShowMcpConfig(true);
        return false;
      }

      const configJson = safeParseJSON<McpConfig>(serverConfigJson, {});
      if (configJson.mcpConfig) {
        configJson.mcpConfig.serverConfig = serverConfig;
      }

      try {
        return await onUpdateAndEnable?.([], JSON.stringify(configJson));
      } catch (error) {
        console.error('更新MCP配置失败:', error);
        return false;
      }
    }

    // 配置参数处理
    if (configParam && configParam.length > 0) {
      if (!showToolSection) {
        setShowToolSection(true);
        return false;
      }

      try {
        const values = await form.validateFields();
        const updatedConfigParam = configParam.map((item) => ({
          ...item,
          value: values[item.name],
        }));
        return await onUpdateAndEnable?.(updatedConfigParam);
      } catch (error) {
        console.error('更新配置参数失败:', error);
        return false;
      }
    }

    // 默认启用
    return await onUpdateAndEnable?.([]);
  }, [
    dataType,
    serverConfigJson,
    showMcpConfig,
    serverConfig,
    configParam,
    showToolSection,
    form,
    onUpdateAndEnable,
  ]);

  // 停用处理函数
  const handleDisable = useCallback(async () => {
    setDisableLoading(true);
    try {
      await onDisable?.();
    } finally {
      setDisableLoading(false);
    }
  }, [onDisable]);

  // 启用按钮点击处理
  const handleEnableClick = useCallback(async () => {
    setEnableLoading(true);
    try {
      await handleEnable();
    } finally {
      setEnableLoading(false);
    }
  }, [handleEnable]);

  // 计算按钮文本
  const buttonText = useMemo(() => {
    if (isEnabled) {
      return showToolSection || showMcpConfig ? '更新配置' : '更新';
    }
    return showToolSection || showMcpConfig ? '保存配置并启用' : '启用';
  }, [isEnabled, showToolSection, showMcpConfig]);

  // 计算是否显示启用按钮图标
  const shouldShowEnableIcon = useMemo(() => {
    return !isEnabled && !showToolSection;
  }, [isEnabled, showToolSection]);

  // 计算启用按钮提示文本
  const enableButtonTooltip = useMemo(() => {
    return dataType === EcosystemDataTypeEnum.MCP
      ? '启用后将发布到官方服务列表'
      : '启用后将发布到系统广场';
  }, [dataType]);

  // 计算停用按钮提示文本
  const disableButtonTooltip = useMemo(() => {
    if (dataType === EcosystemDataTypeEnum.MCP) {
      return '停用后，官方服务列表中将不可见';
    }
    return `停用后，广场${
      dataType ? ECO_TYPE_TITLE_MAP[dataType] : ''
    }中将不可见`;
  }, [dataType]);

  // 渲染操作按钮
  const renderButton = useCallback(() => {
    if (ownedFlag === EcosystemOwnedFlagEnum.YES) {
      return null;
    }

    return (
      <>
        {/* 如果需要更新，则显示更新按钮 */}
        {needUpdateButton && (
          <Button
            type="primary"
            className={cx(styles.actionButton)}
            size="large"
            onClick={handleEnableClick}
            loading={enableLoading}
            iconPosition="end"
            icon={
              shouldShowEnableIcon ? (
                <Tooltip title={enableButtonTooltip}>
                  <InfoCircleOutlined />
                </Tooltip>
              ) : null
            }
          >
            {buttonText}
          </Button>
        )}
        {/* 如果当前状态是启用，则显示停用按钮 */}
        {isEnabled && (
          <Button
            className={cx(styles.actionButton)}
            size="large"
            loading={disableLoading}
            onClick={handleDisable}
            iconPosition="end"
            icon={
              <Tooltip title={disableButtonTooltip}>
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            停用
          </Button>
        )}
      </>
    );
  }, [
    ownedFlag,
    needUpdateButton,
    handleEnableClick,
    enableLoading,
    shouldShowEnableIcon,
    enableButtonTooltip,
    buttonText,
    isEnabled,
    disableLoading,
    handleDisable,
    disableButtonTooltip,
  ]);

  // 渲染表单字段
  const renderFormFields = useCallback(() => {
    if (!configParam || configParam.length === 0) return null;

    return (
      <Form key={`form-${renderKey}`} form={form} layout="vertical">
        {configParam.map((item) => (
          <Form.Item
            key={`${item.name}-${renderKey}`}
            label={item.name}
            name={item.name}
            tooltip={item.description}
            rules={[{ required: true, message: `请输入${item.name}` }]}
          >
            <Input placeholder={`请输入${item.name}`} />
          </Form.Item>
        ))}
      </Form>
    );
  }, [configParam, renderKey, form]);

  // 渲染MCP配置
  const renderMcpConfig = useCallback(() => {
    if (dataType !== EcosystemDataTypeEnum.MCP || !serverConfig) return null;

    return (
      <div
        className={cx(
          styles.toolSection,
          showMcpConfig && styles.enabledToolSection,
        )}
      >
        <CodeEditor
          key={`code-editor-${renderKey}`}
          codeLanguage={CodeLangEnum.JSON}
          value={serverConfig}
          onChange={setServerConfig}
          codeOptimizeVisible={false}
          height="200px"
        />
      </div>
    );
  }, [dataType, serverConfig, showMcpConfig, renderKey]);

  // 渲染工具列表
  const renderToolSection = useCallback(() => {
    if (!configParam || configParam.length === 0) return null;

    return (
      <div
        className={cx(
          styles.toolSection,
          showToolSection && styles.enabledToolSection,
        )}
      >
        {renderFormFields()}
      </div>
    );
  }, [configParam, showToolSection, renderFormFields]);

  // 渲染抽屉头部
  const renderDrawerHeader = useCallback(
    () => (
      <div className={cx(styles.drawerHeader)}>
        <div className={cx(styles.titleArea)}>
          <div className={cx(styles.iconWrapper)}>
            <img
              src={icon ?? targetInfo.defaultImage}
              alt={title}
              className={cx(styles.icon)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = targetInfo.defaultImage;
              }}
            />
            {isEnabled && <ActivatedIcon size={30} />}
          </div>
          <div className={cx(styles.titleContent)}>
            <Title level={5} className={cx(styles.title)}>
              {title}
              {isNewVersion && (
                <span className={cx(styles.newVersion)}>新版本更新</span>
              )}
            </Title>
            <div className={cx(styles.subtitle)}>来自{author}</div>
          </div>
        </div>
        {/* 关闭按钮 */}
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          className={cx(styles.closeButton)}
        />
      </div>
    ),
    [icon, targetInfo, title, isEnabled, isNewVersion, author, handleClose],
  );

  // 渲染抽屉内容
  const renderDrawerContent = useCallback(
    () => (
      <div className={cx(styles.content, 'scroll-container')}>
        <Paragraph className={cx(styles.description)}>{description}</Paragraph>

        <Divider className={cx(styles.divider)} />

        <div className={cx(styles.section)}>
          <Title level={5} className={cx(styles.sectionTitle)}>
            使用文档
          </Title>
          <PureMarkdownRenderer id={`${title}`}>
            {publishDoc ? encodeHTML(publishDoc) : ''}
          </PureMarkdownRenderer>
        </div>
      </div>
    ),
    [description, title, publishDoc],
  );

  if (!data) return null;

  return (
    <Drawer
      key={renderKey}
      placement="right"
      open={visible}
      width={400}
      closeIcon={false}
      onClose={handleClose}
      className={cx(styles.pluginDetailDrawer)}
      maskClassName={cx(styles.resetMask)}
      rootClassName={cx(styles.resetRoot)}
      destroyOnHidden={true}
    >
      {/* 抽屉头部 */}
      {renderDrawerHeader()}

      {/* 抽屉内容 */}
      {renderDrawerContent()}

      {/* 工具列表 */}
      {renderToolSection()}

      {/* MCP配置 */}
      {renderMcpConfig()}

      {/* 操作按钮 */}
      <div className={cx(styles.actions)}>{renderButton()}</div>
    </Drawer>
  );
};

export default EcosystemDetailDrawer;
export type { EcosystemDetailDrawerData };
