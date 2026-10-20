import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import {
  extractXlsxImages,
  imagesFromPreviewer,
  omitXlsxDrawings,
  placeXlsxImage,
} from './xlsxSheetImages';

const RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const OFFICE_NS =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
  (char) => char.charCodeAt(0),
);

function relationships(
  rows: Array<{ id: string; kind: string; target: string }>,
): string {
  return `<Relationships xmlns="${RELS_NS}">${rows
    .map(
      (row) =>
        `<Relationship Id="${row.id}" Type="${OFFICE_NS}/${row.kind}" Target="${row.target}"/>`,
    )
    .join('')}</Relationships>`;
}

async function workbookWithImage(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<Types><Override PartName="/xl/drawings/drawing1.xml" ContentType="drawing"/></Types>',
  );
  zip.file(
    'xl/workbook.xml',
    '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="第一页" sheetId="1" r:id="rId1"/></sheets></workbook>',
  );
  zip.file(
    'xl/_rels/workbook.xml.rels',
    relationships([
      { id: 'rId1', kind: 'worksheet', target: 'worksheets/sheet1.xml' },
    ]),
  );
  zip.file(
    'xl/worksheets/sheet1.xml',
    '<worksheet><sheetData><c r="A1"><v>1</v></c></sheetData><drawing r:id="rId1"/></worksheet>',
  );
  zip.file(
    'xl/worksheets/_rels/sheet1.xml.rels',
    relationships([
      { id: 'rId1', kind: 'drawing', target: '../drawings/drawing1.xml' },
    ]),
  );
  zip.file(
    'xl/drawings/drawing1.xml',
    `<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <xdr:twoCellAnchor>
        <xdr:from><xdr:col>1</xdr:col><xdr:colOff>12700</xdr:colOff><xdr:row>2</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>
        <xdr:to><xdr:col>3</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>4</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>
        <xdr:pic><xdr:blipFill><a:blip r:embed="rId1"/></xdr:blipFill></xdr:pic>
      </xdr:twoCellAnchor>
    </xdr:wsDr>`,
  );
  zip.file(
    'xl/drawings/_rels/drawing1.xml.rels',
    relationships([
      { id: 'rId1', kind: 'image', target: '../media/image1.png' },
    ]),
  );
  zip.file('xl/media/image1.png', PNG);
  return zip.generateAsync({ type: 'arraybuffer' });
}

describe('xlsx 图片解析', () => {
  it('没有绘图时不改原文件', async () => {
    const zip = new JSZip();
    zip.file('xl/workbook.xml', '<workbook></workbook>');
    zip.file(
      'xl/worksheets/sheet1.xml',
      '<worksheet><sheetData><c r="A1"><v>1</v></c></sheetData></worksheet>',
    );
    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    expect(await omitXlsxDrawings(buffer)).toBeNull();
    expect(await extractXlsxImages(buffer)).toEqual([]);
  });

  it('抽出浮动图片，并只在副本里去掉绘图', async () => {
    const buffer = await workbookWithImage();
    const images = await extractXlsxImages(buffer);
    expect(images).toHaveLength(1);
    expect(images[0].anchor).toMatchObject({
      fromCol: 1,
      fromColOff: 12700,
      fromRow: 2,
      toCol: 3,
      toRow: 4,
    });
    expect(Array.from(images[0].bytes)).toEqual(Array.from(PNG));

    const stripped = await omitXlsxDrawings(buffer);
    expect(stripped).toBeTruthy();
    expect(stripped).not.toBe(buffer);
    const zip = await JSZip.loadAsync(stripped as ArrayBuffer);
    const sheet = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
    expect(sheet).toContain('<v>1</v>');
    expect(sheet).not.toContain('<drawing');
    expect(zip.file('xl/drawings/drawing1.xml')).toBeNull();
  });

  it('插件字节完整时不重复叠图，ArrayBuffer 图片仍取出', () => {
    const exact = new Uint8Array(PNG);
    expect(
      imagesFromPreviewer({
        mediasSource: [{ extension: 'png', buffer: exact }],
        workbookDataSource: [
          {
            _media: [
              {
                type: 'image',
                imageId: 0,
                range: {
                  tl: { nativeCol: 0, nativeRow: 0 },
                  ext: { width: 40, height: 20 },
                },
              },
            ],
          },
        ],
      }),
    ).toEqual([]);

    const detached = PNG.buffer.slice(0);
    const images = imagesFromPreviewer({
      mediasSource: [{ extension: 'png', buffer: detached }],
      workbookDataSource: [
        {
          _media: [
            {
              type: 'image',
              imageId: 0,
              range: {
                tl: { nativeCol: 1, nativeColOff: 12700, nativeRow: 2 },
                br: { nativeCol: 3, nativeRow: 4 },
              },
            },
          ],
        },
      ],
    });
    expect(images).toHaveLength(1);
    expect(images[0].anchor).toMatchObject({ fromCol: 1, toCol: 3, toRow: 4 });
  });

  it('按已渲染的列宽和行高换算图片位置', () => {
    const metrics = {
      getColWidth: () => 100,
      getRowHeight: () => 20,
    };
    expect(
      placeXlsxImage(
        {
          fromCol: 1,
          fromColOff: 12700,
          fromRow: 2,
          fromRowOff: 0,
          toCol: 3,
          toColOff: 0,
          toRow: 4,
          toRowOff: 0,
        },
        metrics,
      ),
    ).toEqual({ left: 101, top: 40, width: 199, height: 40 });
  });
});
