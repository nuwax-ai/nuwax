import { buildSync } from 'esbuild';
import JSZip from 'jszip';
import { createRequire } from 'module';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({ initChart: vi.fn() }));
const require = createRequire(import.meta.url);
let init: typeof import('pptx-preview')['init'];

/** 外部化的依赖不会消费 vi.mock；打包真实安装入口，只替换绘图依赖。 */
function loadRealRenderer(): typeof init {
  const built = buildSync({
    entryPoints: [require.resolve('pptx-preview')],
    bundle: true,
    platform: 'browser',
    format: 'cjs',
    external: ['echarts'],
    write: false,
  });
  const rendererModule = { exports: {} as { init: typeof init } };
  const execute = new Function(
    'require',
    'module',
    'exports',
    built.outputFiles[0].text,
  );
  execute(
    (specifier: string) => {
      if (specifier !== 'echarts')
        throw new Error('Unexpected renderer import.');
      return { init: mocks.initChart };
    },
    rendererModule,
    rendererModule.exports,
  );
  return rendererModule.exports.init;
}

const P_NS = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const C_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart';
const R_NS =
  'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const RELS_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const MIME = 'application/vnd.openxmlformats-officedocument.presentationml';

function rels(rows: Array<[string, string, string]>): string {
  return `<Relationships xmlns="${RELS_NS}">${rows
    .map(
      ([id, kind, target]) =>
        `<Relationship Id="${id}" Type="${R_NS}/${kind}" Target="${target}"/>`,
    )
    .join('')}</Relationships>`;
}

/** 两页共用一个原生 OOXML 柱状图部件，实际解析图表缓存数据。 */
async function createChartPptx(): Promise<ArrayBuffer> {
  const zip = new JSZip();
  const parts: Array<[string, string]> = [
    ['ppt/presentation.xml', `${MIME}.presentation.main+xml`],
    ['ppt/slideMasters/slideMaster1.xml', `${MIME}.slideMaster+xml`],
    ['ppt/slideLayouts/slideLayout1.xml', `${MIME}.slideLayout+xml`],
    [
      'ppt/charts/chart1.xml',
      'application/vnd.openxmlformats-officedocument.drawingml.chart+xml',
    ],
    ['ppt/slides/slide1.xml', `${MIME}.slide+xml`],
    ['ppt/slides/slide2.xml', `${MIME}.slide+xml`],
  ];
  zip.file(
    '[Content_Types].xml',
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${parts
      .map(
        ([part, type]) =>
          `<Override PartName="/${part}" ContentType="${type}"/>`,
      )
      .join('')}</Types>`,
  );
  zip.file(
    '_rels/.rels',
    rels([['rOffice', 'officeDocument', 'ppt/presentation.xml']]),
  );
  zip.file(
    'ppt/presentation.xml',
    `<p:presentation xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rMaster"/></p:sldMasterIdLst><p:sldIdLst><p:sldId id="256" r:id="rSlide1"/><p:sldId id="257" r:id="rSlide2"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/><p:defaultTextStyle><a:lvl1pPr><a:defRPr sz="1800"/></a:lvl1pPr></p:defaultTextStyle></p:presentation>`,
  );
  zip.file(
    'ppt/_rels/presentation.xml.rels',
    rels([
      ['rMaster', 'slideMaster', 'slideMasters/slideMaster1.xml'],
      ['rSlide1', 'slide', 'slides/slide1.xml'],
      ['rSlide2', 'slide', 'slides/slide2.xml'],
    ]),
  );
  zip.file(
    'ppt/slideMasters/slideMaster1.xml',
    `<p:sldMaster xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree/></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rLayout"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`,
  );
  zip.file(
    'ppt/slideMasters/_rels/slideMaster1.xml.rels',
    rels([['rLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml']]),
  );
  zip.file(
    'ppt/slideLayouts/slideLayout1.xml',
    `<p:sldLayout xmlns:p="${P_NS}" type="blank"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`,
  );
  zip.file(
    'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
    rels([['rMaster', 'slideMaster', '../slideMasters/slideMaster1.xml']]),
  );
  for (const page of [1, 2]) {
    zip.file(
      `ppt/slides/slide${page}.xml`,
      `<p:sld xmlns:p="${P_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}" xmlns:c="${C_NS}"><p:cSld><p:spTree><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="2" name="Chart"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="914400" y="914400"/><a:ext cx="6400800" cy="3200400"/></p:xfrm><a:graphic><a:graphicData uri="${C_NS}"><c:chart r:id="rChart"/></a:graphicData></a:graphic></p:graphicFrame></p:spTree></p:cSld></p:sld>`,
    );
    zip.file(
      `ppt/slides/_rels/slide${page}.xml.rels`,
      rels([
        ['rLayout', 'slideLayout', '../slideLayouts/slideLayout1.xml'],
        ['rChart', 'chart', '../charts/chart1.xml'],
      ]),
    );
  }
  zip.file(
    'ppt/charts/chart1.xml',
    `<c:chartSpace xmlns:c="${C_NS}" xmlns:a="${A_NS}"><c:chart><c:plotArea><c:barChart><c:barDir val="col"/><c:grouping val="clustered"/><c:ser><c:idx val="0"/><c:order val="0"/><c:tx><c:strRef><c:f>Sheet1!$B$1</c:f><c:strCache><c:ptCount val="1"/><c:pt idx="0"><c:v>Series</c:v></c:pt></c:strCache></c:strRef></c:tx><c:spPr><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></c:spPr><c:cat><c:strRef><c:f>Sheet1!$A$2:$A$3</c:f><c:strCache><c:ptCount val="2"/><c:pt idx="0"><c:v>A</c:v></c:pt><c:pt idx="1"><c:v>B</c:v></c:pt></c:strCache></c:strRef></c:cat><c:val><c:numRef><c:f>Sheet1!$B$2:$B$3</c:f><c:numCache><c:formatCode>General</c:formatCode><c:ptCount val="2"/><c:pt idx="0"><c:v>3</c:v></c:pt><c:pt idx="1"><c:v>7</c:v></c:pt></c:numCache></c:numRef></c:val></c:ser><c:axId val="1"/><c:axId val="2"/></c:barChart><c:catAx><c:axId val="1"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="b"/><c:crossAx val="2"/></c:catAx><c:valAx><c:axId val="2"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:axPos val="l"/><c:crossAx val="1"/></c:valAx></c:plotArea></c:chart></c:chartSpace>`,
  );
  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
}

