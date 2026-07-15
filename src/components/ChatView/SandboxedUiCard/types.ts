export interface SandboxedUiArtifact {
  id?: string;
  title?: string;
  initialHeight?: number;
  html: string;
  css?: string;
  js?: string;
  status?: 'generating' | 'complete' | 'failed';
}
