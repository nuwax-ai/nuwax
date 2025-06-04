import { SkillList } from '@/components/Skill';
import { COMPONENT_LIST } from '@/constants/ecosystem.constants';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  apiPublishedPluginInfo,
  apiPublishedWorkflowInfo,
} from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { BindConfigWithSub } from '@/types/interfaces/agent';
import {
  EcosystemDataTypeEnum,
  EcosystemShareStatusEnum,
} from '@/types/interfaces/ecosystem';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Checkbox,
  Form,
  Input,
  Modal,
  Popover,
  Space,
  Table,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);
export interface PluginParam {
  name: string;
  description: string;
  value: string;
}

export interface EcosystemShareModalProps {
  type: EcosystemDataTypeEnum;
  targetType: AgentComponentTypeEnum;
  visible: boolean;
  isEdit?: boolean;
  onClose: () => void;
  onSave: (values: any, isDraft: boolean) => Promise<boolean>;
  onAddComponent: () => void;
  onRemoveComponent: () => void;
  onOffline: (uid: string) => Promise<boolean>;
  data?: EcosystemShareModalData | null;
}

export interface EcosystemShareModalData {
  uid?: string;
  name?: string;
  description?: string;
  targetType: AgentComponentTypeEnum;
  targetId: string;
  categoryCode?: string;
  categoryName?: string;
  author?: string;
  publishDoc?: string;
  configParamJson?: string;
  shareStatus?: EcosystemShareStatusEnum;
  icon?: string;
}

const addParentName = (inputArgs: any[]): any[] => {
  return inputArgs.map((item) => {
    if (item.subArgs?.length > 0) {
      return {
        ...item,
        parentName: item.name,
        subArgs: addParentName(item.subArgs),
      };
    }
    return item;
  });
};

const setFullName = (parentName: string, inputArgs: any[]): any[] => {
  return inputArgs.map((item) => {
    if (item.subArgs?.length > 0) {
      const fullName = parentName ? parentName + '.' + item.name : item.name;
      return {
        ...item,
        fullName,
        subArgs: setFullName(fullName, item.subArgs),
      };
    }
    return {
      ...item,
      fullName: parentName ? parentName + '.' + item.name : item.name,
    };
  });
};

