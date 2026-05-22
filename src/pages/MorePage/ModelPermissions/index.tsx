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
import { ModelUsageScenarioEnum } from '@/types/enums/modelConfig';
import type { ModelConfigDto } from '@/types/interfaces/systemManage';
import { copyTextToClipboard } from '@/utils/clipboard';
import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, message, Segmented, Tag, Typography } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useModel, useSearchParams } from 'umi';
import styles from './index.less';

const { Text } = Typography;

/** 模型权限 Tab：value 与 i18n key */
const MODEL_PERMISSIONS_TAB_CONFIG: readonly {
  value: MyModelPermissionsTab;
  labelKey:
    | 'PC.Pages.ModelPermissions.tabSystem'
    | 'PC.Pages.ModelPermissions.tabSpace';
}[] = [
  { value: 'System', labelKey: 'PC.Pages.ModelPermissions.tabSystem' },
  { value: 'Space', labelKey: 'PC.Pages.ModelPermissions.tabSpace' },
];

const TAB_VALUES: MyModelPermissionsTab[] = MODEL_PERMISSIONS_TAB_CONFIG.map(
  (item) => item.value,
);

const getModelPermissionsTabOptions = () =>
  MODEL_PERMISSIONS_TAB_CONFIG.map(({ value, labelKey }) => ({
    value,
    label: dict(labelKey),
  }));

const isPermissionsTab = (v: string | null): v is MyModelPermissionsTab =>
  TAB_VALUES.includes(v as MyModelPermissionsTab);

/** 解析外部调用接口地址：租户 baseModelApiUrl + / + 模型id */
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

const supportsExternalOpenApi = (record: ModelConfigDto): boolean =>
  !!record.usageScenarios?.includes(ModelUsageScenarioEnum.OpenApi);

/** 定价列展示 */
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
 * 模型权限页：展示当前用户可用的系统模型与个人空间模型（只读列表）
 */
const ModelPermissions: React.FC = () => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<MyModelPermissionsTab>(
    isPermissionsTab(tabFromUrl) ? tabFromUrl : 'System',
  );
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const capabilityTypeLabelMap = useMemo(
    () =>
      Object.fromEntries(
        MODEL_TYPE_LIST.map((item) => [item.value, item.label]),
      ) as Record<string, string>,
    [],
  );

  const tabOptions = useMemo(getModelPermissionsTabOptions, []);

  const handleTabChange = useCallback(
    (value: string | number) => {
      const next = String(value) as MyModelPermissionsTab;
      setActiveTab(next);
      setSearchParams({ tab: next });
      actionRef.current?.reload();
    },
    [setSearchParams],
  );

  const handleReset = useCallback(() => {
    formRef.current?.resetFields();
    actionRef.current?.reset?.();
    actionRef.current?.reload();
  }, []);

  const handleCopyModelId = useCallback((modelId: string) => {
    copyTextToClipboard(
      modelId,
      () => {
        message.success(dict('PC.Pages.ModelPermissions.modelIdCopied'));
      },
      false,
    );
  }, []);

  const handleCopyInterfaceAddress = useCallback(
    (record: ModelConfigDto) => {
      const url = resolveModelExternalApiUrl(
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
            <div className={styles['types-tags-cell']}>
              {types.map((t) => (
                <Tag key={t}>{capabilityTypeLabelMap[t] ?? t}</Tag>
              ))}
            </div>
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
          return (
            <Button
              type="link"
              className={styles['interface-address-btn']}
              onClick={() => handleCopyInterfaceAddress(record)}
            >
              {dict('PC.Pages.ModelPermissions.copyInterface')}
            </Button>
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
    [capabilityTypeLabelMap, handleCopyInterfaceAddress, handleCopyModelId],
  );

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
