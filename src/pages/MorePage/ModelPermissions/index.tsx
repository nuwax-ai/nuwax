import CopyIconButton from '@/components/base/CopyIconButton';
import ModelPriceTierList from '@/components/business-component/ModelPriceTierList';
import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { MODEL_TYPE_LIST } from '@/constants/library.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiGetMyModels,
  type MyModelPermissionsTab,
} from '@/services/modelConfig';
import {
  ModelApiProtocolEnum,
  ModelUsageScenarioEnum,
} from '@/types/enums/modelConfig';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import { copyTextToClipboard } from '@/utils/clipboard';
import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, message, Segmented, Tooltip, Typography } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useModel, useSearchParams } from 'umi';
import styles from './index.less';
import ModalitiesTagsCell from './ModalitiesTagsCell';

const { Text } = Typography;

/**
 * Tab 配置：系统模型 / 个人空间模型
 * value 与接口 apiGetMyModels 入参一致，labelKey 对应 i18n 文案
 */
const MODEL_PERMISSIONS_TAB_CONFIG: readonly {
  value: MyModelPermissionsTab;
  labelKey:
    | 'PC.Pages.ModelPermissions.tabSystem'
    | 'PC.Pages.ModelPermissions.tabSpace';
}[] = [
  { value: 'System', labelKey: 'PC.Pages.ModelPermissions.tabSystem' },
  { value: 'Space', labelKey: 'PC.Pages.ModelPermissions.tabSpace' },
];

/** 合法的 Tab 值列表，用于 URL 参数校验 */
const TAB_VALUES: MyModelPermissionsTab[] = MODEL_PERMISSIONS_TAB_CONFIG.map(
  (item) => item.value,
);

/** 生成 Segmented 组件所需的 Tab 选项 */
const getModelPermissionsTabOptions = () =>
  MODEL_PERMISSIONS_TAB_CONFIG.map(({ value, labelKey }) => ({
    value,
    label: dict(labelKey),
  }));

/** 判断 URL 中的 tab 参数是否为合法 Tab 值 */
const isPermissionsTab = (v: string | null): v is MyModelPermissionsTab =>
  TAB_VALUES.includes(v as MyModelPermissionsTab);

/**
 * 解析模型外部 OpenAPI 调用地址
 * @param record 模型配置
 * @param baseModelApiUrl 租户配置的基础模型 API 地址
 * @returns 完整接口地址，缺省字段时返回空字符串
 */
const resolveModelExternalApiUrl = (
  record: ModelConfigDto,
  baseModelApiUrl: string,
): string => {
  const modelId = record.id;
  if (!baseModelApiUrl || !modelId) {
    return '';
  }
  return `${baseModelApiUrl}/${modelId}`;
};

/**
 * 解析可复制的外部 OpenAPI 地址
 * OpenAI 协议需在基础地址后追加 /v1，其他协议保持原样
 */
const resolveCopyableInterfaceUrl = (
  record: ModelConfigDto,
  baseModelApiUrl: string,
): string => {
  const url = resolveModelExternalApiUrl(record, baseModelApiUrl);
  if (!url) {
    return '';
  }
  if (record.apiProtocol === ModelApiProtocolEnum.OpenAI) {
    return url.endsWith('/v1') ? url : `${url}/v1`;
  }
  return url;
};

/** 模型是否支持外部 OpenAPI 调用 */
const supportsExternalOpenApi = (record: ModelConfigDto): boolean =>
  !!record.usageScenarios?.includes(ModelUsageScenarioEnum.OpenApi);

/**
 * 定价列渲染：字符串直接展示，对象结构展示阶梯价格列表
 * @param pricing 接口返回的定价字段
 */
const renderPricingCell = (pricing: ModelConfigDto['pricing']) => {
  if (pricing === null || pricing === undefined || pricing === '') {
    return '-';
  }
  if (typeof pricing === 'string') {
    return pricing;
  }
  return <ModelPriceTierList tiers={pricing.modelPriceTiers} />;
};

/**
 * 模型权限页
 *
 * 功能：只读展示当前用户可用的「系统模型」与「个人空间模型」列表，
 * 支持按模型名称搜索、复制模型标识与外部调用接口地址。
 *
 * 路由：/more-page/model-permissions?tab=System|Space
 *
 * 注意事项：
 * - Tab 切换会同步写入 URL query，刷新后保持当前 Tab
 * - 列表数据由前端按名称关键字过滤，无服务端分页
 */
