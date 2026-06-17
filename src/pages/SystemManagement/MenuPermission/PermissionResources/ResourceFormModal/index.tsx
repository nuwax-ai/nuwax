import CustomFormModal from '@/components/CustomFormModal';
import { t } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import { InfoCircleOutlined } from '@ant-design/icons';
import {
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Switch,
  TreeSelect,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';
import { useRequest } from 'umi';
import {
  apiAddResource,
  apiGetResourceById,
  apiGetResourceList,
  apiUpdateResource,
} from '../../services/permission-resources';
import {
  ResourceEnabledEnum,
  ResourceSourceEnum,
  ResourceTreeNode,
  ResourceTypeEnum,
  type ResourceInfo,
} from '../../types/permission-resources';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface ResourceFormModalProps {
  /** Whether modal is visible */
  open: boolean;
  /** Whether current mode is edit */
  isEdit?: boolean;
  /** Resource data in edit mode */
  resourceInfo?: ResourceInfo | null;
  /** Default sort index in create mode */
  defaultSortIndex?: number;
  /** Parent resource in create-child mode */
  parentResource?: ResourceTreeNode | null;
  /** Cancel callback */
  onCancel: () => void;
  /** Success callback */
  onSuccess: () => void;
}

/**
 * Permission resource form modal.
 * Used to create or edit resource info.
 */
const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  open,
  isEdit = false,
  /** Resource info in edit mode */
  resourceInfo,
  /** Default sort index in create mode */
  defaultSortIndex = 1,
  /** Parent resource info in create mode */
  parentResource,
  /** Cancel callback */
  onCancel,
  /** Success callback */
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const resourceTypeOptions = useMemo(
    () => [
      {
        label: t('PC.Pages.SystemPermissionResourceFormModal.typeModule'),
        value: ResourceTypeEnum.Module,
      },
      {
        label: t('PC.Pages.SystemPermissionResourceFormModal.typeComponent'),
        value: ResourceTypeEnum.Component,
      },
    ],
    [],
  );
  const resourceSourceOptions = useMemo(
    () => [
      {
        label: t(
          'PC.Pages.SystemPermissionResourceFormModal.sourceSystemBuiltIn',
        ),
        value: ResourceSourceEnum.SystemBuiltIn,
      },
      {
        label: t(
          'PC.Pages.SystemPermissionResourceFormModal.sourceUserDefined',
        ),
        value: ResourceSourceEnum.UserDefined,
      },
    ],
    [],
  );

  // Add resource
  const { run: runAddResource, loading: addLoading } = useRequest(
    apiAddResource,
    {
      manual: true,
      onSuccess: () => {
        message.success(
          t('PC.Pages.SystemPermissionResourceFormModal.addSuccess'),
        );
        onSuccess();
      },
    },
  );

  // Update resource
  const { run: runUpdateResource, loading: updateLoading } = useRequest(
    apiUpdateResource,
    {
      manual: true,
      onSuccess: () => {
        message.success(
          t('PC.Pages.SystemPermissionResourceFormModal.updateSuccess'),
        );
        onSuccess();
      },
    },
  );

  // Query resource details by id
  const { run: runGetResourceById, data: resourceInfoResponse } = useRequest(
    apiGetResourceById,
    {
      manual: true,
    },
  );

  // Query resource tree for parent selection
  const { run: runGetResourceList, data: resourceTreeList } = useRequest(
    apiGetResourceList,
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (open) {
      // Query resource tree
      runGetResourceList();
      if (isEdit && resourceInfo) {
        // Edit mode: query resource detail
        runGetResourceById(resourceInfo.id);
      } else {
        // Create mode: reset form and set default values
        form.resetFields();
        form.setFieldsValue({
          sortIndex: defaultSortIndex || 1,
          type: ResourceTypeEnum.Module,
          status: true,
          source: ResourceSourceEnum.UserDefined,
          parentId: undefined,
        });
      }
    }
  }, [open, isEdit, resourceInfo, defaultSortIndex]);

  // Initialize form data for edit mode
  useEffect(() => {
    if (isEdit && resourceInfoResponse) {
      // Fill form values in edit mode
      form.setFieldsValue({
        code: resourceInfoResponse.code,
        name: resourceInfoResponse.name,
        description: resourceInfoResponse.description,
        type: resourceInfoResponse.type,
        parentId: resourceInfoResponse.parentId || undefined,
        path: resourceInfoResponse.path,
        sortIndex: resourceInfoResponse.sortIndex || 1,
        status: resourceInfoResponse.status === ResourceEnabledEnum.Enabled,
        source: resourceInfoResponse.source || ResourceSourceEnum.UserDefined,
      });
    }
  }, [isEdit, resourceInfoResponse]);

  // Initialize form data for create mode
  useEffect(() => {
    if (parentResource && resourceTreeList && resourceTreeList.length > 0) {
      form.setFieldsValue({
        sortIndex: defaultSortIndex,
        parentId: parentResource?.id,
      });
    }
  }, [resourceTreeList, parentResource, defaultSortIndex]);

  const loading = addLoading || updateLoading;

  // Convert resource tree to TreeSelect data format
  const treeSelectData = useMemo(() => {
    const convertToTreeData = (resources: ResourceTreeNode[]): any[] => {
      return (
        resources
          ?.filter(
            (resource) =>
              resource.id !== 0 &&
              resource.type === ResourceTypeEnum.Module &&
              (isEdit ? resource.id !== resourceInfo?.id : true),
          ) // Filter root node (id=0); in edit mode also filter current resource
          .map((resource) => ({
            title: resource.name,
            value: resource.id,
            key: resource.id,
            children: resource.children
              ? convertToTreeData(resource.children)
              : undefined,
          })) || []
      );
    };
    if (!resourceTreeList || !resourceTreeList.length) {
      return [];
    }
    // If first node is root (id=0), only return its children
    if (resourceTreeList.length === 1 && resourceTreeList[0].id === 0) {
      const rootNode = resourceTreeList[0];
      return rootNode.children?.length
        ? convertToTreeData(rootNode.children)
        : [];
    }
    // Otherwise filter all id=0 nodes
    return convertToTreeData(resourceTreeList);
  }, [resourceTreeList, isEdit && resourceInfo]);

  // Submit handler
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        status: values.status
          ? ResourceEnabledEnum.Enabled
          : ResourceEnabledEnum.Disabled,
      };

      if (isEdit && resourceInfo) {
        await runUpdateResource({
          id: resourceInfo.id,
          ...formData,
        });
      } else {
        await runAddResource(formData);
      }
    } catch (error) {
      console.error('[ResourceFormModal] form validation failed:', error);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={
        isEdit
          ? t('PC.Pages.SystemPermissionResourceFormModal.editTitle')
          : t('PC.Pages.SystemPermissionResourceFormModal.createTitle')
      }
      open={open}
      loading={loading}
      okText={
        isEdit
          ? t('PC.Pages.SystemPermissionResourceFormModal.save')
          : t('PC.Pages.SystemPermissionResourceFormModal.create')
      }
      width={650}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      classNames={{
        body: cx(styles.modalBody),
      }}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        className={cx(styles.form)}
      >
        {/* Basic info */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.code')}
              name="code"
              rules={[
                {
                  pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                  message: t(
                    'PC.Pages.SystemPermissionResourceFormModal.codePatternInvalid',
                  ),
                },
              ]}
              tooltip={{
                title: t(
                  'PC.Pages.SystemPermissionResourceFormModal.codeTooltip',
                ),
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input
                disabled={isEdit}
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.codePlaceholder',
                )}
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.name')}
              name="name"
              rules={[
                {
                  required: true,
                  message: t(
                    'PC.Pages.SystemPermissionResourceFormModal.nameRequired',
                  ),
                },
              ]}
            >
              <Input
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.namePlaceholder',
                )}
                maxLength={50}
                showCount
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.type')}
              name="type"
              rules={[
                {
                  required: true,
                  message: t(
                    'PC.Pages.SystemPermissionResourceFormModal.typeRequired',
                  ),
                },
              ]}
            >
              <Select
                disabled={isEdit}
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.typePlaceholder',
                )}
                options={resourceTypeOptions}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.sort')}
              name="sortIndex"
            >
              <InputNumber
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.sortPlaceholder',
                )}
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.parentNode')}
              name="parentId"
            >
              <TreeSelect
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.parentNodePlaceholder',
                )}
                treeData={treeSelectData}
                allowClear
                showSearch
                treeDefaultExpandAll
                filterTreeNode={(inputValue, node) =>
                  (node.title as string)
                    ?.toLowerCase()
                    .includes(inputValue.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.routePath')}
              name="path"
              rules={[
                {
                  pattern: /^\/[a-zA-Z0-9/?#&=._:@%+ -]+$/,
                  message: t(
                    'PC.Pages.SystemPermissionResourceFormModal.routePathPatternInvalid',
                  ),
                },
                {
                  max: 500,
                  message: t(
                    'PC.Pages.SystemPermissionResourceFormModal.routePathLengthInvalid',
                  ),
                },
              ]}
              tooltip={{
                title: t(
                  'PC.Pages.SystemPermissionResourceFormModal.routePathTooltip',
                ),
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.routePathPlaceholder',
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.source')}
              name="source"
            >
              <Select
                disabled
                placeholder={t(
                  'PC.Pages.SystemPermissionResourceFormModal.sourcePlaceholder',
                )}
                options={resourceSourceOptions}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={t('PC.Pages.SystemPermissionResourceFormModal.enabled')}
              name="status"
              valuePropName="checked"
              tooltip={{
                title: t(
                  'PC.Pages.SystemPermissionResourceFormModal.enabledTooltip',
                ),
                icon: <InfoCircleOutlined />,
              }}
            >
              <Switch
                checkedChildren={t(
                  'PC.Pages.SystemPermissionResourceFormModal.switchEnabled',
                )}
                unCheckedChildren={t(
                  'PC.Pages.SystemPermissionResourceFormModal.switchDisabled',
                )}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          label={t('PC.Pages.SystemPermissionResourceFormModal.description')}
          name="description"
        >
          <TextArea
            placeholder={t(
              'PC.Pages.SystemPermissionResourceFormModal.descriptionPlaceholder',
            )}
            className="dispose-textarea-count"
            autoSize={{ minRows: 3, maxRows: 5 }}
            showCount
            maxLength={500}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default ResourceFormModal;
