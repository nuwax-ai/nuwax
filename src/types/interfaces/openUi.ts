import type { OpenUiArtifact } from '@nuwax-ai/openui-mcp/contracts';

export type { OpenUiArtifact };

export type OpenUiRenderState =
  | { status: 'absent' }
  | { status: 'ready'; artifact: OpenUiArtifact }
  | { status: 'expired'; artifact: OpenUiArtifact }
  | { status: 'untrusted'; artifact: OpenUiArtifact };
