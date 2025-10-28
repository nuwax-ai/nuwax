import { SkillList } from '@/components/Skill';
import { COMPONENT_LIST } from '@/constants/ecosystem.constants';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  apiPublishedPluginInfo,
  apiPublishedWorkflowInfo,
} from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { BindConfigWithSub, CreatedNodeItem } from '@/types/interfaces/common';
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  onWithdraw: (uid: string) => Promise<boolean>;
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
  onWithdraw,
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
  const [pluginError, setPluginError] = useState(false);
  const [disabledSkill, setDisabledSkill] = useState(false);

  // 使用 useRef 保存当前的 configParam，避免依赖循环
  const configParamRef = useRef<PluginParam[]>([]);

  // 同步 configParam 到 ref
  useEffect(() => {
    configParamRef.current = configParam;
  }, [configParam]);

  const getDetailApi = useCallback(() => {
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
  }, [targetType]);

  const { run: runGetDetail, data: detail } = useRequest(getDetailApi(), {
    manual: true,
    debounceInterval: 300,
  });

  const [tableData, setTableData] = useState<any[]>([]);

  // 完整的重置函数
  const handleReset = useCallback(() => {
    form?.resetFields();
    setTableData([]);
    setConfigParam([]);
  }, [form]);

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
  }, [visible, data, form, handleReset]);

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
    } catch (error: any) {
      const hasPluginError =
        error?.errorFields?.some((item: any) => item.name.includes('plugin')) ||
        false;
      setPluginError(hasPluginError);
    }
  };

  const handleOffline = async (uid: string) => {
    const result = await onOffline(uid);
    if (result) {
      handleClose();
    }
    return result;
  };

  const handleWithdraw = async (uid: string) => {
    const result = await onWithdraw(uid);
    if (result) {
      handleClose();
    }
    return result;
  };

  // 入参配置columns
  const inputColumns: any = [
    {
      title: '参数名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
      ellipsis: {
        showTitle: true,
      },
    },
    {
      title: '参数描述',
      dataIndex: 'description',
      key: 'description',
      width: '50%',
      ellipsis: {
        showTitle: true,
      },
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
        // 直接使用 configParam 而不是 configParamRef.current
        const required = configParam.some(
          (item) => record.fullName === item.name,
        );
        return (
          <Checkbox
            checked={required}
            style={{ fontSize: 12 }}
            onChange={() => {
              // 勾选 取消 同步到 configParam
              let newParam = [...configParam]; // 使用当前状态而不是 ref
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
      const newTableData = setFullName(
        '',
        addParentName(detail?.inputArgs || []),
      );
      setTableData(newTableData);
    }
  }, [detail]);

  // 修复这个 useEffect，避免依赖循环
  useEffect(() => {
    if (tableData.length > 0 && configParamRef.current.length > 0) {
      // 使用 ref 读取当前值，避免依赖循环
      const currentConfigParam = configParamRef.current;

      // 过滤出在 tableData 中存在的配置项
      const newConfigParam = currentConfigParam.filter((item) => {
        return tableData.some((tableItem) => tableItem.fullName === item.name);
      });

      // 只有当数据真正变化时才更新状态
      if (
        JSON.stringify(newConfigParam) !== JSON.stringify(currentConfigParam)
      ) {
        setConfigParam(newConfigParam);
      }
    }
  }, [tableData]); // 只依赖 tableData

  const renderActionButton = useCallback(
    (data?: EcosystemShareModalData | null) => {
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

      const isPublished =
        data.shareStatus === EcosystemShareStatusEnum.PUBLISHED;
      const isReviewing =
        data.shareStatus === EcosystemShareStatusEnum.REVIEWING;
      const isDraft = data.shareStatus === EcosystemShareStatusEnum.DRAFT;

      return (
        <Space>
          <Button onClick={handleClose}>取消</Button>
          {isEdit && (isPublished || isReviewing) && (
            <Button
              onClick={() => {
                if (data.uid) {
                  // 修复类型错误
                  handleOffline(data.uid);
                }
              }}
            >
              下线
            </Button>
          )}
          {isEdit && isReviewing && (
            <Button
              onClick={() => {
                if (data.uid) {
                  // 修复类型错误
                  handleWithdraw(data.uid);
                }
              }}
            >
              撤销发布
            </Button>
          )}
          {isDraft && (
            <Button onClick={() => handleSave(true)}>保存草稿</Button>
          )}
          <Button type="primary" onClick={() => handleSave(false)}>
            保存并发布分享
          </Button>
        </Space>
      );
    },
    [handleClose, handleSave, isEdit, handleOffline],
  );

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
      centered
      open={visible}
      onCancel={handleClose}
      width={720}
      footer={null}
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
                    <>
                      <div
                        className={cx(styles.pluginItemStyle)}
                        style={{ marginBottom: pluginError ? 0 : 24 }}
                        onClick={() => {
                          onAddComponent();
                        }}
                      >
                        {`请先选择${suffixInfo.name}`}
                      </div>
                      {pluginError && (
                        <div
                          className={cx(styles.pluginError)}
                          style={{ marginBottom: 24 }}
                        >
                          请先选择{suffixInfo.name}
                        </div>
                      )}
                    </>
                  );
                }
                return (
                  <div
                    key={`skill-list-${pluginValue.targetId || Date.now()}`}
                    style={{ marginBottom: 24 }}
                  >
                    <SkillList
                      params={[
                        {
                          name: pluginValue.name || '',
                          description: pluginValue.description || '',
                          icon:
                            pluginValue.icon ||
                            COMPONENT_LIST.find(
                              (item: any) =>
                                item.type === pluginValue.targetType,
                            )?.defaultImage,
                          targetId: pluginValue.targetId || '',
                          targetType: pluginValue.targetType || '',
                          type: pluginValue.targetType,
                          statistics: null,
                        } as CreatedNodeItem,
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
                size="small"
                className={cx(styles.tableWrap, 'overflow-hide')}
                columns={inputColumns}
                dataSource={tableData}
                pagination={false}
                scroll={{ x: 600, y: 36 * 5 }}
                rowKey="fullName"
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
                autoSize={{ minRows: 5, maxRows: 5 }}
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
