import CustomFormModal from '@/components/CustomFormModal';
import LabelIcon from '@/components/LabelIcon';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import useCategory from '@/hooks/useCategory';
import { apiPublishApply, apiPublishItemList } from '@/services/publish';
import { apiSpaceList } from '@/services/workspace';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  OnlyTemplateEnum,
} from '@/types/enums/agent';
import { RoleEnum, TooltipTitleTypeEnum } from '@/types/enums/common';
import { PluginPublishScopeEnum } from '@/types/enums/plugin';
import { ReceivePublishEnum } from '@/types/enums/space';
import { option, PublishScope } from '@/types/interfaces/common';
import { PublishItem, PublishItemInfo } from '@/types/interfaces/publish';
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
import React, { useEffect, useState } from 'react';
import { useModel, useRequest } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 发布智能体、插件、工作流等弹窗组件
 */
const PublishComponentModal: React.FC<PublishComponentModalProps> = ({
  mode = AgentComponentTypeEnum.Agent,
  spaceId,
  targetId,
  open,
  onlyShowTemplate = true,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 标题
  const [title, setTitle] = useState<string>('');
  // 分类选择列表
  const [classifyList, setClassifyList] = useState<option[]>([]);
  // 数据列表
  const [dataSource, setDataSource] = useState<PublishScope[]>([]);
  // 已选择空间列表
  const [publishItemList, setPublishItemList] = useState<PublishItem[]>([]);
  // 折叠行key值列表
  const [expandedRowKeys, setExpandedRowKeys] = useState<
    PluginPublishScopeEnum[]
  >([PluginPublishScopeEnum.Space]);
  // 已发布列表
  const [publishList, setPublishList] = useState<PublishItemInfo[]>([]);
  // 智能体、插件、工作流等信息列表
  const { agentInfoList, pluginInfoList, workflowInfoList } =
    useModel('squareModel');
  // 查询分类列表信息
  const { runQueryCategory } = useCategory();

  // 查询用户空间列表
  const { run: runSpace, data: spaceList } = useRequest(apiSpaceList, {
    manual: true,
    debounceWait: 300,
  });

  // 当前登录用户在空间的角色,可用值:Owner,Admin,User
  useEffect(() => {
    const list =
      spaceList
        // 过滤用户角色为普通用户的空间列表
        ?.filter((item: SpaceInfo) => item.spaceRole !== RoleEnum.User)
        // 已关闭“接口来自外部空间的发布”时在其他空间发布时不展示该空间
        ?.filter((item: SpaceInfo) => {
          // 当前空间或者允许来自外部空间的发布的空间列表
          return (
            item.id === spaceId ||
            (item.id !== spaceId &&
              item.receivePublish === ReceivePublishEnum.Receive)
          );
        })
        ?.map((item: SpaceInfo) => ({
          key: uuidv4(),
          name: item.name,
          scope: PluginPublishScopeEnum.Space,
          spaceId: item.id,
        })) || [];

    const _dataSource: PublishScope[] = [
      {
        key: PluginPublishScopeEnum.Tenant,
        name: '系统广场',
        scope: PluginPublishScopeEnum.Tenant,
      },
      {
        key: PluginPublishScopeEnum.Space,
        name: '空间',
        scope: PluginPublishScopeEnum.Space,
        children: list,
      },
    ] as PublishScope[];

    setDataSource(_dataSource);
  }, [spaceList]);

  useEffect(() => {
    if (publishList?.length) {
      const list = publishList.map((item: PublishItemInfo) => {
        return {
          allowCopy: item.allowCopy,
          onlyTemplate: item.onlyTemplate,
          scope: item.scope,
          spaceId: item.spaceId || null,
        };
      });

      setPublishItemList(list);
    }
  }, [publishList]);

  // 查询指定智能体、插件或工作流已发布列表
  const { run: runPublishList } = useRequest(apiPublishItemList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: PublishItemInfo[]) => {
      setPublishList(result);
    },
  });

  useEffect(() => {
    if (open) {
      // 查询广场分类列表信息
      runQueryCategory();
      // 工作空间列表查询接口
      runSpace();
      // 查询指定智能体插件或工作流已发布列表
      runPublishList({
        targetId,
        targetType: AgentComponentTypeEnum.Agent,
      });
    }
  }, [open]);

  // 设置title以及分类选择列表
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
    // 默认选中第一个分类
    if (list?.length > 0) {
      form.setFieldValue('category', list[0].value);
    }
  }, [mode, agentInfoList, pluginInfoList, workflowInfoList]);

  // 智能体、插件、工作流等 - 提交发布申请
  const { run, loading } = useRequest(apiPublishApply, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (data: string) => {
      message.success(data || '发布申请已提交，等待审核中');
      onConfirm();
    },
  });

  const onFinish: FormProps<{
    remark: string;
    category: string;
  }>['onFinish'] = (values) => {
    run({
      ...values,
      targetType: mode,
      targetId,
      items: publishItemList,
    });
  };

  const handlerConfirm = () => {
    form.submit();
  };

  // 查找发布项
  const findPublishItem = (scope: PluginPublishScopeEnum, spaceId?: number) => {
    return publishItemList?.find((item: PublishItem) => {
      // 全等，需要避免item.spaceId为null时，但形参spaceId为undefined时，返回false
      return (
        item.scope === scope && (item.spaceId ?? null) === (spaceId ?? null)
      );
    });
  };

  // 是否选中, 如果存在则为选中状态
  const isChecked = (
    scope: PluginPublishScopeEnum,
    spaceId?: number,
  ): boolean => {
    return !!findPublishItem(scope, spaceId);
  };

  // 是否允许复制
  const isAllCopy = (
    scope: PluginPublishScopeEnum,
    spaceId?: number,
  ): boolean => {
    const item = findPublishItem(scope, spaceId);
    return item?.allowCopy === AllowCopyEnum.Yes;
  };

  // 是否已选中“”仅模板“”选项
  const isOnlyTemplate = (scope: PluginPublishScopeEnum, spaceId?: number) => {
    const item = findPublishItem(scope, spaceId);
    return item?.onlyTemplate === OnlyTemplateEnum.Yes;
  };

  // 切换选中状态
  const handleChecked = (record: PublishScope, checked: boolean) => {
    const { scope, spaceId } = record;
    if (checked) {
      setPublishItemList([
        ...publishItemList,
        {
          scope,
          spaceId,
          allowCopy: AllowCopyEnum.No,
          onlyTemplate: OnlyTemplateEnum.No,
        },
      ]);
    } else {
      setPublishItemList(
        publishItemList.filter(
          (item: PublishItem) =>
            item.scope !== scope ||
            (item.spaceId ?? null) !== (spaceId ?? null),
        ),
      );
    }
  };

  // 切换允许复制
  const handleAllowCopy = (record: PublishScope, checked: boolean) => {
    const { scope, spaceId } = record;
    const list = publishItemList?.map((item: PublishItem) => {
      // 全等，需要避免item.spaceId为null时，但形参spaceId为undefined时，返回false
      if (
        item.scope === scope &&
        (item.spaceId ?? null) === (spaceId ?? null)
      ) {
        return {
          ...item,
          allowCopy: checked ? AllowCopyEnum.Yes : AllowCopyEnum.No,
          onlyTemplate: OnlyTemplateEnum.No,
        };
      }

      return item;
    });
    setPublishItemList(list);
  };

  // 切换“仅模板”选项
  const handleOnlyTemplate = (record: PublishScope, checked: boolean) => {
    const { scope, spaceId } = record;
    const list = publishItemList?.map((item: PublishItem) => {
      // 全等，需要避免item.spaceId为null时，但形参spaceId为undefined时，返回false
      if (
        item.scope === scope &&
        (item.spaceId ?? null) === (spaceId ?? null)
      ) {
        return {
          ...item,
          onlyTemplate: checked ? OnlyTemplateEnum.Yes : OnlyTemplateEnum.No,
        };
      }

      return item;
    });
    setPublishItemList(list);
  };

  // 展开/收起“发布空间”选项
  const handleCollapseExpand = () => {
    setExpandedRowKeys((keys) => {
      if (keys.includes(PluginPublishScopeEnum.Space)) {
        return [];
      } else {
        return [PluginPublishScopeEnum.Space];
      }
    });
  };

  // 所有columns，包含“发布空间”、“允许复制”、“仅模板”等列, 插件组件时没有复制和模板选项
  const allColumns: TableColumnsType<PublishScope> = [
    {
      title: (
        <LabelIcon
          className={cx(styles['label-normal'])}
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
      render: (_: null, record: PublishScope) =>
        record?.children?.length ? (
          <div onClick={handleCollapseExpand} className="cursor-pointer">
            {/* 展开/收起图标 */}
            <DownOutlined
              className={cx(styles['font-12'], {
                [styles['down-outlined']]: !expandedRowKeys.includes(
                  PluginPublishScopeEnum.Space,
                ),
              })}
            />
            <span className={cx(styles['ml-8'])}>{record.name}</span>
          </div>
        ) : (
          <Checkbox
            checked={isChecked(record.scope, record.spaceId)}
            onChange={(e) => handleChecked(record, e.target.checked)}
          >
            <div className="text-ellipsis" style={{ width: '148px' }}>
              {record.name}
            </div>
          </Checkbox>
        ),
    },
    {
      title: (
        <LabelIcon
          className={cx(styles['label-normal'])}
          label="允许复制（模板）"
          title={
            <p>
              选中后将出现在广场模版中，用户可直接复制到自己的工作空间中去。复制可选的前提是发布已选。
            </p>
          }
          type={TooltipTitleTypeEnum.White}
        />
      ),
      dataIndex: 'allowCopy',
      width: 180,
      render: (_: null, record: PublishScope) =>
        record?.children?.length ? null : (
          <Checkbox
            className={cx(styles['table-copy'])}
            checked={isAllCopy(record.scope, record.spaceId)}
            disabled={!isChecked(record.scope, record.spaceId)}
            onChange={(e) => handleAllowCopy(record, e.target.checked)}
          />
        ),
    },
    {
      title: (
        <LabelIcon
          className={cx(styles['label-normal'])}
          label="仅模板"
          title={'选择后仅在模板广场展示，仅模板只有在允许复制选择后才可选'}
          type={TooltipTitleTypeEnum.White}
        />
      ),
      dataIndex: 'onlyTemplate',
      width: 100,
      render: (_: null, record: PublishScope) =>
        record?.children?.length ? null : (
          <div className={cx(styles['text-center'])}>
            <Checkbox
              checked={isOnlyTemplate(record.scope, record.spaceId)}
              disabled={!isAllCopy(record.scope, record.spaceId)}
              onChange={(e) => handleOnlyTemplate(record, e.target.checked)}
            />
          </div>
        ),
    },
  ];

  // 入参配置columns
  const inputColumns: TableColumnsType<PublishScope> = onlyShowTemplate
    ? allColumns
    : allColumns.slice(0, 1);

  return (
    <CustomFormModal
      form={form}
      classNames={{
        content: styles['modal-content'],
        header: styles['modal-header'],
        body: styles['modal-body'],
      }}
      loading={loading}
      title={`发布${title}`}
      centered={true}
      open={open}
      onConfirm={handlerConfirm}
      onCancel={onCancel}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="remark" label="发布记录">
          <Input.TextArea
            rootClassName={cx(
              styles['input-textarea'],
              'dispose-textarea-count',
            )}
            placeholder="这里填写详细的发布记录"
            autoSize={{ minRows: 5, maxRows: 8 }}
            maxLength={200}
            showCount
          ></Input.TextArea>
        </Form.Item>
        <Form.Item name="category" label="分类选择">
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
          noStyle
        >
          <Table<PublishScope>
            className={cx(styles['table-wrap'])}
            columns={inputColumns}
            dataSource={dataSource}
            pagination={false}
            expandable={{
              childrenColumnName: 'children',
              defaultExpandAllRows: true,
              expandedRowKeys,
              expandIcon: () => null,
            }}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default PublishComponentModal;
