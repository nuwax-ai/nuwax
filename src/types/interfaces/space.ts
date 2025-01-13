import { ApplicationMoreActionEnum } from '@/types/enums/space';

export interface ApplicationItemProps {
  onClickMore: (type: ApplicationMoreActionEnum) => void;
}

export interface AgentAnalyzeProps {
  open: boolean;
  onCancel: () => void;
}
