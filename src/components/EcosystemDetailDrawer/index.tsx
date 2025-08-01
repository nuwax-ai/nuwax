import copyImage from '@/assets/images/copy.png';
import { COMPONENT_LIST } from '@/constants/ecosystem.constants';
import useDrawerScroll from '@/hooks/useDrawerScroll';
import { CloseOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Tooltip,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import ActivatedIcon from '../EcosystemCard/ActivatedIcon';
import styles from './index.less';
// 方程式支持
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  EcosystemDataTypeEnum,
  EcosystemDetailDrawerProps,
} from '@/types/interfaces/ecosystem';
import { encodeHTML } from '@/utils/common';
import CopyToClipboard from 'react-copy-to-clipboard';
import { PureMarkdownRenderer } from '../MarkdownRenderer';
import TooltipIcon from '../TooltipIcon';

const cx = classNames.bind(styles);

const { Title, Paragraph } = Typography;

enum OwnedFlagEnum {
  NO = 0,
  YES = 1,
}

const DEFAULT_ICON =
  'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png';
const DEFAULT_TEXT = '插件';

// const md = markdownIt({
//   html: true, // 启用原始HTML解析
//   xhtmlOut: true, // 使用 XHTML 兼容语法
//   breaks: true, // 换行转换为 <br>
//   linkify: true, // 自动识别链接
//   typographer: true, // 优化排版
//   quotes: '""\'\'', // 双引号和单引号都不替换
// });

// // html自定义转义
// md.renderer.rules.html_block = (tokens, idx) => {
//   return encodeHTML(tokens[idx].content);
// };

// // 添加 KaTeX 支持
// md.use(markdownItKatexGpt, {
//   delimiters: [
//     { left: '\\[', right: '\\]', display: true },
//     { left: '\\(', right: '\\)', display: false },
//     { left: '$$', right: '$$', display: false },
//   ],
// });

