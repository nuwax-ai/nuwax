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
  const [args, setArgs] = useState<BindConfigWithSub[]>([]);

  useEffect(() => {
    if (open && eventConfig) {
      form.setFieldsValue({
        name: eventConfig.name,
        identification: eventConfig.identification,
        pageUri: eventConfig.pageUri,
        type: eventConfig.type,
      });

      setArgs(eventConfig.args || []);
    }
  }, [open, eventConfig]);

  // 更新事件绑定配置
  const { run: runEventUpdate } = useRequest(apiAgentComponentEventUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      console.log('更新成功');
      onConfirm();
    },
  });

  // 表单提交
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    console.log('onFinish', values);
    setLoading(true);
    // todo: 更新事件绑定配置
    runEventUpdate({
      id: 0,
      targetId: '',
      bindConfig: {
        ...values,
      },
    });
    setLoading(false);
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 切换类型时，根据类型设置对应的表单项
  const handleChangeType = (value: React.Key) => {
    // form.setFieldValue('type', value);
    setType(value as EventBindResponseActionEnum);
  };

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

  // 入参配置columns
  const inputColumns: TableColumnsType<BindConfigWithSub> = [
    {
      title: '参数名',
      dataIndex: 'name',
      key: 'name',
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
      width: 230,
      render: (_, record) => (
        <div className={cx('h-full', 'flex', 'items-center')}>
          <Space.Compact block>
            <SelectList
              className={cx(styles.select)}
              // disabled={isDefaultValueDisabled(record)}
              value={record.bindValueType}
              // onChange={(value) =>
              //   handleInputValue(record.key, 'bindValueType', value)
              // }
              options={ParamsSettingDefaultOptions}
            />
            {record.bindValueType === BindValueType.Input ? (
              <Input
                rootClassName={cx(styles.select)}
                placeholder="请填写"
                // disabled={isDefaultValueDisabled(record)}
                value={record.bindValue}
                // onChange={(e) =>
                //   handleInputValue(record.key, 'bindValue', e.target.value)
                // }
              />
            ) : (
              <Select
                placeholder="请选择"
                // disabled={isDefaultValueDisabled(record)}
                rootClassName={cx(styles.select)}
                popupMatchSelectWidth={false}
                value={record.bindValue || null}
                // onChange={(value) =>
                //   handleInputValue(record.key, 'bindValue', value)
                // }
                options={variableList}
              />
            )}
          </Space.Compact>
        </div>
      ),
    },
  ];

  // 切换页面路径，修改智能体变量参数
  const changePagePath = (value: React.Key) => {
    console.log('changePagePath', value, pageArgConfigs);

    const currentPageArgConfig = pageArgConfigs.find(
      (item) => item.pageUri === value,
    );
    console.log('currentPageArgConfig', currentPageArgConfig);
    setArgs(currentPageArgConfig?.args || []);
  };

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
          <Form.Item
            name="pageId"
            label="页面路径（页面组件中已添加的页面下的路径作为可选列表）"
          >
            {/* 页面路径 */}
            <SelectList
              placeholder="请选择页面路径"
              options={pageArgConfigs.map((item) => ({
                label: item.name,
                value: item.pageUri,
              }))}
              onChange={changePagePath}
            />
          </Form.Item>
        ) : (
          type === EventBindResponseActionEnum.Link && (
            <Form.Item name="url" label="链接地址（类型为外链时展示）">
              <Input placeholder="https://xxxxxxx" allowClear />
            </Form.Item>
          )
        )}
      </Form>
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
        dataSource={args}
        pagination={false}
        virtual
        scroll={{
          y: 480,
        }}
      />
    </CustomFormModal>
  );
};

export default EventBindModal;
