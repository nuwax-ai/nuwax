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
  /** 是否是系统变量 */
  systemVariable?: boolean;
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
  /** 绑定值（引用路径，用于从 argMap 解析）*/
  bindValue?: string;
}

/**
 * 转换配置项为 PromptVariable 格式
 * 支持多种配置格式，统一转换为 TiptapVariableInput 需要的格式
 *
 * @param configs 配置项数组
 * @param argMap 可选的参数映射，用于从引用中解析对象/数组对象的子属性
 * @returns PromptVariable 数组
 */
export const transformToPromptVariables = (
  configs: VariableConfigItem[] | null | undefined,
  argMap?: Record<string, VariableConfigItem>,
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

    // 仅对象或数组对象类型才处理子变量
    const isComplexType = typeStr === 'object' || typeStr === 'array_object';

    // 处理子变量（支持 children 或 subArgs）
    let children = isComplexType ? item.children || item.subArgs : undefined;

    // 如果是对象或数组对象类型，但没有 children，尝试从 argMap 中解析
    if (isComplexType && !children && argMap && item.bindValue) {
      // 从 argMap 中查找被引用变量的定义
      const referencedVar = argMap[item.bindValue];
      if (referencedVar) {
        // 使用被引用变量的 children 或 subArgs
        children = referencedVar.children || referencedVar.subArgs;
      }
    }

    // 转换子变量，如果存在且不为空数组
    const transformedChildren =
      children && children.length > 0
        ? transformToPromptVariables(children, argMap) // 递归时也传递 argMap
        : undefined;

    return {
      key: item.key ? String(item.key) : item.name, // 优先使用 key（转换为 string），否则使用 name
      name: item.name,
      type: type,
      label: item.name, // 使用 name 作为显示标签
      description: item.description || '',
      systemVariable: item.systemVariable || false,
      children: transformedChildren,
    };
  });
};
