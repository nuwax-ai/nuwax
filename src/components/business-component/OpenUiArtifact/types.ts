export const OPENUI_SCHEMA_VERSION = 'nuwax.openui.v1';

export interface OpenUiInlineArtifact {
  schemaVersion: typeof OPENUI_SCHEMA_VERSION;
  artifactId: string;
  title: string;
  openuiLang: string;
  isStreaming: boolean;
  revision: number;
  renderTarget: 'inline';
}

export interface OpenUiIframeArtifact {
  schemaVersion: typeof OPENUI_SCHEMA_VERSION;
  artifactId: string;
  title: string;
  workspaceUrl: string;
  revision: number;
  renderTarget: 'iframe';
}

export type OpenUiArtifact = OpenUiInlineArtifact | OpenUiIframeArtifact;
