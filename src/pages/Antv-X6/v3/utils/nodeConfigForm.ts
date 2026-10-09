import type { NodeConfig } from '@/types/interfaces/node';
import type { FormInstance } from 'antd';

type OpaqueConfigKeys = 'contextParams' | 'askConfig';
type NodeConfigFormInput = Omit<NodeConfig, OpaqueConfigKeys> &
  Pick<
    Parameters<FormInstance<NodeConfig>['setFieldsValue']>[0],
    OpaqueConfigKeys
  >;

/** AntD RecursivePartial 无法表达不透明配置中的 unknown；保持整份补丁单次原样写入。 */
export function setNodeConfigFieldsValue(
  form: Pick<FormInstance<NodeConfig>, 'setFieldsValue'>,
  config: NodeConfig,
): void {
  form.setFieldsValue(config as NodeConfigFormInput);
}
