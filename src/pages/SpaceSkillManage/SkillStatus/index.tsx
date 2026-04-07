import { dict } from '@/services/i18nRuntime';
import { PublishStatusEnum } from '@/types/enums/common';
import { Tag } from 'antd';

export default function SkillStatus({
  publishStatus,
}: {
  publishStatus: PublishStatusEnum;
}) {
  switch (publishStatus) {
    case PublishStatusEnum.Published:
      return (
        <Tag color="green">
          {dict('PC.Pages.SpaceSkillManage.SkillStatus.published')}
        </Tag>
      );
    case PublishStatusEnum.Applying:
      return (
        <Tag color="blue">
          {dict('PC.Pages.SpaceSkillManage.SkillStatus.reviewing')}
        </Tag>
      );
    case PublishStatusEnum.Developing:
      return (
        <Tag color="orange">
          {dict('PC.Pages.SpaceSkillManage.SkillStatus.developing')}
        </Tag>
      );
    case PublishStatusEnum.Rejected:
      return (
        <Tag color="red">
          {dict('PC.Pages.SpaceSkillManage.SkillStatus.rejected')}
        </Tag>
      );
    default:
      return <Tag color="default">-</Tag>;
  }
}
