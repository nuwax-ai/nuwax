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
import React, { useEffect, useState } from 'react';
import ActivatedIcon from '../EcosystemCard/ActivatedIcon';
import styles from './index.less';
const cx = classNames.bind(styles);
const { Title, Paragraph } = Typography;

export interface EcosystemDetailDrawerProps {
  /** 是否显示抽屉 */
  visible: boolean;
  /** 插件详情数据 */
  plugin?: any;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 更新配置并启用回调 */
  onUpdateAndEnable?: (values: any) => void;
  /** 停用回调 */
  onDisable?: () => void;
}

/**
 * 插件详情抽屉组件
 * 右侧划出的插件详情展示
 */
const EcosystemDetailDrawer: React.FC<EcosystemDetailDrawerProps> = ({
  visible,
  plugin,
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
    configParamJson,
    localConfigParamJson,
    isNewVersion,
    author,
  } = plugin || {};
  const [configParam, setConfigParam] = useState<any>([]);
  const [showToolSection, setShowToolSection] = useState(false);
  const [needUpdateButton, setNeedUpdateButton] = useState(false);
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
    if (visible && plugin?.configParamJson) {
      try {
        const configParams = JSON.parse(plugin.configParamJson);
        form.setFieldsValue(configParams);
      } catch (error) {
        console.error('解析配置参数失败:', error);
      }
    }
  }, [visible, plugin, form]);

  const handleClose = () => {
    form.resetFields(); // 关闭时重置表单
    onClose();
    setConfigParam([]);
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
  const handleEnable = () => {
    if (configParam && configParam.length > 0) {
      if (!showToolSection) {
        setShowToolSection(true);
        return;
      }
      form.validateFields().then((values) => {
        console.log(values);
        onUpdateAndEnable?.(
          configParam.map((item: any) => ({
            ...item,
            value: values[item.name],
          })),
        );
      });
    } else {
      onUpdateAndEnable?.([]);
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

  if (!plugin) return null;

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
      <div className={cx(styles.drawerHeader)}>
        <div className={cx(styles.titleArea)}>
          <div className={cx(styles.iconWrapper)}>
            <img src={icon} alt={title} className={cx(styles.icon)} />
            {isEnabled && <ActivatedIcon enabled={isEnabled} />}
          </div>
          <div className={cx(styles.titleContent)}>
            <Title level={5} className={cx(styles.title)}>
              {title}
              {isNewVersion && (
                <span className={cx(styles.newVersion)}>新版本更新</span>
              )}
            </Title>
            <div className={cx(styles.subtitle)}>{author}</div>
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={handleClose}
          className={cx(styles.closeButton)}
        />
      </div>

      <div className={cx(styles.content)}>
        <Paragraph className={cx(styles.description)}>{description}</Paragraph>

        <Divider className={cx(styles.divider)} />

        <div className={cx(styles.section)}>
          <Title level={5} className={cx(styles.sectionTitle)}>
            使用文档
          </Title>
          <Paragraph className={cx(styles.docContent)}>{publishDoc}</Paragraph>
        </div>
      </div>
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
      <div className={cx(styles.actions)}>
        {needUpdateButton && (
          <Button
            type="primary"
            className={cx(styles.actionButton)}
            size="large"
            onClick={handleEnable}
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
        {isEnabled && (
          <Button
            className={cx(styles.actionButton)}
            size="large"
            onClick={onDisable}
            iconPosition="end"
            icon={
              <Tooltip title="停用">
                <InfoCircleOutlined />
              </Tooltip>
            }
          >
            停用
          </Button>
        )}
      </div>
    </Drawer>
  );
};

export default EcosystemDetailDrawer;