const EcosystemShareModal: React.FC<EcosystemShareModalProps> = ({
  type,
  targetType,
  visible,
  isEdit = false,
  onClose,
  onSave,
  onAddComponent,
  onOffline,
  onRemoveComponent,
  data,
}) => {
  const isPlugin = type === EcosystemDataTypeEnum.PLUGIN;
  const [form] = Form.useForm();
  const [configParam, setConfigParam] = useState<PluginParam[]>([]);
  const [suffixInfo, setSuffixInfo] = useState<any>({
    name: '插件',
    targetType: AgentComponentTypeEnum.Plugin,
  });
  const [disabledSkill, setDisabledSkill] = useState(false);
  const getDetailApi = (targetType: string | undefined) => {
    if (targetType === AgentComponentTypeEnum.Plugin) {
      return apiPublishedPluginInfo;
    }
    if (targetType === AgentComponentTypeEnum.Agent) {
      return apiPublishedAgentInfo;
    }
    if (targetType === AgentComponentTypeEnum.Workflow) {
      return apiPublishedWorkflowInfo;
    }
    return apiPublishedWorkflowInfo;
  };

  const { run: runGetDetail, data: detail } = useRequest(
    getDetailApi(targetType),
    {
      manual: true,
      debounceInterval: 300,
    },
  );

  const [tableData, setTableData] = useState<any[]>([]);

  // 完整的重置函数
  const handleReset = () => {
    form?.resetFields();
    setTableData([]);
    setConfigParam([]);
  };

  // 监听弹窗显示状态变化
  useEffect(() => {
    if (visible && data) {
      // 初始化表单数据
      form.setFieldsValue({
        uid: data.uid,
        plugin: {
          name: data.name,
          description: data.description,
          targetType: data.targetType,
          targetId: data.targetId,
          icon: data.icon,
        },
        author: data.author,
        publishDoc: data.publishDoc,
      });
      if (data.configParamJson) {
        try {
          const parsedConfig = JSON.parse(data.configParamJson);
          setConfigParam(
            parsedConfig.map((item: any) => ({
              name: item.name,
              description: item.description,
              value: item.value || '',
            })),
          );
        } catch (error) {
          console.error('解析配置参数失败:', error);
          setConfigParam([]);
        }
      }
    }
    return () => {
      handleReset();
    };
  }, [visible, data, form]);

  useEffect(() => {
    if (targetType && visible) {
      setSuffixInfo({
        name: COMPONENT_LIST.find((item: any) => item.type === targetType)
          ?.text,
        targetType,
      });
    }
  }, [targetType, visible]);

  const handleClose = () => {
    // 关闭前立即清除数据
    handleReset();
    onClose();
  };

  const handleSave = async (isDraft: boolean) => {
    try {
      const values = await form.validateFields();
      const { plugin, ...rest } = values;
      const result = await onSave(
        {
          ...rest,
          ...plugin,
          categoryCode: detail?.category,
          categoryName: detail?.category,
          configParamJson: JSON.stringify(configParam),
        },
        isDraft,
      );
      if (result) {
        handleClose();
      }
    } catch (error) {
      console.log('保存失败', error);
    }
  };

  const handleOffline = async (uid: string) => {
    if (uid) {
      const result = await onOffline(uid);
      if (result) {
        handleClose();
      }
      return result;
    }
  };

  // 入参配置columns
  const inputColumns: any = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '启用必填',
      dataIndex: 'value',
      key: 'value',
      width: '20%',
      render: (_: any, record: any) => {
        // 仅在末级节点展示
        if (record?.subArgs?.length > 0) {
          return null;
        }
        const required = configParam.some(
          (item) => record.fullName === item.name,
        );
        return (
          <Checkbox
            checked={required}
            onChange={() => {
              // 勾选 取消 同步到 configParam
              let newParam = [...configParam];
              const hasItem = newParam.some((item) => {
                return record.fullName === item.name;
              });
              //如果item不存在，则新增
              if (!hasItem) {
                newParam.push({
                  name: record.fullName,
                  description: record.description,
                  value: '',
                });
              } else {
                // 直接删除
                newParam = newParam.filter((item) => {
                  return item.name !== record.fullName;
                });
              }
              setConfigParam(newParam);
            }}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (visible && data?.targetId) {
      runGetDetail(data?.targetId);
    }
  }, [visible, data?.targetId, runGetDetail]);

  useEffect(() => {
    if (detail) {
      setTableData(setFullName('', addParentName(detail?.inputArgs || [])));
    }
  }, [detail]);

  useEffect(() => {
    if (configParam.length > 0 && tableData.length > 0) {
      // 校验一下数据在tableData中是否存在 如果不存在要删除
      const newConfigParam = configParam.filter((item) => {
        return tableData.some((tableItem) => tableItem.fullName === item.name);
      });
      setConfigParam(newConfigParam);
    }
  }, [tableData, configParam]);

  const renderActionButton = (data?: EcosystemShareModalData | null) => {
    if (!data) {
      return (
        <Space>
          <Button onClick={handleClose}>取消</Button>
          <Button type="primary" onClick={() => handleSave(false)}>
            保存并发布分享
          </Button>
        </Space>
      );
    }

    const isPublished = data.shareStatus === EcosystemShareStatusEnum.PUBLISHED;
    const isDraft = data.shareStatus === EcosystemShareStatusEnum.DRAFT;

    return (
      <Space>
        <Button onClick={handleClose}>取消</Button>
        {isEdit && isPublished && (
          <Button
            onClick={() => {
              handleOffline(data.uid);
            }}
          >
            下线
          </Button>
        )}
        {isDraft && <Button onClick={() => handleSave(true)}>保存草稿</Button>}
        <Button type="primary" onClick={() => handleSave(false)}>
          保存并发布分享
        </Button>
      </Space>
    );
  };

  useEffect(() => {
    setDisabledSkill(isEdit);
    return () => {
      setDisabledSkill(false);
    };
  }, [isEdit]);

  return (
    <Modal
      title={
        <div className={cx(styles.modalTitle)}>
          {isEdit ? '编辑分享' : '创建分享'}
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={720}
      footer={null}
      className={cx(styles.pluginShareModal)}
    >
      <div className={cx(styles.modalContent)}>
        <Form form={form} layout="vertical" className={cx(styles.form)}>
          <div className={cx(styles.section)}>
            <div
              className={cx(styles.sectionTitle)}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <div>{`${suffixInfo.name}信息`}</div>
              {!disabledSkill && (
                <Popover
                  content={<div>添加{suffixInfo.name}</div>}
                  trigger="hover"
                >
                  <Button
                    type="text"
                    size="small"
                    style={{ marginLeft: 10 }}
                    icon={<PlusOutlined />}
                    onClick={() => {
                      onAddComponent();
                    }}
                  />
                </Popover>
              )}
            </div>
            {isEdit && (
              <Form.Item name="uid" hidden>
                <Input type="hidden" />
              </Form.Item>
            )}
            {/* 隐藏的表单项用于存储 plugin 值 */}
            <Form.Item
              name="plugin"
              rules={[{ required: true, message: `请选择${suffixInfo.name}` }]}
              hidden
            >
              <Input type="hidden" />
            </Form.Item>

            {/* 展示组件，使用 shouldUpdate 监听变化 */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => {
                return prevValues.plugin !== currentValues.plugin;
              }}
            >
              {({ getFieldValue }) => {
                const pluginValue = getFieldValue('plugin');
                if (!pluginValue) {
                  return (
                    <div
                      className={cx(styles.pluginItemStyle)}
                      onClick={() => {
                        onAddComponent();
                      }}
                    >
                      {`请先选择${suffixInfo.name}`}
                    </div>
                  );
                }
                return (
                  <div className={cx(styles.pluginItemStyle)}>
                    <SkillList
                      params={[
                        {
                          name: pluginValue.name || '',
                          description: pluginValue.description || '',
                          icon: pluginValue.icon,
                          targetId: pluginValue.targetId || '',
                          targetType: pluginValue.targetType || '',
                          type: pluginValue.targetType,
                          statistics: null,
                        },
                      ]}
                      disabled={disabledSkill}
                      skillName={'skillComponentConfigs'}
                      form={form}
                      removeItem={onRemoveComponent}
                      modifyItem={() => {}}
                    />
                  </div>
                );
              }}
            </Form.Item>
          </div>

          <div className={cx(styles.section)}>
            <div className={cx(styles.sectionTitle)}>发布者信息</div>
            <Form.Item
              name="author"
              rules={[{ required: true, message: '请输入发布者信息' }]}
            >
              <Input
                placeholder="请输入发布者信息，比如：女娲官方"
                maxLength={30}
                showCount
              />
            </Form.Item>
          </div>
          {isPlugin && (
            <div className={cx(styles.section)}>
              <div className={cx(styles.sectionTitle)}>插件参数</div>
              <Table<BindConfigWithSub>
                className={cx(styles['table-wrap'], 'overflow-hide')}
                columns={inputColumns}
                dataSource={tableData}
                pagination={false}
                scroll={{ x: 670, y: 55 * 3 }}
                expandable={{
                  defaultExpandAllRows: true,
                }}
              />
            </div>
          )}

          <div className={cx(styles.section)}>
            <div className={cx(styles.sectionTitle)}>使用文档</div>
            <Form.Item
              name="publishDoc"
              rules={[{ required: true, message: '请输入使用文档' }]}
            >
              <Input.TextArea
                placeholder="请输入使用文档，支持markdown格式"
                autoSize={{ minRows: 3, maxRows: 5 }}
                className={cx(styles.docTextarea)}
              />
            </Form.Item>
          </div>
        </Form>

        <div className={cx(styles.footer)}>{renderActionButton(data)}</div>
      </div>
    </Modal>
  );
};

export default EcosystemShareModal;
