import { SvgIcon } from '@/components/base';
import SelectList from '@/components/custom/SelectList';
import TooltipIcon from '@/components/custom/TooltipIcon';
import CustomFormModal from '@/components/CustomFormModal';
import { EVENT_BIND_RESPONSE_ACTION_OPTIONS } from '@/constants/agent.constants';
import { ParamsSettingDefaultOptions } from '@/constants/common.constants';
import { apiAgentComponentEventUpdate } from '@/services/agentConfig';
import {
  BindValueType,
  EventBindResponseActionEnum,
} from '@/types/enums/agent';
import { AgentComponentEventConfig } from '@/types/interfaces/agent';
import { PagePathSelectOption } from '@/types/interfaces/agentConfig';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { PageArgConfig } from '@/types/interfaces/pageDev';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Form,
  FormProps,
  Input,
  Select,
  Space,
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

// 事件绑定弹窗Props
export interface EventBindModalProps {
  open: boolean;
  eventConfig: AgentComponentEventConfig;
  variables: BindConfigWithSub[];
  pageArgConfigs: PageArgConfig[];
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * 事件绑定弹窗
 */
const EventBindModal: React.FC<EventBindModalProps> = ({
  open,
  eventConfig,
  variables,
  pageArgConfigs,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();
  // 是否展开
  const [isActive, setIsActive] = useState<boolean>(false);
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
    if (open && eventConfig) {
      form.setFieldsValue({
        name: eventConfig.name,
        identification: eventConfig.identification,
        // pageUri: eventConfig.pageUri,
        type: eventConfig.type,
      });

      // 类型
      setType(eventConfig.type);
      // 回显入参配置
      setArgs(eventConfig.args || []);
      // 当前路径页面id
      setCurrentPageId(eventConfig.pageId || null);
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

        if (eventConfig?.pageUri === item.pageUri) {
          form.setFieldValue('pageUriId', pageUriId);
        }
      });
      setPathList(_pathList);
    }
  }, [open, eventConfig]);

  // 缓存变量列表
  const variableList = useMemo(() => {
    return (
      variables?.map((item) => {
        return {
          label: item.name,
          value: item.name,
        };
      }) || []
    );
  }, [variables]);

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

        if (attr === 'bindValueType') {
          item.bindValue = '';
        }
      }
    });
    setArgs(_inputConfigArgs);
  };

  // 更新事件绑定配置
  const { run: runEventUpdate } = useRequest(apiAgentComponentEventUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      console.log('更新成功');
      onConfirm();
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  // 表单提交
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('onFinish', values);
    setLoading(true);
    const { pageUriId, ...rest } = values;
    const pageUri = pathList.find((item) => item.value === pageUriId)?.pageUri;
    // todo: 更新事件绑定配置
    runEventUpdate({
      id: 0,
      targetId: '',
      pageUri,
      pageId: currentPageId,
      ...rest,
      bindConfig: {
        ...values,
        args,
      },
    });
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
    if (eventConfig?.pageUri === pageUri) {
      setArgs(eventConfig?.args || []);
    } else {
      // 切换到其他页面路径，回显入参配置
      if (_config?.args) {
        const _args = _config.args.map((item) => {
          return {
            ...item,
            bindValueType: item.bindValueType || BindValueType.Input,
          };
        });
        setArgs(_args);
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
    },
    {
      title: () => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <span>参数值</span>
          <TooltipIcon
            title="可以在输入框中动态引用参数，留空的参数将由大模型自动补充
              智能体ID {{AGENT_ID}}     
              系统用户ID {{SYS_USER_ID}}    
              用户UID {{USER_UID}}
              用户名 {{USER_NAME}}"
            icon={<InfoCircleOutlined />}
          />
        </div>
      ),
      key: 'bindValue',
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Space.Compact block>
            <SelectList
              className={cx(styles.select)}
              value={record.bindValueType}
              onChange={(value) =>
                handleInputValue(
                  record.key,
                  'bindValueType',
                  value as BindValueType,
                )
              }
              options={ParamsSettingDefaultOptions}
            />
            {record.bindValueType === BindValueType.Input ? (
              <Input
                rootClassName={cx(styles.select)}
                placeholder="请填写"
                value={record.bindValue}
                onChange={(e) =>
                  handleInputValue(record.key, 'bindValue', e.target.value)
                }
              />
            ) : (
              <Select
                placeholder="请选择"
                rootClassName={cx(styles.select)}
                popupMatchSelectWidth={false}
                value={record.bindValue || null}
                onChange={(value) =>
                  handleInputValue(record.key, 'bindValue', value)
                }
                options={variableList}
              />
            )}
          </Space.Compact>
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
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        autoComplete="off"
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
              <TooltipIcon title="输入" icon={<InfoCircleOutlined />} />
            </div>
            <Table<BindConfigWithSub>
              className={cx('mb-16', 'flex-1')}
              columns={inputColumns}
              rowKey="key"
              dataSource={args}
              pagination={false}
              virtual
              scroll={{
                y: 480,
              }}
            />
          </>
        )
      }
    </CustomFormModal>
  );
};

export default EventBindModal;
