import { SvgIcon } from '@/components/base';
import SelectList from '@/components/custom/SelectList';
import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import { EVENT_BIND_RESPONSE_ACTION_OPTIONS } from '@/constants/agent.constants';
import { apiAgentComponentEventUpdate } from '@/services/agentConfig';
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
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (open) {
      if (currentEventConfig) {
        form.setFieldsValue({
          name: currentEventConfig.name,
          identification: currentEventConfig.identification,
          type: currentEventConfig.type,
          url: currentEventConfig.url,
        });

        // 类型
        setType(currentEventConfig.type);
        // 回显入参配置
        setArgs(currentEventConfig.args || []);
        // 当前路径页面id
        setCurrentPageId(currentEventConfig.pageId || null);
      } else {
        form.setFieldValue('type', EventBindResponseActionEnum.Page);
      }
      if (pageArgConfigs?.length > 0) {
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
      }
    }

    return () => {
      setPathList([]);
      setArgs([]);
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
      message.success('更新成功');
      onConfirm();
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 表单提交
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    setLoading(true);
    const { pageUriId, ...rest } = values;
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
      setArgs(currentEventConfig?.args || []);
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
      title: '参数名',
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
          <span>参数值(非必填)</span>
          <TooltipIcon
            title={
              <>
                <div>
                  以下参数非必填，不填写时由模型补充,
                  可以在输入框中动态引用参数，留空的参数将由大模型自动补充
                </div>
                <div>
                  智能体ID {'{{'}AGENT_ID{'}}'}
                </div>
                <div>
                  系统用户ID {'{{'}SYS_USER_ID{'}}'}
                </div>
                <div>
                  用户UID {'{{'}USER_UID{'}}'}
                </div>
                <div>
                  用户名 {'{{'}USER_NAME{'}}'}
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
            placeholder={`请输入${record.description}`}
            value={record.bindValue}
            onChange={(e) =>
              handleInputValue(record.key, 'bindValue', e.target.value)
            }
          />
        </div>
      ),
    },
  ];

  return (
    <CustomFormModal
      form={form}
      title="事件绑定"
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
        autoComplete="off"
        preserve={false}
      >
        <Form.Item
          name="name"
          label="事件名称"
          rules={[{ required: true, message: '请输入事件名称' }]}
        >
          <Input placeholder="请输入事件名称" allowClear />
        </Form.Item>
        <Form.Item name="identification" label="事件标识（用于区分具体事件）">
          <Input placeholder="请输入事件标识" allowClear />
        </Form.Item>
        <Form.Item name="type" label="响应动作">
          <SelectList
            allowClear
            placeholder="请选择响应动作"
            options={EVENT_BIND_RESPONSE_ACTION_OPTIONS}
            value={type}
            onChange={handleChangeType}
          />
        </Form.Item>
        {type === EventBindResponseActionEnum.Page ? (
          <Form.Item name="pageUriId" label="页面路径">
            {/* 页面路径 */}
            <SelectList
              placeholder="请选择页面路径"
              options={pathList as any}
              onChange={changePagePath}
            />
          </Form.Item>
        ) : (
          type === EventBindResponseActionEnum.Link && (
            <Form.Item name="url" label="链接地址">
              <Input placeholder="https://xxxxxxx" allowClear />
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
              <span className={cx('user-select-none')}>输入</span>
              <TooltipIcon title="配置输入参数" icon={<InfoCircleOutlined />} />
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
