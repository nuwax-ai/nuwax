import { PublishStatusEnum } from '@/types/enums/common';
import { Tag } from 'antd';

export default function SkillStatus({
  publishStatus,
}: {
  publishStatus: PublishStatusEnum;
}) {
  switch (publishStatus) {
    case PublishStatusEnum.Published:
      return <Tag color="green">已发布</Tag>;
    case PublishStatusEnum.Applying:
      return <Tag color="blue">审核中</Tag>;
    case PublishStatusEnum.Developing:
      return <Tag color="orange">开发中</Tag>;
    case PublishStatusEnum.Rejected:
      return <Tag color="red">已拒绝</Tag>;
    default:
      return <Tag color="default">-</Tag>;
  }
}
