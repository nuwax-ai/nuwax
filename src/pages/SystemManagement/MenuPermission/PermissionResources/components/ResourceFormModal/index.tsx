import CustomFormModal from '@/components/CustomFormModal';
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
} from '../../../services/permission-resources';
import {
  ResourceSourceEnum,
  ResourceTreeNode,
  ResourceTypeEnum,
  ResourceVisibleEnum,
  type ResourceInfo,
} from '../../../types/permission-resources';
import styles from './index.less';

const { TextArea } = Input;
const cx = classNames.bind(styles);

interface ResourceFormModalProps {
  /** 是否打开 */
  open: boolean;
  /** 是否为编辑模式 */
  isEdit?: boolean;
  /** 编辑时的资源数据 */
  resourceInfo?: ResourceInfo | null;
  /** 新增时，默认排序索引，默认1 */
  defaultSortIndex?: number;
  /** 父资源（新增子资源时使用） */
  parentResource?: ResourceTreeNode | null;
  /** 取消回调 */
  onCancel: () => void;
  /** 成功回调 */
  onSuccess: () => void;
}

// 资源类型选项
const RESOURCE_TYPE_OPTIONS = [
  { label: '模块', value: ResourceTypeEnum.Module },
  { label: '组件', value: ResourceTypeEnum.Component },
];

// 资源来源选项 来源 1:系统内置 2:用户自定义
const RESOURCE_SOURCE_OPTIONS = [
  { label: '系统内置', value: ResourceSourceEnum.SystemBuiltIn },
  { label: '用户自定义', value: ResourceSourceEnum.UserDefined },
];

/**
 * 权限资源表单Modal组件
 * 用于新增或编辑权限资源信息
 */