const ModelPermissions: React.FC = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [searchParams, setSearchParams] = useSearchParams();

  /** 当前 Tab，优先读取 URL ?tab=，非法值回退为 System */
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MyModelPermissionsTab>(
    isPermissionsTab(tabFromUrl) ? tabFromUrl : 'System',
  );

  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  /** 模型能力类型 value -> 展示文案，供模态列 Tag 使用 */
  const capabilityTypeLabelMap = useMemo(
    () =>
      Object.fromEntries(
        MODEL_TYPE_LIST.map((item) => [item.value, item.label]),
      ) as Record<string, string>,
    [],
  );

  const tabOptions = useMemo(getModelPermissionsTabOptions, []);

  /** 切换 Tab：更新本地状态、URL 参数并刷新表格 */
  const handleTabChange = useCallback(
    (value: string | number) => {
      const next = String(value) as MyModelPermissionsTab;
      setActiveTab(next);
      setSearchParams({ tab: next });
      actionRef.current?.reload();
    },
    [setSearchParams],
  );

  /** 重置搜索表单并重新加载列表 */
  const handleReset = useCallback(() => {
    formRef.current?.resetFields();
    actionRef.current?.reset?.();
    actionRef.current?.reload();
  }, []);

  /** 复制模型标识到剪贴板 */
  const handleCopyModelId = useCallback((modelId: string) => {
    copyTextToClipboard(
      modelId,
      () => {
        message.success(dict('PC.Pages.ModelPermissions.modelIdCopied'));
      },
      false,
    );
  }, []);

  /** 复制模型外部 OpenAPI 接口地址到剪贴板 */
  const handleCopyInterfaceAddress = useCallback(
    (record: ModelConfigDto) => {
      const url = resolveCopyableInterfaceUrl(
        record,
        tenantConfigInfo?.baseModelApiUrl,
      );
      if (!url) {
        return;
      }
      copyTextToClipboard(
        url,
        () => {
          message.success(
            dict('PC.Pages.ModelPermissions.interfaceAddressCopied'),
          );
        },
        false,
      );
    },
    [tenantConfigInfo?.baseModelApiUrl],
  );

  /** 表格列配置 */
  const columns: ProColumns<ModelConfigDto>[] = useMemo(
    () => [
      {
        title: dict('PC.Pages.ModelPermissions.colModelName'),
        dataIndex: 'name',
        key: 'name',
        width: 180,
        fixed: 'left',
        ellipsis: true,
        fieldProps: {
          placeholder: dict('PC.Pages.ModelPermissions.colModelName'),
        },
      },
      {
        title: dict('PC.Pages.ModelPermissions.colModelId'),
        dataIndex: 'model',
        key: 'model',
        width: 220,
        hideInSearch: true,
        tooltip: dict('PC.Pages.ModelPermissions.colModelIdTip'),
        render: (_, record) => (
          <div className={styles['model-id-cell']}>
            <Text className={styles['model-id-text']} ellipsis>
              {record.model}
            </Text>
            <CopyIconButton
              text={record.model}
              showMessage={false}
              className={styles['copy-icon-btn']}
              onCopy={() => handleCopyModelId(record.model)}
            />
          </div>
        ),
      },
      {
        title: dict('PC.Pages.ModelPermissions.colModalities'),
        dataIndex: 'types',
        key: 'types',
        hideInSearch: true,
        render: (_, record) => {
          const types = record.types;
          if (!types?.length) {
            return '-';
          }
          return (
            <ModalitiesTagsCell
              types={types}
              labelMap={capabilityTypeLabelMap}
            />
          );
        },
      },
      {
        title: dict('PC.Pages.ModelPermissions.colExternalCall'),
        key: 'externalCall',
        width: 160,
        hideInSearch: true,
        tooltip: dict('PC.Pages.ModelPermissions.colExternalCallTip'),
        render: (_, record) => {
          if (!supportsExternalOpenApi(record)) {
            return dict('PC.Pages.ModelPermissions.notSupported');
          }
          const interfaceUrl = resolveCopyableInterfaceUrl(
            record,
            tenantConfigInfo?.baseModelApiUrl ?? '',
          );
          if (!interfaceUrl) {
            return '-';
          }
          return (
            <Tooltip title={interfaceUrl}>
              <Button
                type="link"
                className={styles['interface-address-btn']}
                onClick={() => handleCopyInterfaceAddress(record)}
              >
                {dict('PC.Pages.ModelPermissions.copyInterface')}
              </Button>
            </Tooltip>
          );
        },
      },
      {
        title: dict('PC.Pages.ModelPermissions.colApiProtocol'),
        dataIndex: 'apiProtocol',
        key: 'apiProtocol',
        width: 120,
        hideInSearch: true,
      },
      {
        title: dict('PC.Pages.ModelPermissions.colPrice'),
        dataIndex: 'pricing',
        key: 'pricing',
        hideInSearch: true,
        render: (_, record) => renderPricingCell(record.pricing),
      },
    ],
    [
      capabilityTypeLabelMap,
      handleCopyInterfaceAddress,
      handleCopyModelId,
      tenantConfigInfo?.baseModelApiUrl,
    ],
  );

  /**
   * ProTable 数据请求
   * 按 activeTab 拉取对应模型列表，并在前端按 name 关键字过滤
   */
  const request = useCallback(
    async (params: ParamsType & { name?: string }) => {
      try {
        const res = await apiGetMyModels(activeTab);
        if (res.code !== SUCCESS_CODE) {
          message.error(
            res.message || dict('PC.Pages.GlobalModelManage.fetchDataFailed'),
          );
          return { data: [], total: 0, success: false };
        }
        const nameKeyword = params.name?.trim();
        let data = res.data || [];
        if (nameKeyword) {
          const lowerKeyword = nameKeyword.toLowerCase();
          data = data.filter((item) =>
            item.name?.toLowerCase().includes(lowerKeyword),
          );
        }
        return {
          data,
          total: data.length,
          success: true,
        };
      } catch {
        return { data: [], total: 0, success: false };
      }
    },
    [activeTab],
  );

  return (
    <WorkspaceLayout title={dict('PC.Routes.modelPermissions')} hideScroll>
      <XProTable<ModelConfigDto>
        className={styles['permissions-table']}
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        request={request}
        pagination={false}
        onReset={handleReset}
        headerTitle={
          <Segmented
            options={tabOptions}
            value={activeTab}
            onChange={handleTabChange}
            className={styles.segmented}
          />
        }
        scroll={{ x: 'max-content' }}
        params={{ tab: activeTab }}
      />
    </WorkspaceLayout>
  );
};

export default ModelPermissions;
