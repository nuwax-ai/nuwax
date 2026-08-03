import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readStatic = (relativePath: string) =>
  fs.readFileSync(
    path.resolve(process.cwd(), 'public/static', relativePath),
    'utf8',
  );

describe('OpenUI static preview entry', () => {
  it('does not make ordinary file previews download heavy runtime assets', () => {
    const entry = readStatic('file-preview.html');

    expect(entry).not.toContain('openui-runtime/runtime.js');
    expect(entry).not.toContain('openui-runtime/runtime.css');
  });

  it('does not expose file downloads for OpenUI artifacts', () => {
    const previewSource = readStatic('file-preview/file-preview.js');

    expect(previewSource).toContain("if (fileType === 'openui')");
    expect(previewSource).toContain("downloadUrl = ''");
    expect(previewSource).toContain("getElementById('previewDownloadBtn')");
    expect(previewSource).toContain("getElementById('errorDownloadBtn')");
    expect(previewSource).toContain('previewDownloadButton.remove()');
    expect(previewSource).toContain('errorDownloadButton.remove()');
    expect(previewSource).toContain(
      "fileType !== 'openui' && params.dl === '1'",
    );
  });

  it('dynamically loads runtime assets in the unified file-preview entry', () => {
    const source = readStatic('file-preview/file-preview-openui.js');

    expect(source).toContain('filePath || parentManaged');
    expect(source).toContain('loadOpenUiRuntimeDirect(');
    expect(source).toContain("runtime.type = 'module'");
    expect(source).toContain('/static/openui-runtime/runtime.js');
    expect(source).toContain("data.type === 'OPENUI_FP_ARTIFACT'");
    expect(source).toContain("data.type === 'OPENUI_FP_ERROR'");
    expect(source).toContain('success: isChat');
    expect(source).not.toContain('window.location.replace(runtimeUrl)');
  });

  it('keeps shared previews read-only', () => {
    const source = readStatic('file-preview/file-preview-openui.js');

    expect(source).toContain("type: 'OPENUI_ACTION_RESULT'");
    expect(source).toContain('success: isChat');
    expect(source).toContain('Share preview is read-only');
  });

  it('keeps file-preview.html as the only business preview HTML entry', () => {
    const source = readStatic('file-preview/file-preview-openui.js');
    const legacyEntry = readStatic('openui-runtime/index.html');

    expect(source).not.toContain('openui-runtime/index.html');
    expect(source).not.toContain('openui-frame.html');
    expect(legacyEntry).toContain("'/static/file-preview.html?openui=1'");
  });

  it('keeps runtime asset cache keys synchronized with the installed package', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf8'),
    ) as { dependencies: Record<string, string> };
    const version = packageJson.dependencies[
      '@nuwax-ai/openui-runtime'
    ].replace(/^[^\d]*/, '');
    const source = readStatic('file-preview/file-preview-openui.js');
    const entry = readStatic('file-preview.html');

    expect(source).toContain(`OPENUI_RUNTIME_ASSET_VERSION = '${version}'`);
    expect(entry).toContain(`file-preview-openui.js?v=runtime-${version}`);
  });

  it('retains a standalone nested-frame diagnostic page', () => {
    const debugPage = readStatic('openui-debug.html');
    const debugFrame = readStatic('openui-debug-frame.html');

    expect(debugPage).toContain('OPENUI_DEBUG_PARENT_PING');
    expect(debugPage).toContain('crypto.subtle.digest');
    expect(debugPage).toContain('OPENUI_FP_ARTIFACT');
    expect(debugFrame).toContain('OPENUI_DEBUG_FRAME_MODULE');
  });
});
