import JSZip from 'jszip';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PPTX_PACKAGE_LIMITS,
  PptxPackageError,
  preparePptxForPreview,
} from './pptxPackage';

const P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const R_NS =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const MIME_PREFIX =
  'application/vnd.openxmlformats-officedocument.presentationml';

interface Relation {
  id: string;
  kind: string;
  target: string;
  external?: boolean;
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function relations(rows: Relation[]): string {
  return `<Relationships xmlns="${RELS_NS}">${rows
    .map(
      (row) =>
        `<Relationship Id="${row.id}" Type="${R_NS}/${
          row.kind
        }" Target="${xmlEscape(row.target)}"${
          row.external ? ' TargetMode="External"' : ''
        }/>`,
    )
    .join('')}</Relationships>`;
}

interface FixtureOptions {
  slides?: number;
  order?: number[];
  orphanMasters?: number;
  absoluteTargets?: boolean;
  compression?: 'STORE' | 'DEFLATE';
  mutate?: (zip: JSZip) => void | Promise<void>;
  comment?: string;
}

async function createPptx(options: FixtureOptions = {}): Promise<ArrayBuffer> {
  const zip = new JSZip();
  const count = options.slides ?? 1;
  const order =
    options.order ?? Array.from({ length: count }, (_, index) => index + 1);
  const masterCount = 1 + (options.orphanMasters ?? 0);
  const part = (path: string, mime: string) =>
    `<Override PartName="/${path}" ContentType="${mime}"/>`;
  zip.file(
    '[Content_Types].xml',
    `<Types xmlns="${CT_NS}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${part(
      'ppt/presentation.xml',
      `${MIME_PREFIX}.presentation.main+xml`,
    )}${Array.from({ length: count }, (_, index) =>
      part(`ppt/slides/slide${index + 1}.xml`, `${MIME_PREFIX}.slide+xml`),
    ).join('')}${Array.from({ length: masterCount }, (_, index) =>
      part(
        `ppt/slideMasters/slideMaster${index + 1}.xml`,
        `${MIME_PREFIX}.slideMaster+xml`,
      ),
    ).join('')}${part(
      'ppt/slideLayouts/slideLayout1.xml',
      `${MIME_PREFIX}.slideLayout+xml`,
    )}</Types>`,
  );
  zip.file(
    '_rels/.rels',
    relations([
      { id: 'rOffice', kind: 'officeDocument', target: 'ppt/presentation.xml' },
    ]),
  );
  zip.file(
    'ppt/presentation.xml',
    `<p:presentation xmlns:p="${P_NS}" xmlns:r="${R_NS}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rMaster"/></p:sldMasterIdLst><p:sldIdLst>${order
      .map((slide) => `<p:sldId id="${255 + slide}" r:id="rSlide${slide}"/>`)
      .join('')}</p:sldIdLst></p:presentation>`,
  );
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    relations([
      {
        id: 'rMaster',
        kind: 'slideMaster',
        target: 'slideMasters/slideMaster1.xml',
      },
      ...Array.from({ length: count }, (_, index) => ({
        id: `rSlide${index + 1}`,
        kind: 'slide',
        target: options.absoluteTargets
          ? `/ppt/slides/slide${index + 1}.xml`
          : `./slides/slide${index + 1}.xml`,
      })),
    ]),
  );
  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    `<p:sldMaster xmlns:p="${P_NS}"><p:cSld><p:spTree/></p:cSld></p:sldMaster>`,
  );
  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    `<p:sldLayout xmlns:p="${P_NS}"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`,
  );
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    relations([
      {
        id: 'rMaster',
        kind: 'slideMaster',
        target: options.absoluteTargets
          ? '/ppt/slideMasters/slideMaster1.xml'
          : '../slideMasters/slideMaster1.xml',
      },
    ]),
  );
  for (let slide = 1; slide <= count; slide += 1) {
    zip.file(
      `ppt/slides/slide${slide}.xml`,
      `<p:sld xmlns:p="${P_NS}"><p:cSld><p:spTree/></p:cSld></p:sld>`,
    );
    zip.file(
      `ppt/slides/_rels/slide${slide}.xml.rels`,
      relations([
        {
          id: 'rLayout',
          kind: 'slideLayout',
          target: '../slideLayouts/slideLayout1.xml',
        },
      ]),
    );
  }
  await options.mutate?.(zip);
  return zip.generateAsync({
    type: 'arraybuffer',
    compression: options.compression ?? 'DEFLATE',
    comment: options.comment,
  });
}

