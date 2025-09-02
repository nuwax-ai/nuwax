import { ReactComponent as BackwardSvgFile } from '@/assets/icons/nav/backward.svg';
import { ReactComponent as ComponentsSvgFile } from '@/assets/icons/nav/components.svg';
import { ReactComponent as DocSvgFile } from '@/assets/icons/nav/doc.svg';
import { ReactComponent as EcosystemSvgFile } from '@/assets/icons/nav/ecosystem.svg';
import { ReactComponent as HomeSvgFile } from '@/assets/icons/nav/home.svg';
import { ReactComponent as McpSvgFile } from '@/assets/icons/nav/mcp.svg';
import { ReactComponent as NewChatSvgFile } from '@/assets/icons/nav/new_chat.svg';
import { ReactComponent as NotificationSvgFile } from '@/assets/icons/nav/notification.svg';
import { ReactComponent as PaletteSvgFile } from '@/assets/icons/nav/palette.svg';
import { ReactComponent as PluginsSvgFile } from '@/assets/icons/nav/plugins.svg';
import { ReactComponent as PublishAuditSvgFile } from '@/assets/icons/nav/publish_audit.svg';
import { ReactComponent as SettingsSvgFile } from '@/assets/icons/nav/settings.svg';
import { ReactComponent as SpaceSquareSvgFile } from '@/assets/icons/nav/space_square.svg';
import { ReactComponent as SquareSvgFile } from '@/assets/icons/nav/square.svg';
import { ReactComponent as StarsSvgFile } from '@/assets/icons/nav/stars.svg';
import { ReactComponent as TemplateSvgFile } from '@/assets/icons/nav/template.svg';
import { ReactComponent as UserSvgFile } from '@/assets/icons/nav/user.svg';
import { ReactComponent as WorkflowSvgFile } from '@/assets/icons/nav/workflow.svg';
import { ReactComponent as WorkspaceSvgFile } from '@/assets/icons/nav/workspace.svg';
import React from 'react';
import { wrapSvg } from './utils';

const HomeSvg = wrapSvg(HomeSvgFile);
const WorkspaceSvg = wrapSvg(WorkspaceSvgFile);
const SquareSvg = wrapSvg(SquareSvgFile);
const EcosystemSvg = wrapSvg(EcosystemSvgFile);
const DocSvg = wrapSvg(DocSvgFile);
const SettingsSvg = wrapSvg(SettingsSvgFile);
const StarsSvg = wrapSvg(StarsSvgFile);
const PluginsSvg = wrapSvg(PluginsSvgFile);
const TemplateSvg = wrapSvg(TemplateSvgFile);
const WorkflowSvg = wrapSvg(WorkflowSvgFile);
const NewChatSvg = wrapSvg(NewChatSvgFile);
const NotificationSvg = wrapSvg(NotificationSvgFile);
const McpSvg = wrapSvg(McpSvgFile);
const ComponentsSvg = wrapSvg(ComponentsSvgFile);
const SpaceSquareSvg = wrapSvg(SpaceSquareSvgFile);
const UserSvg = wrapSvg(UserSvgFile);
const PublishAuditSvg = wrapSvg(PublishAuditSvgFile);
const BackwardSvg = wrapSvg(BackwardSvgFile);
const PaletteSvg = wrapSvg(PaletteSvgFile);
export default {
  'icons-nav-home': HomeSvg,
  'icons-nav-workspace': WorkspaceSvg,
  'icons-nav-ecosystem': EcosystemSvg,
  'icons-nav-square': SquareSvg,
  'icons-nav-doc': DocSvg,
  'icons-nav-settings': SettingsSvg,
  'icons-nav-stars': StarsSvg,
  'icons-nav-plugins': PluginsSvg,
  'icons-nav-template': TemplateSvg,
  'icons-nav-workflow': WorkflowSvg,
  'icons-nav-new_chat': NewChatSvg,
  'icons-nav-notification': NotificationSvg,
  'icons-nav-mcp': McpSvg,
  'icons-nav-components': ComponentsSvg,
  'icons-nav-space_square': SpaceSquareSvg,
  'icons-nav-user': UserSvg,
  'icons-nav-publish_audit': PublishAuditSvg,
  'icons-nav-backward': BackwardSvg,
  'icons-nav-palette': PaletteSvg,
} as Record<string, React.FC>;
