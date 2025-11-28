/*
 * Variable Transform Utils
 * 变量转换工具函数
 */

import type React from 'react';
import type { PromptVariable } from '../types';
import { VariableType } from '../types';

/**
 * 配置项接口（兼容多种配置格式）
 */
interface VariableConfigItem {
  /** 变量名称 */
  name: string;
  /** 变量键值（可选，支持多种类型） */
  key?: string | number | bigint | React.Key;
  /** 数据类型 */
  dataType?: string;
  /** 变量描述 */
  description?: string;
  /** 子变量（支持 children 或 subArgs） */
  children?: VariableConfigItem[];
  subArgs?: VariableConfigItem[];
}

/**
 * 转换配置项为 PromptVariable 格式
 * 支持多种配置格式，统一转换为 TiptapVariableInput 需要的格式
 *
 * @param configs 配置项数组
 * @returns PromptVariable 数组
 */
export const transformToPromptVariables = (
  configs: VariableConfigItem[] | null | undefined,
): PromptVariable[] => {
  if (!configs || !Array.isArray(configs)) {
    return [];
  }

  return configs.map((item) => {
    // 处理数据类型，转换为 VariableType
    const typeStr = item.dataType?.toLowerCase() || 'string';
    let type: VariableType = VariableType.String;
    if (Object.values(VariableType).includes(typeStr as VariableType)) {
      type = typeStr as VariableType;
    }

    // 处理子变量（支持 children 或 subArgs）
    const children = item.children || item.subArgs;

    return {
      key: item.key ? String(item.key) : item.name, // 优先使用 key（转换为 string），否则使用 name
      name: item.name,
      type: type,
      label: item.name, // 使用 name 作为显示标签
      description: item.description || '',
      children: children ? transformToPromptVariables(children) : undefined,
    };
  });
};
