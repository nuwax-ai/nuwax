import { COMPONENT_LIST } from '@/constants/ecosystem.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
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
  data?: EcosystemDetailDrawerData;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 更新配置并启用回调 */
  onUpdateAndEnable?: (values: any) => Promise<boolean>;
  /** 停用回调 */
  onDisable?: () => Promise<boolean>;
}

enum OwnedFlagEnum {
  NO = 0,
  YES = 1,
}

export interface EcosystemDetailDrawerData {
  /** 插件图标URL */
  icon: string;
  /** 插件作者 */
  author: string;
  /** 插件标题 */
  title: string;
  /** 插件描述 */
  description: string;
  /** 自定义类名 */
  className?: string;
  /** 是否启用 */
  isEnabled?: boolean;
  /** 使用文档 */
  publishDoc?: string;
  /** 是否是新版本 */
  isNewVersion?: boolean;
  /** 配置信息 */
  configParamJson: string;
  /** 本地配置信息(之前 版本) */
  localConfigParamJson?: string;
  /** 是否我的分享,0:否(生态市场获取的);1:是(我的分享)*/
  ownedFlag?: OwnedFlagEnum;
  /** 组件类型 */
  targetType: AgentComponentTypeEnum;
}

const DEFAULT_ICON =
  'https://agent-1251073634.cos.ap-chengdu.myqcloud.com/store/b5fdb62e8b994a418d0fdfae723ee827.png';
const DEFAULT_TEXT = '插件';
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
  const [targetInfo, setTargetInfo] = useState<any>({
    icon: DEFAULT_ICON,
    text: DEFAULT_TEXT,
  });
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
    if (targetType) {
      const hitInfo = COMPONENT_LIST.find(
        (item: any) => item.type === targetType,
      );
      setTargetInfo({
        icon: icon || hitInfo?.defaultImage,
        text: hitInfo?.text || DEFAULT_TEXT,
      });
    }
    return () => {
      setTargetInfo({
        icon: DEFAULT_ICON,
        text: DEFAULT_TEXT,
      });
    };
  }, [icon, targetType]);

  useEffect(() => {
    //fix: 打开抽屉时，隐藏横向滚动条
    if (visible) {
      document.body.style.overflowX = 'hidden';
    } else {
      document.body.style.overflowX = '';
    }
    return () => {
      document.body.style.overflowX = '';
    };
  }, [visible]);

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
            onClick={handleEnable}
            iconPosition="end"
            icon={
              !isEnabled && !showToolSection ? (
                <Tooltip title="启用后将发布到系统广场">
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
        {isEnabled && (
          <Button
            className={cx(styles.actionButton)}
            size="large"
            onClick={onDisable}
            iconPosition="end"
            icon={
              <Tooltip title={`停用后，广场${targetInfo.text}中将不可见`}>
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
      <div className={cx(styles.drawerHeader)}>
        <div className={cx(styles.titleArea)}>
          <div className={cx(styles.iconWrapper)}>
            <img
              src={targetInfo.icon}
              alt={title}
              className={cx(styles.icon)}
            />
            {isEnabled && <ActivatedIcon size={30} enabled={isEnabled} />}
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
      <div className={cx(styles.actions)}>{renderButton()}</div>
    </Drawer>
  );
};

export default EcosystemDetailDrawer;
