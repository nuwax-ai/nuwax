import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '@/types/interfaces/acpIntervention';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import React from 'react';

export interface AcpPermissionMessageSlotProps {
  className?: string;
  messageInfo: MessageInfo;
  onRespond?: (
    interaction: AcpPermissionInteraction,
    acpResponse: AcpRequestPermissionResponse,
  ) => void;
}

const AcpPermissionMessageSlot: React.FC<AcpPermissionMessageSlotProps> = () =>
  null;

export default AcpPermissionMessageSlot;
