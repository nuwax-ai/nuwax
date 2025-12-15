import { PublishStatusEnum } from '@/types/enums/common';

export default function SkillStatus({
  publishStatus,
}: {
  publishStatus: PublishStatusEnum;
}) {
  switch (publishStatus) {
    case PublishStatusEnum.Published:
      return <span>已发布</span>;
    case PublishStatusEnum.Applying:
      return <span>审核中</span>;
    case PublishStatusEnum.Developing:
      return <span>开发中</span>;
    case PublishStatusEnum.Rejected:
      return <span>已拒绝</span>;
    default:
      return <span>&nbsp;</span>;
  }
}
