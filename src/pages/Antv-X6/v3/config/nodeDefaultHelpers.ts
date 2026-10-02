/** 默认配置的纯构造 helper，供节点定义和原有 Workflow 工厂共用。 */
import { DataTypeEnum } from '@/types/enums/common';
import {
  createEmptyConditionArg,
  createOtherIntentBranch,
} from '../agentFlow/adapters/routeConditionAdapter';

export function generateDefaultConfigUuid(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

interface DefaultArgOptions {
  key: string;
  name: string;
  description?: string;
  dataType: DataTypeEnum;
  require?: boolean;
  systemVariable?: boolean;
  bindValueType?: string | null;
  bindValue?: string | null;
  subArgs?: any[] | null;
}

/** 与后端 inputArgs/outputArgs 字段保持一致。 */
export function createDefaultArg(options: DefaultArgOptions): any {
  return {
    key: options.key,
    name: options.name,
    displayName: null,
    description: options.description || '',
    dataType: options.dataType,
    originDataType: null,
    require: options.require ?? false,
    enable: true,
    systemVariable: options.systemVariable ?? false,
    bindValueType: options.bindValueType ?? null,
    bindValue: options.bindValue ?? null,
    subArgs: options.subArgs ?? null,
    inputType: null,
    selectConfig: null,
    loopId: null,
    children: options.subArgs ?? null,
  };
}

export function createDefaultExceptionHandleConfig(): any {
  return {
    retryCount: 0,
    timeout: 180,
    exceptionHandleType: 'INTERRUPT',
    specificContent: {},
    exceptionHandleNodeIds: [],
  };
}

export function createDefaultIntentConfig(): any[] {
  return [
    {
      uuid: `intent-${generateDefaultConfigUuid()}`,
      name: '',
      intent: '',
      intentType: 'NORMAL',
      conditionType: 'AND',
      conditionArgs: [createEmptyConditionArg()],
      nextNodeIds: [],
    },
    createOtherIntentBranch(),
  ];
}
