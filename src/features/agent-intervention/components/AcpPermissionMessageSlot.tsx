import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import React from 'react';
import type {
  AcpPermissionInteraction,
  AcpRequestPermissionResponse,
} from '../types';

export interface AcpPermissionMessageSlotProps {
  className?: string;
  messageInfo: MessageInfo;
  onRespond?: (
    interaction: AcpPermissionInteraction,
    acpResponse: AcpRequestPermissionResponse,
  ) => void;
}

/**
 * @deprecated 已迁移至 AgentInterventionChatLayer 输入框上方固定栏
 */
const AcpPermissionMessageSlot: React.FC<AcpPermissionMessageSlotProps> = () =>
  null;

export default AcpPermissionMessageSlot;
