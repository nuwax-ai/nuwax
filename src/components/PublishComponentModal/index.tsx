import CustomFormModal from '@/components/CustomFormModal';
import LabelIcon from '@/components/LabelIcon';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import useCategory from '@/hooks/useCategory';
import { apiAgentPublishApply } from '@/services/agentConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { RoleEnum, TooltipTitleTypeEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { option } from '@/types/interfaces/common';
import { PublishComponentModalProps } from '@/types/interfaces/space';
import { SquareAgentInfo } from '@/types/interfaces/square';
import { SpaceInfo } from '@/types/interfaces/workspace';
import { DownOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
  Checkbox,
  Form,
  FormProps,
  Input,
  message,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

// 智能体、插件、工作流等发布范围属性
export interface PublishScope {
  name: string;
  key: string;
  children?: PublishScope[];
  [key: string]: string | PublishScope[] | undefined;
}

/**
 * 发布智能体、插件、工作流等弹窗组件
 */
const PublishComponentModal: React.FC<PublishComponentModalProps> = ({
  mode = AgentComponentTypeEnum.Agent,
  agentId,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [title, setTitle] = useState<string>('');
  // 分类选择列表
  const [classifyList, setClassifyList] = useState<option[]>([]);
  const { agentInfoList, pluginInfoList, workflowInfoList } =
    useModel('squareModel');
  const { spaceList, asyncSpaceListFun } = useModel('spaceModel');
  const { runQueryCategory } = useCategory();

  // 当前登录用户在空间的角色,可用值:Owner,Admin,User
  const filterSpaceList = useMemo(() => {
    // 过滤用户角色为用户的空间列表
    const list =
      spaceList
        ?.map((item: SpaceInfo) => ({
          key: uuidv4(),
          ...item,
        }))
        .filter((item: SpaceInfo) => item.spaceRole !== RoleEnum.User) || [];

    return [
      {
        name: '系统广场',
        key: PluginPublishScopeEnum.Tenant,
      },
      {
        name: '空间',
        key: PluginPublishScopeEnum.Space,
        children: list,
      },
    ] as PublishScope[];
  }, [spaceList]);

  useEffect(() => {
    // 查询广场分类列表信息
    runQueryCategory();
    // 工作空间列表查询接口
    asyncSpaceListFun();
  }, []);

  useEffect(() => {
    let _classifyList: SquareAgentInfo[] = [];
    switch (mode) {
      case AgentComponentTypeEnum.Agent:
        _classifyList = agentInfoList;
        setTitle('智能体');
        break;
      case AgentComponentTypeEnum.Plugin:
        _classifyList = pluginInfoList;
        setTitle('插件');
        break;
      case AgentComponentTypeEnum.Workflow:
        _classifyList = workflowInfoList;
        setTitle('工作流');
        break;
    }
    // 分类选择列表 - 数据类型转换
    const list = _classifyList?.map((item: SquareAgentInfo) => ({
      label: item.description,
      value: item.name,
    }));
    setClassifyList(list);
  }, [mode, agentInfoList, pluginInfoList, workflowInfoList]);

  // 智能体发布申请
  const { run, loading } = useRequest(apiAgentPublishApply, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: string) => {
      message.success(data || '发布申请已提交，等待审核中');
      onConfirm();
    },
  });

  const onFinish: FormProps<{
    channels: string[];
    remark: string;
  }>['onFinish'] = (values) => {
    run({
      agentId,
      ...values,
    });
  };

  const handlerConfirm = () => {
    form.submit();
  };

  // 入参配置columns
  const inputColumns: TableColumnsType<PublishScope> = [
    {
      title: (
        <LabelIcon
          label="发布空间"
          title={
            <>
              <p>1. 系统广场：智能体将出现在系统广场中。</p>
              <p>2. 空间广场：智能体将出现在选择的空间广场中。</p>
            </>
          }
          type={TooltipTitleTypeEnum.White}
        />
      ),
      dataIndex: 'name',
      key: 'name',
      render: (_: null, record: PublishScope) =>
        record?.children?.length ? (
          <>
            <DownOutlined className={cx(styles['font-12'])} />
            <span className={cx(styles['ml-8'])}>{record.name}</span>
          </>
        ) : (
          <Checkbox>{record.name}</Checkbox>
        ),
    },
    {
      title: (
        <LabelIcon
          label="允许复制（模板）"
          title={
            <p>
              选中后将出现在广场模版中，用户可直接复制到自己的工作空间中去。复制可选的前提是发布已选。
            </p>
          }
          type={TooltipTitleTypeEnum.White}
        />
      ),
      dataIndex: 'description',
      key: 'description',
      width: 180,
      render: (_: null, record: PublishScope) =>
        record?.children?.length ? null : (
          <Checkbox className={cx(styles['table-copy'])} />
        ),
    },
  ];

  return (
    <CustomFormModal
      form={form}
      classNames={{
        content: styles['modal-content'],
        header: styles['modal-header'],
      }}
      loading={loading}
      title={`发布${title}`}
      open={open}
      onConfirm={handlerConfirm}
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="remark" label="发布记录">
          <Input.TextArea
            rootClassName={cx(styles['input-textarea'])}
            placeholder="这里填写详细的发布记录，如果渠道选择了广场审核通过后将在智能体广场进行展示"
            autoSize={{ minRows: 5, maxRows: 8 }}
          ></Input.TextArea>
        </Form.Item>
        <Form.Item name="classify" label="分类选择">
          <SelectList className={styles.select} options={classifyList} />
        </Form.Item>
        <Form.Item
          label={
            <h4 className={cx(styles.scope, 'flex', 'items-center')}>
              选择发布范围
              <TooltipIcon
                title={
                  <>
                    <p>1. 系统广场：智能体将出现在系统广场中。</p>
                    <p>2. 空间广场：智能体将出现在选择的空间广场中。</p>
                  </>
                }
                icon={<InfoCircleOutlined />}
                type={TooltipTitleTypeEnum.White}
              />
            </h4>
          }
        >
          <Table<PublishScope>
            className={cx(styles['table-wrap'])}
            columns={inputColumns}
            dataSource={filterSpaceList}
            pagination={false}
            virtual
            expandable={{
              childrenColumnName: 'children',
              defaultExpandAllRows: true,
              expandedRowKeys: [PluginPublishScopeEnum.Space],
              expandIcon: () => null,
            }}
            scroll={{
              y: 200,
            }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PublishComponentModal;
