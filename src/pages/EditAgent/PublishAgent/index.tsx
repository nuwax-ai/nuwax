import CustomFormModal from '@/components/CustomFormModal';
import LabelIcon from '@/components/LabelIcon';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import { PUBLISH_SCOPE_OPTIONS } from '@/constants/agent.constants';
import useCategory from '@/hooks/useCategory';
import { apiAgentPublishApply } from '@/services/agentConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { TooltipTitleTypeEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { option } from '@/types/interfaces/common';
import type { PublishAgentProps } from '@/types/interfaces/space';
import { SquareAgentInfo } from '@/types/interfaces/square';
import { SpaceInfo } from '@/types/interfaces/workspace';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Checkbox,
  Form,
  FormProps,
  Input,
  message,
  Radio,
  Table,
  TableColumnsType,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 发布智能体弹窗组件
 */
const PublishAgent: React.FC<PublishAgentProps> = ({
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
  const [selectScope, setSelectScope] = useState<PluginPublishScopeEnum>(
    PluginPublishScopeEnum.Tenant,
  );
  const { agentInfoList, pluginInfoList, workflowInfoList } =
    useModel('squareModel');
  const { spaceList, asyncSpaceListFun } = useModel('spaceModel');
  const { runQueryCategory } = useCategory();

  const filterSpaceList = useMemo(() => {
    return (
      spaceList?.map((item: SpaceInfo) => {
        item.key = uuidv4();
        return item;
      }) || []
    );
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
  const inputColumns: TableColumnsType<SpaceInfo> = [
    {
      title: (
        <LabelIcon
          label="发布空间"
          title={<p>发布空间</p>}
          type={TooltipTitleTypeEnum.White}
        />
      ),
      dataIndex: 'name',
      key: 'name',
      render: (_: string, record: SpaceInfo) => (
        <Checkbox>{record.name}</Checkbox>
      ),
    },
    {
      title: (
        <LabelIcon
          label="允许复制（模板）"
          title={<p>允许复制（模板）</p>}
          type={TooltipTitleTypeEnum.White}
        />
      ),
      dataIndex: 'description',
      key: 'description',
      width: 180,
      render: () => <Checkbox className={cx(styles['table-copy'])} />,
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
          noStyle
          label={
            <h4 className={cx(styles.scope, 'flex', 'items-center')}>
              选择发布范围
              <TooltipIcon
                title={<p>发布范围</p>}
                icon={<InfoCircleOutlined />}
                type={TooltipTitleTypeEnum.White}
              />
            </h4>
          }
        >
          <Form.Item noStyle>
            <Radio.Group
              options={PUBLISH_SCOPE_OPTIONS}
              value={selectScope}
              onChange={(e) => setSelectScope(e.target.value)}
            />
          </Form.Item>
          {selectScope === PluginPublishScopeEnum.Tenant ? (
            <Form.Item name="copy">
              <Checkbox>
                <LabelIcon
                  label="允许复制（模板）"
                  title={<p>允许复制（模板）</p>}
                  type={TooltipTitleTypeEnum.White}
                />
              </Checkbox>
            </Form.Item>
          ) : (
            <Table<SpaceInfo>
              className={cx(styles['table-wrap'])}
              columns={inputColumns}
              dataSource={filterSpaceList}
              pagination={false}
              virtual
              expandable={{
                childrenColumnName: 'subArgs',
              }}
              scroll={{
                y: 200,
              }}
            />
          )}
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PublishAgent;