type ChartInstance = {
  element: HTMLElement;
  setOption: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
};
const charts: ChartInstance[] = [];
const previewers: ReturnType<typeof init>[] = [];
let fixture: ArrayBuffer;

function createPreviewer() {
  const host = document.createElement('div');
  document.body.append(host);
  const previewer = init(host, { width: 800, height: 450, mode: 'list' });
  previewers.push(previewer);
  return { previewer, host };
}

beforeAll(async () => {
  init = loadRealRenderer();
  fixture = await createChartPptx();
});

beforeEach(() => {
  charts.length = 0;
  previewers.length = 0;
  mocks.initChart.mockReset().mockImplementation((element: HTMLElement) => {
    const chart = { element, setOption: vi.fn(), dispose: vi.fn() };
    charts.push(chart);
    return chart;
  });
});

afterEach(() => {
  previewers.forEach((previewer) => previewer.destroy());
  document.body.replaceChildren();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('真实 pptx-preview 图表资源生命周期', () => {
  it('纯加载不创建图表，正常渲染可初始化并幂等销毁', async () => {
    const { previewer, host } = createPreviewer();
    const pptx = await previewer.load(fixture);
    expect(pptx.slides).toHaveLength(2);
    expect(host.querySelector('.chart-node')).toBeNull();

    vi.useFakeTimers();
    previewer.htmlRender.renderSlide(0);
    expect(host.querySelector('.chart-node')).not.toBeNull();
    expect(mocks.initChart).not.toHaveBeenCalled();
    vi.runAllTimers();

    expect(mocks.initChart).toHaveBeenCalledOnce();
    expect(charts[0].setOption).toHaveBeenCalledWith(
      expect.objectContaining({
        xAxis: expect.objectContaining({ data: ['A', 'B'] }),
        series: [expect.objectContaining({ type: 'bar', data: [3, 7] })],
      }),
    );
    previewer.destroy();
    previewer.destroy();
    expect(charts[0].dispose).toHaveBeenCalledOnce();
  });

  it('创建、加载和销毁另一实例均不释放已有实例的图表', async () => {
    const first = createPreviewer();
    await first.previewer.load(fixture);
    vi.useFakeTimers();
    first.previewer.htmlRender.renderSlide(0);
    vi.runAllTimers();
    const firstChart = charts[0];

    vi.useRealTimers();
    const second = createPreviewer();
    await second.previewer.load(fixture);
    expect(firstChart.dispose).not.toHaveBeenCalled();
    vi.useFakeTimers();
    second.previewer.htmlRender.renderSlide(0);
    vi.runAllTimers();
    const secondChart = charts[1];

    second.previewer.destroy();
    second.previewer.destroy();
    expect(secondChart.dispose).toHaveBeenCalledOnce();
    expect(firstChart.dispose).not.toHaveBeenCalled();
    first.previewer.destroy();
    expect(firstChart.dispose).toHaveBeenCalledOnce();
  });

  it('单个 dispose 抛错时仍释放下一个图表，卸载保持幂等', async () => {
    const { previewer } = createPreviewer();
    await previewer.load(fixture);
    vi.useFakeTimers();
    previewer.htmlRender.renderSlide(0);
    previewer.htmlRender.renderSlide(1);
    vi.runAllTimers();
    charts[0].dispose.mockImplementation(() => {
      throw new Error('drawing cleanup failed');
    });

    expect(() => previewer.destroy()).not.toThrow();
    expect(charts[0].dispose).toHaveBeenCalledOnce();
    expect(charts[1].dispose).toHaveBeenCalledOnce();
    expect(() => previewer.destroy()).not.toThrow();
    expect(charts[0].dispose).toHaveBeenCalledOnce();
    expect(charts[1].dispose).toHaveBeenCalledOnce();
  });

  it('删除某页只释放该页图表，同实例其他页和其他实例继续可用', async () => {
    const first = createPreviewer();
    const second = createPreviewer();
    await first.previewer.load(fixture);
    await second.previewer.load(fixture);
    vi.useFakeTimers();
    first.previewer.htmlRender.renderSlide(0);
    first.previewer.htmlRender.renderSlide(1);
    second.previewer.htmlRender.renderSlide(0);
    vi.runAllTimers();

    first.previewer.currentIndex = 0;
    first.previewer.removeCurrentSlide();

    expect(charts[0].dispose).toHaveBeenCalledOnce();
    expect(charts[1].dispose).not.toHaveBeenCalled();
    expect(charts[2].dispose).not.toHaveBeenCalled();
    first.previewer.destroy();
    expect(charts[1].dispose).toHaveBeenCalledOnce();
    expect(charts[2].dispose).not.toHaveBeenCalled();
  });

  it('owner 在图表计时器执行前销毁时不会初始化图表', async () => {
    const { previewer, host } = createPreviewer();
    await previewer.load(fixture);
    vi.useFakeTimers();
    previewer.htmlRender.renderSlide(0);
    previewer.destroy();
    vi.runAllTimers();

    expect(mocks.initChart).not.toHaveBeenCalled();
    const count = host.querySelectorAll('.chart-node').length;
    previewer.htmlRender.renderSlide(1);
    expect(host.querySelectorAll('.chart-node')).toHaveLength(count);
  });

  it('图表 DOM 已卸载时计时器不会初始化图表', async () => {
    const { previewer, host } = createPreviewer();
    await previewer.load(fixture);
    vi.useFakeTimers();
    previewer.htmlRender.renderSlide(0);
    host.remove();
    vi.runAllTimers();

    expect(mocks.initChart).not.toHaveBeenCalled();
  });

  it.each(['load', 'preview'] as const)(
    '%s 解析结果在销毁后迟到时不会创建 DOM 或图表',
    async (operation) => {
      const { previewer, host } = createPreviewer();
      const pending = previewer[operation](fixture);
      const assertion = expect(pending).rejects.toMatchObject({
        name: 'AbortError',
      });
      previewer.destroy();
      await assertion;

      expect(host.querySelector('.pptx-preview-slide-wrapper')).toBeNull();
      expect(mocks.initChart).not.toHaveBeenCalled();
    },
  );

  it('同实例重新加载只释放自身已有资源，保留其他实例', async () => {
    const first = createPreviewer();
    const second = createPreviewer();
    await first.previewer.load(fixture);
    await second.previewer.load(fixture);
    vi.useFakeTimers();
    first.previewer.htmlRender.renderSlide(0);
    second.previewer.htmlRender.renderSlide(0);
    vi.runAllTimers();

    vi.useRealTimers();
    await first.previewer.load(fixture);

    expect(charts[0].dispose).toHaveBeenCalledOnce();
    expect(charts[1].dispose).not.toHaveBeenCalled();
    vi.useFakeTimers();
    first.previewer.htmlRender.renderSlide(0);
    vi.runAllTimers();
    expect(charts).toHaveLength(3);
    expect(charts[1].dispose).not.toHaveBeenCalled();
  });
});
