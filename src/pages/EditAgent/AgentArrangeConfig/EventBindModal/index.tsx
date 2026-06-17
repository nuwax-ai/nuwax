import { SvgIcon } from '@/components/base';
import SelectList from '@/components/custom/SelectList';
import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import { EVENT_BIND_RESPONSE_ACTION_OPTIONS } from '@/constants/agent.constants';
import { apiAgentComponentEventUpdate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import {
  BindValueType,
  EventBindResponseActionEnum,
} from '@/types/enums/agent';
import { AgentComponentEventConfig } from '@/types/interfaces/agent';
import {
  EventBindModalProps,
  PagePathSelectOption,
} from '@/types/interfaces/agentConfig';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { isHttp, validateTableName } from '@/utils/common';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Form,
  FormProps,
  Input,
  message,
  Table,
  TableColumnsType,
  theme,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 事件绑定弹窗
 */
const EventBindModal: React.FC<EventBindModalProps> = ({
  open,
  eventsInfo,
  currentEventConfig,
  pageArgConfigs,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  // 是否展开
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  // 响应动作类型，默认为扩展页面打开
  const [type, setType] = useState<EventBindResponseActionEnum>(
    EventBindResponseActionEnum.Page,
  );
  // 入参配置
  const [args, setArgs] = useState<BindConfigWithSub[]>([]);
  // 当前路径页面id
  const [currentPageId, setCurrentPageId] = useState<number | null>(null);
  // 页面路径列表
  const [pathList, setPathList] = useState<PagePathSelectOption[]>([]);

  // 初始化输入参数
  const initialArgs = () => {
    if (!currentEventConfig) {
      return [];
    }
    if (!pageArgConfigs?.length) {
      return currentEventConfig?.args || [];
    }
    // 当前选中的页面配置参数列表
    const _argConfigs: BindConfigWithSub[] =
      pageArgConfigs?.find(
        (item) => item.pageUri === currentEventConfig?.pageUri,
      )?.args || [];

    // 新旧参数对比，如果旧参数不存在，则新增
    const newArgs: BindConfigWithSub[] = [];
    _argConfigs.forEach((item) => {
      // 如果旧参数存在，则添加到新参数列表
      const _currentArg = currentEventConfig?.args?.find(
        (arg) => arg.key === item.key,
      );
      if (_currentArg) {
        newArgs.push(_currentArg);
      } else {
        // 如果旧参数不存在，则新增
        newArgs.push(item);
      }
    });
    return newArgs;
  };

  useEffect(() => {
    if (open) {
      if (currentEventConfig) {
        form.setFieldsValue({
          name: currentEventConfig.name,
          identification: currentEventConfig.identification,
          url: currentEventConfig.url,
        });

        // 类型
        setType(currentEventConfig.type);
        // 回显入参配置
        const _args = initialArgs();
        setArgs(_args);
        // 当前路径页面id
        setCurrentPageId(currentEventConfig.pageId || null);
      }

      // 扩展页面路径类型时，展示入参配置
      if (pageArgConfigs?.length > 0) {
        // 修改模式下，回显类型
        if (currentEventConfig) {
          form.setFieldValue('type', currentEventConfig.type);
        } else {
          form.setFieldValue('type', EventBindResponseActionEnum.Page);
        }

        const _pathList: PagePathSelectOption[] = [];
        pageArgConfigs?.forEach((item) => {
          // 添加一个唯一值，因为pageArgConfigs中可能存在相同的pageUri
          const pageUriId = uuidv4();
          _pathList.push({
            label: item.name,
            value: pageUriId,
            // 下拉选择框的值,后续选择页面路径时，需要使用pageUri来作为真正的value值
            pageUri: item.pageUri,
            pageId: item.pageId,
          });

          if (currentEventConfig?.pageUri === item.pageUri) {
            form.setFieldValue('pageUriId', pageUriId);
          }
        });
        setPathList(_pathList);
      } else {
        // 没有页面路径，默认选择链接类型, 因为事件绑定如果响应动作选择扩展页面打开时，必须选择页面路径
        form.setFieldValue('type', EventBindResponseActionEnum.Link);
        setType(EventBindResponseActionEnum.Link);
      }
    }

    return () => {
      setPathList([]);
      setArgs([]);
      setType(EventBindResponseActionEnum.Page);
      setCurrentPageId(null);
      setIsActive(true);
    };
  }, [open, currentEventConfig]);

  // 入参配置 - changeValue
  const handleInputValue = (
    key: React.Key,
    attr: string,
    value: string | number | BindValueType,
  ) => {
    const _inputConfigArgs = [...args];
    _inputConfigArgs.forEach((item: BindConfigWithSub) => {
      if (item.key === key) {
        item[attr] = value;
      }
    });
    setArgs(_inputConfigArgs);
  };

  // 更新事件绑定配置
  const { run: runEventUpdate } = useRequest(apiAgentComponentEventUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(t('PC.Pages.AgentArrangeEventBindModal.updateSuccess'));
      onConfirm();
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 表单提交
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const { pageUriId, ...rest } = values;

    setLoading(true);
    const pageUri = pathList.find((item) => item.value === pageUriId)?.pageUri;

    const _currentEventConfig = {
      ...(currentEventConfig || {}),
      ...rest,
      pageUri,
      args,
      // 选择的页面路径的ID
      pageId: currentPageId,
    };
    // 拷贝事件绑定配置
    const eventConfigs = [...(eventsInfo.bindConfig.eventConfigs || [])];

    const index = eventConfigs.findIndex(
      (item: AgentComponentEventConfig) =>
        item.pageUri === currentEventConfig?.pageUri &&
        item.pageId === currentEventConfig?.pageId &&
        item.name === currentEventConfig?.name,
    );
    // 如果存在，则更新，否则新增
    if (index !== -1) {
      eventConfigs[index] = _currentEventConfig;
    } else {
      eventConfigs.push(_currentEventConfig);
    }

    const newEventsInfo = {
      id: eventsInfo?.id,
      bindConfig: {
        eventConfigs,
      },
    };

    // 更新事件绑定配置
    runEventUpdate(newEventsInfo);
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 切换类型时，根据类型设置对应的表单项
  const handleChangeType = (value: React.Key) => {
    setType(value as EventBindResponseActionEnum);

    form.setFieldsValue({
      type: value,
      pageUriId: '',
      url: '',
    });
    setArgs([]);
  };

  // 切换页面路径，修改智能体变量参数
  const changePagePath = (_: React.Key, option: any) => {
    const { label, pageId, pageUri } = option;
    // 根据页面路径，获取入参配置
    const _config =
      pageArgConfigs.find(
        (item) =>
          item.pageUri === pageUri &&
          item.pageId === pageId &&
          item.name === label,
      ) || null;
    // 当前路径页面id
    setCurrentPageId(pageId);

    // 切换到当前页面路径，回显入参配置
    if (currentEventConfig?.pageUri === pageUri) {
      // 回显入参配置
      const _args = initialArgs();
      setArgs(_args);
    } else {
      // 切换到其他页面路径，回显入参配置
      if (_config?.args) {
        setArgs(_config.args);
      }
    }
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: t('PC.Pages.AgentArrangeEventBindModal.paramName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (_: string, record: BindConfigWithSub) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          {record.name}
        </div>
      ),
    },
    {
      title: () => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <span>{t('PC.Pages.AgentArrangeEventBindModal.paramValue')}</span>
          <TooltipIcon
            title={
              <>
                <div>
                  {t('PC.Pages.AgentArrangeEventBindModal.paramValueTip')}
                </div>
                <div>
                  {t('PC.Pages.AgentArrangeEventBindModal.agentIdVariable')}{' '}
                  {'{{'}AGENT_ID{'}}'}
                </div>
                <div>
                  {t(
                    'PC.Pages.AgentArrangeEventBindModal.systemUserIdVariable',
                  )}{' '}
                  {'{{'}SYS_USER_ID{'}}'}
                </div>
                <div>
                  {t('PC.Pages.AgentArrangeEventBindModal.userUidVariable')}{' '}
                  {'{{'}USER_UID{'}}'}
                </div>
                <div>
                  {t('PC.Pages.AgentArrangeEventBindModal.userNameVariable')}{' '}
                  {'{{'}USER_NAME{'}}'}
                </div>
              </>
            }
            icon={<InfoCircleOutlined />}
          />
        </div>
      ),
      key: 'bindValue',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Input
            allowClear
            placeholder={t(
              'PC.Pages.AgentArrangeEventBindModal.paramValuePlaceholder',
              record.description || '',
            )}
            value={record.bindValue}
            onChange={(e) =>
              handleInputValue(record.key, 'bindValue', e.target.value)
            }
          />
        </div>
      ),
    },
  ];

  // 响应动作列表(没有路径列表时，不展示扩展页面打开选项)
  const responseActionList = useMemo(() => {
    const localizedOptions = EVENT_BIND_RESPONSE_ACTION_OPTIONS.map((item) => {
      if (item.value === EventBindResponseActionEnum.Page) {
        return {
          ...item,
          label: t('PC.Pages.AgentArrangeEventBindModal.responseActionPage'),
        };
      }
      return {
        ...item,
        label: t('PC.Pages.AgentArrangeEventBindModal.responseActionLink'),
      };
    });

    return pageArgConfigs.length > 0
      ? localizedOptions
      : localizedOptions.filter(
          (item) => item.value !== EventBindResponseActionEnum.Page,
        );
  }, [pageArgConfigs]);

  return (
    <CustomFormModal
      form={form}
      title={t('PC.Pages.AgentArrangeEventBindModal.title')}
      open={open}
      loading={loading}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
      classNames={{
        body: styles['modal-body'],
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={customizeRequiredMark}
        autoComplete="off"
        preserve={false}
      >
        <Form.Item
          name="name"
          label={t('PC.Pages.AgentArrangeEventBindModal.eventName')}
          rules={[
            {
              required: true,
              message: t(
                'PC.Pages.AgentArrangeEventBindModal.eventNameRequired',
              ),
            },
          ]}
        >
          <Input
            placeholder={t(
              'PC.Pages.AgentArrangeEventBindModal.eventNamePlaceholder',
            )}
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="identification"
          label={t('PC.Pages.AgentArrangeEventBindModal.eventCode')}
          rules={[
            {
              required: true,
              message: t(
                'PC.Pages.AgentArrangeEventBindModal.eventCodeRequired',
              ),
            },
            {
              validator(_, value) {
                if (!value || validateTableName(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error(
                    t('PC.Pages.AgentArrangeEventBindModal.eventCodeInvalid'),
                  ),
                );
              },
            },
          ]}
        >
          <Input
            placeholder={t(
              'PC.Pages.AgentArrangeEventBindModal.eventCodePlaceholder',
            )}
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="type"
          label={t('PC.Pages.AgentArrangeEventBindModal.responseAction')}
        >
          <SelectList
            placeholder={t(
              'PC.Pages.AgentArrangeEventBindModal.responseActionPlaceholder',
            )}
            options={responseActionList}
            value={type}
            onChange={handleChangeType}
          />
        </Form.Item>
        {type === EventBindResponseActionEnum.Page ? (
          <Form.Item
            name="pageUriId"
            label={t('PC.Pages.AgentArrangeEventBindModal.pagePath')}
            rules={[
              {
                required: true,
                message: t(
                  'PC.Pages.AgentArrangeEventBindModal.pagePathRequired',
                ),
              },
            ]}
          >
            {/* 页面路径 */}
            <SelectList
              placeholder={t(
                'PC.Pages.AgentArrangeEventBindModal.pagePathPlaceholder',
              )}
              options={pathList as any}
              onChange={changePagePath}
            />
          </Form.Item>
        ) : (
          type === EventBindResponseActionEnum.Link && (
            <Form.Item
              name="url"
              label={t('PC.Pages.AgentArrangeEventBindModal.linkUrl')}
              rules={[
                {
                  required: true,
                  message: t(
                    'PC.Pages.AgentArrangeEventBindModal.linkUrlRequired',
                  ),
                },
                {
                  validator(_, value) {
                    if (!value || isHttp(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        t('PC.Pages.AgentArrangeEventBindModal.linkUrlInvalid'),
                      ),
                    );
                  },
                },
              ]}
            >
              <Input placeholder="https://www.xxx.com" allowClear />
            </Form.Item>
          )
        )}
      </Form>
      {
        // 扩展页面路径类型时，展示入参配置
        type === EventBindResponseActionEnum.Page && (
          <>
            <div className={cx(styles['input-box'], 'flex', 'items-center')}>
              <SvgIcon
                name="icons-common-caret_right"
                rotate={isActive ? 90 : 0}
                style={{ color: token.colorTextTertiary }}
                onClick={() => setIsActive(!isActive)}
              />
              <span className={cx('user-select-none')}>
                {t('PC.Pages.AgentArrangeEventBindModal.input')}
              </span>
              <TooltipIcon
                title={t('PC.Pages.AgentArrangeEventBindModal.configInputArgs')}
                icon={<InfoCircleOutlined />}
              />
            </div>
            <div
              className={cx(
                styles['table-collapse-wrapper'],
                isActive && styles['table-collapse-active'],
              )}
            >
              <Table<BindConfigWithSub>
                className={cx('mb-16', 'flex-1')}
                columns={inputColumns}
                dataSource={args}
                pagination={false}
                virtual
                scroll={{
                  y: 480,
                }}
              />
            </div>
          </>
        )
      }
    </CustomFormModal>
  );
};

export default EventBindModal;
