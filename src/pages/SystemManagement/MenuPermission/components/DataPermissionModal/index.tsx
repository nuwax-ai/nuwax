import {
  apiGetRoleBoundDataPermissionList,
  apiRoleBindDataPermission,
} from '@/pages/SystemManagement/MenuPermission/services/role-manage';
import {
  apiSystemResourceAgentListByIds,
  apiSystemResourceKnowledgeListByIds,
  apiSystemResourcePageListByIds,
} from '@/pages/UserManage/user-manage';
import {
  apiGetOpenApiList,
  OpenApiPermissionTargetTypeEnum,
} from '@/services/account';
import { t } from '@/services/i18nRuntime';
import { apiPublishedAgentList } from '@/services/square';
import {
  apiSystemModelList,
  apiSystemResourceKnowledgeList,
} from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { AccessControlEnum } from '@/types/enums/systemManage';
import type { OpenApiDefinition } from '@/types/interfaces/account';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import type { CustomPageDto } from '@/types/interfaces/pageDev';
import type { Page } from '@/types/interfaces/request';
import type { SquarePublishedItemInfo } from '@/types/interfaces/square';
import type {
  KnowledgeInfoById,
  ModelConfigDto,
  SystemKnowledgeInfo,
  SystemKnowledgePage,
} from '@/types/interfaces/systemManage';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, message, Modal, Tabs, TabsProps, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiGetGroupBoundDataPermissionList,
  apiGroupBindDataPermission,
} from '../../services/user-group-manage';
import { DataPermission, OpenApiConfigInfo } from '../../types/role-manage';
import styles from './index.less';
import {
  AgentTabPanel,
  ApiPermissionTabPanel,
  DeveloperPermissionFormTab,
  KnowledgeTabPanel,
  ModelTabPanel,
  PageTabPanel,
} from './tabPanels';

const cx = classNames.bind(styles);

interface DataPermissionModalProps {
  /** 是否打开 */
  open: boolean;
  /** 目标ID */
  targetId: number;
  type: 'role' | 'userGroup';
  /** 名称 */
  name?: string;
  /** 取消回调 */
  onCancel: () => void;
}

export type DataPermissionTabKey =
  | 'model'
  | 'agent'
  | 'page'
  | 'knowledge'
  | 'dataPermission'
  | 'apiPermission';

export const getDataPermissionTabItems = (): TabsProps['items'] => [
  {
    key: 'model',
    label: (
      <span>
        {t('PC.Pages.SystemMenuDataPermissionModal.tabModel')}
        <Tooltip
          title={t('PC.Pages.SystemMenuDataPermissionModal.tabModelTip')}
        >
          <InfoCircleOutlined
            style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
          />
        </Tooltip>
      </span>
    ),
  },
  {
    key: 'agent',
    label: (
      <span>
        {t('PC.Pages.SystemMenuDataPermissionModal.tabAgent')}
        <Tooltip
          title={t('PC.Pages.SystemMenuDataPermissionModal.contentMgmtTip')}
        >
          <InfoCircleOutlined
            style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
          />
        </Tooltip>
      </span>
    ),
  },
  {
    key: 'page',
    label: (
      <span>
        {t('PC.Pages.SystemMenuDataPermissionModal.tabWebApp')}
        <Tooltip
          title={t('PC.Pages.SystemMenuDataPermissionModal.contentMgmtTip')}
        >
          <InfoCircleOutlined
            style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
          />
        </Tooltip>
      </span>
    ),
  },
  {
    key: 'knowledge',
    label: (
      <span>
        知识库
        <Tooltip title="在内容管理中开启管控后可在此处进行授权，若开启管控，需授权才能使用该知识库">
          <InfoCircleOutlined
            style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
          />
        </Tooltip>
      </span>
    ),
  },
  {
    key: 'dataPermission',
    label: t('PC.Pages.SystemMenuDataPermissionModal.tabDevPermission'),
  },
  {
    key: 'apiPermission',
    label: (
      <span>
        {t('PC.Pages.SystemMenuDataPermissionModal.tabApiPermission')}
        <Tooltip
          title={t(
            'PC.Pages.SystemMenuDataPermissionModal.tabApiPermissionTooltip',
          )}
        >
          <InfoCircleOutlined
            style={{ marginLeft: 4, color: '#999', cursor: 'help' }}
          />
        </Tooltip>
      </span>
    ),
  },
];

