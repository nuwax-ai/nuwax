import { ExceptionHandleTypeEnum } from '@/types/enums/common';
import { ChildNode, ExceptionItemProps } from '@/types/interfaces/graph';
import { ExceptionHandleConfig } from '@/types/interfaces/node';
import { showExceptionHandle } from '@/utils/graph';
import { Form } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import '../../../index.less';
import { ExceptionItem } from '../../component/ExceptionItem';
import { getNodeComponent } from '../../config/NodeRegistry';

const ExceptionHandle: React.FC<{
  data: ExceptionHandleConfig | undefined;
}> = ({ data }) => {
  const defaultExceptionItemProps: ExceptionItemProps = useMemo(
    () => ({
      exceptionHandleType: ExceptionHandleTypeEnum.INTERRUPT,
      timeout: 180,
      retryCount: 0,
      name: 'exceptionHandleConfig',
    }),
    [],
  );
  const [exceptionItemProps, setExceptionItemProps] =
    useState<ExceptionItemProps>(defaultExceptionItemProps);
  useEffect(() => {
    setExceptionItemProps((prev) => ({
      ...prev,
      ...(data || {}),
    }));
    return () => {
      setExceptionItemProps(defaultExceptionItemProps);
    };
  }, []);

  return <ExceptionItem {...exceptionItemProps} />;
};

/**
 * V3 专用的 NodePanelDrawer
 * 参考 v1 版本（src/pages/Antv-X6/components/NodePanelDrawer）实现
 * 区别：从 V3 的 component 目录导入组件，而非 src/pages/Antv-X6/component/
 *
 * Refactored: Logic moved to NodeRegistry.tsx
 */
export default function NodePanelDrawerV3({ params }: { params: ChildNode }) {
  const form = Form.useFormInstance();
  const showException = showExceptionHandle(params);
  return (
    <>
      {getNodeComponent(params, form)}
      {/* 处理节点异常项展示*/}
      {showException && (
        <ExceptionHandle data={params.nodeConfig?.exceptionHandleConfig} />
      )}
    </>
  );
}
