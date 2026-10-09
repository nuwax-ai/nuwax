import JSZip from 'jszip';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

type PreviewApi = typeof import('./filePreviewPptxEntry');
let api: PreviewApi;
let fixture: ArrayBuffer;
const previewers: Array<ReturnType<PreviewApi['init']>> = [];

const P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const MIME = 'application/vnd.openxmlformats-officedocument.presentationml';

function relations(rows: Array<[string, string, string]>) {
  return `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rows
    .map(
      ([id, type, target]) =>
        `<Relationship Id="${id}" Type="${R}/${type}" Target="${target}"/>`,
    )
    .join('')}</Relationships>`;
}

/** 演示关系刻意采用 2、1 页序，带一个可安全清理的缺失母版声明。 */
async function createPptx() {
  const zip = new JSZip();
  const parts: Array<[string, string]> = [
    ['ppt/presentation.xml', 'presentation.main'],
    ['ppt/slides/slide1.xml', 'slide'],
    ['ppt/slides/slide2.xml', 'slide'],
    ['ppt/slideMasters/slideMaster1.xml', 'slideMaster'],
    ['ppt/slideMasters/slideMaster9.xml', 'slideMaster'],
    ['ppt/slideLayouts/slideLayout1.xml', 'slideLayout'],
  ];
  zip.file(
    '[Content_Types].xml',
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${parts
      .map(
        ([part, type]) =>
          `<Override PartName="/${part}" ContentType="${MIME}.${type}+xml"/>`,
      )
      .join('')}</Types>`,
  );
  zip.file(
    '_rels/.rels',
    relations([['rOffice', 'officeDocument', 'ppt/presentation.xml']]),
  );
  zip.file(
    'ppt/presentation.xml',
    `<p:presentation xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rMaster"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="257" r:id="rSlide2"/><p:sldId id="256" r:id="rSlide1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/><p:defaultTextStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>`,
  );
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    relations([
      ['rMaster', 'slideMaster', 'slideMasters/slideMaster1.xml'],
      ['rSlide1', 'slide', 'slides/slide1.xml'],
      ['rSlide2', 'slide', 'slides/slide2.xml'],
    ]),
  );
  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    `<p:sldMaster xmlns:p="${P}" xmlns:a="${A}" xmlns:r="${R}"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree/></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2"/><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`,
  );
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    relations([['rLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml']]),
  );
  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    `<p:sldLayout xmlns:p="${P}" type="blank"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`,
  );
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    relations([['rMaster', 'slideMaster', '../slideMasters/slideMaster1.xml']]),
  );
  for (const page of [1, 2]) {
    zip.file(
      `ppt/slides/slide${page}.xml`,
      `<p:sld xmlns:p="${P}"><p:cSld><p:spTree/></p:cSld></p:sld>`,
    );
    zip.file(
      `ppt/slides/_rels/slide${page}.xml.rels`,
      relations([
        ['rLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml'],
      ]),
    );
  }
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
}

beforeAll(async () => {
  const browser = {
    document,
    navigator,
    DOMParser,
    XMLSerializer,
    DOMException,
    TextDecoder,
    TextEncoder,
    ArrayBuffer,
    Uint8Array,
    DataView,
    setTimeout,
    clearTimeout,
    crypto,
  } as Record<string, unknown>;
  browser.window = browser;
  browser.self = browser;
  // 直接执行产物的 classic script，检验静态页的 window API，而非 TS 源码 mock。
  runInNewContext(
    readFileSync(
      path.resolve(
        __dirname,
        '../../public/static/file-preview/file-preview-pptx.js',
      ),
      'utf8',
    ),
    browser,
  );
  api = browser.NuwaxPptxPreview as PreviewApi;
  fixture = await createPptx();
});

afterEach(() => {
  previewers.splice(0).forEach((previewer) => previewer.destroy());
  document.body.replaceChildren();
});

describe('静态分享页共享 PPTX bundle', () => {
  it('通过 window 暴露完整 API，使用相同默认资源预算', () => {
    expect(Object.keys(api).sort()).toEqual([
      'DEFAULT_PPTX_PACKAGE_LIMITS',
      'init',
      'preparePptxForPreview',
      'validateAndOrderPptxSlides',
    ]);
    expect(api.DEFAULT_PPTX_PACKAGE_LIMITS).toEqual({
      maxCompressedBytes: 50 * 1024 * 1024,
      maxUncompressedBytes: 200 * 1024 * 1024,
      maxEntries: 10_000,
    });
    expect(Object.isFrozen(api.DEFAULT_PPTX_PACKAGE_LIMITS)).toBe(true);
  });

  it('修复后的真实包可经 load、逐页渲染与校验恢复关系页序', async () => {
    const prepared = await api.preparePptxForPreview(fixture);
    expect(prepared.slidePaths).toEqual([
      'ppt/slides/slide2.xml',
      'ppt/slides/slide1.xml',
    ]);
    expect(prepared.repairedParts).toEqual([
      'ppt/slideMasters/slideMaster9.xml',
    ]);
    const host = document.createElement('div');
    document.body.append(host);
    const previewer = api.init(host, { mode: 'list', width: 800, height: 450 });
    previewers.push(previewer);

    await previewer.load(prepared.buffer);
    expect(host.querySelector('.pptx-preview-slide-wrapper')).toBeNull();
    previewer.pptx.slides.forEach((_, index) =>
      previewer.htmlRender.renderSlide(index),
    );
    api.validateAndOrderPptxSlides(previewer, host, prepared.slidePaths);

    expect(
      Array.from(
        host.querySelectorAll<HTMLElement>('.pptx-preview-slide-wrapper'),
      ).map((page) => page.dataset.pptxSlidePath),
    ).toEqual(prepared.slidePaths);
  });

  it('共享包预算超限与取消保持结构化错误', async () => {
    await expect(
      api.preparePptxForPreview(fixture, { limits: { maxCompressedBytes: 1 } }),
    ).rejects.toMatchObject({ code: 'tooLarge' });
    const controller = new AbortController();
    controller.abort();
    await expect(
      api.preparePptxForPreview(fixture, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('产物中的 renderer 拒绝销毁后迟到的 load，避免创建失效页面', async () => {
    const prepared = await api.preparePptxForPreview(fixture);
    const host = document.createElement('div');
    document.body.append(host);
    const previewer = api.init(host, { mode: 'list', width: 800, height: 450 });
    previewers.push(previewer);
    const pending = previewer.load(prepared.buffer);
    previewer.destroy();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(host.querySelector('.pptx-preview-slide-wrapper')).toBeNull();
  });
});
