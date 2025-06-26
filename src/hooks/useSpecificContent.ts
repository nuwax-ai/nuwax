import { DataTypeEnum, ExceptionHandleTypeEnum } from '@/types/enums/common';
import { Form } from 'antd';
import _ from 'lodash';
import { useMemo } from 'react';
interface outputArg {
  name: string;
  dataType: DataTypeEnum;
  subArgs?: outputArg[];
}
const _convertOutputArgsToJSON = (outputArgs: outputArg[]) => {
  const results: any = {};
  if (!outputArgs || !outputArgs.length) {
    return results;
  }
  const illegalArgs = outputArgs.filter((item: outputArg) => {
    if (!item.name || !item.dataType) {
      return false;
    }
    return true;
  });
  illegalArgs.forEach((item: outputArg) => {
    if (item.dataType === DataTypeEnum.Array_Object) {
      results[item.name] = [_convertOutputArgsToJSON(item.subArgs || [])];
    } else if (item.dataType === DataTypeEnum.Object) {
      results[item.name] = _convertOutputArgsToJSON(item.subArgs || []);
    } else if (item.dataType.startsWith('Array_')) {
      results[item.name] = [];
    } else {
      results[item.name] = '';
    }
  });
  return results;
};

function _mergeByTemplate(template: any, source: any) {
  if (_.isArray(template)) {
    return template.map((item: any, index: number) =>
      _mergeByTemplate(item, _.get(source, index)),
    );
  } else if (_.isPlainObject(template)) {
    const result: any = {};
    for (const key in template) {
      if (template.hasOwnProperty(key)) {
        result[key] = _mergeByTemplate(template[key], source?.[key]);
      }
    }
    return result;
  } else {
    return source !== undefined ? source : template;
  }
}

interface UseSpecificContentProps {
  watchField: string;
  specificContent: string;
  fieldName: string;
}

/**
 * 处理 specificContent 计算的自定义 hook
 * @param props - 包含 form 和 exceptionItemProps 的对象
 * @returns 返回计算后的 specificContent
 */
export const useSpecificContent = ({
  watchField,
  fieldName,
  specificContent: initialSpecificContent,
}: UseSpecificContentProps): string => {
  const form = Form.useFormInstance();
  // 监听表单中的 outputArgs 字段变化
  const outputArgs = Form.useWatch(watchField, { form, preserve: true });
  const exceptionHandleConfig =
    Form.useWatch(fieldName, {
      form,
      preserve: true,
    }) || {};

  // 使用 useMemo 计算 specificContent，当 outputArgs 或 exceptionItemProps.specificContent 变化时重新计算
  const specificContent = useMemo(() => {
    const originalSpecificContent =
      exceptionHandleConfig.specificContent || initialSpecificContent || '{}';
    if (
      exceptionHandleConfig.exceptionHandleType !==
      ExceptionHandleTypeEnum.SPECIFIC_CONTENT
    ) {
      return '';
    }
    try {
      if (!outputArgs) {
        return '';
      }
      const outputArgsJSON = _convertOutputArgsToJSON(outputArgs);

      // 以outputArgsJSON的字段为主不关心除了引用对象之前的值，把specificContent上value 赋值给 outputArgsJSON
      const finalSpecificContent = _mergeByTemplate(
        outputArgsJSON,
        JSON.parse(originalSpecificContent),
      );
      return finalSpecificContent;
    } catch (error) {
      return '';
    }
  }, [outputArgs, exceptionHandleConfig.exceptionHandleType]);

  return specificContent;
};
