import ConditionRender from '@/components/ConditionRender';
import LabelStar from '@/components/LabelStar';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import {
  AsyncRunProps,
  AsyncRunSaveParams,
} from '@/types/interfaces/agentConfig';
import { Button, Input, Switch } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const AsyncRun: React.FC<AsyncRunProps> = ({ onSaveSet }) => {
  const [async, setAsync] = useState<DefaultSelectedEnum>(
    DefaultSelectedEnum.No,
  );
  const [asyncReplyContent, setAsyncReplyContent] =
    useState<string>('已经开始为您处理，请耐心等待运行结果');

  // 保存
  const handleSave = () => {
    const data: AsyncRunSaveParams = {
      async,
      asyncReplyContent,
    };
    onSaveSet(data);
  };

  return (
    <div className={cx('flex', 'flex-col', 'h-full', styles.container)}>
      <div className={cx('flex-1')}>
        <header className={cx('flex', 'items-center', styles.header)}>
          <div className={cx('flex-1')}>异步运行</div>
          <Switch
            checked={async === DefaultSelectedEnum.Yes}
            onChange={(checked) =>
              setAsync(
                checked ? DefaultSelectedEnum.Yes : DefaultSelectedEnum.No,
              )
            }
          />
        </header>
        <p className={cx(styles.desc)}>
          任务进入异步运行时默认返回一条回复内容，用户可以继续对话，任务在后台运行完成后会通知用户
        </p>
        <ConditionRender condition={async}>
          <LabelStar className={cx(styles['reply-content'])} label="回复内容" />
          <Input.TextArea
            className={cx('dispose-textarea-count')}
            classNames={{
              textarea: cx(styles.textarea),
            }}
            placeholder="您可以在这里设置消息回复,任务运行时将自动回复,比如: 任务已在进行中,一旦完成我将第一时间向您报告结果,您还有其他需要我协助的事项吗?"
            autoSize={{ minRows: 5, maxRows: 6 }}
            maxLength={1000}
            showCount
            value={asyncReplyContent}
            onChange={(e) => setAsyncReplyContent(e.target.value)}
          />
          <ConditionRender condition={!asyncReplyContent}>
            <p className={cx(styles.tips)}>回复内容必须设置</p>
          </ConditionRender>
        </ConditionRender>
      </div>
      <footer className={cx(styles.footer)}>
        <Button type="primary" onClick={handleSave}>
          保存
        </Button>
      </footer>
    </div>
  );
};

export default AsyncRun;