// // 添加表格支持
// md.use(markdownItMultimdTable, {
//   multiline: true,
//   rowspan: true,
//   headerless: false,
//   multibody: true,
//   aotolabel: true,
// });

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
    configJson,
    configParamJson,
    localConfigParamJson,
    isNewVersion,
    author,
    ownedFlag,
    targetType,
  } = data || {};
  const [configParam, setConfigParam] = useState<any>([]);
  const [showToolSection, setShowToolSection] = useState(false);
  const [needUpdateButton, setNeedUpdateButton] = useState(false);
  const [targetInfo, setTargetInfo] = useState<{
    defaultImage: string;
    text: string;
  }>({
    defaultImage: DEFAULT_ICON,
    text: DEFAULT_TEXT,
  });
  // MCP服务配置
  const [serverConfig, setServerConfig] = useState<string>('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [enableLoading, setEnableLoading] = useState(false);
  const [form] = Form.useForm();

  // 监听抽屉关闭，重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setShowToolSection(false);
      setNeedUpdateButton(false);
    }
  }, [visible, form]);

  // 监听插件数据变化，设置表单初始值
  useEffect(() => {
    if (visible && data?.configParamJson) {
      try {
        const configParams = JSON.parse(data.configParamJson);
        form.setFieldsValue(configParams);
      } catch (error) {
        console.error('解析配置参数失败:', error);
      }
    }
  }, [visible, data, form]);

  useEffect(() => {
    // 如果targetType为空，则根据dataType判断，因为dataType为MCP时，targetType可能为空
    const type =
      targetType ||
      (dataType === EcosystemDataTypeEnum.MCP
        ? AgentComponentTypeEnum.MCP
        : null);
    if (!type) {
      return;
    }
    const hitInfo = COMPONENT_LIST.find((item: any) => item.type === type);
    setTargetInfo({
      defaultImage: hitInfo?.defaultImage || DEFAULT_ICON,
      text: hitInfo?.text || DEFAULT_TEXT,
    });
  }, [targetType, dataType]);

  useEffect(() => {
    if (configJson) {
      try {
        const _configJson = JSON.parse(configJson);
        setServerConfig(_configJson?.mcpConfig?.serverConfig || '');
      } catch (error) {
        console.error('解析配置失败:', error);
      }
    }
  }, [configJson]);

  // 使用自定义 Hook 处理抽屉打开时的滚动条
  useDrawerScroll(visible);

  const handleClose = () => {
    form.resetFields(); // 关闭时重置表单
    setConfigParam([]);
    onClose();
  };

  useEffect(() => {
    if (configParamJson) {
      const configParam = JSON.parse(configParamJson);
      if (configParam.length > 0) {
        // 如果localConfigParamJson 内的value merge configParam 内的value
        const localConfigParam = JSON.parse(localConfigParamJson || '[]');
        const mergedConfigParam = configParam.map((item: any) => {
          const localItem = localConfigParam.find(
            (localItem: any) => localItem.name === item.name,
          );
          return {
            ...item,
            value: localItem?.value || item.value,
          };
        });
        setConfigParam(mergedConfigParam);
        form.resetFields();
        form.setFieldsValue(
          mergedConfigParam.reduce((acc: any, item: any) => {
            acc[item.name] = item.value;
            return acc;
          }, {}),
        );
      }
    }
    return () => {
      form?.resetFields();
      setConfigParam([]);
    };
  }, [configParamJson]);
  const handleEnable = async () => {
    if (configParam && configParam.length > 0) {
      if (!showToolSection) {
        setShowToolSection(true);
        return false;
      }
      try {
        const values = await form.validateFields();
        const result = await onUpdateAndEnable?.(
          configParam.map((item: any) => ({
            ...item,
            value: values[item.name],
          })),
        );
        return result;
      } catch (error) {
        console.error('更新配置失败:', error);
      }
      return false;
    } else {
      const result = await onUpdateAndEnable?.([]);
      return result;
    }
  };
  useEffect(() => {
    if (!isNewVersion && isEnabled && !configParam?.length) {
      //没有新版本，且已启用，且没有配置参数
      setNeedUpdateButton(false);
    } else {
      setNeedUpdateButton(true);
    }
    return () => {
      setNeedUpdateButton(false);
    };
  }, [isNewVersion, isEnabled, configParam]);

  if (!data) return null;
  const renderButton = () => {
    if (ownedFlag === OwnedFlagEnum.YES) {
      return <></>;
    }
    return (
      <>
        {needUpdateButton && (
          <Button
            type="primary"
            className={cx(styles.actionButton)}
            size="large"
            onClick={() => {
              setEnableLoading(true);
              handleEnable().finally(() => {
                setEnableLoading(false);
              });
            }}
            loading={enableLoading}
            iconPosition="end"
            icon={
              !isEnabled && !showToolSection ? (
                <Tooltip
                  title={
                    dataType === EcosystemDataTypeEnum.MCP
                      ? `启用后将发布到官方服务列表`
                      : `启用后将发布到系统广场`
                  }
                >
                  <InfoCircleOutlined />
                </Tooltip>
              ) : null
            }
          >
            {isEnabled
              ? showToolSection
                ? '更新配置'
                : '更新'
              : showToolSection
              ? '保存配置并启用'
              : '启用'}
          </Button>
        )}
        {/* 如果当前状态是启用，则显示停用按钮 */}
        {isEnabled && (
          <Button
            className={cx(styles.actionButton)}
            size="large"
            loading={disableLoading}
            onClick={() => {
              setDisableLoading(true);
              onDisable?.().finally(() => {
                setDisableLoading(false);
              });
            }}
            iconPosition="end"
            icon={
              <Tooltip
                title={
                  dataType === EcosystemDataTypeEnum.MCP
                    ? `停用后，官方服务列表中将不可见`
                    : `停用后，广场${targetInfo.text}中将不可见`
                }
              >
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            停用
          </Button>
        )}
      </>
    );
  };

  return (
    <Drawer
      placement="right"
      open={visible}
      width={400}
      closeIcon={false}
      onClose={handleClose}
      className={cx(styles.pluginDetailDrawer)}
      maskClassName={cx(styles.resetMask)}
      rootClassName={cx(styles.resetRoot)}
    >
      {/* 抽屉头部 */}
      <div className={cx(styles.drawerHeader)}>
        <div className={cx(styles.titleArea)}>
          <div className={cx(styles.iconWrapper)}>
            <img
              src={icon || targetInfo.defaultImage}
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
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          className={cx(styles.closeButton)}
        />
      </div>
      {/* 抽屉内容 */}
      <div className={cx(styles.content)}>
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
      {/* 工具列表 */}
      <div
        className={cx(
          styles.toolSection,
          showToolSection && styles.enabledToolSection,
        )}
      >
        {/* 这部分可以根据实际需求自定义，截图中显示的是一个工具列表 */}
        {configParam && configParam.length > 0 && (
          <Form form={form} layout="vertical">
            {configParam.map((item: any) => (
              <Form.Item
                key={item.name}
                label={item.name}
                name={item.name}
                tooltip={item.description}
                rules={[{ required: true, message: '请输入' + item.name }]}
              >
                <Input placeholder={'请输入' + item.name} />
              </Form.Item>
            ))}
          </Form>
        )}
      </div>
      {/* 如果是MCP，则显示服务配置 */}
      {serverConfig && (
        <div className={cx(styles['server-config-wrapper'])}>
          <CopyToClipboard
            text={serverConfig}
            onCopy={() => {
              message.success('复制成功');
            }}
          >
            <TooltipIcon
              title="复制"
              icon={
                <img className={styles['copy-img']} src={copyImage} alt="" />
              }
              className={styles['copy-box']}
            />
          </CopyToClipboard>
          <pre className={cx(styles['server-config'])}>{serverConfig}</pre>
        </div>
      )}
      {/* 操作按钮 */}
      <div className={cx(styles.actions)}>{renderButton()}</div>
    </Drawer>
  );
};

export default EcosystemDetailDrawer;
