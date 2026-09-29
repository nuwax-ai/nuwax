export interface PptxSlideValidationPreviewer {
  pptx?: { slides?: Array<{ name?: string }> };
}

/** 按演示文稿的关系顺序排列页面，避免库按 slide 文件编号排序导致顺序变化。 */
export function validateAndOrderPptxSlides(
  previewer: PptxSlideValidationPreviewer,
  host: HTMLElement,
  slidePaths: string[],
): void {
  const slides = previewer.pptx?.slides ?? [];
  const wrappers = Array.from(
    host.querySelectorAll<HTMLElement>('.pptx-preview-slide-wrapper'),
  );
  const pages = new Map<string, HTMLElement>();
  slides.forEach((slide, index) => {
    const path = slide.name?.replace(/^\//, '');
    if (path && wrappers[index] && !pages.has(path)) {
      pages.set(path, wrappers[index]);
    }
  });
  if (
    slidePaths.length === 0 ||
    slides.length !== slidePaths.length ||
    wrappers.length !== slidePaths.length ||
    pages.size !== slidePaths.length ||
    slidePaths.some((path) => !pages.has(path))
  ) {
    throw Object.assign(new Error('PPTX rendered pages are incomplete'), {
      code: 'incomplete',
    });
  }
  const parent = wrappers[0].parentElement;
  if (!parent || wrappers.some((wrapper) => wrapper.parentElement !== parent)) {
    throw Object.assign(new Error('PPTX page containers are invalid'), {
      code: 'incomplete',
    });
  }
  slidePaths.forEach((path) => {
    const page = pages.get(path)!;
    page.dataset.pptxSlidePath = path;
    parent.appendChild(page);
  });
}
