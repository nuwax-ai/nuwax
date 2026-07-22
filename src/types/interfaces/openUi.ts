import type { OpenUiArtifact as LegacyOpenUiArtifact } from '@nuwax-ai/openui-mcp/contracts';

export interface OpenUiPresentation {
  mode: 'inline' | 'sidecar';
  autoOpen: boolean;
  preferredWidth?: 'compact' | 'normal' | 'wide';
}

export interface OpenUiFile {
  type: 'nuwax.openui-file';
  schemaVersion: 'nuwax.openui-file/v1';
  artifactId: string;
  title: string;
  presentation: OpenUiPresentation;
  document: {
    language: 'openui-lang';
    specVersion: '0.5';
    source: string;
    digest: string;
  };
  bindings: { tools: Array<Record<string, unknown>> };
  fallback: { markdown: string };
  createdAt: string;
  updatedAt: string;
}

export interface OpenUiArtifactRef {
  type: 'nuwax.openui-ref';
  schemaVersion: 'nuwax.openui-ref/v1';
  artifactId: string;
  path: string;
  title: string;
  presentation: OpenUiPresentation;
  digest: string;
  operation: 'created' | 'updated';
}

export interface OpenUiAction {
  type: 'nuwax.openui-action';
  schemaVersion: 'nuwax.openui-action/v1';
  actionId: string;
  artifactId: string;
  artifactPath: string;
  actionName: string;
  values: Record<string, unknown>;
  formName?: string;
  humanFriendlyMessage?: string;
  params?: Record<string, unknown>;
  submittedAt: string;
}

export type OpenUiArtifact = LegacyOpenUiArtifact | OpenUiArtifactRef;

export type OpenUiRenderState =
  | { status: 'absent' }
  | { status: 'ready'; artifact: OpenUiArtifact };