/**
 * 数据权限设置弹窗组件
 * 用于配置角色的数据权限，包括模型、智能体、应用页面和数据权限
 */
const DataPermissionModal: React.FC<DataPermissionModalProps> = ({
  open,
  targetId,
  type = 'role',
  name,
  onCancel,
}) => {
  const [form] = Form.useForm();
  // 当前激活的tab
  const [activeTab, setActiveTab] = useState<DataPermissionTabKey>('model');
  // 智能体列表
  const [agentList, setAgentList] = useState<SquarePublishedItemInfo[]>([]);
  // 应用页面列表
  const [pageList, setPageList] = useState<SquarePublishedItemInfo[]>([]);
  // 选中的模型ID列表
  const [selectedModelIds, setSelectedModelIds] = useState<number[]>([]);
  // 选中的智能体ID列表
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);
  // 选中的应用页面关联的agentId列表（此处应该是页面的devAgentId字段值列表）
  const [selectedPageAgentIds, setSelectedPageAgentIds] = useState<number[]>(
    [],
  );
  // 已选中的智能体详情列表（通过ID列表查询）
  const [selectedAgentList, setSelectedAgentList] = useState<AgentConfigInfo[]>(
    [],
  );
  // 已选中的应用页面详情列表（通过ID列表查询）
  const [selectedPageList, setSelectedPageList] = useState<CustomPageDto[]>([]);
  // 已选中的模型列表（通过ID列表过滤）
  const [selectedModelList, setSelectedModelList] = useState<ModelConfigDto[]>(
    [],
  );
  // 智能体搜索关键字
  const [agentSearchKw, setAgentSearchKw] = useState<string>('');
  // 网页应用搜索关键字
  const [pageSearchKw, setPageSearchKw] = useState<string>('');
  // 智能体分页状态
  const [agentPage, setAgentPage] = useState<number>(1);
  const [agentHasMore, setAgentHasMore] = useState<boolean>(false);
  // 网页应用分页状态
  const [pagePage, setPagePage] = useState<number>(1);
  const [pageHasMore, setPageHasMore] = useState<boolean>(false);

  // ======================================= 知识库 =======================================
  // 知识库列表（管控开启的资源）
  const [knowledgeList, setKnowledgeList] = useState<SystemKnowledgeInfo[]>([]);
  const [selectedKnowledgeIds, setSelectedKnowledgeIds] = useState<number[]>(
    [],
  );
  const [selectedKnowledgeList, setSelectedKnowledgeList] = useState<
    KnowledgeInfoById[]
  >([]);
  const [knowledgeSearchKw, setKnowledgeSearchKw] = useState<string>('');
  const [knowledgePage, setKnowledgePage] = useState<number>(1);
  const [knowledgeHasMore, setKnowledgeHasMore] = useState<boolean>(false);

  // 滚动容器引用
  const agentListScrollRef = useRef<HTMLDivElement>(null);
  const pageListScrollRef = useRef<HTMLDivElement>(null);
  const knowledgeListScrollRef = useRef<HTMLDivElement>(null);
  // 保存表单值的状态，用于在组件卸载时保留值
  const [formValuesCache, setFormValuesCache] = useState<DataPermission>({});

  // ============================= API 权限 Tab：可选 API 树 =============================
  /** 左侧树数据，来自 apiGetOpenApiList（随 type 区分角色 / 用户组） */
  const [openApiTreeData, setOpenApiTreeData] = useState<OpenApiDefinition[]>(
    [],
  );
  /** 拉取开放 API 列表时的 loading */
  const [openApiListLoading, setOpenApiListLoading] = useState<boolean>(false);
  /**
   * 开放 API 勾选与限流：列表中的项即勾选节点，含 key / rpm / rpd；
   * 与数据权限接口的 openApiConfigs 一致，用于树勾选回显与提交。
   */
  const [openApiConfigsCache, setOpenApiConfigsCache] = useState<
    OpenApiConfigInfo[]
  >([]);

  // 模型列表
  const {
    data: modelList,
    loading: modelLoading,
    run: runModelList,
  } = useRequest(apiSystemModelList, {
    manual: true,
  });

  // 根据类型选择查询接口
  const getDataPermissionApi =
    type === 'role'
      ? apiGetRoleBoundDataPermissionList
      : apiGetGroupBoundDataPermissionList;

  // 查询数据权限（用于编辑回显）
  const { run: runGetDataPermission } = useRequest(getDataPermissionApi, {
    manual: true,
    onSuccess: (result: DataPermission) => {
      if (!result) return;

      // 回显表单数据
      const formData = {
        tokenLimit: {
          limitPerDay: result.tokenLimit?.limitPerDay ?? -1,
        },
        maxSpaceCount: result.maxSpaceCount ?? -1,
        maxAgentCount: result.maxAgentCount ?? -1,
        maxPageAppCount: result.maxPageAppCount ?? -1,
        maxKnowledgeCount: result.maxKnowledgeCount ?? -1,
        knowledgeStorageLimitGb: result.knowledgeStorageLimitGb ?? -1,
        maxDataTableCount: result.maxDataTableCount ?? -1,
        maxScheduledTaskCount: result.maxScheduledTaskCount ?? -1,
        agentComputerMemoryGb: result.agentComputerMemoryGb ?? 4,
        agentComputerCpuCores: result.agentComputerCpuCores ?? 2,
        agentFileStorageDays: result.agentFileStorageDays ?? -1,
        agentDailyPromptLimit: result.agentDailyPromptLimit ?? -1,
        pageDailyPromptLimit: result.pageDailyPromptLimit ?? -1,
      };
      form.setFieldsValue(formData);
      // 同时更新缓存
      setFormValuesCache(formData as DataPermission);

      // 直接设置选中状态
      setSelectedModelIds(result?.modelIds || []);
      // 回显智能体选择
      setSelectedAgentIds(result?.agentIds || []);
      // 回显应用页面选择
      setSelectedPageAgentIds(result?.pageAgentIds || []);
      // 回显知识库选择
      setSelectedKnowledgeIds(result?.knowledgeIds || []);
      // 回显 API 权限选择
      setOpenApiConfigsCache(result.openApiConfigs || []);
    },
  });

  // 根据ID列表查询智能体详情（已选中的智能体）
  const { run: runGetAgentListByIds } = useRequest(
    apiSystemResourceAgentListByIds,
    {
      manual: true,
      onSuccess: (result: AgentConfigInfo[]) => {
        setSelectedAgentList(result || []);
      },
    },
  );

  // 根据ID列表查询网页应用详情（已选中的网页应用）
  const { run: runGetPageListByIds } = useRequest(
    apiSystemResourcePageListByIds,
    {
      manual: true,
      onSuccess: (result: CustomPageDto[]) => {
        setSelectedPageList(result || []);
      },
    },
  );

  // ======================================= 知识库 =======================================
  // 根据id列表查询知识库列表（数据权限回显）
  const { run: runGetKnowledgeListByIds } = useRequest(
    apiSystemResourceKnowledgeListByIds,
    {
      manual: true,
      onSuccess: (result: KnowledgeInfoById[]) => {
        setSelectedKnowledgeList(result || []);
      },
    },
  );

  // 查询知识库列表
  const { loading: knowledgeLoading, run: runKnowledgeList } = useRequest(
    apiSystemResourceKnowledgeList,
    {
      manual: true,
      onSuccess: (result: SystemKnowledgePage) => {
        // 知识库列表
        const records = result?.records || [];
        // 	总记录数
        const total = result?.total ?? 0;
        // 当前页码
        const currentPage = result?.pageNo ?? 1;
        // 每页条数
        const pageSize = result?.pageSize ?? 20;

        // 判断是否还有更多数据
        setKnowledgeHasMore(currentPage * pageSize < total);
        // 更新页码
        setKnowledgePage(currentPage);

        // 如果是第一页（搜索或首次加载），直接替换列表
        if (currentPage === 1) {
          setKnowledgeList(records);
        } else {
          // 加载更多时，合并新数据
          setKnowledgeList((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = records.filter(
              (item) => !existingIds.has(item.id),
            );
            return [...prev, ...newItems];
          });
        }
      },
    },
  );

  // 广场-已发布智能体列表接口（智能体列表）
  const { loading: agentLoading, run: runAgentList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (result: Page<SquarePublishedItemInfo>) => {
        // 已发布智能体列表
        const records = result.records || [];
        // 当前页码
        const currentPage = result?.current ?? 1;
        // 总页数
        const totalPages = result.pages || 0;

        // 判断是否还有更多数据
        setAgentHasMore(currentPage < totalPages);

        // 更新页码
        setAgentPage(currentPage);

        // 如果是第一页（搜索或首次加载），直接替换列表
        if (currentPage === 1) {
          setAgentList(records);
        } else {
          // 加载更多时，合并新数据
          setAgentList((prev) => {
            // 合并新数据和已有数据，去重
            const existingIds = new Set(prev.map((item) => item.targetId));
            const newItems = records.filter(
              (item) => !existingIds.has(item.targetId),
            );
            return [...prev, ...newItems];
          });
        }
      },
    },
  );

  // 广场-已发布应用页面列表接口
  const { loading: pageLoading, run: runAgentPageList } = useRequest(
    apiPublishedAgentList,
    {
      manual: true,
      onSuccess: (result: Page<SquarePublishedItemInfo>) => {
        const records = result.records || [];
        // 当前页码
        const currentPage = result?.current ?? 1;
        // 总页数
        const totalPages = result.pages || 0;

        // 判断是否还有更多数据
        setPageHasMore(currentPage < totalPages);

        // 更新页码
        setPagePage(currentPage);

        // 如果是第一页（搜索或首次加载），直接替换列表
        if (currentPage === 1) {
          setPageList(records);
        } else {
          // 加载更多时，合并新数据
          setPageList((prev) => {
            // 合并新数据和已有数据，去重
            const existingIds = new Set(prev.map((item) => item.targetId));
            const newItems = records.filter(
              (item) => !existingIds.has(item.targetId),
            );
            return [...prev, ...newItems];
          });
        }
      },
    },
  );

  // 当弹窗打开时，加载数据
  useEffect(() => {
    if (open) {
      // 加载模型列表
      runModelList(AccessControlEnum.Filter);

      // 如果是编辑模式，查询数据权限用于回显
      if (targetId) {
        runGetDataPermission(targetId);
      }
    } else {
      // 重置表单
      form.resetFields();
      const defaultFormValues = {
        tokenLimit: {
          limitPerDay: -1,
        },
        maxSpaceCount: -1,
        maxAgentCount: -1,
        maxPageAppCount: -1,
        maxKnowledgeCount: -1,
        knowledgeStorageLimitGb: -1,
        maxDataTableCount: -1,
        maxScheduledTaskCount: -1,
        agentComputerMemoryGb: 4,
        agentComputerCpuCores: 2,
        agentFileStorageDays: -1,
        agentDailyPromptLimit: -1,
        pageDailyPromptLimit: -1,
      };
      form.setFieldsValue(defaultFormValues);
      // 重置缓存
      setFormValuesCache(defaultFormValues as DataPermission);
      // 重置已选中的数据
      setSelectedModelIds([]);
      setSelectedAgentIds([]);
      setSelectedPageAgentIds([]);
      setAgentList([]);
      setPageList([]);
      setActiveTab('model');
      setSelectedAgentList([]);
      setSelectedPageList([]);
      setAgentSearchKw('');
      setPageSearchKw('');
      setAgentPage(1);
      setPagePage(1);
      setAgentHasMore(false);
      setPageHasMore(false);

      // 重置知识库列表
      setKnowledgeList([]);
      setSelectedKnowledgeIds([]);
      setSelectedKnowledgeList([]);
      setKnowledgeSearchKw('');
      setKnowledgePage(1);
      setKnowledgeHasMore(false);

      // API 权限 Tab 状态重置（关闭弹窗时）
      setOpenApiTreeData([]);
      setOpenApiConfigsCache([]);
      setOpenApiListLoading(false);
    }
  }, [open, targetId]);

  /**
   * 加载 API 权限左侧树数据。
   * type 为 role 时传 OpenApiPermissionTargetTypeEnum.Role，否则传 Group。
   * 树使用 defaultExpandAll，加载后全部展开。
   */
  const loadOpenApiTree = useCallback(async () => {
    const targetType =
      type === 'role'
        ? OpenApiPermissionTargetTypeEnum.Role
        : OpenApiPermissionTargetTypeEnum.Group;
    setOpenApiListLoading(true);
    try {
      const res = await apiGetOpenApiList(targetType);
      if (res.success && res.data) {
        setOpenApiTreeData(res.data);
      } else {
        setOpenApiTreeData([]);
      }
    } catch (e) {
      console.error(e);
      setOpenApiTreeData([]);
    } finally {
      setOpenApiListLoading(false);
    }
  }, [type]);

  // 根据 selectedModelIds 更新 selectedModelList
  useEffect(() => {
    if (modelList && modelList.length > 0 && selectedModelIds.length > 0) {
      const selected = modelList.filter((model: ModelConfigDto) =>
        selectedModelIds.includes(model.id),
      );
      setSelectedModelList(selected);
    } else {
      setSelectedModelList([]);
    }
  }, [modelList, selectedModelIds]);

  // 模型选择配置（使用 id 作为选中 ID）
  const toggleModelSelected = (modelId: number) => {
    // 添加到右侧列表（不从左侧列表移除）
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) {
        return prev;
      }
      return [...prev, modelId];
    });
  };

  // 从右侧删除模型
  const removeModelFromSelected = (modelId: number) => {
    // 从右侧ID列表移除
    setSelectedModelIds((prev) => prev.filter((id) => id !== modelId));
  };

  // 智能体行选择配置（使用 targetId 作为选中 ID）
  const toggleAgentSelected = (targetId: number) => {
    // 添加到右侧列表并更新详情（不从左侧列表移除）
    setSelectedAgentIds((prev) => {
      if (prev.includes(targetId)) {
        return prev;
      }
      const newIds = [...prev, targetId];
      if (newIds.length > 0) {
        runGetAgentListByIds({
          agentIds: newIds,
        });
      }
      return newIds;
    });
  };

  // 查询智能体列表
  const queryAgentList = (page = 1, kw = agentSearchKw) => {
    runAgentList({
      page,
      pageSize: 20,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'ChatBot',
      kw,
      accessControl: AccessControlEnum.Filter, // 访问控制过滤，0 无需过滤，1 过滤出需要权限管控的内容
    });
  };

  // 查询网页应用列表
  const queryPageList = (page = 1, kw = pageSearchKw) => {
    runAgentPageList({
      page,
      pageSize: 20,
      targetType: AgentComponentTypeEnum.Agent,
      targetSubType: 'PageApp',
      kw,
      accessControl: AccessControlEnum.Filter, // 访问控制过滤，0 无需过滤，1 过滤出需要权限管控的内容
    });
  };

  // 查询知识库列表
  const queryKnowledgeList = (page = 1, kw = knowledgeSearchKw) => {
    runKnowledgeList({
      pageNo: page,
      pageSize: 20,
      name: kw || undefined,
      accessControl: AccessControlEnum.Filter,
    });
  };

  // 知识库行选择配置（使用 targetId 作为选中 ID）
  const toggleKnowledgeSelected = (targetId: number) => {
    setSelectedKnowledgeIds((prev) => {
      if (prev.includes(targetId)) {
        return prev;
      }
      const newIds = [...prev, targetId];
      if (newIds.length > 0) {
        runGetKnowledgeListByIds({
          knowledgeIds: newIds,
        });
      }
      return newIds;
    });
  };

  // 从右侧删除知识库
  const removeKnowledgeFromSelected = (knowledgeId: number) => {
    // 从右侧ID列表移除
    setSelectedKnowledgeIds((prev) => prev.filter((id) => id !== knowledgeId));

    // 从右侧列表移除
    setSelectedKnowledgeList((prev) =>
      prev.filter((item) => item.id !== knowledgeId),
    );
  };

  // 从右侧删除智能体，添加回左侧
  const removeAgentFromSelected = (agentId: number) => {
    // 从右侧ID列表移除
    setSelectedAgentIds((prev) => prev.filter((id) => id !== agentId));

    // 从右侧列表移除
    setSelectedAgentList((prev) => prev.filter((item) => item.id !== agentId));
  };

  // 应用页面行选择配置（使用 targetId 作为选中 ID）
  const togglePageSelected = (targetId: number) => {
    // 添加到右侧列表并更新详情（不从左侧列表移除）
    setSelectedPageAgentIds((prev) => {
      if (prev.includes(targetId)) {
        return prev;
      }
      const newIds = [...prev, targetId];
      if (newIds.length > 0) {
        runGetPageListByIds({
          agentIds: newIds,
        });
      }
      return newIds;
    });
  };

  // 从右侧删除网页应用
  const removePageFromSelected = (agentId: number) => {
    // 从右侧ID列表移除
    setSelectedPageAgentIds((prev) => prev.filter((id) => id !== agentId));

    // 从右侧列表移除
    setSelectedPageList((prev) =>
      prev.filter((item) => item.devAgentId !== agentId),
    );
  };

  // 根据类型选择接口
  const apiUrl =
    type === 'role' ? apiRoleBindDataPermission : apiGroupBindDataPermission;

  // 保存数据权限
  const { run: runBindDataPermission, loading: bindLoading } = useRequest(
    apiUrl,
    {
      manual: true,
      debounceInterval: 300,
      onSuccess: () => {
        message.success(
          t('PC.Pages.SystemMenuDataPermissionModal.saveSuccess'),
        );
        onCancel();
      },
    },
  );

  // 保存数据权限
  const handleOk = async () => {
    if (!targetId) {
      message.error(
        t('PC.Pages.SystemMenuDataPermissionModal.missingTargetId'),
      );
      return;
    }

    // 优先使用缓存的值（即使字段被卸载，缓存的值仍然存在）
    let formValues: DataPermission = { ...formValuesCache };

    // 如果当前在开发者权限 tab，尝试验证并获取最新值
    if (activeTab === 'dataPermission') {
      try {
        const validatedValues = (await form.validateFields()) || {};
        // 验证成功，使用验证后的值并更新缓存
        formValues = validatedValues;
        setFormValuesCache(validatedValues);
      } catch (error) {
        // 验证失败时，尝试从表单获取值，如果获取不到则使用缓存
        const currentValues = form.getFieldsValue() || {};
        if (currentValues && Object.keys(currentValues).length > 0) {
          formValues = currentValues;
          setFormValuesCache(currentValues);
        }
      }
    } else {
      // 不在开发者权限 tab 时，尝试从表单获取最新值（如果字段还在）
      const currentValues = form.getFieldsValue() || {};
      if (currentValues && Object.keys(currentValues).length > 0) {
        // 如果表单有值，使用表单值并更新缓存
        formValues = currentValues;
        setFormValuesCache(currentValues);
      }
    }

    // 直接使用选中的模型ID数组
    const modelIds = selectedModelIds.length > 0 ? selectedModelIds : [];

    const idKey = type === 'role' ? 'roleId' : 'groupId';
    const params = {
      [idKey]: targetId,
      dataPermission: {
        ...formValues,
        tokenLimit: {
          limitPerDay: formValues?.tokenLimit?.limitPerDay || -1,
        },
        modelIds,
        agentIds: selectedAgentIds,
        pageAgentIds: selectedPageAgentIds,
        knowledgeIds: selectedKnowledgeIds,
        openApiConfigs: openApiConfigsCache,
      },
    };

    runBindDataPermission(params);
  };

  // 处理 Tab 切换
  const handleTabChange = (key: string) => {
    const tabKey = key as DataPermissionTabKey;
    setActiveTab(tabKey);

    // 智能体 / 网页应用 / 知识库 / API 权限等 Tab 的按需加载
    switch (tabKey) {
      case 'agent':
        // 右侧：根据选中的ID列表查询已选择的智能体
        if (selectedAgentIds.length > 0) {
          runGetAgentListByIds({
            agentIds: selectedAgentIds,
          });
        }
        // 首次切换到智能体 tab 时，加载第一页数据
        if (agentList.length === 0 && !agentLoading) {
          queryAgentList();
        }
        break;
      case 'page':
        // 右侧：根据选中的ID列表查询已选择的网页应用
        if (selectedPageAgentIds.length > 0) {
          runGetPageListByIds({
            agentIds: selectedPageAgentIds,
          });
        }
        // 首次切换到网页应用 tab 时，加载第一页数据
        if (pageList.length === 0 && !pageLoading) {
          queryPageList();
        }
        break;
      case 'knowledge':
        if (selectedKnowledgeIds.length > 0) {
          runGetKnowledgeListByIds({
            knowledgeIds: selectedKnowledgeIds,
          });
        }
        if (knowledgeList.length === 0 && !knowledgeLoading) {
          queryKnowledgeList();
        }
        break;
      case 'apiPermission':
        // 首次进入且尚无树数据时拉取列表（避免重复请求）
        if (openApiTreeData.length === 0 && !openApiListLoading) {
          loadOpenApiTree();
        }
        break;
      default:
        break;
    }
  };

  // 各 Tab 内容拆至 tabPanels/，避免单文件过长
  const renderTabContent = () => {
    const contentMap: Record<DataPermissionTabKey, React.ReactNode> = {
      model: (
        <ModelTabPanel
          modelLoading={modelLoading}
          modelList={modelList}
          selectedModelIds={selectedModelIds}
          selectedModelList={selectedModelList}
          onToggleModel={toggleModelSelected}
          onRemoveModel={removeModelFromSelected}
        />
      ),
      agent: (
        <AgentTabPanel
          agentSearchKw={agentSearchKw}
          onAgentSearchKwChange={setAgentSearchKw}
          onAgentSearch={(v) => queryAgentList(1, v)}
          agentListScrollRef={agentListScrollRef}
          agentLoading={agentLoading}
          agentList={agentList}
          agentHasMore={agentHasMore}
          onLoadMoreAgent={() => queryAgentList(agentPage + 1)}
          selectedAgentIds={selectedAgentIds}
          selectedAgentList={selectedAgentList}
          onToggleAgent={toggleAgentSelected}
          onRemoveAgent={removeAgentFromSelected}
        />
      ),
      page: (
        <PageTabPanel
          pageSearchKw={pageSearchKw}
          onPageSearchKwChange={setPageSearchKw}
          onPageSearch={(v) => queryPageList(1, v)}
          pageListScrollRef={pageListScrollRef}
          pageLoading={pageLoading}
          pageList={pageList}
          pageHasMore={pageHasMore}
          onLoadMorePage={() => queryPageList(pagePage + 1)}
          selectedPageAgentIds={selectedPageAgentIds}
          selectedPageList={selectedPageList}
          onTogglePage={togglePageSelected}
          onRemovePage={removePageFromSelected}
        />
      ),
      knowledge: (
        <KnowledgeTabPanel
          knowledgeSearchKw={knowledgeSearchKw}
          onKnowledgeSearchKwChange={setKnowledgeSearchKw}
          onKnowledgeSearch={(v) => queryKnowledgeList(1, v)}
          knowledgeListScrollRef={knowledgeListScrollRef}
          knowledgeLoading={knowledgeLoading}
          knowledgeList={knowledgeList}
          knowledgeHasMore={knowledgeHasMore}
          onLoadMoreKnowledge={() => queryKnowledgeList(knowledgePage + 1)}
          selectedKnowledgeIds={selectedKnowledgeIds}
          selectedKnowledgeList={selectedKnowledgeList}
          onToggleKnowledge={toggleKnowledgeSelected}
          onRemoveKnowledge={removeKnowledgeFromSelected}
        />
      ),
      dataPermission: (
        <DeveloperPermissionFormTab
          form={form}
          onValuesChange={(allValues) =>
            setFormValuesCache((prev) => ({ ...prev, ...allValues }))
          }
        />
      ),
      apiPermission: (
        <ApiPermissionTabPanel
          openApiListLoading={openApiListLoading}
          openApiTreeData={openApiTreeData}
          openApiConfigsCache={openApiConfigsCache}
          setOpenApiConfigsCache={setOpenApiConfigsCache}
        />
      ),
    };
    return contentMap[activeTab] ?? null;
  };

  return (
    <Modal
      title={t(
        'PC.Pages.SystemMenuDataPermissionModal.titleWithName',
        name || '',
      )}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={t('PC.Common.Global.confirm')}
      cancelText={t('PC.Common.Global.cancel')}
      confirmLoading={bindLoading}
      width={1000}
    >
      <div className={cx(styles.tabsContentWrapper)}>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={getDataPermissionTabItems()}
        />
        <div className={cx(styles.tabContent)}>{renderTabContent()}</div>
      </div>
    </Modal>
  );
};

export default DataPermissionModal;