function mutateZipHeader(
  buffer: ArrayBuffer,
  mutate: (view: DataView, endOffset: number, directoryOffset: number) => void,
): ArrayBuffer {
  const copy = buffer.slice(0);
  const view = new DataView(copy);
  const endOffset = copy.byteLength - 22;
  mutate(view, endOffset, view.getUint32(endOffset + 16, true));
  return copy;
}

afterEach(() => vi.restoreAllMocks());

describe('preparePptxForPreview', () => {
  it('正常包返回原始 ArrayBuffer，并按 presentation 的页序返回路径', async () => {
    const buffer = await createPptx({ slides: 3, order: [3, 1, 2] });
    const result = await preparePptxForPreview(buffer);
    expect(result.buffer).toBe(buffer);
    expect(result.repairedParts).toEqual([]);
    expect(result.slidePaths).toEqual([
      'ppt/slides/slide3.xml',
      'ppt/slides/slide1.xml',
      'ppt/slides/slide2.xml',
    ]);
  });

  it('45 页加 44 个悬空母版声明时只修改 Content Types，保留原件', async () => {
    const buffer = await createPptx({ slides: 45, orphanMasters: 44 });
    const original = new Uint8Array(buffer.slice(0));
    const result = await preparePptxForPreview(buffer);
    expect(result.buffer).not.toBe(buffer);
    expect(result.slidePaths).toHaveLength(45);
    expect(result.repairedParts).toEqual(
      Array.from(
        { length: 44 },
        (_, index) => `ppt/slideMasters/slideMaster${index + 2}.xml`,
      ),
    );
    expect(new Uint8Array(buffer)).toEqual(original);
    const before = await JSZip.loadAsync(buffer);
    const after = await JSZip.loadAsync(result.buffer);
    expect(Object.keys(after.files)).toEqual(Object.keys(before.files));
    for (const [path, entry] of Object.entries(before.files)) {
      if (entry.dir) continue;
      if (path === '[Content_Types].xml') {
        const xml = await after.file(path)!.async('text');
        expect(xml).toContain('/ppt/slideMasters/slideMaster1.xml');
        expect(xml).not.toContain('/ppt/slideMasters/slideMaster2.xml');
      } else {
        expect(await after.file(path)!.async('uint8array')).toEqual(
          await entry.async('uint8array'),
        );
      }
    }
    expect((await preparePptxForPreview(result.buffer)).buffer).toBe(
      result.buffer,
    );
  });

  it('解析包根绝对路径、相对路径和百分号编码路径', async () => {
    const buffer = await createPptx({
      absoluteTargets: true,
      mutate: (zip) => {
        zip.file(
          'ppt/slides/_rels/slide1.xml.rels',
          relations([
            {
              id: 'rLayout',
              kind: 'slideLayout',
              target: '../slideLayouts/%73lideLayout1.xml',
            },
          ]),
        );
      },
    });
    expect((await preparePptxForPreview(buffer)).slidePaths).toEqual([
      'ppt/slides/slide1.xml',
    ]);
  });

  it('External 关系不算内部引用，也不会要求对应包文件存在', async () => {
    const buffer = await createPptx({
      orphanMasters: 1,
      mutate: (zip) => {
        zip.file(
          'ppt/slides/_rels/slide1.xml.rels',
          relations([
            {
              id: 'rExternal',
              kind: 'hyperlink',
              target: '../slideMasters/slideMaster2.xml',
              external: true,
            },
          ]),
        );
      },
    });
    expect((await preparePptxForPreview(buffer)).repairedParts).toEqual([
      'ppt/slideMasters/slideMaster2.xml',
    ]);
  });

  it('缺失母版仍被内部关系引用时拒绝，不清理其声明', async () => {
    const buffer = await createPptx({
      orphanMasters: 1,
      mutate: (zip) => {
        zip.file(
          'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
          relations([
            {
              id: 'rMaster',
              kind: 'slideMaster',
              target: '../slideMasters/slideMaster2.xml',
            },
          ]),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('缺失母版被演示文稿母版列表引用时拒绝', async () => {
    const buffer = await createPptx({
      orphanMasters: 1,
      mutate: (zip) => {
        zip.file(
          'ppt/_rels/presentation.xml.rels',
          relations([
            {
              id: 'rMaster',
              kind: 'slideMaster',
              target: 'slideMasters/slideMaster2.xml',
            },
            { id: 'rSlide1', kind: 'slide', target: 'slides/slide1.xml' },
          ]),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('缺失的非母版声明不能作为兼容修复被隐藏', async () => {
    const buffer = await createPptx({
      mutate: async (zip) => {
        const xml = await zip.file('[Content_Types].xml')!.async('text');
        zip.file(
          '[Content_Types].xml',
          xml.replace(
            '</Types>',
            `<Override PartName="/ppt/theme/theme2.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>`,
          ),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it.each(['ppt/slides/slide1.xml', 'ppt/slideMasters/slideMaster1.xml'])(
    '拒绝实际使用但缺失的文件：%s',
    async (path) => {
      const buffer = await createPptx({
        mutate: (zip) => {
          zip.remove(path);
        },
      });
      await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
        code: 'damaged',
      });
    },
  );

  it.each([
    [
      '页列表关系断链',
      (xml: string) => xml.replace('r:id="rSlide1"', 'r:id="unknown"'),
    ],
    ['页列表 ID 重复', (xml: string) => xml.replace('id="257"', 'id="256"')],
    [
      '页列表重复引用同一页',
      (xml: string) => xml.replace('r:id="rSlide2"', 'r:id="rSlide1"'),
    ],
    [
      '母版列表关系断链',
      (xml: string) => xml.replace('r:id="rMaster"', 'r:id="unknown"'),
    ],
    [
      '母版列表重复',
      (xml: string) =>
        xml.replace(
          '</p:sldMasterIdLst>',
          '<p:sldMasterId id="2147483649" r:id="rMaster"/></p:sldMasterIdLst>',
        ),
    ],
  ])('拒绝%s', async (_, change) => {
    const buffer = await createPptx({
      slides: 2,
      mutate: async (zip) => {
        zip.file(
          'ppt/presentation.xml',
          change(await zip.file('ppt/presentation.xml')!.async('text')),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('不同关系 ID 指向同一页时也拒绝', async () => {
    const buffer = await createPptx({
      slides: 2,
      mutate: (zip) => {
        zip.file(
          'ppt/_rels/presentation.xml.rels',
          relations([
            {
              id: 'rMaster',
              kind: 'slideMaster',
              target: 'slideMasters/slideMaster1.xml',
            },
            { id: 'rSlide1', kind: 'slide', target: 'slides/slide1.xml' },
            { id: 'rSlide2', kind: 'slide', target: 'slides/slide1.xml' },
          ]),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('关系文件重复 ID 时拒绝', async () => {
    const buffer = await createPptx({
      mutate: (zip) => {
        zip.file(
          'ppt/slides/_rels/slide1.xml.rels',
          relations([
            {
              id: 'duplicate',
              kind: 'slideLayout',
              target: '../slideLayouts/slideLayout1.xml',
            },
            {
              id: 'duplicate',
              kind: 'slideMaster',
              target: '../slideMasters/slideMaster1.xml',
            },
          ]),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it.each([
    'ppt/slides/slide1.xml',
    'ppt/slideLayouts/slideLayout1.xml',
    'customXml/unreferenced.xml',
  ])('拒绝 XML 损坏，包含未引用的 XML：%s', async (path) => {
    const buffer = await createPptx({
      mutate: (zip) => {
        zip.file(path, '<broken>');
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('注释或 CDATA 中的 DOCTYPE 字样不属于文档类型声明', async () => {
    const buffer = await createPptx({
      mutate: async (zip) => {
        const slide = await zip.file('ppt/slides/slide1.xml')!.async('text');
        zip.file(
          'ppt/slides/slide1.xml',
          `<!-- Literal <!DOCTYPE in a comment -->${slide}`,
        );
        zip.file(
          'customXml/literal.xml',
          '<data><![CDATA[<!DOCTYPE is ordinary text]]></data>',
        );
      },
    });
    expect((await preparePptxForPreview(buffer)).buffer).toBe(buffer);
  });

  it.each(['urn:example:custom-data', ''])(
    '合法自定义 parsererror 元素不会被当作解析错误：%s',
    async (namespace) => {
      const buffer = await createPptx({
        mutate: async (zip) => {
          zip.file(
            'customXml/item1.xml',
            `<parsererror xmlns="${namespace}">valid application data</parsererror>`,
          );
          const rels = await zip
            .file('ppt/_rels/presentation.xml.rels')!
            .async('text');
          zip.file(
            'ppt/_rels/presentation.xml.rels',
            rels.replace(
              '</Relationships>',
              `<Relationship Id="rCustom" Type="${R_NS}/customXml" Target="../customXml/item1.xml"/></Relationships>`,
            ),
          );
        },
      });
      expect((await preparePptxForPreview(buffer)).buffer).toBe(buffer);
    },
  );

  it('真实 DOCTYPE 仍被拒绝', async () => {
    const buffer = await createPptx({
      mutate: async (zip) => {
        const slide = await zip.file('ppt/slides/slide1.xml')!.async('text');
        zip.file('ppt/slides/slide1.xml', `<!DOCTYPE p:sld>${slide}`);
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
      message: expect.stringContaining('文档类型声明'),
    });
  });

  it('DOMParser 返回没有根元素的 Document 时返回明确的包错误', async () => {
    const buffer = await createPptx();
    const emptyDocument = document.implementation.createDocument(
      null,
      '',
      null,
    );
    vi.spyOn(DOMParser.prototype, 'parseFromString').mockReturnValueOnce(
      emptyDocument,
    );
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      name: 'PptxPackageError',
      code: 'damaged',
      message: expect.stringContaining('XML 解析失败'),
    });
  });

  it.each([
    '../../../outside.xml',
    '/../../outside.xml',
    '%2e%2e/%2e%2e/%2e%2e/outside.xml',
    '..\\outside.xml',
  ])('拒绝逃出包根目录或含反斜线的内部目标：%s', async (target) => {
    const buffer = await createPptx({
      mutate: (zip) => {
        zip.file(
          'ppt/slides/_rels/slide1.xml.rels',
          relations([{ id: 'escape', kind: 'slideMaster', target }]),
        );
      },
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('在 JSZip 自动清理 zip slip 路径之前拒绝不安全 ZIP 名称', async () => {
    const buffer = await createPptx({
      mutate: (zip) => {
        zip.file('../outside.xml', '<root/>');
      },
    });
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
    expect(load).not.toHaveBeenCalled();
  });

  it('识别旧 PPT，并区分非 ZIP、非 PPTX、损坏 ZIP', async () => {
    const legacy = Uint8Array.from([
      0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
    ]).buffer;
    await expect(preparePptxForPreview(legacy)).rejects.toMatchObject({
      code: 'legacy',
    });
    const encoded = new TextEncoder().encode('<html/>');
    const htmlBuffer = new ArrayBuffer(encoded.byteLength);
    new Uint8Array(htmlBuffer).set(encoded);
    await expect(preparePptxForPreview(htmlBuffer)).rejects.toMatchObject({
      code: 'invalid',
    });
    const unrelated = await new JSZip()
      .file('readme.txt', 'hello')
      .generateAsync({ type: 'arraybuffer' });
    await expect(preparePptxForPreview(unrelated)).rejects.toMatchObject({
      code: 'invalid',
    });
    const valid = await createPptx();
    await expect(
      preparePptxForPreview(valid.slice(0, -8)),
    ).rejects.toMatchObject({ code: 'damaged' });
    expect(new PptxPackageError('invalid', 'message')).toBeInstanceOf(Error);
  });

  it.each([
    ['压缩大小', { maxCompressedBytes: 1 }],
    ['总解压大小', { maxUncompressedBytes: 1 }],
    ['条目数', { maxEntries: 1 }],
  ])('在 JSZip 读取或解压前拦截%s超限', async (_, limits) => {
    const buffer = await createPptx();
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(
      preparePptxForPreview(buffer, { limits }),
    ).rejects.toMatchObject({ code: 'tooLarge' });
    expect(load).not.toHaveBeenCalled();
  });

  it('中央目录声明超过默认条目预算时在解压前拦截', async () => {
    const buffer = mutateZipHeader(await createPptx(), (view, end) => {
      view.setUint16(end + 8, DEFAULT_PPTX_PACKAGE_LIMITS.maxEntries + 1, true);
      view.setUint16(
        end + 10,
        DEFAULT_PPTX_PACKAGE_LIMITS.maxEntries + 1,
        true,
      );
    });
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'tooLarge',
    });
    expect(load).not.toHaveBeenCalled();
  });

  it('中央目录字段越界不会进入 JSZip', async () => {
    const buffer = mutateZipHeader(await createPptx(), (view, _, directory) => {
      view.setUint16(directory + 28, 0xffff, true);
    });
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
    expect(load).not.toHaveBeenCalled();
  });

  it('EOCD 注释中伪造的末尾 EOCD 不会覆盖真实目录', async () => {
    const fakeEnd =
      String.fromCharCode(0x50, 0x4b, 0x05, 0x06) + '\0'.repeat(18);
    const buffer = await createPptx({ comment: fakeEnd });
    expect((await preparePptxForPreview(buffer)).buffer).toBe(buffer);
  });

  it.each([
    [
      'ZIP64',
      (view: DataView, end: number) => {
        view.setUint16(end + 10, 0xffff, true);
      },
    ],
    [
      '分卷 ZIP',
      (view: DataView, end: number) => {
        view.setUint16(end + 4, 1, true);
      },
    ],
    [
      '加密 ZIP',
      (view: DataView, _: number, directory: number) => {
        view.setUint16(directory + 8, 1, true);
      },
    ],
    [
      '不支持的压缩方式',
      (view: DataView, _: number, directory: number) => {
        view.setUint16(directory + 10, 99, true);
      },
    ],
  ])('明确拒绝%s', async (description, change) => {
    const buffer = mutateZipHeader(await createPptx(), change);
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'invalid',
      message: expect.stringContaining(
        description === '不支持的压缩方式' ? '压缩方式' : description,
      ),
    });
    expect(load).not.toHaveBeenCalled();
  });

  it('内容 CRC 不一致时拒绝，而不是把损坏文件当作正常包', async () => {
    const buffer = mutateZipHeader(await createPptx(), (view, _, directory) => {
      // 第一个非空文件的 CRC 字段无需改变 XML 文本即可模拟传输损坏。
      view.setUint32(
        directory + 16,
        view.getUint32(directory + 16, true) ^ 1,
        true,
      );
    });
    await expect(preparePptxForPreview(buffer)).rejects.toMatchObject({
      code: 'damaged',
    });
  });

  it('开始前取消时不读取 ZIP', async () => {
    const buffer = await createPptx();
    const controller = new AbortController();
    controller.abort();
    const load = vi.spyOn(JSZip, 'loadAsync');
    await expect(
      preparePptxForPreview(buffer, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(load).not.toHaveBeenCalled();
  });

  it('异步加载期间取消时在 await 后停止，不返回成功结果', async () => {
    const buffer = await createPptx();
    const zip = await JSZip.loadAsync(buffer);
    let resolveLoad!: (value: JSZip) => void;
    vi.spyOn(JSZip, 'loadAsync').mockReturnValueOnce(
      new Promise((resolve) => {
        resolveLoad = resolve;
      }),
    );
    const controller = new AbortController();
    const result = preparePptxForPreview(buffer, { signal: controller.signal });
    controller.abort();
    resolveLoad(zip);
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
  });
});
