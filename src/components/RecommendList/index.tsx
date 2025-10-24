import { GuidQuestionDto } from '@/types/interfaces/agent';
import type { RecommendListProps } from '@/types/interfaces/agentConfig';
import { checkPathParams, fillPathParams } from '@/utils';
import { LoadingOutlined } from '@ant-design/icons';
import { message as antdMessage } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const RecommendList: React.FC<RecommendListProps> = ({
  className,
  itemClassName,
  loading,
  chatSuggestList,
  onClick,
}) => {
  const { showPagePreview } = useModel('chat');

  const handleShowPage = (eventConfig: GuidQuestionDto) => {
    // 提取参数（从 data 中获取）
    const pathParams: Record<string, any> = {};
    const params: Record<string, any> = {};
    if (eventConfig.args && Array.isArray(eventConfig.args)) {
      eventConfig.args.forEach((arg: any) => {
        if (arg.inputType === 'Path' && arg.name) {
          pathParams[arg.name] = arg.bindValue;
        }
        if (arg.inputType === 'Query' && arg.name && arg.bindValue) {
          params[arg.name] = arg.bindValue;
        }
      });
    }

    // 检查路径模板中的变量是否在 data 中存在且值有效
    if (checkPathParams(eventConfig.pageUrl as string, pathParams)) {
      const pageUrl = fillPathParams(
        eventConfig?.pageUrl as string,
        pathParams,
      );

      // 构建完整的页面 URL
      const fullUri = `${process.env.BASE_URL}${pageUrl}`;

      // 调用页面预览
      showPagePreview({
        name: eventConfig.info || '页面预览',
        uri: fullUri,
        params,
        executeId: `event-${Date.now()}`,
      });
    } else {
      antdMessage.error('页面路径参数配置错误');
    }
  };

  const handleClick = (item: GuidQuestionDto) => {
    if (item.type === 'Question') {
      onClick(item.info);
      return;
    }

    // 内置页面
    if (item.type === 'Page') {
      // 打开页面
      if (!item.pageUrl) {
        antdMessage.error('页面路径配置错误');
        return;
      }
      handleShowPage(item);
      return;
    }

    // 外部页面
    if (item.type === 'Link') {
      // 打开外链
      if (!item.url) {
        antdMessage.error('链接地址配置错误');
        return;
      }
      window.open(item.url, '_blank');
      return;
    }
  };

  return loading ? (
    <div className={cx('flex', styles['loading-box'])}>
      <LoadingOutlined />
    </div>
  ) : chatSuggestList?.length > 0 ? (
    <div className={cx(styles.container, 'flex', 'flex-col', className)}>
      {chatSuggestList?.map((item, index) => {
        if (!item) {
          return null;
        }
        return (
          <div
            key={index}
            onClick={() =>
              typeof item === 'string' ? onClick(item) : handleClick(item)
            }
            className={cx(
              styles.box,
              'cursor-pointer',
              'hover-box',
              itemClassName,
              'text-ellipsis-2',
            )}
          >
            {typeof item === 'object' && item?.icon && (
              <img className={cx(styles.icon)} src={item?.icon} />
            )}
            {typeof item === 'string' ? item : item.info}
          </div>
        );
      })}
    </div>
  ) : null;
};

export default RecommendList;
