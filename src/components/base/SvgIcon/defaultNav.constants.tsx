// 一级导航默认图标下载自 agent.nuwax.com，独立于原有图标资源和名称。
import { ReactComponent as EcosystemSvgFile } from '@/assets/icons/nav/default_ecosystem.svg';
import { ReactComponent as ExpertSkillConnectorSvgFile } from '@/assets/icons/nav/default_expert_skill_connector.svg';
import { ReactComponent as MessageSvgFile } from '@/assets/icons/nav/default_message.svg';
import { ReactComponent as NewChatSvgFile } from '@/assets/icons/nav/default_new_chat.svg';
import { ReactComponent as NuwaAppsSvgFile } from '@/assets/icons/nav/default_nuwa_apps.svg';
import { ReactComponent as RepoSvgFile } from '@/assets/icons/nav/default_repo.svg';
import { ReactComponent as SettingsSvgFile } from '@/assets/icons/nav/default_settings.svg';
import { ReactComponent as WorkspaceSvgFile } from '@/assets/icons/nav/default_workspace.svg';
import type React from 'react';
import { wrapSvg } from './utils';

export default {
  'icons-nav-default-message': wrapSvg(MessageSvgFile),
  'icons-nav-default-new-chat': wrapSvg(NewChatSvgFile),
  'icons-nav-default-repo': wrapSvg(RepoSvgFile),
  'icons-nav-default-expert-skill-connector': wrapSvg(
    ExpertSkillConnectorSvgFile,
  ),
  'icons-nav-default-nuwa-apps': wrapSvg(NuwaAppsSvgFile),
  'icons-nav-default-workspace': wrapSvg(WorkspaceSvgFile),
  'icons-nav-default-ecosystem': wrapSvg(EcosystemSvgFile),
  'icons-nav-default-settings': wrapSvg(SettingsSvgFile),
} as Record<string, React.FC>;
