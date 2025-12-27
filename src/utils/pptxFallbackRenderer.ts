/**
 * PPTX 降级渲染工具
 * 当 pptx-preview 库无法解析 PPTX 文件时，使用此工具显示友好提示
 *
 * 功能：
 * 1. 显示 PPTX 缩略图（如果有）
 * 2. 显示友好的降级提示信息
 * 3. 提供下载按钮
 */

/**
 * PPTX 解析结果
 */
export interface PPTXParseResult {
  thumbnail?: string;
  slideCount: number;
  fileName: string;
}

/**
 * 解析 PPTX 文件
 * @param pptxData pptx-preview 库加载的 PPTX 数据对象
 * @returns 解析结果
 */
export async function parsePPTX(pptxData: any): Promise<PPTXParseResult> {
  try {
    // 从 pptx-preview 的数据中提取信息
    const thumbnail = pptxData?.thumbnail || pptxData?._thumbnail;

    // 尝试从文件结构中获取幻灯片数量
    let slideCount = pptxData?.slides?.length || 0;

    // 如果 slides 为空，尝试其他方式获取
    if (slideCount === 0 && pptxData?.slideLayouts) {
      slideCount = pptxData.slideLayouts.length;
    }

    return {
      thumbnail,
      slideCount: slideCount > 0 ? slideCount : 6, // 默认显示至少 1 张
      fileName: 'presentation',
    };
  } catch (error) {
    console.error('[PPTX Fallback] Parse error:', error);
    throw new Error('PPTX 文件解析失败');
  }
}

/**
 * 创建 PPTX 降级显示界面
 * @param container 容器元素
 * @param parseResult 解析结果
 */
export function renderFallback(
  container: HTMLElement,
  parseResult: PPTXParseResult,
) {
  if (!container) return;

  container.innerHTML = '';

  // 创建主容器
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 32px;
    height: 100%;
    background: #f5f5f5;
    overflow-y: auto;
  `;

  // 如果有缩略图，显示缩略图
  if (parseResult.thumbnail) {
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    `;

    const img = document.createElement('img');
    img.src = parseResult.thumbnail;
    img.alt = '演示文稿预览';
    img.style.cssText = `
      max-width: 100%;
      max-height: 500px;
      object-fit: contain;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      background: #fff;
    `;

    const thumbnailLabel = document.createElement('div');
    thumbnailLabel.textContent = '演示文稿封面预览';
    thumbnailLabel.style.cssText = `
      color: #666;
      font-size: 13px;
      font-weight: 500;
    `;

    thumbnailContainer.appendChild(img);
    thumbnailContainer.appendChild(thumbnailLabel);
    wrapper.appendChild(thumbnailContainer);
  }

  // 显示幻灯片信息
  const infoContainer = document.createElement('div');
  infoContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  `;

  const slideCountText = document.createElement('div');
  slideCountText.textContent = `共 ${parseResult.slideCount} 张幻灯片`;
  slideCountText.style.cssText = `
    color: #262626;
    font-size: 14px;
    font-weight: 500;
  `;

  const notice = document.createElement('div');
  notice.innerHTML = `
    该 PPTX 文件格式较为复杂，暂不支持完整预览。
    <br>建议下载后在 PowerPoint 中查看完整内容。
  `;
  notice.style.cssText = `
    color: #8c8c8c;
    font-size: 12px;
    text-align: center;
    line-height: 1.6;
  `;

  infoContainer.appendChild(slideCountText);
  infoContainer.appendChild(notice);
  wrapper.appendChild(infoContainer);
  container.appendChild(wrapper);
}