const ResourceFormModal: React.FC<ResourceFormModalProps> = ({
  open,
  isEdit = false,
  /** 编辑时，资源信息 */
  resourceInfo,
  /** 新增时，默认排序索引，默认1 */
  defaultSortIndex = 1,
  /** 新增时，父资源信息 */
  parentResource,
  /** 取消回调 */
  onCancel,
  /** 成功回调 */
  onSuccess,
}) => {
  const [form] = Form.useForm();

  // 新增资源
  const { run: runAddResource, loading: addLoading } = useRequest(
    apiAddResource,
    {
      manual: true,
      onSuccess: () => {
        message.success('新增资源成功');
        onSuccess();
      },
    },
  );

  // 更新资源
  const { run: runUpdateResource, loading: updateLoading } = useRequest(
    apiUpdateResource,
    {
      manual: true,
      onSuccess: () => {
        message.success('更新资源成功');
        onSuccess();
      },
    },
  );

  // 根据ID查询权限资源
  const { run: runGetResourceById, data: resourceInfoResponse } = useRequest(
    apiGetResourceById,
    {
      manual: true,
    },
  );

  // 查询资源树列表（用于父节点选择）
  const { run: runGetResourceList, data: resourceTreeList } = useRequest(
    apiGetResourceList,
    {
      manual: true,
    },
  );

  useEffect(() => {
    if (open) {
      // 查询资源树列表
      runGetResourceList();
      if (isEdit && resourceInfo) {
        // 编辑模式：查询资源详情
        runGetResourceById(resourceInfo.id);
      } else {
        // 新增模式：重置表单并设置初始值
        form.resetFields();
        form.setFieldsValue({
          sortIndex: 1,
          type: ResourceTypeEnum.Module,
          visible: true,
          source: ResourceSourceEnum.UserDefined,
          parentId: undefined,
        });
      }
    }
  }, [open, isEdit, resourceInfo]);

  // 初始化表单数据（编辑模式）
  useEffect(() => {
    if (open && isEdit && resourceInfoResponse) {
      // 编辑模式：填充表单数据
      form.setFieldsValue({
        code: resourceInfoResponse.code,
        name: resourceInfoResponse.name,
        description: resourceInfoResponse.description,
        type: resourceInfoResponse.type,
        parentId: resourceInfoResponse.parentId || undefined,
        path: resourceInfoResponse.path,
        sortIndex: resourceInfoResponse.sortIndex || 1,
        visible: resourceInfoResponse.visible === ResourceVisibleEnum.Visible,
        source: resourceInfoResponse.source || ResourceSourceEnum.UserDefined,
      });
    }
  }, [open, isEdit, resourceInfoResponse]);

  // 初始化表单数据（新增模式）
  useEffect(() => {
    if (parentResource && resourceTreeList && resourceTreeList.length > 0) {
      form.setFieldsValue({
        sortIndex: defaultSortIndex,
        parentId: parentResource?.id,
      });
    }
  }, [resourceTreeList, parentResource, defaultSortIndex]);

  const loading = addLoading || updateLoading;

  // 将资源树转换为TreeSelect需要的数据格式
  const treeSelectData = useMemo(() => {
    const convertToTreeData = (resources: ResourceTreeNode[]): any[] => {
      return (
        resources
          ?.filter(
            (resource) =>
              resource.id !== 0 &&
              (isEdit ? resource.id !== resourceInfo?.id : true),
          ) // 过滤掉根节点（id为0） 编辑模式下过滤掉当前资源
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
    // 如果第一个节点是根节点（id为0），则只返回其子节点
    if (resourceTreeList.length === 1 && resourceTreeList[0].id === 0) {
      const rootNode = resourceTreeList[0];
      return rootNode.children?.length
        ? convertToTreeData(rootNode.children)
        : [];
    }
    // 否则过滤掉所有 id 为 0 的节点
    return convertToTreeData(resourceTreeList);
  }, [resourceTreeList, isEdit && resourceInfo]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = {
        ...values,
        visible: values.visible
          ? ResourceVisibleEnum.Visible
          : ResourceVisibleEnum.Hidden,
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
      console.error('表单验证失败:', error);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={isEdit ? '编辑资源' : '新增资源'}
      open={open}
      loading={loading}
      okText={isEdit ? '保存' : '创建'}
      width={800}
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
        {/* 基本信息 */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="资源码"
              name="code"
              rules={[
                { required: true, message: '请输入资源码' },
                {
                  pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                  message:
                    '资源码必须以英文字母开头，只能包含字母、数字和下划线',
                },
              ]}
            >
              <Input
                disabled={isEdit}
                placeholder="请输入资源码"
                maxLength={100}
                showCount
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="资源名称"
              name="name"
              rules={[{ required: true, message: '请输入资源名称' }]}
            >
              <Input placeholder="请输入资源名称" maxLength={50} showCount />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="资源类型"
              name="type"
              rules={[{ required: true, message: '请选择资源类型' }]}
            >
              <Select
                placeholder="请选择资源类型"
                options={RESOURCE_TYPE_OPTIONS}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="排序" name="sortIndex">
              <InputNumber
                placeholder="请输入排序"
                className={cx('w-full')}
                min={1}
                max={10000}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="父节点" name="parentId">
              <TreeSelect
                placeholder="请选择父节点（无）"
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
              label="路由路径"
              name="path"
              rules={[
                {
                  pattern: /^\/[a-zA-Z0-9/?#&=._:@%+ -]+$/,
                  message:
                    '路由路径必须以斜杠开头，只能包含英文字母、数字、斜杠和URL常见特殊字符（?、#、&、=、.、_、-、:、%、@、+、空格）',
                },
                {
                  max: 500,
                  message: '路由路径长度不能超过500个字符',
                },
              ]}
              tooltip={{
                title:
                  '静态路由，例如：/system/menu; 动态路由，例如：/system/menu/:id',
                icon: <InfoCircleOutlined />,
              }}
            >
              <Input placeholder="请输入路由路径，例如：/system/menu" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="来源" name="source">
              <Select
                placeholder="请选择来源"
                options={RESOURCE_SOURCE_OPTIONS}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="是否显示"
              name="visible"
              valuePropName="checked"
              tooltip={{
                title: '是否显示此资源',
                icon: <InfoCircleOutlined />,
              }}
            >
              <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="描述" name="description">
          <TextArea
            placeholder="请输入描述"
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
